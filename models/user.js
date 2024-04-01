
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        unique : true,
    },
    aadharCardNumber : {
        type : String,
        required : true,
    },
    password : {
        type : String,
        required : true,
    },
    address : {
        type : String,
        required : true,
    },
    age : {
        type : Number,
        required : true,
    },
    role : {
        type : String,
        required : true,
        enum : ['admin', 'voter'],
        default : 'voter',
    },
    isVoted : {
        type : Boolean,
        default : false,
    }
}, {timestamps : true}
)

// Before saving into the database - hashing the password and
userSchema.pre('save', async function(next){
    const user = this;

    // Hash the password only if it has been modified (or is new)
    if(!user.isModified('password')) return next();
    try{
        // hash password generation
        const salt = await bcrypt.genSalt(10);

        // hash password
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        // Override the plain password with the hashed one
        user.password = hashedPassword;
        next();
    }catch(err){
        return next(err);
    }
})

// Function for comparing the password against the entered password
userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        // Use bcrypt to compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    }catch(err){
        throw err;
    }
}

const User = mongoose.model("user", userSchema)


module.exports = User; 