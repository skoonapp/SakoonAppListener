
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Ensure Firebase Admin is initialized. This is crucial for the function to work reliably.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * CRITICAL FUNCTION for Real-time Status Sync
 * RTDB se Firestore me listener status sync karta hai
 */
export const onListenerStatusChanged = functions
  .region("asia-southeast1") // Correct region to match RTDB instance location
  .database.ref("/status/{uid}")
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const beforeData = change.before.val();
    const afterData = change.after.val();

    functions.logger.log(`Status write for listener: ${uid}`, { beforeData, afterData });

    // Case 1: Node is deleted (e.g., user logs out, onDisconnect fires)
    if (!afterData) {
      // Only update Firestore if they were previously online
      if (beforeData?.isOnline === true) {
        await updateListenerFirestoreStatus(uid, false);
      }
      return null;
    }

    const beforeOnline = beforeData?.isOnline ?? false;
    const afterOnline = afterData.isOnline ?? false;

    // Case 2: The online status has actually changed.
    // This is the key optimization. It prevents writes on heartbeats or other non-status changes.
    if (beforeOnline !== afterOnline) {
      try {
        await updateListenerFirestoreStatus(uid, afterOnline);
        functions.logger.log(`✅ Synced ${uid}: ${afterOnline ? "Online" : "Offline"}`);
      } catch (error) {
        functions.logger.error(`❌ Sync failed for ${uid}:`, error);
      }
    } else {
      functions.logger.log(`Skipping Firestore sync for ${uid}, online status unchanged.`);
    }


    return null;
  });

/**
 * Helper function - Firestore listener document update
 */
async function updateListenerFirestoreStatus(uid: string, isOnline: boolean): Promise<void> {
  const listenerRef = admin.firestore().collection("listeners").doc(uid);
  
  try {
    const doc = await listenerRef.get();
    
    if (!doc.exists) {
      functions.logger.warn(`Listener document not found: ${uid}`);
      return;
    }

    await listenerRef.update({
      isOnline: isOnline,
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    functions.logger.error(`Firestore update failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * Cleanup offline listeners - Har 30 minute me run hota hai
 */
export const cleanupOfflineListeners = functions
  .region("asia-southeast1")
  .pubsub.schedule('every 30 minutes')
  .onRun(async (context) => {
    functions.logger.log('🧹 Starting offline listeners cleanup');
    
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    
    try {
      // Get all online listeners from Firestore
      const onlineListeners = await admin.firestore()
        .collection('listeners')
        .where('isOnline', '==', true)
        .get();

      let cleanupCount = 0;

      for (const doc of onlineListeners.docs) {
        const uid = doc.id;
        
        // Check RTDB for actual status
        const rtdbSnapshot = await admin.database()
          .ref(`/status/${uid}`)
          .once('value');
          
        const rtdbData = rtdbSnapshot.val();
        
        // Agar RTDB me nahi hai ya 30 min se inactive
        if (!rtdbData || !rtdbData.isOnline || (rtdbData.lastActive && rtdbData.lastActive < thirtyMinutesAgo)) {
          
          // Mark offline in Firestore
          await doc.ref.update({
            isOnline: false,
            lastSeen: admin.firestore.FieldValue.serverTimestamp(),
            cleanupReason: 'auto-cleanup'
          });
          
          // Also clean RTDB if stale
          if (rtdbData && rtdbData.lastActive < thirtyMinutesAgo) {
            await admin.database().ref(`/status/${uid}`).remove();
          }
          
          cleanupCount++;
        }
      }

      functions.logger.log(`🧹 Cleanup completed: ${cleanupCount} stale listeners cleaned`);
      
    } catch (error) {
      functions.logger.error('❌ Cleanup failed:', error);
    }
  });
