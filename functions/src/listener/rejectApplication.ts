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

export const listener_rejectApplication = functions.region("asia-south1").https.onCall(async (data, context) => {
  await ensureIsAdmin(context);
  
  const application = data;
  const applicationId = application.id;

  if (!applicationId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing application ID in the request data.");
  }
  await db.collection("applications").doc(applicationId).update({ status: "rejected" });
  return { success: true };
});
