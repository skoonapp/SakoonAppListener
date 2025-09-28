import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { ensureIsAdmin } from "../common/adminCheck";

const db = admin.firestore();

/**
 * Toggles a regular user's account status (e.g., active/suspended).
 * Assumes a 'users' collection exists.
 * This is a callable function for admins.
 */
export const toggleUserAccountStatus = functions.region("asia-south1").https.onCall(async (data, context) => {
  await ensureIsAdmin(context);

  const { userUid, newStatus } = data;
  if (!userUid || typeof userUid !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "Missing 'userUid' argument.");
  }
  
  // newStatus should be true for active, false for suspended
  if (typeof newStatus !== "boolean") {
    throw new functions.https.HttpsError("invalid-argument", "The 'newStatus' argument must be a boolean.");
  }

  try {
    const userRef = db.collection("users").doc(userUid);
    
    // Update both Firestore and Auth disabled status
    await userRef.update({ accountActive: newStatus });
    await admin.auth().updateUser(userUid, { disabled: !newStatus });

    functions.logger.info(`Admin ${context.auth?.uid} toggled user ${userUid} account status to ${newStatus ? 'active' : 'suspended'}. Auth disabled: ${!newStatus}`);
    return { success: true, message: `User account status updated. User is now ${newStatus ? 'enabled' : 'disabled'}.` };
  } catch (error: any) {
    functions.logger.error(`Error toggling user ${userUid} account status:`, error);
    throw new functions.https.HttpsError("internal", "Failed to toggle user account status.", error.message);
  }
});
