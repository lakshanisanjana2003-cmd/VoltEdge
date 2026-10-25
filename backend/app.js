import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import professionalRoutes from "./routes/professionalRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

const app = express();

// Only the React app's address may call this API from a browser.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/professionals", professionalRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
