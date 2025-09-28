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
// COMMON/UTILITY FUNCTIONS
// ===================================================================================

// API Routes (Express app)
// export { api } from './common/api'; // Uncomment if you have this file

// Gemini AI Functions
// export { generateTextWithGemini } from './common/gemini'; // Uncomment if you have this file

// ===================================================================================
// USER-SIDE FUNCTIONS
// ===================================================================================

// Payment Functions
// export { createCashfreeOrder, cashfreeWebhook } from './user/payment'; // Uncomment if you have these files

// Call Request Functions
// export { generateZegoToken } from './user/callRequest'; // Note: This is for the user app, not the listener app.

// Chat Request Functions
// export { useFreeMessage } from './user/chatRequest'; // Uncomment if you have this file

// Session Functions
export { finalizeChatSession } from './user/sessions';
// export { finalizeCallSession } from './user/sessions'; // Uncomment if you have these files


// History Functions
// export { getRechargeHistory, getUsageHistory } from "./user/history"; // Uncomment if you have these files

// User Functions
// export { updateMyProfile } from "./user/users"; // Uncomment if you have this file

// ===================================================================================
// LISTENER-SIDE FUNCTIONS
// ===================================================================================

// Listener Application Functions
export { listener_approveApplication } from './listener/approveApplication';
export { listener_rejectApplication } from './listener/rejectApplication';
export { listener_submitListenerApplication } from './listener/submitListenerApplication';

// Listener Management Functions
export { onDeleteListener } from './listener/onDeleteListener';
// FIX: The file `setAdminRole.ts` is empty and not a valid module, causing a compilation error.
// The function is not implemented, so its export is commented out to resolve the issue.
// export { listener_setAdminRole } from './listener/setAdminRole';

// Call & Callback Functions for Listener App
// FINAL FIX: Using simple, unique filenames to avoid any caching or pathing issues.
export { generateZegoTokenForListener } from './listener/token';
export { listener_initiateCallback } from './listener/callback';


// ===================================================================================
// ADMIN-SIDE FUNCTIONS
// ===================================================================================

// export { makeAdmin } from "./admin/auth";
// export { getAdminDashboardStats } from "./admin/dashboard";
// export { updateListenerStatusByAdmin } from "./admin/manageListeners";
// export { toggleUserAccountStatus } from "./admin/manageUsers";

// ===================================================================================
// PRESENCE & UTILITY FUNCTIONS
// ===================================================================================

export { onListenerStatusChanged } from "./utility/presence";
export { cleanupOfflineListeners } from "./utility/presence";
// export { forceSyncListenerStatus } from "./utility/presence";
// export { testListenerStatusSync } from "./utility/presence";
// export { batchSyncAllListenerStatus } from "./utility/presence";