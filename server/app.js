const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/authdb";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message || err);
    process.exit(1);
  });


// ✅ User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

// ✅ Routes

// Home redirect → login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Login handler
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.send("❌ User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send("❌ Invalid credentials");

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.send(`✅ Login successful! Token: ${token}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Signup handler
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.send("⚠️ Username already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.send("✅ User registered successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
