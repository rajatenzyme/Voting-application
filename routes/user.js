const express = require('express')
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('./../jwt');


router.get('/login', (req, res) => {
    return res.render('login');
});

router.get('/signup', (req, res) => {
    return res.render('signup');
});



// POST route to signing up a person
router.post('/signup', async (req, res) => {
    try{
        const data = req.body;

        // Check if there is already an admin user, then we can not add another admin user
        const adminUser = await User.findOne({ role: 'admin' });
        if (data.role === 'admin' && adminUser) {
            return res.status(400).render('signup', { error: 'Admin user already exists' });
            // return res.status(400).json({ error: 'Admin user already exists' });
        }

        // Validate Aadhar Card Number must have exactly 12 digit
        if (!/^\d{12}$/.test(data.aadharCardNumber)) {
            return res.status(400).render('signup', { error: 'Aadhar Card Number must be of exactly 12 digits' });
            // return res.status(400).json({ error: 'Aadhar Card Number must be of exactly 12 digits' });
        }

        // Check if a user with the same Aadhar Card Number already exists
        const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
        if (existingUser) {
            return res.status(400).render('signup', { error: 'User with the same Aadhar Card Number already exists' });
            // return res.status(400).json({ error: 'User with the same Aadhar Card Number already exists' });
        }

        // Create a new User document using the Mongoose model
        const newUser = new User(data);

        // Save the new user to the database
        const response = await newUser.save();

        console.log(`Successfully created new user ${response}`);

        // // Generating payload for this new user for the token generation
        // const payload = {
        //     id : response.id,
        // }

        // const token = generateToken(payload);
        
        // return res.status(200).json({response: response, token: token});
        return res.redirect('/');
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
    
});

// POST route to logging in a person
router.post('/login', async (req, res) => {
    try{
        // Get aadharCardNumber and password from request body
        const {aadharCardNumber, password} = req.body;
        // console.log(aadharCardNumber, password);

        // Check if aadharCardNumber or password is missing
        if (!aadharCardNumber || !password) {
            // return res.status(400).json({ error: 'Aadhar Card Number and password are required' });
            return res.status(400).render('login', { error: 'Aadhar Card Number and password are required' });
        }

        // Find the user by aadharCardNumber
        const user = await User.findOne({ aadharCardNumber : aadharCardNumber });

        // If user does not exist or password does not match, return error
        if(!user || !(await user.comparePassword(password))){
            // return res.status(401).json({error: 'Invalid Aadhar Card Number or Password'});
            return res.status(401).render('login', { error: 'Invalid Aadhar Card Number or Password' });
        }

        // else generating the token for the user
        const payload = {
            id : user.id,
        }

        const token = generateToken(payload);
        // console.log(token)

        // return res.cookie('token', token).redirect('/');
        return res.cookie('token', token).render('home', {user : user})

        // return res.json({token});
        
    }
    catch(err){
        return res.status(500).json({error: "Internal Server Error"});
    }
});

router.get('/logout', function(req, res) {
    res.clearCookie('token');
    return res.redirect('/');
});


// Profile route
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try{
        const user = await User.findById(req.user?.id);
        if(!user)   return res.redirect('/');
        return res.render('profile', {user : user})  ;
        // res.status(200).json({user});
    }catch(err){
        console.error(err);
        return res.redirect('/');
        // res.status(500).json({ error: 'Internal Server Error' });
    }

});

router.get('/profile/password', jwtAuthMiddleware, async (req, res) => {
    try{
        const user = await User.findById(req.user?.id);
        if(!user)   return res.redirect('/');
        return res.render('changePassword', {user : user})  ;
        // res.status(200).json({user});
    }catch(err){
        console.error(err);
        return res.redirect('/');
        // res.status(500).json({ error: 'Internal Server Error' });
    }

});

// route for password changing for the user profile
router.put('/profile/password', jwtAuthMiddleware, async (req, res) => {
    try{
        const userId = req.user.id;
        const {currentPassword, newPassword} = req.body;
        // console.log(userId, currentPassword, newPassword);

        // Check if currentPassword and newPassword are present in the request body
        if (!currentPassword || !newPassword) {
            const alertScript = `<script>alert("Both current Password and new Password is required");window.history.back();</script>`;
            return res.status(400).send(alertScript);
            // return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }


        // Find the user by userID
        const user = await User.findById(userId);

        // If user does not exist or password does not match, return error
        if(!user || !(await user.comparePassword(currentPassword))){
            const alertScript = `<script>alert("Invalid Current Password");window.history.back();</script>`;
            return res.status(400).send(alertScript);
            // return res.status(401).json({error: 'Invalid Current Password'});
        }

        // else update the password with the new password
        user.password = newPassword;
        // save updated document
        await user.save();

        console.log('password updated');

        // res.status(200).json({user});
        const alertScript = `<script>alert("Password updated");window.history.back();</script>`;
        return res.status(200).send(alertScript);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});



module.exports = router;