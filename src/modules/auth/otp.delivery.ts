interface OtpDelivery {
    mobileNumber: string,
    otp: string
}

export async function deliverOtp({
    mobileNumber,
    otp
}: OtpDelivery): Promise<void> {
    const mode = process.env.OTP_DELIVERY_MODE
    const environment = process.env.NODE_ENV

    if (mode === "console" && environment === "development") {
        console.log("\n========== TREE SHOP DEV OTP ==========")
        console.log("Mobile:", mobileNumber)
        console.log("OTP:", otp)
        console.log("=======================================\n")
        return
    }

    throw new Error("OTP delivery provider is not configured.")
}