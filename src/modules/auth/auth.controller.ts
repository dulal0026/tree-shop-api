import type { Request,  Response } from "express";
import { requestOtp } from "./auth.service";
import { error } from "node:console";


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