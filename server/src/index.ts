import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import app from "./app.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// server/src/index.ts -> server/src -> server -> repository root
dotenv.config({
  path: path.resolve(currentDir, "../../.env"),
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Express server listening on port ${port}`);
});
