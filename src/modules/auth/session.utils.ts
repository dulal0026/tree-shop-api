import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME =  
process.env.SESSION_COOKIE_NAME ?? "tree_shop_session"

export function getSessionDurationMs():number {
    const days = Number(process.env.SESSION_EXPIRY_DAYS) ?? 7

    if(!Number.isSafeInteger(days) || days < 1 || days > 30) {
        throw new Error("Invalid SESSIOS_EXPIRY_DAYS")
    }
    return days * 24 * 60 * 60 * 1000
}

export function generateSessionToken(): string {
    return randomBytes(32).toString("hex")
}

export function hashSessionToken(token: string): string {
    return createHash("sha256")
    .update(token)
    .digest("hex")
}