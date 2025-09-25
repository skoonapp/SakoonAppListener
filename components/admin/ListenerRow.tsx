import React from 'react';
import type { ListenerProfile, ListenerAccountStatus } from '../../types';

interface ListenerRowProps {
  listener: ListenerProfile;
  onStatusChange: (newStatus: ListenerAccountStatus) => void;
  isUpdating: boolean;
}

const StatusBadge: React.FC<{ status: ListenerAccountStatus }> = ({ status }) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize inline-block";
    let colorClasses = "";

    switch (status) {
        case 'active':
            colorClasses = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
            break;
        case 'pending':
        case 'onboarding_required':
            colorClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
            break;
        case 'suspended':
            colorClasses = "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
            break;
        case 'rejected':
            colorClasses = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
            break;
        default:
             colorClasses = "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status.replace('_', ' ')}</span>;
};


const ListenerRow: React.FC<ListenerRowProps> = ({ listener, onStatusChange, isUpdating }) => {
    return (
        <tr className={`bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isUpdating ? 'opacity-50' : ''}`}>
            <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <img src={listener.avatarUrl || `https://ui-avatars.com/api/?name=${listener.displayName}&background=random`} alt={listener.displayName} className="w-10 h-10 rounded-full object-cover"/>
                    <div>
                        {listener.displayName}
                        <div className="font-normal text-slate-500 text-xs">{listener.uid}</div>
                    </div>
                </div>
            </th>
            <td className="px-6 py-4">
                <StatusBadge status={listener.status} />
            </td>
            <td className="px-6 py-4">{listener.phone || 'N/A'}</td>
            <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
              ₹{listener.totalEarnings?.toFixed(2) ?? '0.00'}
            </td>
            <td className="px-6 py-4 font-mono text-center text-slate-600 dark:text-slate-300">
              {listener.callsCompleted ?? listener.totalCalls ?? 0}
            </td>
            <td className="px-6 py-4 text-right">
                 <select
                    value={listener.status}
                    onChange={(e) => onStatusChange(e.target.value as ListenerAccountStatus)}
                    disabled={isUpdating}
                    className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm p-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-70"
                >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="onboarding_required">Onboarding</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                </select>
            </td>
        </tr>
    );
};

export default ListenerRow;