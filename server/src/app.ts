import cookieParser from "cookie-parser";
import express from "express";
import healthRouter from "./health/health-routes.js";
import apiRoutes from "./api/api-routes.js";
import { attachUser } from "./api/auth/session-middleware.js";

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
// Session handling is limited to /api so health checks never depend on the database.
app.use("/api", cookieParser(), attachUser, apiRoutes);

export default app;
