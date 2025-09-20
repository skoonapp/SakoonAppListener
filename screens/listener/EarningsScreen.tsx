import React, { useState, useEffect } from 'react';
import { useListener } from '../../context/ListenerContext';
import { db } from '../../utils/firebase';
import type { EarningRecord } from '../../types';

// --- Icons ---
const TotalEarningsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const TodayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;

// --- Components ---

// Data structure for aggregated earnings
interface EarningsData {
    total: number;
    today: number;
    last7Days: number;
    last30Days: number;
}
interface AdvancedStats {
    avgDaily: number;
    bestDay: { date: string; amount: number };
}

const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse ${className}`}></div>
);

const StatCard: React.FC<{ title: string; value: string; loading: boolean; icon: React.ReactNode; subtext?: string; }> = ({ title, value, loading, icon, subtext }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            {loading ? 
                <LoadingSkeleton className="h-7 w-20 mt-1" /> :
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            }
            {subtext && !loading && <p className="text-xs text-slate-400">{subtext}</p>}
        </div>
    </div>
);

const TransactionRow: React.FC<{ transaction: EarningRecord }> = ({ transaction }) => (
    <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CallIcon />
            </div>
            <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Call with {transaction.userName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {transaction.timestamp.toDate().toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                </p>
            </div>
        </div>
        <p className="font-bold text-green-600 dark:text-green-400 text-lg">
            +₹{Number(transaction.amount).toFixed(2)}
        </p>
    </div>
);

const EarningsScreen: React.FC = () => {
    const { profile } = useListener();
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState<EarningsData>({ total: 0, today: 0, last7Days: 0, last30Days: 0 });
    const [transactions, setTransactions] = useState<EarningRecord[]>([]);
    const [advancedStats, setAdvancedStats] = useState<AdvancedStats>({ avgDaily: 0, bestDay: { date: '', amount: 0 } });

    useEffect(() => {
        if (!profile?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const unsubscribe = db.collection('listeners').doc(profile.uid).collection('earnings')
            .where('timestamp', '>=', thirtyDaysAgo)
            .orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                const recentEarningsRecords = snapshot.docs.map(doc => ({
                    id: doc.id, ...doc.data(),
                }) as EarningRecord);
                
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                const calculatedEarnings: Omit<EarningsData, 'total'> = { today: 0, last7Days: 0, last30Days: 0 };
                const dailyTotals: { [key: string]: number } = {};

                recentEarningsRecords.forEach(record => {
                    const callEarning = Number(record.amount) || 0;
                    const callDate = record.timestamp.toDate();
                    const dateStr = callDate.toLocaleDateString('en-CA');
                    dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + callEarning;
                    
                    calculatedEarnings.last30Days += callEarning;
                    if (callDate >= sevenDaysAgo) calculatedEarnings.last7Days += callEarning;
                    if (callDate >= today) calculatedEarnings.today += callEarning;
                });

                let bestDay = { date: 'N/A', amount: 0 };
                for (const date in dailyTotals) {
                    if (dailyTotals[date] > bestDay.amount) {
                        bestDay = { date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric'}), amount: dailyTotals[date] };
                    }
                }
                const avgDaily = calculatedEarnings.last30Days > 0 ? calculatedEarnings.last30Days / 30 : 0;
                setAdvancedStats({ avgDaily, bestDay });

                setEarnings({ total: profile.totalEarnings || 0, ...calculatedEarnings });
                setTransactions(recentEarningsRecords.slice(0, 25));
                setLoading(false);
            }, (error) => {
                console.error("Error fetching earnings:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [profile?.uid, profile?.totalEarnings]);

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-cyan-600 to-teal-500 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-lg font-medium text-white/80">Total Earnings</p>
                    {loading && !profile?.totalEarnings ? 
                        <LoadingSkeleton className="h-10 w-32 mt-1 bg-white/30" /> :
                        <p className="text-4xl font-extrabold tracking-tight">₹{(profile?.totalEarnings || earnings.total).toFixed(2)}</p>
                    }
                </div>
                <TotalEarningsIcon />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Today's Earnings" value={`₹${earnings.today.toFixed(2)}`} loading={loading} icon={<TodayIcon />} />
                <StatCard title="Last 7 Days" value={`₹${earnings.last7Days.toFixed(2)}`} loading={loading} icon={<CalendarIcon />} />
                <StatCard title="Last 30 Days" value={`₹${earnings.last30Days.toFixed(2)}`} loading={loading} icon={<CalendarIcon />} />
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Performance Insights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard title="Avg. Daily Earnings" value={`₹${advancedStats.avgDaily.toFixed(2)}`} loading={loading} icon={<TrendingUpIcon />} subtext="Last 30 days" />
                    <StatCard title="Best Earning Day" value={`₹${advancedStats.bestDay.amount.toFixed(2)}`} loading={loading} icon={<StarIcon />} subtext={advancedStats.bestDay.date} />
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Recent Transactions</h3>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    {loading ? (
                        <div className="space-y-2">
                           {[...Array(5)].map((_, i) => <LoadingSkeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : transactions.length > 0 ? (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} />)}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
                            <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-200">No Transactions Yet</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Completed calls will appear here as transactions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
        
export default EarningsScreen;
