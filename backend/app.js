import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import drawingRoutes from "./routes/drawingRoutes.js";
import siteVisitRoutes from "./routes/siteVisitRoutes.js";
import testRecordRoutes from "./routes/testRecordRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import professionalRoutes from "./routes/professionalRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();


const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/professionals", professionalRoutes);
app.use("/api/drawings", drawingRoutes);
app.use("/api/site-visits", siteVisitRoutes);
app.use("/api/test-records", testRecordRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
