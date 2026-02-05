
import React from 'react';
import Link from 'next/link';

export default function DownloadPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">

                {/* Logo Placeholder */}
                <div className="h-20 w-20 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-3xl font-bold">
                    R
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Download Rallio Mobile</h1>
                    <p className="text-neutral-400">
                        The latest version of the app is currently being processed.
                    </p>
                </div>

                <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                        <span className="text-sm font-medium">Version</span>
                        <span className="text-sm text-neutral-400">1.0.0 (Latest)</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                        <span className="text-sm font-medium">Status</span>
                        <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                            Build Processing...
                        </span>
                    </div>

                    <p className="text-xs text-neutral-500 pt-2">
                        The download link will be active here automatically as soon as the build finishes (approx. 12:10 AM).
                    </p>
                </div>

                {/* Placeholder Button - currently disabled or leads to alert */}
                <button
                    disabled
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download APK (Coming Soon)
                </button>

                <p className="text-xs text-neutral-600">
                    If you are viewing this page, you have the correct link. Please check back shortly.
                </p>

                <Link href="/" className="text-sm text-emerald-500 hover:underline block mt-8">
                    &larr; Back to Website
                </Link>
            </div>
        </div>
    );
}
