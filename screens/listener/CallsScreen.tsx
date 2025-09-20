import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../utils/firebase';
import { useListener } from '../../context/ListenerContext';
import type { CallRecord } from '../../types';
import CallHistoryCard from '../../components/calls/CallHistoryCard';

type StatusFilter = 'all' | 'completed' | 'missed' | 'rejected';
type DateFilter = 'all' | 'today' | '7d' | '30d';

const FilterButton: React.FC<{
  options: { value: string, label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}> = ({ options, value, onChange }) => (
    <select 
        value={value} 
        onChange={onChange}
        className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    >
        {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
        ))}
    </select>
);

const StatusTab: React.FC<{label: string; value: StatusFilter; active: boolean; onClick: (value: StatusFilter) => void}> = ({ label, value, active, onClick }) => {
    const baseClasses = "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap";
    const activeClasses = "border-b-2 border-cyan-500 text-cyan-600 dark:text-cyan-400";
    const inactiveClasses = "border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600";
    
    return (
        <button onClick={() => onClick(value)} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
            {label}
        </button>
    );
};


const CallsScreen: React.FC = () => {
    const { profile } = useListener();
    const [allCalls, setAllCalls] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');

    useEffect(() => {
        if (!profile?.uid) return;

        setLoading(true);
        const unsubscribe = db.collection('calls')
            .where('listenerId', '==', profile.uid)
            .orderBy('startTime', 'desc')
            .limit(200) // Optimization: Limit to last 200 calls to prevent fetching huge datasets.
            .onSnapshot(snapshot => {
                const callsData = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    callId: doc.id,
                })) as CallRecord[];
                setAllCalls(callsData);
                setLoading(false);
            }, error => {
                console.error("Error fetching call history: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [profile?.uid]);

    const filteredCalls = useMemo(() => {
        let calls = allCalls;

        // Filter by status
        if (statusFilter !== 'all') {
            calls = calls.filter(call => call.status === statusFilter);
        }

        // Filter by date
        if (dateFilter !== 'all') {
            const now = new Date();
            let startDate = new Date();

            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (dateFilter === '7d') {
                startDate.setDate(now.getDate() - 7);
            } else if (dateFilter === '30d') {
                startDate.setDate(now.getDate() - 30);
            }
            
            calls = calls.filter(call => call.startTime && call.startTime.toDate() >= startDate);
        }

        return calls;
    }, [allCalls, statusFilter, dateFilter]);

    const statusOptions: {value: StatusFilter, label: string}[] = [
        { value: 'all', label: 'All Calls' },
        { value: 'completed', label: 'Completed' },
        { value: 'missed', label: 'Missed' },
        { value: 'rejected', label: 'Reverse' },
    ];

    return (
        <div className="p-4 space-y-4">
            <header className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-slate-500 dark:text-slate-400">Review your recent calls.</p>
                    <FilterButton 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                        options={[
                            { value: 'all', label: 'All Time' },
                            { value: 'today', label: 'Today' },
                            { value: '7d', label: 'Last 7 Days' },
                            { value: '30d', label: 'Last 30 Days' },
                        ]}
                    />
                </div>
                 <div className="flex items-center border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                    {statusOptions.map(opt => (
                        <StatusTab key={opt.value} label={opt.label} value={opt.value} active={statusFilter === opt.value} onClick={setStatusFilter} />
                    ))}
                </div>
            </header>
            
            {loading ? (
                <div className="text-center py-10">
                    <svg className="animate-spin h-8 w-8 text-cyan-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Loading history...</p>
                </div>
            ) : filteredCalls.length > 0 ? (
                <div className="space-y-3">
                    {filteredCalls.map(call => (
                        <CallHistoryCard key={call.callId} call={call} />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm text-center border border-dashed border-slate-300 dark:border-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-200">No Calls Found</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your call history matching these filters will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default CallsScreen;