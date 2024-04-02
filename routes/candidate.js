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
      // return res
      //   .status(403)
      //   .json({ message: "admin is not allowed to cast a vote" });
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


router.get("/vote/count/", async (req, res) => {
  try {
    const candidates = await Candidate.find();
    const user = await User.findById(req.user?.id);
    const voteRecord = candidates.map((data) => {
      return {
        party: data.party,
        count: data.votes.length,
      };
    });

    // console.log(voteRecord);
    // return res.status(200).json(voteRecord);
    return res.render("scorecard", { voteRecord: voteRecord, user: user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get List of all candidates with only name and party fields
router.get("/", async (req, res) => {
  try {
    // Find all candidates and select only the name and party fields, excluding _id
    const candidates = await Candidate.find({}, "name party -_id");

    // Return the list of candidates
    res.status(200).json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/add-new-candidate", async (req, res) => {
    return res.render("addNewCandidate");
});

// Adding a new candidate
router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: "user does not have admin role" });

    const body = req.body;

    const newCandidate = new Candidate(body);

    // Save the newCandidate to the database
    const response = await newCandidate.save();
    // console.log("data saved");
    res.status(200).json({ response: response });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
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
