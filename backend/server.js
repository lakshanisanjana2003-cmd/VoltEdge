
import "dotenv/config";
import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
import mongoose from "mongoose";
import app from "./app.js";


const port = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.error("Missing MONGODB_URI or JWT_SECRET. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
  family: 4,
  serverSelectionTimeoutMS: 10000,
});
    console.log("Connected to MongoDB");
    app.listen(port, () => console.log(`VoltEdge API running at http://localhost:${port}/api`));
  } catch (error) {
  console.error("MongoDB connection error:", error);
  process.exit(1);
}
}

startServer();
