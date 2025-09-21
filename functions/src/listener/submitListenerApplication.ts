import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

interface ApplicationData {
  fullName: string;
  displayName: string;
  phone: string;
  profession: string;
  languages: string[];
  bankAccount?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
}

export const listener_submitListenerApplication = functions.region("asia-south1").https.onCall(async (data, context) => {
  const { fullName, displayName, phone, profession, languages, bankAccount, ifsc, bankName, upiId } = data as ApplicationData;

  if (!fullName || !displayName || !phone || !profession || !languages) {
    throw new functions.https.HttpsError("invalid-argument", "कृपया सभी ज़रूरी फ़ील्ड्स भरें।");
  }
  if (!/^\d{10}$/.test(phone)) {
    throw new functions.https.HttpsError("invalid-argument", "कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।");
  }
  if (!Array.isArray(languages) || languages.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "कृपया कम से कम एक भाषा चुनें।");
  }
  const hasBankDetails = bankAccount && ifsc && bankName;
  const hasUpi = upiId;
  if (!hasBankDetails && !hasUpi) {
    throw new functions.https.HttpsError("invalid-argument", "कृपया बैंक विवरण या UPI ID प्रदान करें।");
  }

  try {
    const appQuery = db.collection("applications").where("phone", "==", phone).where("status", "in", ["pending", "approved"]);
    const existingApps = await appQuery.get();
    if (!existingApps.empty) {
      throw new functions.https.HttpsError("already-exists", "इस फ़ोन नंबर से पहले ही एक आवेदन किया जा चुका है।");
    }

    const listenerQuery = db.collection("listeners").where("phone", "==", `+91${phone}`);
    const existingListeners = await listenerQuery.get();
    if (!existingListeners.empty) {
      throw new functions.https.HttpsError("already-exists", "यह फ़ोन नंबर पहले से एक Listener के रूप में रजिस्टर है।");
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error checking for duplicates:", error);
    throw new functions.https.HttpsError("internal", "आवेदन की जाँच करते समय एक त्रुटि हुई।");
  }

  try {
    await db.collection("applications").add({
      fullName: fullName.trim(),
      displayName: displayName.trim(),
      phone: phone.trim(),
      profession,
      languages,
      bankAccount: bankAccount || null,
      ifsc: ifsc || null,
      bankName: bankName || null,
      upiId: upiId || null,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, message: "आपका आवेदन सफलतापूर्वक जमा हो गया है!" };
  } catch (error) {
    functions.logger.error("Error saving application to Firestore:", error);
    throw new functions.https.HttpsError("internal", "आपका आवेदन जमा करने में विफल रहा। कृपया बाद में पुनः प्रयास करें।");
  }
});
