/**
 * मुख्य Firebase Functions इंडेक्स फाइल।
 * यह फाइल आपके ऐप के सभी (User, Listener, Admin) Cloud Functions के लिए मुख्य एंट्री पॉइंट है।
 * यह अलग-अलग फाइलों से सभी फंक्शन्स को इम्पोर्ट और एक्सपोर्ट करती है,
 * ताकि Firebase उन्हें पहचान सके और तैनात (deploy) कर सके।
 */
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// ===================================================================================
// USER-SIDE FUNCTIONS (एंड-यूज़र के लिए)
// ===================================================================================

// Payment Functions (user/payment.ts से)
// Only the webhook is used, which is called by an external service.
export { cashfreeWebhook } from './user/payment';

// webhook को 'api' नाम से भी export करें
import { cashfreeWebhook } from './user/payment';
export { cashfreeWebhook as api };

// Session Functions (user/sessions.ts से)
// These are Firestore triggers that run automatically.
export { finalizeCallSession, finalizeChatSession } from './user/sessions';

// ===================================================================================
// LISTENER-SIDE FUNCTIONS (आपके मौजूदा स्ट्रक्चर से)
// ===================================================================================

// Listener Application और Approval से जुड़े फ़ंक्शंस
export { listener_approveApplication } from './listener/approveApplication';
export { listener_rejectApplication } from './listener/rejectApplication';
export { listener_submitListenerApplication } from './listener/submitListenerApplication';

// Listener Auth (जैसे अकाउंट डिलीट होने पर) और Admin Management से जुड़े फ़ंक्शंस
// This is an auth trigger that runs automatically.
export { onDeleteListener } from './listener/onDeleteListener';

// ===================================================================================
// PRESENCE & UTILITY FUNCTIONS
// ===================================================================================

// These are database triggers or scheduled functions that run automatically.
export { onListenerStatusChanged } from "./utility/presence";
export { cleanupOfflineListeners } from "./utility/presence";

// ===================================================================================
// COMMON UTILITY FUNCTIONS
// ===================================================================================

// ZegoCloud utility function (common में बनाया गया)
// This is called from the frontend to join calls.
export { generateZegoToken as generateZegoTokenUtility } from "./common/zegocloud";
