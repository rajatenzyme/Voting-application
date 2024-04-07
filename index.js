require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const methodOverride = require("method-override");

const Candidate = require("./models/candidate");
const db = require("./db");
const { jwtAuthMiddleware, generateToken } = require("./jwt");

const PORT = process.env.PORT || 8001;

const userRoutes = require("./routes/user");
const candidateRoutes = require("./routes/candidate");

app = express();

app.set("view engine", "ejs");
app.set("views", path.resolve("./views/"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.resolve("./public")));
app.use(express.static(path.resolve("./views")));
app.use(methodOverride("_method"));

const User = require("./models/user");

app.use("/user", userRoutes);
app.use("/candidate", jwtAuthMiddleware, candidateRoutes);

app.get("/", jwtAuthMiddleware, async (req, res) => {
  const user = await User.find({ _id: req.user?.id });

  res.render("home", {
    user: user,
  });
});

app.get("/vote/count/", jwtAuthMiddleware, async (req, res) => {
  try {
    const candidates = await Candidate.find();
    const user = await User.findById(req.user?.id);
    const voteRecord = candidates.map((data) => {
      return {
        party: data.party,
        count: data.votes.length,
      };
    });

    return res.render("scorecard", { voteRecord: voteRecord, user: user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log(`Server Started at PORT : ${PORT}`));
