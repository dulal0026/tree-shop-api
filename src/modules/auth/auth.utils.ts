import { createHmac, randomInt, timingSafeEqual } from "node:crypto";


function getOtpSecret():string {
    const secret = process.env.OTP_HMAC_KEY

    if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
        throw new Error(
            "OTP_HMAC_KEY must be a 32-byte hexadecimal secret"
        )
    }
    return secret

}

export function normalizeMobileNumber(input: string): string {
  const mobile = input.trim().replace(/[\s-]/g, "");

  if (/^01[3-9]\d{8}$/.test(mobile)) {
    return `+88${mobile}`;
  }

  if (/^\+8801[3-9]\d{8}$/.test(mobile)) {
    return mobile;
  }

  throw new Error("Invalid mobile number");
}



export function generateOtp(): string {
    return randomInt(0,1_000_000)
    .toString()
    .padStart(6, "0")
}

function hmac(value: string): string {
  return createHmac("sha256", getOtpSecret())
    .update(value)
    .digest("hex");
}


export function hashOtp(
  challengeId: string,
  otp: string
): string {
  return hmac(`otp:${challengeId}:${otp}`);
}


export function hashLimitKey(
  type: "mobile" | "ip",
  value: string
): string {
  return hmac(`limit:${type}:${value}`);
}

export function verifyOtpHash(
  challengeId: string,
  submittedOtp: string,
  storedHash: string
): boolean {
  if (!/^\d{6}$/.test(submittedOtp)) {
    return false;
  }

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const actual = Buffer.from(
    hashOtp(challengeId, submittedOtp),
    "hex"
  );

  const expected = Buffer.from(storedHash, "hex");

  return timingSafeEqual(actual, expected);
}