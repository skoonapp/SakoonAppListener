import React from 'react';
import type { CallRecord } from '../../types';

interface CallHistoryCardProps {
    call: CallRecord;
}

const formatDuration = (seconds: number = 0): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatDate = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

const formatTime = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const StatusBadge: React.FC<{ status: CallRecord['status'] }> = ({ status }) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize";
    let colorClasses = "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";

    switch (status) {
        case 'completed':
            colorClasses = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
            break;
        case 'missed':
        case 'rejected':
            colorClasses = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
            break;
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
};


const CallHistoryCard: React.FC<CallHistoryCardProps> = ({ call }) => {
    const isMissedOrRejected = call.status === 'missed' || call.status === 'rejected';

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* User Info */}
                <div className="flex items-center gap-3 flex-grow">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        {/* Placeholder Icon, can be replaced with call.userAvatar if available */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             {isMissedOrRejected && (
                                <span 
                                  className={`w-2.5 h-2.5 rounded-full ${call.status === 'missed' ? 'bg-green-500' : 'bg-red-500'}`}
                                  title={call.status === 'missed' ? 'Missed Call' : 'Rejected Call'}
                                ></span>
                            )}
                            <p className="font-bold text-slate-800 dark:text-slate-200">{call.userName || 'Unknown User'}</p>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(call.startTime)} at {formatTime(call.startTime)}</p>
                    </div>
                </div>

                {/* Call Details */}
                <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300" title="Duration">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-medium">{formatDuration(call.durationSeconds)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300" title="Earnings">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 4h4m5 4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-bold text-green-600 dark:text-green-400">
                            ₹{typeof call.earnings === 'number' ? call.earnings.toFixed(2) : '0.00'}
                        </span>
                    </div>

                    <div className="shrink-0">
                        <StatusBadge status={call.status} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallHistoryCard;