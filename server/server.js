require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();


app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cors());


const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/authdb";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message || err);
    process.exit(1);
  }
})();

const frontendPath = path.join(__dirname, "..", "client");
console.log("🛠 Serving frontend from:", frontendPath);

// const loginPath = path.join(frontendPath, "login.html");
// const registerPath = path.join(frontendPath, "register.html");

// if (!fs.existsSync(loginPath)) console.warn("⚠️ login.html NOT FOUND");
// if (!fs.existsSync(registerPath)) console.warn("⚠️ register.html NOT FOUND");


app.use("/api/auth", require("./routes/auth")); 
app.use("/api/donees/near", require("./routes/nearDonee")); 
app.use("/api/donees", require("./routes/addDonee"));       
app.use("/api/admin", require("./routes/adminStats"));     
app.use("/api/donations", require("./routes/donations"));   


app.use("/", require("./routes/protected")); 


app.use(express.static(frontendPath));


app.get("/", (req, res) => {
  const indexPath = path.join(frontendPath, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  // if (fs.existsSync(loginPath)) return res.sendFile(loginPath);
  res.status(404).send("404: No index.html or login.html found.");
});


// app.get(["/login", "/login.html"], (req, res) => res.sendFile(loginPath));
// app.get(["/register", "/register.html"], (req, res) => res.sendFile(registerPath));

app.use((req, res) => res.status(404).json({ success: false, message: "Page not found" }));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
