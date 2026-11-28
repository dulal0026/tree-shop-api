
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { productRouter } from "./routes/product.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";

export const app = express();

app.use(
  cors({
  origin: "http://localhost:3000",
  credentials: true,
})
);

app.use(express.json());
app.use(cookieParser())

app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    message: "Tree Shop API is running",
  });
});

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/products", productRouter);

export default app;

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

