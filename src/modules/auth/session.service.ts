import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../../config/database";
import { hashSessionToken } from "./session.utils";

interface SessionCustomerRow extends RowDataPacket {
    id: number,
    mobile_number: string
}

export interface AuthenticatedCustomer {
    id: number,
    mobileNumber: string
}

function isValidSessionToken(token: string) : boolean {
      return /^[a-f0-9]{64}$/i.test(token);
}

export async function getCustomerFromSession(
    token: string | undefined
): Promise<AuthenticatedCustomer | null> {

    if (!token || !isValidSessionToken(token)) {
        return null
    }

    const tokenHash = hashSessionToken(token)

    const [rows] = 
    await pool.execute<SessionCustomerRow[]> (
        `SELECT
        c.id,
        c.mobile_number
        FROM customer_sessions AS cs
        INNER JOIN customers AS c
        ON c.id = cs.customer_id
        WHERE cs.session_token_hash = ?
        AND cs.expires_at > UTC_TIMESTAMP(3)
        AND cs.revoked_at IS NULL
        AND c.is_active = TRUE
        LIMIT 1`,
        [tokenHash]
    )
    const customer = rows[0]

    if (!customer) {
        return null
    }

    return {
        id: customer.id,
        mobileNumber: customer.mobile_number
    }

}

export async function revokeSession(
    token: string | undefined
): Promise<void> {

    if (!token || !isValidSessionToken(token)) {
        return 
    }

    const tokenHash = hashSessionToken(token)

    await pool.execute(
        `UPDATE customer_sessions
        SET revoked_at = UTC_TIMESTAMP(3)
        WHERE session_token_hash = ?
        AND revoked_at IS NULL`,
        [tokenHash]
    )

}