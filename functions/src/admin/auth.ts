// functions/src/admin/auth.ts का पूरा कोड
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth(); 

/**
 * Cloud Function Callable: makeAdmin
 *
 * उद्देश्य: यह एक सुरक्षित फंक्शन है जिसे केवल एक मौजूदा एडमिन ही कॉल कर सकता है
 * ताकि वह किसी दूसरे यूज़र को भी एडमिन बना सके।
 *
 * Purpose: A secure function that can only be called by an existing admin
 * to grant admin privileges to another user.
 */
export const makeAdmin = functions
  .region("asia-south1")
  .https.onCall(async (data: { email: string }, context) => {
    // 1. सुरक्षा जाँच: क्या कॉल करने वाला यूज़र एडमिन है?
    if (context.auth?.token.admin !== true) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "केवल एडमिन ही यह काम कर सकते हैं।"
      );
    }

    const {email} = data;
    if (!email) {
      throw new functions.https.HttpsError("invalid-argument", "ईमेल ज़रूरी है।");
    }

    try {
      // 2. दिए गए ईमेल से यूज़र का अकाउंट खोजें
      const user = await auth.getUserByEmail(email);

      // 3. उस यूज़र पर एक 'कस्टम क्लेम' सेट करें, जो उसे एडमिन बनाता है
      await auth.setCustomUserClaims(user.uid, {admin: true});

      return {success: true, message: `यूज़र ${email} को सफलतापूर्वक एडमिन बना दिया गया है।`};
    } catch (error: any) {
      functions.logger.error(`एडमिन बनाने में त्रुटि: ${email}`, error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });