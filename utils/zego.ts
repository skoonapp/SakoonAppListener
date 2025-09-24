import { auth, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

// ZegoUIKitPrebuilt is loaded from a script tag in index.html
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

/**
 * Fetches a ZegoCloud Kit Token from our secure Firebase Function using the recommended httpsCallable method.
 * The function verifies the listener's authentication before issuing a token for a specific room.
 * @param roomId The ID of the call/room the listener is joining.
 * @returns A promise that resolves to the Zego Kit Token.
 */
export const fetchZegoToken = async (roomId: string): Promise<string> => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User not logged in.");
        }

        // FIX: Called the correct, simplified cloud function for utility token generation.
        // The 'generateZegoToken' function is for the end-user app and has different logic.
        const generateToken = httpsCallable(functions, 'generateZegoTokenUtility');
        const result = await generateToken({ roomId });

        // The httpsCallable result has the data inside a `data` property.
        const token = (result.data as { token: string }).token;
        
        if (!token) {
            console.error('Invalid token response from server:', result.data);
            throw new Error('Invalid token response from server.');
        }

        return token;

    } catch (error: any) {
        console.error("Failed to fetch Zego token:", error);
        // HttpsCallable errors have a `message` property with the specific reason from the backend
        const errorMessage = error.message || "Could not create a secure session. Please try again.";
        throw new Error(errorMessage);
    }
};