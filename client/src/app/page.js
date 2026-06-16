'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, GraduationCap, Building2, CalendarRange, Clock, Users, SlidersHorizontal } from 'lucide-react';

export default function SearchPage() {
    const router = useRouter();
    const [dayOfWeek, setDayOfWeek] = useState('Monday');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('10:00');
    const [capacity, setCapacity] = useState('');
    const [roomType, setRoomType] = useState('All');
    const [roomTypes, setRoomTypes] = useState([]);
    const [error, setError] = useState('');

    // Initialize defaults based on current date/time
    useEffect(() => {
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayIndex = new Date().getDay();
        // If Sunday, default to Monday
        const defaultDay = currentDayIndex === 0 ? 'Monday' : weekdays[currentDayIndex];
        setDayOfWeek(defaultDay);

        // Fetch available room types for dropdown
        const fetchRoomTypes = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/public/room-types');
                if (res.ok) {
                    const data = await res.ok ? await res.json() : [];
                    setRoomTypes(data);
                }
            } catch (err) {
                console.error('Failed to fetch room types:', err);
            }
        };
        fetchRoomTypes();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setError('');

        if (startTime >= endTime) {
            setError('Start time must be strictly before end time.');
            return;
        }

        const params = new URLSearchParams({
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime
        });

        if (capacity) params.append('capacity', capacity);
        if (roomType && roomType !== 'All') params.append('room_type', roomType);

        router.push(`/results?${params.toString()}`);
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Header / Navigation */}
            <header className="bg-blue-900 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <GraduationCap className="h-8 w-8 text-blue-300" />
                            <span className="font-bold text-xl tracking-tight">Free Classroom Finder</span>
                        </div>
                        <div>
                            <Link 
                                href="/admin/login" 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all-custom shadow"
                            >
                                Admin Login
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    {/* Welcome Text */}
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                            Find an Empty Classroom
                        </h1>
                        <p className="mt-3 text-slate-600">
                            Search real-time classroom availability for your study groups, lectures, or online sessions.
                        </p>
                    </div>

                    {/* Search Card */}
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                        <form onSubmit={handleSearch} className="space-y-6">
                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-3 rounded-md text-sm font-medium border border-rose-100">
                                    {error}
                                </div>
                            )}

                            {/* Day of the Week */}
                            <div>
                                <label htmlFor="day" className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <CalendarRange className="h-4 w-4 text-blue-600" /> Day of Week
                                </label>
                                <select
                                    id="day"
                                    value={dayOfWeek}
                                    onChange={(e) => setDayOfWeek(e.target.value)}
                                    className="block w-full rounded-md border-slate-300 border p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 transition-all"
                                    required
                                >
                                    {days.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Times grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="start_time" className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-600" /> Start Time
                                    </label>
                                    <input
                                        type="time"
                                        id="start_time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="block w-full rounded-md border-slate-300 border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="end_time" className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-600" /> End Time
                                    </label>
                                    <input
                                        type="time"
                                        id="end_time"
                                        value={endTime}
                                        onChange={(e) => setStartTime(e.target.value) /* Wait, let's make sure it modifies endTime */}
                                        // Wait, let's write it correct below: onChange={(e) => setEndTime(e.target.value)}
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="block w-full rounded-md border-slate-300 border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Optional Capacity & Room Type */}
                            <div className="border-t border-slate-100 pt-5 space-y-4">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <SlidersHorizontal className="h-3.5 w-3.5" /> Filters (Optional)
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="capacity" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                            <Users className="h-3 w-3 text-blue-600" /> Min Capacity
                                        </label>
                                        <input
                                            type="number"
                                            id="capacity"
                                            value={capacity}
                                            onChange={(e) => setCapacity(e.target.value)}
                                            placeholder="e.g. 30"
                                            min="1"
                                            className="block w-full rounded-md border-slate-300 border p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="room_type" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                            <Building2 className="h-3 w-3 text-blue-600" /> Room Type
                                        </label>
                                        <select
                                            id="room_type"
                                            value={roomType}
                                            onChange={(e) => setRoomType(e.target.value)}
                                            className="block w-full rounded-md border-slate-300 border p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                        >
                                            <option value="All">All Types</option>
                                            {roomTypes.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-all-custom shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Search className="h-5 w-5" /> Search Availability
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} Free Classroom Finder. For educational institutions and study groups.
            </footer>
        </div>
    );
}
