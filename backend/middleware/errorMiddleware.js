// Runs when no route matched.
export function notFound(req, res) {
  res.status(404).json({ message: "Route not found." });
}

// Runs when something unexpected goes wrong (Express 5 also sends errors from async functions here).
export function errorHandler(error, req, res, next) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON." });
  }
  if (error.code === 11000) {
    return res.status(400).json({ message: "A record with this ID already exists." });
  }
  console.error(error); // details stay in the server log
  res.status(500).json({ message: "Something went wrong on the server." });
}
