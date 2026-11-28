import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { getCustomerFromSession } from "./session.service.js";
import type { AuthenticatedCustomer } from "./session.service.js";
import { SESSION_COOKIE_NAME } from "./session.utils.js";

// Extend Express Request with authenticated customer
export interface AuthenticatedRequest extends Request {
  customer?: AuthenticatedCustomer;
}

// Authentication middleware
export async function requireCustomer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    const customer = await getCustomerFromSession(
      typeof token === "string" ? token : undefined
    );

    if (!customer) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Attach authenticated customer to the request
    req.customer = customer;

    next();
  } catch (error) {
    next(error);
  }
}
