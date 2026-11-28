import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requestOtpController } from "./auth.controller";

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