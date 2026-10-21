import express from "express";
import healthRouter from "./health/health-routes.js";
import apiRoutes from "./api/api-routes.js";

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/api", apiRoutes);

export default app;
