import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

import documentRoutes from "./routes/document.routes.js";
import aiRoutes from './routes/ai.routes.js';
import { chroma } from "./config/chroma.js";
import { model } from "./config/gemini.js";

const app = express();


app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());


app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        service: "AI Service",
        message: "AI Service is running successfully",
    });
});

// Health check endpoint
app.get("/health", async (req, res) => {
    const health = { server: "ok" };

    // MongoDB
    try {
        health.mongodb = mongoose.connection.readyState === 1 ? "ok" : "disconnected";
    } catch (e) {
        health.mongodb = "error";
    }

    // ChromaDB
    try {
        await chroma.heartbeat();
        health.chromadb = "ok";
    } catch (e) {
        health.chromadb = "error: " + e.message;
    }

    // Gemini (lightweight check)
    try {
        health.gemini = model ? "configured" : "not configured";
    } catch (e) {
        health.gemini = "error";
    }

    const allOk = health.mongodb === "ok" && health.chromadb === "ok";
    res.status(allOk ? 200 : 503).json({ success: allOk, ...health });
});

app.use("/api/v1/documents", documentRoutes);
app.use("/documents", documentRoutes);

app.use('/api/v1/ai', aiRoutes);
app.use('/ai', aiRoutes);

export default app;