/**
 * मुख्य Firebase Functions इंडेक्स फाइल।
 * यह फाइल आपके ऐप के सभी (User, Listener, Admin) Cloud Functions के लिए मुख्य एंट्री पॉइंट है।
 * यह अलग-अलग फाइलों से सभी फंक्शन्स को इम्पोर्ट और एक्सपोर्ट करती है,
 * ताकि Firebase उन्हें पहचान सके और तैनात (deploy) कर सके।
 */
import { setGlobalOptions } from 'firebase-functions/v2';
setGlobalOptions({ region: 'asia-south1' });

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

// Listener Application और Approval से जुड़े फ़ंक्शंस (RENAMED)
export { listener_approveApplication } from './listener/approveApplication';
export { listener_rejectApplication } from './listener/rejectApplication';
export { listener_submitListenerApplication } from './listener/submitListenerApplication';

// Listener Auth (जैसे अकाउंट डिलीट होने पर) और Admin Management से जुड़े फ़ंक्शंस (RENAMED)
export { onDeleteListener } from './listener/onDeleteListener';
export { listener_setAdminRole } from './listener/setAdminRole';


// Listener Availability (Online/Offline/Busy) से जुड़े फ़ंक्शंस
// export * from "./availability"; // updateListenerAvailability

// Listener Dashboard डेटा से जुड़े फ़ंक्शंस
// export * from "./listener/dashboard"; // getDashboardData

// Listener Earnings से जुड़े फ़ंक्शंस
// export * from "./listener/addEarning"; // onCallComplete
// export * from "./listener/earnings"; // getEarningsSummary

// Push Notifications भेजने वाले फ़ंक्शंस
// export * from "./notifications"; // sendCallNotification


// ===================================================================================
// ADMIN-SIDE FUNCTIONS (आपके मौजूदा स्ट्रक्चर से)
// ===================================================================================

// export * from "./admin/auth";
// export * from "./admin/dashboard";
// export * from "./admin/manageListeners";
// export * from "./admin/manageUsers";

// ===================================================================================
// COMMON APIs & WEBHOOKS (आपके मौजूदा स्ट्रक्चर से)
// ===================================================================================

// Common Utilities और API फ़ंक्शंस
// export * from "./common/api";
// export * from "./common/gemini";

// ZegoCloud utility function (common में बनाया गया)
export { generateZegoToken as generateZegoTokenUtility } from "./common/zegocloud";

// ZegoCloud (Video/Audio Call) से जुड़े पुराने फ़ंक्शंस (अगर इस्तेमाल हो रहे हैं)
// export * from "./zego";
