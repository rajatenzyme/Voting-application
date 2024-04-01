require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");

const Candidate = require("./models/candidate");
const db = require("./db");
const {jwtAuthMiddleware, generateToken} = require('./jwt');


const PORT = process.env.PORT || 8001;

const userRoutes = require("./routes/user");
const candidateRoutes = require("./routes/candidate");

app = express();


app.set("view engine", "ejs");
app.set("views", path.resolve("./views/"))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.resolve("./public")));
app.use(express.static(path.resolve("./views")));

const User = require('./models/user');

app.use("/user", jwtAuthMiddleware, userRoutes);
app.use("/candidate", jwtAuthMiddleware, candidateRoutes);


app.get('/', jwtAuthMiddleware, async (req, res) => {

    const user = await User.find({_id : req.user?.id});

    res.render("home", {
        user : user,
    });
  });

app.listen(PORT, () => console.log(`Server Started at PORT : ${PORT}`));
