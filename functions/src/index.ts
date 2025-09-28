/**
 * मुख्य Firebase Functions इंडेक्स फाइल।
 * यह फाइल आपके ऐप के सभी (User, Listener, Admin) Cloud Functions के लिए मुख्य एंट्री पॉइंट है।
 * यह अलग-अलग फाइलों से सभी फंक्शन्स को इम्पोर्ट और एक्सपोर्ट करती है।
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// ===================================================================================
// USER-SIDE FUNCTIONS (Files not provided, commented out for safety)
// ===================================================================================
// export { createCashfreeOrder, cashfreeWebhook } from './user/payment';
// export { generateZegoToken } from './user/callRequest';
// export { useFreeMessage } from './user/chatRequest';
// export { finalizeCallSession, finalizeChatSession } from './user/sessions';
// export { getRechargeHistory, getUsageHistory } from "./user/history";
// export { updateMyProfile } from "./user/users";

// ===================================================================================
// LISTENER-SIDE FUNCTIONS
// ===================================================================================

// Listener Application & Approval
export { listener_approveApplication } from './listener/approveApplication';
export { listener_rejectApplication } from './listener/rejectApplication';
export { listener_submitListenerApplication } from './listener/submitListenerApplication';

// Listener Account Management & Auth
export { onDeleteListener } from './listener/onDeleteListener';
export { listener_setAdminRole } from './listener/setAdminRole';

// Listener Calling & Zego Token
export { generateZegoTokenForListener } from './listener/token';
export { listener_initiateCallback } from './listener/callback';

// Listener Dashboard & Stats
export { getDashboardData } from './listener/dashboard';

// Listener Earnings
export { onCallComplete } from './listener/addEarning';
export { getEarningsSummary } from './listener/earnings';

// Listener Notifications
export { sendCallNotificationToListener, sendChatNotificationToListener } from './listener/notifications';


// ===================================================================================
// ADMIN-SIDE FUNCTIONS
// ===================================================================================

export { makeAdmin } from "./admin/auth";
// export { getAdminDashboardStats } from "./admin/dashboard"; // This file is empty
export { updateListenerStatusByAdmin } from "./admin/manageListeners";
export { toggleUserAccountStatus } from "./admin/manageUsers";

// ===================================================================================
// PRESENCE & UTILITY FUNCTIONS
// ===================================================================================

export { onListenerStatusChanged, cleanupOfflineListeners } from "./utility/presence";
// NOTE: Other presence functions were not provided.
// export { forceSyncListenerStatus } from "./utility/presence";
// export { testListenerStatusSync } from "./utility/presence";
// export { batchSyncAllListenerStatus } from "./utility/presence";
