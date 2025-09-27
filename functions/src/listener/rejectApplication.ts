
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { ensureIsAdmin } from "../common/adminCheck";

const db = admin.firestore();

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
