import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

/**
 * CRITICAL FUNCTION for Real-time Status Sync
 * RTDB se Firestore me listener status sync karta hai
 */
export const onListenerStatusChanged = functions
  .region("asia-south1")
  .database.ref("/status/{uid}")
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const afterData = change.after.val();
    
    functions.logger.log(`Status change for listener: ${uid}`, afterData);

    // Agar node delete ho gaya (logout/cleanup)
    if (!afterData) {
      await updateListenerFirestoreStatus(uid, false);
      return null;
    }

    const isOnline = afterData.isOnline ?? false;
    
    try {
      await updateListenerFirestoreStatus(uid, isOnline);
      functions.logger.log(`✅ Synced ${uid}: ${isOnline ? 'Online' : 'Offline'}`);
    } catch (error) {
      functions.logger.error(`❌ Sync failed for ${uid}:`, error);
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
 * Force sync listener status - Admin/Manual sync ke liye
 */
export const forceSyncListenerStatus = functions
  .region("asia-south1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const uid = data.uid || context.auth.uid;
    
    try {
      const rtdbSnapshot = await admin.database()
        .ref(`/status/${uid}`)
        .once('value');
      
      const rtdbData = rtdbSnapshot.val();
      const isOnline = rtdbData?.isOnline ?? false;
      
      await updateListenerFirestoreStatus(uid, isOnline);
      
      return {
        success: true,
        message: 'Status synced successfully',
        uid,
        status: isOnline ? 'online' : 'offline'
      };
      
    } catch (error: any) {
      functions.logger.error(`Force sync failed for ${uid}:`, error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Test function - Status sync test karne ke liye
 */
export const testListenerStatusSync = functions
  .region("asia-south1")
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    
    const { uid, isOnline } = req.query;
    
    if (!uid) {
      res.status(400).json({ 
        error: "UID required",
        usage: "?uid=USER_ID&isOnline=true|false"
      });
      return;
    }

    const isOnlineBoolean = isOnline === 'true';

    try {
      const testData = {
        isOnline: isOnlineBoolean,
        appStatus: isOnlineBoolean ? 'Test-Online' : 'Test-Offline',
        lastActive: admin.database.ServerValue.TIMESTAMP
      };
      
      await admin.database().ref(`/status/${uid}`).set(testData);
      
      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const firestoreDoc = await admin.firestore()
        .collection('listeners')
        .doc(uid as string)
        .get();
      
      const firestoreData = firestoreDoc.data();
      const syncSuccess = firestoreData?.isOnline === isOnlineBoolean;
      
      res.json({
        success: syncSuccess,
        message: syncSuccess ? "✅ Sync test PASSED!" : "❌ Sync test FAILED",
        test: {
          uid: uid,
          rtdbSet: testData,
          firestoreResult: {
            isOnline: firestoreData?.isOnline,
            lastSeen: firestoreData?.lastSeen
          }
        }
      });
      
    } catch (error: any) {
      res.status(500).json({ 
        error: "Test failed", 
        details: error.message
      });
    }
  });

/**
 * Batch sync all listeners - Admin ke liye
 */
export const batchSyncAllListenerStatus = functions
  .region("asia-south1")
  .https.onRequest(async (req, res) => {
    // Simple admin check
    const authToken = req.headers.authorization;
    if (!authToken || !authToken.includes('admin')) {
      res.status(401).json({ error: "Admin access required" });
      return;
    }

    try {
      const rtdbSnapshot = await admin.database().ref('/status').once('value');
      const allStatuses = rtdbSnapshot.val() || {};
      const uids = Object.keys(allStatuses);
      
      let syncCount = 0;
      
      for (const uid of uids) {
        try {
          const isOnline = allStatuses[uid]?.isOnline ?? false;
          await updateListenerFirestoreStatus(uid, isOnline);
          syncCount++;
        } catch (error) {
          functions.logger.error(`Batch sync failed for ${uid}:`, error);
        }
      }

      res.json({
        message: "Batch sync completed",
        total: uids.length,
        synced: syncCount
      });

    } catch (error: any) {
      res.status(500).json({ 
        error: "Batch sync failed", 
        details: error.message 
      });
    }
  });

/**
 * Cleanup offline listeners - Har 30 minute me run hota hai
 */
export const cleanupOfflineListeners = functions
  .region("asia-south1")
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