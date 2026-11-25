
import express from "express";
import cors from "cors";
import { productRouter } from "./routes/product.routes.js";

export const app = express();

app.use(cors({
  origin: "http://localhost:3000",
}));

app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    message: "Tree Shop API is running",
  });
});

app.use("/api/v1/products", productRouter);

app.use((
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error("API error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});
