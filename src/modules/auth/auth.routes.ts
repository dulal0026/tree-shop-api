import { Router } from "express";
import rateLimit from "express-rate-limit";
import { 
    verifyOtpController,
     requestOtpController,
    logoutController } from "./auth.controller";

import { requireTrustedOrigin } from "./origin.middleware.js";
import { getCurrentCustomerController } from "./auth.controller";

import { requireCustomer } from "./auth.middleware";

export const authRouter = Router()

const otpLimiter = rateLimit({
    windowMs:60*60*1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success:false,
        message: "To many request. Try again later."
    }
})


authRouter.post(
    "/request-otp",
    otpLimiter,
    requestOtpController
)


const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts",
  },
});

authRouter.post(
  "/verify-otp",
  requireTrustedOrigin,
  verifyOtpLimiter,
  verifyOtpController
);

authRouter.get(
  "/me",
  requireCustomer,
  getCurrentCustomerController
);

authRouter.post(
  "/logout",
  requireTrustedOrigin,
  logoutController
);
