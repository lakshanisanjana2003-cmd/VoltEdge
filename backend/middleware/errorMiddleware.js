// Runs when no route matched.
export function notFound(req, res) {
  res.status(404).json({ message: "Route not found." });
}

// Runs when something unexpected goes wrong.
export function errorHandler(error, req, res, next) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON." });
  }
    if (error.name === "MulterError") {
    const message = error.code === "LIMIT_FILE_SIZE" ? "The file is too large (maximum 10 MB)." : `Upload failed: ${error.message}`;
    return res.status(400).json({ message });
  }
  if (error.status === 400 && error.message) {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === 11000) {
    return res.status(400).json({ message: "A record with this ID already exists." });
  }
  console.error(error); // details stay in server log
  res.status(500).json({ message: "Something went wrong on the server." });
}
