import * as functions from "firebase-functions/v1";

// A reusable utility function to ensure the caller is an admin.
export const ensureIsAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  // This relies on a custom claim 'admin' being set on the user's auth token.
  if (context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "The function must be called by an admin user."
    );
  }
};
