import React from 'react';
import { Link } from 'react-router-dom';

const PolicyPageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="animate-fade-in bg-white dark:bg-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 sticky top-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10">
            <Link to="/profile" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Back to Profile">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h1>
        </div>
        <div className="p-4 md:p-6 prose prose-slate dark:prose-invert max-w-4xl mx-auto">
            {children}
        </div>
    </div>
);

export default PolicyPageLayout;