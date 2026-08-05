// Vercel serverless function — catches every request under /api/* and hands
// it to the same Express app used for local dev. An Express app instance is
// itself a valid (req, res) => void handler, so no adapter/wrapper is needed.
module.exports = require('../backend/app');
