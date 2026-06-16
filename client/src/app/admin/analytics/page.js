'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { LineChart, BarChart2, Calendar, Clock, Sparkles, Building } from 'lucide-react';

export default function AnalyticsPage() {
    const { authFetch } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await authFetch('/admin/analytics/stats');
                if (!res.ok) throw new Error('Failed to fetch analytics statistics');
                const data = await res.json();
                setAnalytics(data);
            } catch (err) {
                console.error(err);
                setError('Could not load analytics. Make sure the API server is online.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
                <p className="text-slate-500 text-sm">Processing classroom utilization statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-lg">
                <p className="font-bold">Error loading analytics metrics</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }

    // Find the max booking value to scale the hourly chart correctly
    const maxBookings = Math.max(...analytics.busyHours.map(h => h.active_bookings), 1);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Space Analytics Dashboard</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Deep-dive assessment of room operational occupancy rates and booking trends.</p>
                </div>
                <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 hidden sm:block">
                    <Sparkles className="h-5 w-5" />
                </div>
            </div>

            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Weekly Utilization</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-4xl font-extrabold text-blue-900">{analytics.utilizationRate}%</span>
                        <span className="text-xs text-slate-500 font-semibold">capacity</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                        <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${analytics.utilizationRate}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Most Active Hour</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        {analytics.busyHours.length > 0 ? (
                            <>
                                <span className="text-3xl font-extrabold text-slate-800">
                                    {analytics.busyHours.reduce((prev, current) => (prev.active_bookings > current.active_bookings) ? prev : current).hour}
                                </span>
                                <span className="text-xs text-slate-500 font-semibold">peak booking time</span>
                            </>
                        ) : (
                            <span className="text-xl text-slate-400 font-bold">N/A</span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-5 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Calculated dynamically based on start slots.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Rooms</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-4xl font-extrabold text-emerald-700">{analytics.totalClassrooms}</span>
                        <span className="text-xs text-slate-500 font-semibold">rooms registered</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" /> Allocated across {analytics.totalBuildings} campus buildings.
                    </p>
                </div>
            </div>

            {/* Core Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hourly Booking Distribution (Vertical Bar Chart) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" /> Hourly Booking Volume
                        </h3>
                        <p className="text-slate-500 text-xs">Number of classes starting during each operational hour of the day.</p>
                    </div>

                    {analytics.busyHours.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 text-sm">
                            No scheduled data to map.
                        </div>
                    ) : (
                        <div className="relative pt-6 h-64 flex items-end justify-between gap-2 border-b border-slate-200">
                            {analytics.busyHours.map((hourInfo, index) => {
                                const heightPercentage = (hourInfo.active_bookings / maxBookings) * 80; // scale up to 80% max height
                                return (
                                    <div key={index} className="flex-grow flex flex-col items-center group relative cursor-pointer">
                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow">
                                            {hourInfo.active_bookings} classes
                                        </div>
                                        {/* Bar */}
                                        <div 
                                            className="w-full max-w-[28px] bg-blue-600 hover:bg-blue-700 rounded-t-sm transition-all duration-300 shadow-sm"
                                            style={{ height: `${heightPercentage + 5}px` /* minimum height 5px */ }}
                                        ></div>
                                        <span className="text-[10px] text-slate-400 font-bold mt-2 rotate-45 sm:rotate-0 transform origin-top-left">
                                            {hourInfo.hour}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Occupancy Breakdown by Room Type */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-violet-600" /> Utilization by Room Type
                        </h3>
                        <p className="text-slate-500 text-xs">Comparing room capacity efficiency relative to their categories.</p>
                    </div>

                    {analytics.utilizationByRoomType.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 text-sm">
                            No room types configured.
                        </div>
                    ) : (
                        <div className="space-y-6 pt-4">
                            {analytics.utilizationByRoomType.map((type, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="font-bold text-slate-700 capitalize">
                                            {type.room_type} <span className="text-slate-400 font-normal">({type.room_count} rooms, {type.bookings} bookings)</span>
                                        </div>
                                        <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded text-xs">
                                            {type.rate}% utilized
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200/40">
                                        <div 
                                            className="bg-violet-600 h-full rounded-full transition-all duration-500" 
                                            style={{ width: `${type.rate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row - Top booked list */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-emerald-600" /> Space Booking Volume Rank
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">Top 5 classrooms by sheer volume of booking schedule count.</p>
                </div>

                {analytics.mostBookedRooms.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        No scheduled logs found.
                    </div>
                ) : (
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
                                    <th className="py-3 px-6">Rank</th>
                                    <th className="py-3 px-6">Classroom Name</th>
                                    <th className="py-3 px-6">Building</th>
                                    <th className="py-3 px-6 text-right">Schedule Bookings Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {analytics.mostBookedRooms.map((room, index) => (
                                    <tr key={index} className="hover:bg-slate-50/30">
                                        <td className="py-4 px-6 font-bold text-slate-500">#{index + 1}</td>
                                        <td className="py-4 px-6 font-extrabold text-slate-800">{room.room_name}</td>
                                        <td className="py-4 px-6 text-slate-600 font-semibold">{room.building_name}</td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                                                {room.bookings} times
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
