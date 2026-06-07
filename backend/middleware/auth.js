module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.BACKEND_API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing API Key" });
  }
  next();
};
