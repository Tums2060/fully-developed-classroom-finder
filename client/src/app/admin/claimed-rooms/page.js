'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
    Clock, 
    Building2, 
    Users, 
    Search,
    Trash2, 
    Calendar,
    KeyRound,
    Network,
    Filter,
    ShieldAlert
} from 'lucide-react';

export default function AdminClaimedRoomsPage() {
    const { authFetch } = useAuth();
    const [claims, setClaims] = useState([]);
    const [filteredClaims, setFilteredClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchAllClaims = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await authFetch('/admin/claims');
            if (!res.ok) {
                throw new Error('Failed to retrieve active room claims.');
            }
            const data = await res.json();
            setClaims(data);
            setFilteredClaims(data);
        } catch (err) {
            console.error(err);
            setError('Could not load claims. Make sure the API server is online.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllClaims();
    }, []);

    // Filter claims in real-time
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredClaims(claims);
            return;
        }
        const term = searchTerm.toLowerCase();
        const filtered = claims.filter(c => 
            c.room_name.toLowerCase().includes(term) ||
            c.building_name.toLowerCase().includes(term) ||
            c.ip_address.toLowerCase().includes(term) ||
            c.device_token.toLowerCase().includes(term) ||
            c.cancel_pin.toLowerCase().includes(term)
        );
        setFilteredClaims(filtered);
    }, [searchTerm, claims]);

    const handleRevokeClaim = async (claimId) => {
        if (!confirm('Are you absolutely sure you want to revoke this student claim? This will immediately free the space for others.')) return;
        setActionLoading(claimId);
        try {
            const res = await authFetch(`/admin/claims/${claimId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete room claim.');
            }

            // Refresh claims
            await fetchAllClaims();
        } catch (err) {
            console.error(err);
            alert(err.message || 'An error occurred revoking the claim.');
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

    if (loading && claims.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
                <p className="text-slate-500 text-sm">Loading classroom claims registry...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Claimed Classrooms</h2>
                <p className="text-slate-500 text-sm mt-1">
                    Manage and audit active or scheduled classroom claims registered by students.
                </p>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-lg flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-bold">Operational Error</p>
                        <p className="text-sm mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by room, building, IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    />
                </div>
                <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 flex-shrink-0">
                    <Filter className="h-4 w-4 text-slate-400" />
                    Showing <span className="text-slate-800 font-bold">{filteredClaims.length}</span> of <span className="text-blue-900 font-bold">{claims.length}</span> claims
                </div>
            </div>

            {filteredClaims.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 text-center">
                    <Network className="h-12 w-12 text-slate-350 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-800 text-base">No Claims Registered</h3>
                    <p className="text-slate-550 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                        {claims.length === 0 
                            ? 'There are currently no active classroom claims recorded in the database.' 
                            : 'No claims match your active search terms.'
                        }
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Classroom</th>
                                    <th className="px-6 py-4">Booking Time</th>
                                    <th className="px-6 py-4">Group Capacity</th>
                                    <th className="px-6 py-4">Credentials & IP</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-650 font-medium">
                                {filteredClaims.map((claim) => (
                                    <tr key={claim.claim_id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-extrabold text-slate-800">{claim.room_name}</div>
                                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Building2 className="h-3 w-3" /> {claim.building_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-blue-700">
                                                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                <span>{formatClaimDay(claim.start_time)}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-slate-400" />
                                                <span>{formatClaimTime(claim.start_time)} - {formatClaimTime(claim.end_time)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                                <Users className="h-4.5 w-4.5 text-slate-400" />
                                                <span>{claim.group_size} <span className="text-slate-400">/ {claim.capacity} seats</span></span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            <div className="text-xs text-slate-700 flex items-center gap-1.5 font-semibold bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded w-max">
                                                <Network className="h-3.5 w-3.5 text-slate-400" />
                                                <span>IP: {claim.ip_address}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono select-all truncate max-w-xs block">
                                                Token: {claim.device_token}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                                                    <KeyRound className="h-3 w-3 text-amber-500" />
                                                    PIN: {claim.cancel_pin}
                                                </span>
                                                <button
                                                    onClick={() => handleRevokeClaim(claim.claim_id)}
                                                    disabled={actionLoading === claim.claim_id}
                                                    className="p-2 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-transparent rounded-lg transition-colors cursor-pointer"
                                                    title="Revoke Booking"
                                                >
                                                    <Trash2 className="h-4.5 w-4.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
