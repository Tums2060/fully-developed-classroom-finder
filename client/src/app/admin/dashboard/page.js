'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Building2, GraduationCap, CalendarClock, Users, TrendingUp, Award, Clock } from 'lucide-react';

export default function DashboardPage() {
    const { authFetch } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardStats = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await authFetch('/admin/analytics/stats');
                if (!res.ok) {
                    throw new Error('Failed to retrieve dashboard analytics');
                }
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error(err);
                setError('Could not load analytics. Make sure the API server is online.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
                <p className="text-slate-500 text-sm">Loading dashboard metrics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-lg">
                <p className="font-bold">Error Loading Dashboard</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }

    const cards = [
        { name: 'Total Buildings', value: stats.totalBuildings, icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { name: 'Total Rooms', value: stats.totalClassrooms, icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        { name: 'Scheduled Entries', value: stats.totalTimetables, icon: CalendarClock, color: 'text-violet-600 bg-violet-50 border-violet-100' },
        { name: 'Registered Lecturers', value: stats.totalLecturers, icon: Users, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    ];

    return (
        <div className="space-y-8">
            {/* Header info */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
                <p className="text-slate-500 text-sm mt-1">Real-time statistics and academic space utilization summary.</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500">{card.name}</p>
                                <p className="text-3xl font-extrabold text-slate-900 mt-2">{card.value}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${card.color}`}>
                                <Icon className="h-6 w-6" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Global Utilization Gauge & Breakdown grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Global Utilization Gauge */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" /> Space Utilization
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">Percentage of room capacity operational hours booked weekly.</p>
                    </div>

                    <div className="flex flex-col items-center justify-center my-6">
                        <div className="relative flex items-center justify-center">
                            {/* Simple circular utilization percentage visualization */}
                            <svg className="w-36 h-36">
                                <circle 
                                    className="text-slate-100" 
                                    strokeWidth="10" 
                                    stroke="currentColor" 
                                    fill="transparent" 
                                    r="58" 
                                    cx="72" 
                                    cy="72" 
                                />
                                <circle 
                                    className="text-blue-600" 
                                    strokeWidth="10" 
                                    strokeDasharray={364.4}
                                    strokeDashoffset={364.4 - (364.4 * stats.utilizationRate) / 100}
                                    strokeLinecap="round" 
                                    stroke="currentColor" 
                                    fill="transparent" 
                                    r="58" 
                                    cx="72" 
                                    cy="72" 
                                    transform="rotate(-90 72 72)"
                                />
                            </svg>
                            <div className="absolute text-center">
                                <span className="text-3xl font-extrabold text-slate-800">{stats.utilizationRate}%</span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Average Booked</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center bg-slate-50 p-3 rounded-lg text-slate-600 text-xs font-semibold">
                        Optimized for a standard 60hr / week capacity.
                    </div>
                </div>

                {/* Most Booked Classrooms */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Award className="h-5 w-5 text-emerald-600" /> Top Booked Classrooms
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">Classrooms with the highest booking count.</p>
                    </div>

                    {stats.mostBookedRooms.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            No active timetable records found.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 mt-4 flex-grow">
                            {stats.mostBookedRooms.map((room, index) => (
                                <div key={index} className="flex justify-between items-center py-3">
                                    <div className="overflow-hidden pr-2">
                                        <p className="font-bold text-slate-800 truncate">{room.room_name}</p>
                                        <span className="text-xs text-slate-400 truncate block">{room.building_name}</span>
                                    </div>
                                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                                        {room.bookings} bookings
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-[11px] text-slate-400 mt-2">
                        Updated in real-time.
                    </div>
                </div>

                {/* Utilization by Room Type */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-violet-600" /> Usage by Room Type
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">Occupancy comparison based on room category.</p>
                    </div>

                    {stats.utilizationByRoomType.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            No classroom categories configured.
                        </div>
                    ) : (
                        <div className="space-y-4 mt-4 flex-grow">
                            {stats.utilizationByRoomType.map((type, index) => (
                                <div key={index} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span className="capitalize">{type.room_type} ({type.room_count} rooms)</span>
                                        <span>{type.rate}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-violet-600 h-full rounded-full transition-all" 
                                            style={{ width: `${type.rate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-[11px] text-slate-400 mt-2">
                        Includes computer labs, seminar halls, and lecture theatres.
                    </div>
                </div>
            </div>
        </div>
    );
}
