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

export const listener_approveApplication = functions.region("asia-south1").https.onCall(async (data, context) => {
  await ensureIsAdmin(context);

  const application = data;
  const applicationId = application.id;

  if (!applicationId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing application ID in the request data.");
  }

  const appRef = db.collection("applications").doc(applicationId);
  const appDoc = await appRef.get();

  if (!appDoc.exists) {
    throw new functions.https.HttpsError("not-found", `Application ${applicationId} not found.`);
  }
  const appData = appDoc.data()!;

  if (appData.status !== "pending") {
    throw new functions.https.HttpsError("failed-precondition", "Application already processed.");
  }

  let userRecord;
  try {
    userRecord = await auth.createUser({
      phoneNumber: `+91${appData.phone}`,
      displayName: appData.displayName,
    });

    const listenerProfile = {
      uid: userRecord.uid,
      displayName: appData.displayName,
      realName: appData.fullName,
      phone: `+91${appData.phone}`,
      status: "onboarding_required",
      appStatus: "Offline",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      onboardingComplete: false,
      isAdmin: false,
      profession: appData.profession,
      languages: appData.languages,
      bankAccount: appData.bankAccount || null,
      ifsc: appData.ifsc || null,
      bankName: appData.bankName || null,
      upiId: appData.upiId || null,
    };

    const batch = db.batch();
    const listenerRef = db.collection("listeners").doc(userRecord.uid);
    batch.set(listenerRef, listenerProfile);
    batch.update(appRef, { status: "approved", listenerUid: userRecord.uid });
    await batch.commit();

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    if (userRecord) {
      functions.logger.warn(`Cleaning up orphaned auth user ${userRecord.uid} due to a failed profile creation.`);
      await auth.deleteUser(userRecord.uid);
    }
    if (error.code === "auth/phone-number-already-exists") {
      await appRef.update({ status: "rejected", reason: "Phone already exists in Auth" });
      throw new functions.https.HttpsError("already-exists", "This phone number is already registered as a user.");
    }
    functions.logger.error(`Critical error approving application ${applicationId}:`, error);
    throw new functions.https.HttpsError("internal", "An error occurred while creating the listener. The operation was rolled back.", error.message);
  }
});
