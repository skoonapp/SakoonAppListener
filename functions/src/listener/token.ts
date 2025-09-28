
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { Buffer } from "buffer";

// Ensure Firebase Admin is initialized.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// IMPORTANT: Store your Zego App ID and Server Secret in Firebase Function configuration
// In your terminal, run these commands:
// firebase functions:config:set zegocloud.appid="YOUR_APP_ID"
// firebase functions:config:set zegocloud.secret="YOUR_SERVER_SECRET"
const ZEGO_APP_ID = parseInt(process.env.ZEGO_APP_ID || functions.config().zegocloud?.appid || "0");
const ZEGO_SERVER_SECRET = process.env.ZEGO_SERVER_SECRET || functions.config().zegocloud?.secret || "";

/**
 * Generates a ZegoCloud Kit Token for an authenticated LISTENER to join a room.
 * This is a callable function, invoked from the client-side.
 */
export const generateZegoTokenForListener = functions.region("asia-south1").https.onCall(async (data, context) => {
  if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
    functions.logger.error("Zego App ID or Server Secret is not configured in Firebase Functions config.");
    throw new functions.https.HttpsError("internal", "The server is not configured for calling. Please contact support.");
  }

  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to get a token.");
  }

  // Check if the user is a valid listener in Firestore
  try {
    const listenerDoc = await db.collection("listeners").doc(uid).get();
    if (!listenerDoc.exists) {
        functions.logger.warn(`Unauthorized token request from user ${uid} who is not a listener.`);
        throw new functions.https.HttpsError("permission-denied", "User is not an authorized listener.");
    }
  } catch (error: any) {
    if (error.code === "permission-denied") throw error; // Re-throw permission denied errors
    functions.logger.error(`Error verifying listener status for UID: ${uid}`, error);
    throw new functions.https.HttpsError("internal", "Could not verify listener status.");
  }


  // Room ID is passed from the client
  const roomId = data.roomId;
  if (!roomId || typeof roomId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'roomId' string argument.");
  }

  const effectiveTimeInSeconds = 3600; // Token is valid for 1 hour
  const payloadData = {
    room_id: roomId,
    privilege: {
      1: 1, // loginRoom: 1 = allow, 0 = forbid
      2: 1, // publishStream: 1 = allow, 0 = forbid
    },
    stream_id_list: null, // No specific stream restrictions
  };

  try {
    const token = generateToken04(ZEGO_APP_ID, uid, ZEGO_SERVER_SECRET, effectiveTimeInSeconds, JSON.stringify(payloadData));
    functions.logger.info(`Successfully generated Zego token for listener ${uid} in room ${roomId}`);
    return { token };
  } catch (error) {
    functions.logger.error(`Failed to generate token for user ${uid}:`, error);
    throw new functions.https.HttpsError("internal", "Failed to generate a secure call token.");
  }
});

/**
 * Implements Zego's token generation logic (version 04).
 * This is a manual implementation based on Zego's documentation for environments
 * where their server SDK might not be available.
 * @see https://docs.zegocloud.com/article/14142
 */
function generateToken04(appId: number, userId: string, secret: string, effectiveTimeInSeconds: number, payload: string): string {
  const createTime = Math.floor(Date.now() / 1000);
  const expireTime = createTime + effectiveTimeInSeconds;
  const nonce = crypto.randomBytes(16).toString("hex");

  const plainText = JSON.stringify({
    app_id: appId,
    user_id: userId,
    nonce: nonce,
    ctime: createTime,
    expire: expireTime,
    payload: payload || "",
  });

  // 1. Encrypt with AES
  // Zego requires a 32-byte key for AES-256, so we ensure the secret is the correct length.
  if (secret.length !== 32) {
      throw new Error("Zego server secret must be 32 characters long.");
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", secret, iv);
  cipher.setAutoPadding(true);
  let encrypted = cipher.update(plainText, "utf8", "base64");
  encrypted += cipher.final("base64");

  // 2. Pack the expire time, IV, and ciphertext into a buffer
  const expireTimeBuffer = Buffer.alloc(8);
  expireTimeBuffer.writeBigInt64BE(BigInt(expireTime), 0);

  const pack = Buffer.concat([
    expireTimeBuffer,
    iv,
    Buffer.from(encrypted, "base64"),
  ]);

  // 3. Final token is version + base64(packed_data)
  const token = `04${pack.toString("base64")}`;
  return token;
}