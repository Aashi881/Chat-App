const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Protected
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create user");
  }
});

//@description     Auth the user
//@route           POST /api/user/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {
  console.log("Incoming request body:", JSON.stringify(req.body, null, 2));
  
  if (!req.body) {
    console.error("No request body received");
    res.status(400);
    throw new Error("Request body is required");
  }

  const { email, password } = req.body;

  if (!email || !password) {
    console.error("Missing credentials:", { email, password });
    res.status(400);
    throw new Error("Please provide both email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    console.error("User not found for email:", email);
    res.status(401);
    throw new Error("Invalid Email or Password");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    console.error("Password mismatch for user:", user.email);
    res.status(401);
    throw new Error("Invalid Email or Password");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    pic: user.pic,
    token: generateToken(user._id),
  });
});

module.exports = { allUsers, registerUser, authUser };