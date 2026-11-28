import type { Request,  Response } from "express";
import { requestOtp } from "./auth.service";
import { error } from "node:console";

import {
  verifyCustomerOtp,
  InvalidOtpError,
} from "./auth.service.js";

import {
  revokeSession,
} from "./session.service.js";

import type {
  AuthenticatedRequest,
} from "./auth.middleware.js";

import {
  SESSION_COOKIE_NAME,
  getSessionDurationMs,
} from "./session.utils.js";


const isProduction = process.env.NODE_ENV === "production";

const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

export async function verifyOtpController(
  req: Request,
  res: Response
): Promise<void> {
  const { mobileNumber, otp } = req.body ?? {};

  if (
    typeof mobileNumber !== "string" ||
    mobileNumber.length > 32 ||
    typeof otp !== "string" ||
    !/^\d{6}$/.test(otp)
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid verification request",
    });
    return;
  }

  try {
    const result = await verifyCustomerOtp(
      mobileNumber,
      otp
    );

    res.cookie(
      SESSION_COOKIE_NAME,
      result.sessionToken,
      {
        ...sessionCookieOptions,
        maxAge: getSessionDurationMs(),
      }
    );

    res.status(200).json({
      success: true,
      message: "Authentication successful",
      customer: result.customer,
    });
  } catch (error) {
    if (
      error instanceof InvalidOtpError ||
      (error instanceof Error &&
        error.message === "Invalid mobile number")
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
      return;
    }

    console.error("OTP verification failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify OTP",
    });
  }
}

export async function getCurrentCustomerController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  res.status(200).json({
    success: true,
    customer: req.customer,
  });
}

export async function logoutController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    await revokeSession(
      typeof token === "string" ? token : undefined
    );

    res.clearCookie(
      SESSION_COOKIE_NAME,
      sessionCookieOptions
    );

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to log out",
    });
  }
}


export async function requestOtpController(
    req: Request,
    res: Response
): Promise<void> {
    const {mobileNumber} = req.body ?? {}

    if (
        typeof mobileNumber != "string" || 
        mobileNumber.length > 32
    ){
        res.status(400).json({
            success: false,
            message: "Invalid mobile number"
        })
        return
    }

    try {

        await requestOtp(mobileNumber, req.ip ?? "unknown")

        res.status(202).json({
            success: true,
            message: "If the request is eligible, an OTP will be sent."
        })
    } 
    catch (error) {

        if (
            error instanceof Error && 
            error.message === "Invalid mobile number"
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid mobile number."
            })
            return
        }

        console.log("OTP request failed:", error)

        res.status(500).json({
            success: false,
            message: "Unable to process OTP request."
        })
    }

}