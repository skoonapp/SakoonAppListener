// functions/src/listener/dashboard.ts - Updated for asia-south1
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const getDashboardData = functions
  .region("asia-south1") // ✅ Region added
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated", "Please log in to see your dashboard."
      );
    }
    const {uid} = context.auth;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);

      const callsQuery = db.collection("calls")
        .where("listenerId", "==", uid)
        .where("startTime", ">=", sevenDaysAgoTimestamp)
        .orderBy("startTime", "desc")
        .limit(5);

      const chatsQuery = db.collection("chats")
        .where("listenerId", "==", uid)
        .where("lastMessageTimestamp", ">=", sevenDaysAgoTimestamp)
        .orderBy("lastMessageTimestamp", "desc")
        .limit(5);

      const [callsSnapshot, chatsSnapshot] = await Promise.all([
        callsQuery.get(),
        chatsQuery.get(),
      ]);

      const callsData = callsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
        ...doc.data(),
        type: "call",
        timestamp: doc.data().startTime,
      }));

      const chatsData = chatsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
        ...doc.data(),
        type: "chat",
        timestamp: doc.data().lastMessageTimestamp,
      }));

      const recentActivities = [...callsData, ...chatsData]
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
        .slice(0, 5)
        .map((activity: any) => ({
          type: activity.type,
          userName: activity.userName,
          durationSeconds: activity.durationSeconds || null,
          lastMessageText: activity.lastMessageText || null,
          earnings: activity.earnings || null,
        }));

      const allWeeklyCallsSnapshot = await db.collection("calls")
        .where("listenerId", "==", uid)
        .where("startTime", ">=", sevenDaysAgoTimestamp)
        .get();

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let todayCallsCount = 0;
      let todayTalkTimeSeconds = 0;
      let weekCallsCount = 0;
      let weekTalkTimeSeconds = 0;

      allWeeklyCallsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        const call = doc.data();
        const callDate = call.startTime.toDate();
        const duration = call.durationSeconds || 0;

        weekCallsCount++;
        weekTalkTimeSeconds += duration;

        if (callDate >= startOfToday) {
          todayCallsCount++;
          todayTalkTimeSeconds += duration;
        }
      });

      return {
        recentActivities,
        todayStats: {
          calls: todayCallsCount,
          duration: todayTalkTimeSeconds,
        },
        weekStats: {
          calls: weekCallsCount,
          avgDuration: weekCallsCount > 0 ? weekTalkTimeSeconds / weekCallsCount : 0,
        },
      };
    } catch (error) {
      functions.logger.error(`Error fetching dashboard data for UID: ${uid}`, error);
      throw new functions.https.HttpsError(
        "internal", "Could not load dashboard data."
      );
    }
  });
