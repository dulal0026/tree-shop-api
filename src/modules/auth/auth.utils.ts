import { createHmac, randomInt } from "node:crypto";


export function normalizeMobileNumber(input: string) {
    const mobile = input.trim().replace(/[\s-]/g, "")


  if (/^01[3-9]\d{8}$/.test(mobile)) {
    return `+88${mobile}`
  }

  throw new Error("Invalid mobile number")
}



export function generateOtp(): string {
    return randomInt(0,1_000_000)
    .toString()
    .padStart(6, "0")
}


export function hashOtp(
    challengeId: string,
    otp: string
): string {

    const secret = process.env.OTP_HMAC_KEY


    if (! secret || secret.length < 32) {
        throw new Error("OTP_HMAC_KEY is not configured properly.")
    }

    return createHmac("sha256", secret)
    .update(`${challengeId}:${otp}`)
    .digest("hex")
}