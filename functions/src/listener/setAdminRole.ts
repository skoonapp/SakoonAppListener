import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();

const ensureIsAdmin = async (context: functions.https.CallableContext) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const user = await auth.getUser(uid);
  if (user.customClaims?.admin !== true) {
    throw new functions.https.HttpsError("permission-denied", "User must be an admin to perform this action.");
  }
};

export const listener_setAdminRole = functions.region("asia-south1").https.onCall(async (data, context) => {
  await ensureIsAdmin(context);
  const { targetUid } = data;
  if (!targetUid || typeof targetUid !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'targetUid' string.");
  }
  try {
    await auth.setCustomUserClaims(targetUid, { admin: true });
    await db.collection("listeners").doc(targetUid).update({ isAdmin: true });
    return { success: true, message: `User ${targetUid} has been successfully made an admin.` };
  } catch (error) {
    console.error(`Error setting admin role for ${targetUid}:`, error);
    throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
  }
});
