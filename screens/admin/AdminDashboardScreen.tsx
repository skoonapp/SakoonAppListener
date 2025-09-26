import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db, functions, auth } from '../../utils/firebase';
import type { ListenerProfile, Application, CallRecord } from '../../types';
import { useNavigate, Link } from 'react-router-dom';
import { usePTR } from '../../context/PTRContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


// --- Reusable Notification Banner ---
const NotificationBanner: React.FC<{ message: string; type: 'error' | 'success'; onDismiss: () => void; }> = ({ message, type, onDismiss }) => {
    const baseClasses = "p-4 mb-4 rounded-lg flex items-center justify-between shadow-md animate-fade-in";
    const colorClasses = type === 'error'
        ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"
        : "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200";

    return (
        <div className={`${baseClasses} ${colorClasses}`} role="alert">
            <p className="font-medium">{message}</p>
            <button onClick={onDismiss} aria-label="Dismiss" className="p-1 -mr-2 rounded-full hover:bg-black/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
};


// --- Icon Components ---
const RupeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 4h4m5 4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ProfitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const TransactionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UserClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const NewApplicationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const OnlineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const SpinnerIcon = () => <svg className="animate-spin h-5 w-5 text-slate-500 dark:text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; loading: boolean; }> = ({ title, value, icon, loading }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4 h-full">
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            {loading ?
                <div className="h-7 w-24 mt-1 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div> :
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            }
        </div>
    </div>
);

