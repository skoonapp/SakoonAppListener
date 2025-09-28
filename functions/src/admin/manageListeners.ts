import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { ensureIsAdmin } from "../common/adminCheck";

const db = admin.firestore();

type ListenerAccountStatus = 'onboarding_required' | 'pending' | 'active' | 'suspended' | 'rejected';

/**
 * Updates the account status of a listener.
 * This is a callable function that can only be executed by an admin.
 */
export const updateListenerStatusByAdmin = functions.region("asia-south1").https.onCall(async (data, context) => {
  await ensureIsAdmin(context);

  const { listenerUid, newStatus } = data;
  if (!listenerUid || typeof listenerUid !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "Missing 'listenerUid' argument.");
  }
  
  const validStatuses: ListenerAccountStatus[] = ['onboarding_required', 'pending', 'active', 'suspended', 'rejected'];
  if (!newStatus || !validStatuses.includes(newStatus)) {
    throw new functions.https.HttpsError("invalid-argument", `Invalid 'newStatus' provided. Must be one of: ${validStatuses.join(", ")}`);
  }

  try {
    const listenerRef = db.collection("listeners").doc(listenerUid);
    await listenerRef.update({ status: newStatus });

    functions.logger.info(`Admin ${context.auth?.uid} updated listener ${listenerUid} status to ${newStatus}.`);
    return { success: true, message: "Listener status updated successfully." };
  } catch (error: any) {
    functions.logger.error(`Error updating listener ${listenerUid} status:`, error);
    throw new functions.https.HttpsError("internal", "Failed to update listener status.", error.message);
  }
});
