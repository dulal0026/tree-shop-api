
import { randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { pool } from "../../config/database.js";
import {
  generateOtp,
  hashLimitKey,
  hashOtp,
  normalizeMobileNumber,
} from "./auth.utils.js";
import { deliverOtp } from "./otp.delivery.js";

interface LimitRow extends RowDataPacket {
  request_count: number;
  window_started_at: Date;
}

interface ChallengeRow extends RowDataPacket {
  created_at: Date;
}

class OtpRequestRejected extends Error {}

const HOUR_MS = 60 * 60 * 1000;

function positiveInt(
  name: string,
  fallback: number
): number {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid configuration: ${name}`);
  }

  return value;
}

async function consumeRateLimit(
  connection: PoolConnection,
  key: string,
  maximum: number,
  now: Date
): Promise<void> {
  await connection.execute(
    `INSERT IGNORE INTO otp_request_limits
       (limit_key, window_started_at, request_count)
     VALUES (?, ?, 0)`,
    [key, now]
  );

  const [rows] = await connection.execute<LimitRow[]>(
    `SELECT request_count, window_started_at
     FROM otp_request_limits
     WHERE limit_key = ?
     FOR UPDATE`,
    [key]
  );

  const row = rows[0];

  if (!row) {
    throw new Error("Rate-limit row not found");
  }

  const windowStart = new Date(row.window_started_at);
  const windowExpired =
    now.getTime() - windowStart.getTime() >= HOUR_MS;

  const count = windowExpired ? 0 : row.request_count;

  if (count >= maximum) {
    throw new OtpRequestRejected("Request limit exceeded");
  }

  await connection.execute(
    `UPDATE otp_request_limits
     SET request_count = ?,
         window_started_at = ?
     WHERE limit_key = ?`,
    [
      count + 1,
      windowExpired ? now : windowStart,
      key,
    ]
  );
}

export async function requestOtp(
  mobileInput: string,
  clientIp: string
): Promise<void> {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.OTP_DELIVERY_MODE !== "console"
  ) {
    throw new Error(
      "OTP delivery is not configured for this environment"
    );
  }

  const mobileNumber = normalizeMobileNumber(mobileInput);

  const mobileKey = hashLimitKey("mobile", mobileNumber);
  const ipKey = hashLimitKey("ip", clientIp);

  const otp = generateOtp();
  const challengeId = randomUUID();
  const otpHash = hashOtp(challengeId, otp);

  const expiryMinutes = positiveInt("OTP_EXPIRY_MINUTES", 5);
  const maxAttempts = positiveInt("OTP_MAX_ATTEMPTS", 5);
  const cooldownSeconds = positiveInt(
    "OTP_RESEND_COOLDOWN_SECONDS",
    60
  );

  const mobileLimit = positiveInt(
    "OTP_MOBILE_REQUESTS_PER_HOUR",
    5
  );

  const ipLimit = positiveInt(
    "OTP_IP_REQUESTS_PER_HOUR",
    30
  );

  const connection = await pool.getConnection();

  let shouldDeliver = false;

  try {
    await connection.beginTransaction();

    // Serialize concurrent requests for this mobile.
    await connection.execute(
      `INSERT IGNORE INTO otp_mobile_locks (mobile_key)
       VALUES (?)`,
      [mobileKey]
    );

    await connection.execute(
      `SELECT mobile_key
       FROM otp_mobile_locks
       WHERE mobile_key = ?
       FOR UPDATE`,
      [mobileKey]
    );

    const now = new Date();

    // Consume the rate-limit counters before cooldown checks.
    await consumeRateLimit(
      connection,
      ipKey,
      ipLimit,
      now
    );

    await consumeRateLimit(
      connection,
      mobileKey,
      mobileLimit,
      now
    );

    const [previous] = await connection.execute<ChallengeRow[]>(
      `SELECT created_at
       FROM customer_otp_challenges
       WHERE mobile_number = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [mobileNumber]
    );

    const lastRequest = previous[0];

    const cooldownActive =
      lastRequest &&
      now.getTime() - new Date(lastRequest.created_at).getTime() <
        cooldownSeconds * 1000;

    if (!cooldownActive) {
      // Invalidate any older unused challenges.
      await connection.execute(
        `UPDATE customer_otp_challenges
         SET consumed_at = ?
         WHERE mobile_number = ?
           AND consumed_at IS NULL`,
        [now, mobileNumber]
      );

      const expiresAt = new Date(
        now.getTime() + expiryMinutes * 60_000
      );

      await connection.execute(
        `INSERT INTO customer_otp_challenges
         (
           challenge_id,
           mobile_number,
           otp_hash,
           attempts,
           max_attempts,
           expires_at,
           created_at
         )
         VALUES (?, ?, ?, 0, ?, ?, ?)`,
        [
          challengeId,
          mobileNumber,
          otpHash,
          maxAttempts,
          expiresAt,
          now,
        ]
      );

      shouldDeliver = true;
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();

    if (error instanceof OtpRequestRejected) {
      return;
    }

    throw error;
  } finally {
    connection.release();
  }

  if (shouldDeliver) {
    await deliverOtp({
      mobileNumber,
      otp,
    });
  }
}
