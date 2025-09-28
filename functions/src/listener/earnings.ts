// functions/src/listener/earnings.ts - Updated for asia-south1
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const getEarningsSummary = functions
  .region("asia-south1") // ✅ Region added
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "इस फ़ंक्शन को इस्तेमाल करने के लिए लॉगिन होना ज़रूरी है।"
      );
    }
    const {uid} = context.auth;

    try {
      const earningsSnapshot = await db
        .collection("listeners")
        .doc(uid)
        .collection("earnings")
        .get();

      if (earningsSnapshot.empty) {
        return {total: 0, today: 0, last7Days: 0, last30Days: 0};
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

      const summary = {total: 0, today: 0, last7Days: 0, last30Days: 0};

      earningsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        const record = doc.data();
        const amount = Number(record.amount) || 0;
        const recordDate = (record.timestamp as admin.firestore.Timestamp).toDate();

        summary.total += amount;
        if (recordDate >= todayStart) summary.today += amount;
        if (recordDate >= sevenDaysAgo) summary.last7Days += amount;
        if (recordDate >= thirtyDaysAgo) summary.last30Days += amount;
      });

      for (const key in summary) {
        summary[key as keyof typeof summary] = parseFloat(summary[key as keyof typeof summary].toFixed(2));
      }

      return summary;
    } catch (error) {
      functions.logger.error(`Error fetching earnings summary for UID: ${uid}`, error);
      throw new functions.https.HttpsError(
        "internal",
        "Earnings summary प्राप्त करने में विफल रहा।"
      );
    }
  });