const PayoutNotice: React.FC = () => {
    const getNextMonday = () => {
        const today = new Date();
        const day = today.getDay(); // Sunday - 0, Monday - 1, ...
        const daysUntilMonday = (8 - day) % 7;
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
        return nextMonday;
    };

    const isTodayPayoutDay = new Date().getDay() === 1;
    const nextPayoutDate = getNextMonday();

    return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between gap-4">
            <div className="flex-grow">
                <h3 className="font-bold text-lg">{isTodayPayoutDay ? "✅ Today is Payout Day!" : "🗓️ Next Payout Schedule"}</h3>
                <p className="text-sm">{isTodayPayoutDay ? "Ensure all calculations are verified." : `Payouts are processed every Monday. Next Payout: ${nextPayoutDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}</p>
            </div>
            <CalendarIcon />
        </div>
    );
};


const AdminDashboardScreen: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [onboardingListeners, setOnboardingListeners] = useState<ListenerProfile[]>([]);
  const [stats, setStats] = useState<any>({
      onlineListeners: 0,
      activeListeners: 0,
      dailyRevenue: '0.00',
      dailyProfit: 'N/A',
      dailyTransactions: 0,
      activeCallsNow: 0,
      activeChatsNow: 'N/A',
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { disablePTR } = usePTR();
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(true);


  const handleLogout = async () => {
    try {
        await auth.signOut();
        navigate('/login'); 
    } catch (error) {
        console.error('Error signing out: ', error);
        setNotification({ message: 'Could not log out. Please try again.', type: 'error' });
    }
  };

  useEffect(() => {
    // This screen is real-time, so disable pull-to-refresh.
    disablePTR();
    
    setLoading(true);
    setStatsLoading(true);

    // --- Real-time Listeners for Dashboard Data ---

    const unsubApplications = db.collection('applications')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const pendingApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        setApplications(pendingApps);
        setLoading(false);
      }, (err: any) => {
        console.error("Error fetching applications:", err);
        setNotification({ message: 'Failed to load new applications.', type: 'error' });
        setLoading(false);
      });
      
    const unsubOnboarding = db.collection('listeners').where('status', '==', 'onboarding_required')
      .onSnapshot(snapshot => {
        setOnboardingListeners(snapshot.docs.map(doc => doc.data() as ListenerProfile));
      }, (err: any) => {
        console.error("Error fetching onboarding listeners:", err);
        setNotification({ message: 'Failed to load onboarding listeners.', type: 'error' });
      });
      
    const unsubOnline = db.collection('listeners')
        .where('appStatus', '==', 'Available')
        .where('isOnline', '==', true) // More accurate online status
        .onSnapshot(snapshot => {
            setStats(prev => ({ ...prev, onlineListeners: snapshot.size }));
            setStatsLoading(false);
        }, (err: any) => {
          console.error("Error fetching online listeners:", err);
          // Provide a helpful error if the composite index is missing
          if (err.message.includes('firestore/indexes')) {
              console.error("Firestore composite index required. Please create it using the link in the error message.");
              setNotification({ message: 'A database index is required to view online listeners. See console for details.', type: 'error' });
          }
          setStatsLoading(false);
        });
        
    const unsubActive = db.collection('listeners').where('status', '==', 'active')
        .onSnapshot(snapshot => {
            setStats(prev => ({ ...prev, activeListeners: snapshot.size }));
        });

    const unsubActiveCalls = db.collection('calls').where('status', '==', 'active')
        .onSnapshot(snapshot => {
            setStats(prev => ({ ...prev, activeCallsNow: snapshot.size }));
        });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const unsubTodayCalls = db.collection('calls').where('startTime', '>=', startOfToday)
        .onSnapshot(snapshot => {
            const dailyRevenue = snapshot.docs
                .filter(doc => doc.data().status === 'completed')
                .reduce((sum, doc) => sum + (doc.data().earnings || 0), 0);
            
            const dailyTransactions = snapshot.docs
                .filter(doc => doc.data().status === 'completed').length;

            setStats(prev => ({
                ...prev,
                dailyRevenue: dailyRevenue.toFixed(2),
                dailyTransactions: dailyTransactions
            }));
        });

    return () => {
      unsubApplications();
      unsubOnboarding();
      unsubOnline();
      unsubActive();
      unsubActiveCalls();
      unsubTodayCalls();
    };
  }, [disablePTR]);

  // Effect for fetching chart data
  useEffect(() => {
    const fetchChartData = async () => {
        setChartLoading(true);
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const snapshot = await db.collection('calls')
                .where('status', '==', 'completed')
                .where('startTime', '>=', sevenDaysAgo)
                .get();
            
            const dailyData = new Map<string, { date: string; revenue: number; calls: number }>();

            // Initialize last 7 days in chronological order
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const dateKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
                dailyData.set(dateKey, {
                    date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    revenue: 0,
                    calls: 0,
                });
            }

            snapshot.docs.forEach(doc => {
                const call = doc.data() as CallRecord;
                if (call.startTime) {
                    const callDate = call.startTime.toDate();
                    const dateKey = callDate.toISOString().split('T')[0];
                    if (dailyData.has(dateKey)) {
                        const day = dailyData.get(dateKey)!;
                        day.revenue += call.earnings || 0;
                        day.calls += 1;
                    }
                }
            });
            
            setWeeklyChartData(Array.from(dailyData.values()));
        } catch (err) {
            console.error("Error fetching chart data:", err);
            setNotification({ message: 'Failed to load analytics charts.', type: 'error' });
        } finally {
            setChartLoading(false);
        }
    };
    fetchChartData();
  }, []);

  const handleApplicationAction = async (application: Application, action: 'approve' | 'reject') => {
    if (!application.id || processingAppId) return;

    const confirmationText = action === 'approve'
      ? `Are you sure you want to approve this application for ${application.displayName}? This will create a listener account and ask them to complete their profile.`
      : `Are you sure you want to reject this application for ${application.displayName}?`;
    
    if (!window.confirm(confirmationText)) return;

    setProcessingAppId(application.id);
    const functionName = action === 'approve' ? 'listener_approveApplication' : 'listener_rejectApplication';
    try {
        const callable = functions.httpsCallable(functionName);
        await callable(application);
        setNotification({ message: `Application successfully ${action}d.`, type: 'success' });
    } catch (error: any) {
        console.error(`Error ${action}ing application for ${application.displayName} (${application.id}):`, error);
        setNotification({ message: `Failed to ${action} application: ${error.message}`, type: 'error' });
    } finally {
        setProcessingAppId(null);
    }
  };


  return (
    <div className="p-4 sm:p-6 space-y-8 bg-slate-100 dark:bg-slate-900 min-h-screen">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Admin Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">Welcome, Admin. Here is a complete overview of your business.</p>
            </div>
             <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0"
            >
                Logout
            </button>
        </header>
        
        {notification && <NotificationBanner message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
        
        <PayoutNotice />

        {/* Main Dashboard Overview */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Main Dashboard Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Listeners Online" value={stats.onlineListeners} icon={<OnlineIcon />} loading={statsLoading} />
                <StatCard title="Active Listeners" value={stats.activeListeners} icon={<UserCheckIcon />} loading={statsLoading} />
                <StatCard title="New Applications" value={applications.length} icon={<NewApplicationIcon />} loading={loading} />
                <StatCard title="Pending Onboarding" value={onboardingListeners.length} icon={<UserClockIcon />} loading={loading} />
            </div>
        </div>
        
        {/* Daily Performance Grid */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Daily Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Today's Revenue" value={`₹${stats.dailyRevenue}`} icon={<RupeeIcon />} loading={statsLoading} />
                <StatCard title="Today's Profit" value={`${stats.dailyProfit}`} icon={<ProfitIcon />} loading={statsLoading} />
                <StatCard title="Today's Transactions" value={stats.dailyTransactions} icon={<TransactionIcon />} loading={statsLoading} />
                <StatCard title="Active Calls Now" value={stats.activeCallsNow} icon={<PhoneIcon />} loading={statsLoading} />
                <StatCard title="Active Chats Now" value={`${stats.activeChatsNow}`} icon={<ChatIcon />} loading={statsLoading} />
            </div>
        </div>
        
        {/* Weekly Analytics */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Weekly Analytics</h3>
            {chartLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm h-[350px] animate-pulse"></div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm h-[350px] animate-pulse"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Revenue (Last 7 Days)</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="date" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
                                    cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                        borderColor: 'rgb(51 65 85)',
                                        borderRadius: '0.5rem',
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#06b6d4" name="Revenue" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Call Volume Chart */}
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Call Volume (Last 7 Days)</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={weeklyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="date" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} allowDecimals={false} />
                                <Tooltip
                                    formatter={(value: number) => [value, 'Calls']}
                                    cursor={{ stroke: 'rgba(100, 116, 139, 0.5)', strokeWidth: 1 }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                        borderColor: 'rgb(51 65 85)',
                                        borderRadius: '0.5rem',
                                    }}
                                />
                                <Line type="monotone" dataKey="calls" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 8 }} name="Calls" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* New Applications Table */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">ACTION REQUIRED: New Applications</h3>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Applicant</th>
                                    <th scope="col" className="px-6 py-3">Profession</th>
                                    <th scope="col" className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={3} className="text-center p-4">Loading...</td></tr>
                                ) : applications.length > 0 ? (
                                    applications.map(app => (
                                        <tr key={app.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                                {app.displayName}
                                                <div className="font-normal text-slate-500">{app.phone}</div>
                                            </th>
                                            <td className="px-6 py-4 capitalize">{app.profession}</td>
                                            <td className="px-6 py-4 text-right">
                                                {processingAppId === app.id ? (
                                                    <div className="flex justify-end items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                                                        <SpinnerIcon />
                                                        <span>Processing...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button
                                                            onClick={() => handleApplicationAction(app, 'approve')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-colors bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/30"
                                                        >
                                                            <CheckIcon /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleApplicationAction(app, 'reject')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-colors bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30"
                                                        >
                                                            <XIcon /> Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8">No new applications to review.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Pending Profile Completion Table */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">INFORMATIONAL: Pending Profile Completion</h3>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                             <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Approved On</th>
                                    <th scope="col" className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={3} className="text-center p-4">Loading...</td></tr>
                                ) : onboardingListeners.length > 0 ? (
                                    onboardingListeners.map(listener => (
                                        <tr key={listener.uid} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                                {listener.displayName}
                                                <div className="font-normal text-slate-500">{listener.phone}</div>
                                            </th>
                                            <td className="px-6 py-4">{listener.createdAt?.toDate().toLocaleDateString() ?? 'N/A'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button disabled className="font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed">Send Reminder</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8">No listeners are pending profile completion.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div className="text-center">
             <Link to="/admin/listeners" className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
                Manage All Listeners
            </Link>
        </div>
    </div>
  );
};

export default AdminDashboardScreen;