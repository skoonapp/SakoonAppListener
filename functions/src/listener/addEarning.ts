// functions/src/listener/addEarning.ts का पूरा कोड
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// ✅ db को initialize करें
const db = admin.firestore();

// Define necessary types locally to avoid conflicts
type CallStatus = "completed" | "missed" | "rejected";
interface CallRecord {
  status: CallStatus;
  listenerId: string;
  durationSeconds?: number;
  userName?: string;
}
/**
 * Calculates earnings for a call based on its duration in minutes.
 * @param {number} durationMinutes The duration of the call in minutes.
 * @return {number} The calculated earning for the listener.
 */
function calculateCallEarnings(durationMinutes: number): number {
  let rate = 0;
  if (durationMinutes <= 5) rate = 2.0;
  else if (durationMinutes <= 15) rate = 2.5;
  else if (durationMinutes <= 30) rate = 3.0;
  else if (durationMinutes <= 45) rate = 3.5;
  else rate = 3.6;
  return parseFloat((durationMinutes * rate).toFixed(2));
}
/**
 * Cloud Function Trigger: onCallComplete
 *
 * उद्देश्य: जब भी 'calls' कलेक्शन में किसी कॉल का स्टेटस 'completed' होता है,
 * यह फंक्शन अपने आप चलता है। यह कॉल की अवधि के आधार पर कमाई की गणना करता है
 * और Listener के लिए एक नया Earning Record बनाता है।
 *
 * Purpose: This function triggers automatically whenever a call document in the
 * 'calls' collection is updated to a status of 'completed'. It calculates the
 * earnings based on the call duration and creates a new earning record for the listener.
 */
export const onCallComplete = functions
  .region("asia-south1")
  .firestore.document("calls/{callId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data() as CallRecord;
    const afterData = change.after.data() as CallRecord;
    // केवल तभी आगे बढ़ें जब कॉल का स्टेटस 'completed' हुआ हो
    if (beforeData.status !== "completed" && afterData.status === "completed") {
      const {callId} = context.params;
      const {listenerId, durationSeconds, userName} = afterData;
      if (!listenerId || !durationSeconds || durationSeconds <= 0) {
        functions.logger.warn(`Call ${callId} is missing listenerId or a valid duration.`);
        return null;
      }
      const durationMinutes = durationSeconds / 60;
      const listenerEarning = calculateCallEarnings(durationMinutes);
      if (listenerEarning <= 0) {
        functions.logger.info(`No earnings calculated for call ${callId}.`);
        return null;
      }
      const earningRecord = {
        amount: listenerEarning,
        callId: callId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userName: userName || "A User",
        type: "call",
      };
      const batch = db.batch();
      // Listener की subcollection में Earning Record जोड़ें
      const listenerEarningsRef = db.collection("listeners").doc(listenerId).collection("earnings").doc(callId);
      batch.set(listenerEarningsRef, earningRecord);
      // Call document में भी Earning अपडेट करें
      const callRef = change.after.ref;
      batch.update(callRef, {earnings: listenerEarning});
      await batch.commit();
      functions.logger.info(`Earnings processed for call ${callId}. Listener earned: ₹${listenerEarning}.`);
    }
    return null;
  });
