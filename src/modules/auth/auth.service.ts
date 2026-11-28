import { randomUUID } from "node:crypto";
import { pool } from "../../config/database";

import { generateOtp, hashOtp, normalizeMobileNumber } from "./auth.utils";



export async function requestOTP(
    mobileInput: string
): Promise<void> {
    const mobileNumber = normalizeMobileNumber(mobileInput)

    const otp = generateOtp()
    const challengeId = randomUUID()

    const otpHash = hashOtp(challengeId, otp)
    void pool
    void otpHash

    if (process.env.NODE_ENV === "development") {
        console.log("Development OTP request for", mobileNumber)
    }

}