'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Clock, 
    Building2, 
    Users, 
    ArrowLeft, 
    XCircle, 
    Calendar,
    KeyRound,
    Network
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function StudentClaimedRoomsPage() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchMyClaims = async () => {
        setLoading(true);
        setError('');
        try {
            const deviceToken = localStorage.getItem('device_token') || '';
            const res = await fetch(`${API_URL}/api/claims/my-claims?device_token=${deviceToken}`);
            if (!res.ok) {
                throw new Error('Failed to load your claimed rooms.');
            }
            const data = await res.json();
            setClaims(data);
        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred fetching your claims.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyClaims();
    }, []);

    const handleReleaseClaim = async (claimId, cancelPin) => {
        if (!confirm('Are you sure you want to release this classroom claim?')) return;
        setActionLoading(claimId);
        try {
            const response = await fetch(`${API_URL}/api/claims/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cancel_pin: cancelPin
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to release claim.');
            }

            // Reload claims list
            await fetchMyClaims();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error releasing claim.');
        } finally {
            setActionLoading(null);
        }
    };

    const formatClaimTime = (dateTimeStr) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatClaimDay = (dateTimeStr) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleDateString([], { weekday: 'long' });
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-blue-900 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <Link href="/" className="flex items-center space-x-3">
                                <Image
                                    src="/strathmore-logo.png"
                                    alt="Logo"
                                    width={120}
                                    height={43}
                                    className="h-11 w-auto object-contain"
                                    priority
                                />
                                <span className="font-bold text-xl tracking-tight">
                                    Free Classroom Finder
                                </span>
                            </Link>
                        </div>
                        <div>
                            <Link
                                href="/"
                                className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all"
                            >
                                <ArrowLeft className="h-4 w-4" /> Back to Search
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        My Claimed Rooms
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        View and release classrooms booked from your current device or IP address.
                    </p>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
                        <p className="text-slate-500 text-sm font-semibold">Loading claimed spaces...</p>
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-xl flex flex-col gap-3">
                        <p className="font-bold">Error retrieving claims</p>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                ) : claims.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-16 text-center max-w-md mx-auto">
                        <Network className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="font-bold text-slate-800 text-base">No Active Claims Found</h3>
                        <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                            You haven't claimed any classrooms for this period from your device/IP. 
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5 rounded-md font-semibold transition shadow"
                        >
                            Find and Claim a Room
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {claims.map((claim) => (
                            <div 
                                key={claim.claim_id}
                                className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
                            >
                                <div className="space-y-3 flex-grow">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-slate-800 text-lg">{claim.room_name}</h3>
                                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                                            Active Claim
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 text-xs text-slate-650 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-slate-450 flex-shrink-0" />
                                            <span>Building: <strong className="text-slate-800">{claim.building_name}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-slate-450 flex-shrink-0" />
                                            <span>Claim Group: <strong className="text-slate-800">{claim.group_size} / {claim.capacity} seats</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-450 flex-shrink-0" />
                                            <span>Day: <strong className="text-slate-800">{formatClaimDay(claim.start_time)}</strong></span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1 text-slate-500">
                                        <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50/50 px-2 py-1 rounded border border-blue-100/40">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                            Timeslot: {formatClaimTime(claim.start_time)} - {formatClaimTime(claim.end_time)}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-100">
                                            <KeyRound className="h-4 w-4 text-amber-600" />
                                            PIN: <strong className="font-bold tracking-widest text-slate-800">{claim.cancel_pin}</strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full sm:w-auto flex-shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0">
                                    <button
                                        onClick={() => handleReleaseClaim(claim.claim_id, claim.cancel_pin)}
                                        disabled={actionLoading === claim.claim_id}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-100 hover:border-transparent px-5 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow active:scale-98 disabled:opacity-50"
                                    >
                                        <XCircle className="h-4.5 w-4.5" />
                                        {actionLoading === claim.claim_id ? 'Releasing...' : 'Release Claim'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-slate-500 text-sm mt-auto">
                &copy; {new Date().getFullYear()} Strathmore University Free Classroom Finder. For educational institutions and study groups.
            </footer>
        </div>
    );
}
