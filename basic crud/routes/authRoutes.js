const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Compare without leaking how many characters matched
function sameText(a, b) {
  const hashA = crypto.createHash("sha256").update(String(a)).digest();
  const hashB = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// POST /api/auth/login { username, password } -> { token, user }
// The single admin account is set in .env (ADMIN_USERNAME / ADMIN_PASSWORD)
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const validUser = sameText(username || "", process.env.ADMIN_USERNAME);
  const validPassword = sameText(password || "", process.env.ADMIN_PASSWORD);
  if (!validUser || !validPassword) {
    return res.status(401).json({ message: "Wrong username or password" });
  }

  const user = { username: process.env.ADMIN_USERNAME, role: "admin" };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
  res.json({ token, user, message: `Login successful. Welcome, ${user.username}!` });
});

// GET /api/auth/me - who the token belongs to
router.get("/me", requireAuth, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

module.exports = router;
