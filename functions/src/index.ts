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
export { createCashfreeOrder, cashfreeWebhook } from './user/payment';
// webhook को 'api' नाम से भी export करें
import { cashfreeWebhook } from './user/payment';
export { cashfreeWebhook as api };

// Call Request Functions (user/callRequest.ts से) - FIXED VERSION
export { generateZegoToken } from './user/callRequest';

// Chat Request Functions (user/chatRequest.ts से)
export { useFreeMessage } from './user/chatRequest';

// Session Functions (user/sessions.ts से)
export { finalizeCallSession, finalizeChatSession } from './user/sessions';

// History Functions (user/history.ts से)
import { getRechargeHistory, getUsageHistory } from "./user/history";
export { getRechargeHistory, getUsageHistory };

// User Functions (user/users.ts से)
import { updateMyProfile } from "./user/users";
export { updateMyProfile };

// ===================================================================================
// LISTENER-SIDE FUNCTIONS (आपके मौजूदा स्ट्रक्चर से)
// ===================================================================================

// Listener Application और Approval से जुड़े फ़ंक्शंस
export { listener_approveApplication } from './listener/approveApplication';
export { listener_rejectApplication } from './listener/rejectApplication';
export { listener_submitListenerApplication } from './listener/submitListenerApplication';

// Listener Auth (जैसे अकाउंट डिलीट होने पर) और Admin Management से जुड़े फ़ंक्शंस
export { onDeleteListener } from './listener/onDeleteListener';
export { listener_setAdminRole } from './listener/setAdminRole';

// ===================================================================================
// PRESENCE & UTILITY FUNCTIONS
// ===================================================================================

// All presence-related functions are imported and exported from the utility file.
export * from "./utility/presence";

// ZegoCloud utility function (common में बनाया गया)
export { generateZegoToken as generateZegoTokenUtility } from "./common/zegocloud";