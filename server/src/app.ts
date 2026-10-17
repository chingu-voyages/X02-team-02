import express from "express";
import healthRouter from "./health/health-routes.js";

const app = express();

app.use(express.json());

app.use("/health", healthRouter);

export default app;
