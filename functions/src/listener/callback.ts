
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Ensure Firebase Admin is initialized.
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

interface CallbackData {
    userId: string;
    userName: string;
    userAvatar: string | null;
}

/**
 * Creates a new 2-minute callback call document.
 * Invoked by a listener from the frontend.
 */
export const listener_initiateCallback = functions.region("asia-south1").https.onCall(async (data: CallbackData, context) => {
    const listenerUid = context.auth?.uid;
    if (!listenerUid) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to initiate a callback.");
    }

    const { userId, userName, userAvatar } = data;
    if (!userId || !userName) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with 'userId' and 'userName'.");
    }

    try {
        // Security Check 1: Verify the caller is a real, active listener.
        const listenerDoc = await db.collection("listeners").doc(listenerUid).get();
        if (!listenerDoc.exists || listenerDoc.data()?.status !== "active") {
            functions.logger.warn(`Unauthorized callback attempt from non-listener or inactive listener: ${listenerUid}`);
            throw new functions.https.HttpsError("permission-denied", "Only active listeners can initiate callbacks.");
        }
        
        // Security Check 2 (Optional but good): Prevent spamming callbacks to the same user.
        const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
        const recentCallbacks = await db.collection("calls")
            .where("listenerId", "==", listenerUid)
            .where("userId", "==", userId)
            .where("isCallback", "==", true)
            .where("startTime", ">=", twentyFourHoursAgo)
            .limit(1)
            .get();

        if (!recentCallbacks.empty) {
            functions.logger.warn(`Listener ${listenerUid} tried to make a repeat callback to user ${userId} within 24 hours.`);
            throw new functions.https.HttpsError("failed-precondition", "A callback has already been made to this user recently.");
        }

        // Create the new call document
        const newCallData = {
            listenerId: listenerUid,
            userId: userId,
            userName: userName,
            userAvatar: userAvatar || null,
            startTime: admin.firestore.FieldValue.serverTimestamp(),
            status: "ringing", // This will trigger a notification for the user app
            earnings: 0,
            type: "call",
            isCallback: true,
            maxDurationSeconds: 120, // 2 minutes
        };

        const newCallRef = await db.collection("calls").add(newCallData);

        functions.logger.info(`Listener ${listenerUid} successfully initiated callback call ${newCallRef.id} for user ${userId}.`);

        return { success: true, callId: newCallRef.id };

    } catch (error: any) {
        functions.logger.error(`Error initiating callback from listener ${listenerUid} to user ${userId}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while starting the callback.");
    }
});