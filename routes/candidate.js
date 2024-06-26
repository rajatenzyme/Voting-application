require("dotenv").config();

const express = require("express");
const router = express.Router();
const { jwtAuthMiddleware, generateToken } = require("./../jwt");
const Candidate = require("../models/candidate");
const User = require("../models/user");

const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    if (user.role === "admin") {
      return true;
    }
  } catch (err) {
    return false;
  }
};

// POST route to add a candidate


router.get("/castvote", async (req, res) => {
  const candidate = await Candidate.find({}, "name party _id");
  // console.log("Hi Candidates",candidate);
  const user = await User.find({ _id: req.user?.id });

  return res.render("castVote", {
    candidates: candidate,
    user: user,
  });
});

router.post("/vote/:candidateId", jwtAuthMiddleware, async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // console.log("req", req)
    const userId = req.user?.id;
    if (!userId) return res.status(400).redirect("/");

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (user.role == "admin") {
      const alertScript = `<script>alert("admin is not allowed to cast a vote");window.history.back();</script>`;
      return res.status(403).send(alertScript);
      // return res.status(403).render("castVote", { error: 'admin is not allowed to cast a vote' });
    }
    if (user.isVoted) {
      const alertScript = `<script>alert("You have already voted");window.history.back();</script>`;
      return res.status(400).send(alertScript);
      // return res.status(400).json({ message: "You have already voted" });
    }

    // Update the Candidate document to record the vote
    candidate.votes.push({ user: userId });

    await candidate.save();

    // update the user document
    user.isVoted = true;
    await user.save();
    const alertScript = `<script>alert("Yayy!, Vote Recorded successfully");window.history.back();</script>`;
    return res.status(200).send(alertScript);
    // return res.status(200).json({ message: "Vote recorded successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});




// // Get List of all candidates with only name and party fields
// router.get("/", async (req, res) => {
//   try {
//     // Find all candidates and select only the name and party fields, excluding _id
//     const candidates = await Candidate.find({}, "name party -_id");

//     // Return the list of candidates
//     res.status(200).json(candidates);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });


router.get("/add-new-candidate", async (req, res) => {
    const user = await User.findById(req.user?.id);
    // console.log(user);
    if(!user) {
      const alertScript = `<script>alert("You are unauthorized for this action!!");window.history.back();</script>`;
      return res.status(200).send(alertScript);
    }
    return res.render("addNewCandidate", { user: user});
});

// Adding a new candidate
router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: "user does not have admin role" });

    const data = req.body;
    // console.log("data: " + JSON.stringify(data));

     // Check if candidate is added by admin
     if (data.role === 'admin') {
      return res.status(400).render('addNewCandidate', { error: 'Unauthorized action!' });
     }

     // Validate Aadhar Card Number must have exactly 12 digit
     if (!/^\d{12}$/.test(data.aadharCardNumber)) {
        return res.status(400).render('addNewCandidate', { error: 'Aadhar Card Number must be of exactly 12 digits' });
     }

     // Check if a user with the same Aadhar Card Number already exists
     const existingUser = await Candidate.findOne({ aadharCardNumber: data.aadharCardNumber});
     if (existingUser) {
      return res.status(400).render('addNewCandidate', { error: 'Candidate with the same Aadhar Card Number already exists!' });
     }

     // Check if a user with the same email already exists
     const existingUserEmail = await Candidate.findOne({ email: data.email });
     if (existingUserEmail) {
      return res.status(400).render('addNewCandidate', { error: 'Candidate with the same email already exists!' });
     }

     const existingUserParty = await Candidate.findOne({party: data.party});
     if (existingUserParty) {
      return res.status(400).render('addNewCandidate', { error: 'Candidate with the same party already exists!' });
     }

    const newCandidate = new Candidate(data);

    // Save the newCandidate to the database
    const response = await newCandidate.save();
    // console.log("data saved");
  
    return res.status(200).render('addNewCandidate', { error: 'Candidate Added Successfully!' });
      // return res.status(400).send(alertScript);
    // res.status(200).json({ response: response });
  } catch (err) {
    console.log(err);
    return res.status(500).render('addNewCandidate', { error: 'Internal Server Error!' });
  }
});

router.get("/edit-candidate", async (req, res) => {
  return res.render("editCandidate");
});


// Updating candidate data
router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res.status(403).json({ message: "Only admin can perform this action!" });

    const candidateID = req.params.candidateID; // Extract the id from the URL parameter
    const updatedCandidateData = req.body; // Updated data for the person

    const response = await Candidate.findByIdAndUpdate(
      candidateID,
      updatedCandidateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run Mongoose validation
      }
    );

    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    console.log("candidate data updated");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Deleting a candidate data
router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" });

    const candidateID = req.params.candidateID; // Extract the id from the URL parameter

    const response = await Candidate.findByIdAndDelete(candidateID);

    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    console.log("candidate deleted");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;
