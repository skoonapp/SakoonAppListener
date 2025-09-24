import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { functions } from '../../utils/firebase';
import { httpsCallable } from 'firebase/functions';

const generateZegoTokenFunction = httpsCallable(functions, 'generateZegoToken');

async function testZegoToken(roomId: string, userId: string) {
  try {
    console.log(`Requesting Zego Token for Room: ${roomId}, User: ${userId}`);
    const result = await generateZegoTokenFunction({ roomId, userId });
    console.log('Raw result from function:', result);

    const responseData = result.data as any;
    if (responseData.success) {
      return responseData.data;
    } else {
      throw new Error(responseData.message || 'The function returned success: false but did not provide an error message.');
    }
  } catch (error: any) {
    console.error('Error calling generateZegoToken function:', error);
    // Re-throw the error with a more helpful message if possible
    throw new Error(error.message || 'An unknown error occurred while generating the token.');
  }
}

const TestScreen: React.FC = () => {
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState('test-room-123');
  const [userId, setUserId] = useState('test-user-456');

  const handleGenerateToken = async () => {
    setLoading(true);
    setError(null);
    setTokenData(null);
    try {
      const data = await testZegoToken(roomId, userId);
      setTokenData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-slate-100 dark:bg-slate-900 min-h-screen">
      <Link to="/admin" className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium">&larr; Back to Admin Dashboard</Link>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Zego Token Generation Test</h1>
      <p className="text-slate-500 dark:text-slate-400">
        This tool calls the <code>generateZegoToken</code> Cloud Function to test token creation for users.
      </p>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-4 max-w-lg">
        <div>
          <label htmlFor="roomId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Room ID</label>
          <input
            type="text"
            id="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="mt-1 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">User ID</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>

        <button
          onClick={handleGenerateToken}
          disabled={loading || !roomId || !userId}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Zego Token'}
        </button>

        {error && <div className="text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/50 p-3 rounded-md text-sm"><span className="font-bold">Error:</span> {error}</div>}

        {tokenData && (
          <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-md text-sm text-green-800 dark:text-green-200 space-y-2">
            <h3 className="font-bold">✅ Token generated successfully!</h3>
            <p><strong>Room ID:</strong> {tokenData.roomId}</p>
            <p><strong>User ID:</strong> {tokenData.userId}</p>
            <p><strong>App ID:</strong> {tokenData.appId}</p>
            <p><strong>Expires In:</strong> {tokenData.expiresIn} seconds</p>
            <p className="break-all"><strong>Token:</strong> <code className="text-xs p-1 bg-black/10 rounded">{tokenData.token}</code></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestScreen;