import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db, functions } from '../../utils/firebase';
import type { ListenerProfile, ListenerAccountStatus } from '../../types';
import ListenerRow from '../../components/admin/ListenerRow';
import type firebase from 'firebase/compat/app';
import { usePTR } from '../../context/PTRContext';

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


type StatusFilter = 'all' | ListenerAccountStatus;

const PAGE_SIZE = 25;

const ListenerManagementScreen: React.FC = () => {
    const [listeners, setListeners] = useState<ListenerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<firebase.firestore.QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
    const [updatingUids, setUpdatingUids] = useState<string[]>([]);
    const { enablePTR, disablePTR } = usePTR();

    const fetchInitialListeners = useCallback(async () => {
        setLoading(true);
        setHasMore(true);
        setLastDoc(null);
        try {
            // FIX: Order by 'displayName' for more robust sorting, as 'createdAt' might be missing on older documents.
            const query = db.collection('listeners')
                .orderBy('displayName')
                .limit(PAGE_SIZE);
            
            const snapshot = await query.get();
            
            const listenersData = snapshot.docs.map(doc => doc.data() as ListenerProfile);
            setListeners(listenersData);
            
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastDoc(lastVisible);
            
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (error: any) {
            console.error("Error fetching listeners:", error);
            let detailedMessage = 'Failed to fetch initial listeners.';
            if (error.message && error.message.includes('firestore/indexes')) {
                detailedMessage += ' A Firestore index is required. Please check the browser console for a link to create it.';
            }
            setNotification({ message: detailedMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialListeners();
    }, [fetchInitialListeners]);
    
    useEffect(() => {
        enablePTR(fetchInitialListeners);
        return () => disablePTR();
    }, [enablePTR, disablePTR, fetchInitialListeners]);


    const handleLoadMore = async () => {
        if (!lastDoc || loadingMore || !hasMore) return;
        
        setLoadingMore(true);
        try {
            // FIX: Order by 'displayName' to match the initial fetch query.
            const query = db.collection('listeners')
                .orderBy('displayName')
                .startAfter(lastDoc)
                .limit(PAGE_SIZE);

            const snapshot = await query.get();
            
            const newListenersData = snapshot.docs.map(doc => doc.data() as ListenerProfile);
            setListeners(prev => [...prev, ...newListenersData]);
            
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastDoc(lastVisible);
            
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching more listeners:", error);
             setNotification({ message: 'Failed to load more listeners.', type: 'error' });
        } finally {
            setLoadingMore(false);
        }
    };

    const handleStatusChange = async (listener: ListenerProfile, newStatus: ListenerAccountStatus) => {
        if (listener.status === newStatus) return;
        if (!window.confirm(`Are you sure you want to change status to "${newStatus}" for ${listener.displayName}?`)) return;

        setUpdatingUids(prev => [...prev, listener.uid]);
        try {
            const updateStatus = functions.httpsCallable('updateListenerStatusByAdmin');
            await updateStatus({ listenerUid: listener.uid, newStatus: newStatus });
            
            // Update local state for immediate feedback
            setListeners(prev => prev.map(l => l.uid === listener.uid ? { ...l, status: newStatus } : l));
            setNotification({ message: `Status updated for ${listener.displayName}.`, type: 'success'});
        } catch (error: any) {
            console.error("Failed to update status:", error);
            setNotification({ message: `Error updating status for ${listener.displayName}: ${error.message}`, type: 'error'});
        } finally {
            setUpdatingUids(prev => prev.filter(uid => uid !== listener.uid));
        }
    };


    const filteredListeners = useMemo(() => {
        return listeners.filter(listener => {
            const matchesStatus = statusFilter === 'all' || listener.status === statusFilter;
            const matchesSearch = searchTerm === '' ||
                listener.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (listener.phone && listener.phone.includes(searchTerm));
            
            return matchesStatus && matchesSearch;
        });
    }, [listeners, statusFilter, searchTerm]);

    const filterOptions: { value: StatusFilter, label: string }[] = [
        { value: 'all', label: 'All Listeners' },
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'rejected', label: 'Rejected' },
    ];
    
    return (
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-full">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div>
                    <div className="flex items-center gap-2">
                         <Link to="/admin" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 -ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Listener Management</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10">View, manage, and update all listener accounts.</p>
                </div>
            </header>
            
            {notification && <NotificationBanner message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="sm:w-1/4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {filterOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>
            
            {/* Listeners Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Listener</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Phone</th>
                                <th scope="col" className="px-6 py-3">Total Earnings</th>
                                <th scope="col" className="px-6 py-3">Total Calls</th>
                                <th scope="col" className="px-6 py-3 text-right">Change Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                        <td className="px-6 py-4"><div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-10 w-32 ml-auto bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : filteredListeners.length > 0 ? (
                                filteredListeners.map(listener => <ListenerRow key={listener.uid} listener={listener} onStatusChange={(newStatus) => handleStatusChange(listener, newStatus)} isUpdating={updatingUids.includes(listener.uid)} />)
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10">
                                        <p className="font-semibold text-lg text-slate-600 dark:text-slate-300">No Listeners Found</p>
                                        <p className="text-slate-400">No listeners match the current filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Load More Button */}
            {hasMore && (
                 <div className="text-center pt-4">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-full disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                    >
                        {loadingMore && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ListenerManagementScreen;