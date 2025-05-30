const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ msg: "No token, access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded payload to request
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(403).json({ msg: "Token is invalid or expired" });
  }
};

module.exports = verifyToken;
