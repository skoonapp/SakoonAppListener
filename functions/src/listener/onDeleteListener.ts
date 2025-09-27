

import * as functionsV1 from "firebase-functions/v1";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const onDeleteListener = functionsV1
  .region("asia-south1")
  .auth.user()
  .onDelete(async (user) => {
    functionsV1.logger.info(`Listener account deletion triggered for UID: ${user.uid}`);
    try {
      const listenerRef = db.collection("listeners").doc(user.uid);
      await listenerRef.delete();
      functionsV1.logger.info(`Successfully deleted listener data for UID: ${user.uid} from Firestore.`);
    } catch (error) {
      functionsV1.logger.error(`Error deleting listener data for UID: ${user.uid}`, error);
    }
  });
