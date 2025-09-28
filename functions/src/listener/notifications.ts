// functions/src/listener/notifications.ts - Updated for asia-south1
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const sendCallNotificationToListener = functions
  .region("asia-south1") // ✅ Region added
  .https.onCall(async (data: { listenerUid: string, callData: any }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "इस function को use करने के लिए login होना जरूरी है।"
      );
    }

    const {listenerUid, callData} = data;

    if (!listenerUid || !callData || !callData.roomId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "listenerUid और callData (with roomId) required हैं।"
      );
    }

    try {
      const listenerDoc = await db.collection("listeners").doc(listenerUid).get();

      if (!listenerDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "यह listener मौजूद नहीं है।"
        );
      }

      const listenerData = listenerDoc.data();
      const fcmToken = listenerData?.fcmToken;

      if (!fcmToken) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Listener का FCM token नहीं मिला।"
        );
      }

      const message = {
        notification: {
          title: "नई कॉल आई है! 📞",
          body: `${callData.callerName || "एक यूज़र"} आपसे ${callData.callType === "video" ? "वीडियो कॉल" : "वॉइस कॉल"} करना चाहता है।`,
        },
        data: {
          type: "incoming_call",
          roomId: callData.roomId,
          callerName: callData.callerName || "Unknown User",
          callType: callData.callType || "voice",
          callerUid: context.auth.uid,
        },
        token: fcmToken,
        android: {
          priority: "high" as const,
          notification: {
            channelId: "incoming_calls",
            priority: "max" as const,
            sound: "call_ringtone",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "call_ringtone.caf",
              category: "INCOMING_CALL",
            },
          },
        },
      };

      const messagingResponse = await admin.messaging().send(message);
      functions.logger.info(`Notification sent successfully: ${messagingResponse}`);

      const callRequestData = {
        listenerUid,
        callerUid: context.auth.uid,
        roomId: callData.roomId,
        callerName: callData.callerName || "Unknown User",
        callType: callData.callType || "voice",
        status: "pending",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        notificationSent: true,
        messagingResponse: messagingResponse,
      };

      await db.collection("call_requests").add(callRequestData);

      functions.logger.info(`Call notification sent to listener: ${listenerUid} for caller: ${context.auth.uid}`);

      return {
        success: true,
        message: "Notification भेज दिया गया है।",
        messagingResponse: messagingResponse,
      };
    } catch (error) {
      functions.logger.error("Error sending call notification:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Notification भेजने में problem हुई। कृपया फिर से कोशिश करें।"
      );
    }
  });

export const sendChatNotificationToListener = functions
  .region("asia-south1") // ✅ Region added
  .https.onCall(async (data: { listenerUid: string, messageData: any }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }

    const {listenerUid, messageData} = data;

    try {
      const listenerDoc = await db.collection("listeners").doc(listenerUid).get();

      if (!listenerDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Listener not found");
      }

      const listenerData = listenerDoc.data();
      const fcmToken = listenerData?.fcmToken;

      if (!fcmToken) {
        throw new functions.https.HttpsError("failed-precondition", "FCM token not found");
      }

      const message = {
        notification: {
          title: "नया मैसेज आया है! 💬",
          body: `${messageData.senderName || "एक यूज़र"} ने आपको मैसेज भेजा है।`,
        },
        data: {
          type: "new_message",
          chatId: messageData.chatId,
          senderName: messageData.senderName || "Unknown",
          senderUid: context.auth.uid,
          messagePreview: messageData.text ? messageData.text.substring(0, 50) : "",
        },
        token: fcmToken,
      };

      const messagingResponse = await admin.messaging().send(message);

      return {
        success: true,
        message: "Chat notification sent successfully",
        messagingResponse: messagingResponse,
      };
    } catch (error) {
      functions.logger.error("Error sending chat notification:", error);
      throw new functions.https.HttpsError("internal", "Could not send chat notification");
    }
  });
