
import type {
  Request,
  Response,
  NextFunction,
} from "express";

export function requireTrustedOrigin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const allowedOrigins = new Set([
    "http://localhost:3000",
    "http://localhost:4000",
  ]);

  const origin = req.get("origin");

  // Permit local API clients without Origin headers.
  // Production should enforce a stricter browser policy.
  if (!origin) {
    if (process.env.NODE_ENV === "development") {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "Origin required",
    });
    return;
  }

  if (!allowedOrigins.has(origin)) {
    res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
    return;
  }

  next();
}
