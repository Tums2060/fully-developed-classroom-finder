'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
    CalendarClock, 
    Plus, 
    Edit2,
    Trash2, 
    X, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    BookOpen, 
    User, 
    Users, 
    Building2 
} from 'lucide-react';

export default function TimetablesPage() {
    const { authFetch } = useAuth();
    
    const [timetables, setTimetables] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form modal visibility
    const [showModal, setShowModal] = useState(false);

    // Form inputs state
    const [form, setForm] = useState({
        id: null,
        school_id: '',
        classroom_id: '',
        group_id: '',
        lecturer_id: '',
        course_id: '',
        day_of_week: 'Monday',
        start_time: '08:00',
        end_time: '10:00',
        unit_id: ''
    });

    // Reactive conflicts feedback states
    const [conflicts, setConflicts] = useState({
        roomConflict: false,
        groupConflict: false,
        lecturerConflict: false
    });
    const [timeValidationError, setTimeValidationError] = useState(false);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

    // general feedback alert
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Fetch necessary items to populate selectors
    const fetchData = async () => {
        setLoading(true);
        try {
            const tRes = await authFetch('/admin/timetables');
            if (tRes.ok) setTimetables(await tRes.json());

            const cRes = await authFetch('/admin/classrooms');
            if (cRes.ok) setClassrooms(await cRes.json());

            const crsRes = await authFetch('/admin/courses');
            if (crsRes.ok) setCourses(await crsRes.json());

            const gRes = await authFetch('/admin/student-groups');
            if (gRes.ok) setGroups(await gRes.json());

            const lRes = await authFetch('/admin/lecturers');
            if (lRes.ok) setLecturers(await lRes.json());

            const sRes = await authFetch('/admin/schools');
            if (sRes.ok) setSchools(await sRes.json());

            const uRes = await authFetch('/admin/units');
            if (uRes.ok) setUnits(await uRes.json());
        } catch (err) {
            console.error('Failed to load timetable parameters', err);
            triggerFeedback('error', 'Error loading timetable data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Reactive conflict checking trigger
    useEffect(() => {
        const checkConflicts = async () => {
            const { id, classroom_id, group_id, lecturer_id, day_of_week, start_time, end_time } = form;

            // Reset warnings if not all parameters are selected
            if (!classroom_id || !group_id || !lecturer_id || !day_of_week || !start_time || !end_time) {
                setConflicts({ roomConflict: false, groupConflict: false, lecturerConflict: false });
                setTimeValidationError(false);
                return;
            }

            if (start_time >= end_time) {
                setTimeValidationError(true);
                setConflicts({ roomConflict: false, groupConflict: false, lecturerConflict: false });
                return;
            } else {
                setTimeValidationError(false);
            }

            setIsCheckingConflicts(true);
            try {
                const res = await authFetch('/admin/timetables/check-conflicts', {
                    method: 'POST',
                    body: JSON.stringify({
                        id,
                        classroom_id: parseInt(classroom_id, 10),
                        group_id: parseInt(group_id, 10),
                        lecturer_id: parseInt(lecturer_id, 10),
                        day_of_week,
                        start_time,
                        end_time
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.timeValidationError) {
                        setTimeValidationError(true);
                        setConflicts({ roomConflict: false, groupConflict: false, lecturerConflict: false });
                    } else {
                        setConflicts(data.conflicts);
                    }
                }
            } catch (err) {
                console.error('Failed to run reactive conflict validations', err);
            } finally {
                setIsCheckingConflicts(false);
            }
        };

        const timeoutId = setTimeout(checkConflicts, 400); // debounce API requests
        return () => clearTimeout(timeoutId);
    }, [form.id, form.classroom_id, form.group_id, form.lecturer_id, form.day_of_week, form.start_time, form.end_time]);

    const triggerFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: '', message: '' }), 5500);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const { id, school_id, classroom_id, group_id, lecturer_id, course_id, day_of_week, start_time, end_time, unit_id } = form;

        if (!school_id || !classroom_id || !group_id || !lecturer_id || !course_id || !day_of_week || !start_time || !end_time || !unit_id) {
            triggerFeedback('error', 'All fields are required.');
            return;
        }

        if (start_time >= end_time) {
            triggerFeedback('error', 'Start time must be strictly before end time.');
            return;
        }

        const isEdit = id !== null;
        const url = isEdit ? `/admin/timetables/${id}` : '/admin/timetables';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify({
                    classroom_id: parseInt(classroom_id, 10),
                    group_id: parseInt(group_id, 10),
                    lecturer_id: parseInt(lecturer_id, 10),
                    course_id: parseInt(course_id, 10),
                    day_of_week,
                    start_time,
                    end_time,
                    unit_id: parseInt(unit_id, 10)
                })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save timetable entry');
            }

            triggerFeedback('success', `Timetable entry ${isEdit ? 'updated' : 'created'} successfully.`);
            setShowModal(false);
            setForm({
                id: null,
                school_id: '',
                classroom_id: '',
                group_id: '',
                lecturer_id: '',
                course_id: '',
                day_of_week: 'Monday',
                start_time: '08:00',
                end_time: '10:00',
                unit_id: ''
            });
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this timetable entry?')) return;
        try {
            const res = await authFetch(`/admin/timetables/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to delete timetable');

            triggerFeedback('success', 'Timetable entry deleted.');
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const filteredCourses = form.school_id 
        ? courses.filter(c => c.school_id === parseInt(form.school_id, 10)) 
        : [];

    const filteredGroups = form.course_id 
        ? groups.filter(g => g.course_id === parseInt(form.course_id, 10)) 
        : [];

    const filteredUnits = form.course_id
        ? units.filter(u => u.course_id === parseInt(form.course_id, 10))
        : [];

    const hasAnyConflict = conflicts.roomConflict || conflicts.groupConflict || conflicts.lecturerConflict || timeValidationError;

    return (
        <div className="space-y-6">
            {/* Top Info Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-blue-600" /> Academic Timetable
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">View and manage classroom course schedule allocations.</p>
                </div>
                <button
                    onClick={() => {
                    setForm({
                        id: null,
                        school_id: '',
                        classroom_id: classrooms[0]?.id || '',
                        group_id: '',
                        lecturer_id: lecturers[0]?.id || '',
                        course_id: '',
                        day_of_week: 'Monday',
                        start_time: '08:00',
                        end_time: '10:00',
                        unit_id: ''
                    });
                    setConflicts({ roomConflict: false, groupConflict: false, lecturerConflict: false });
                    setTimeValidationError(false);
                    setShowModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 transition-all shadow shadow-blue-100 cursor-pointer"
                disabled={classrooms.length === 0 || groups.length === 0 || lecturers.length === 0 || courses.length === 0 || schools.length === 0}
                >
                    <Plus className="h-4 w-4" /> Add Schedule Entry
                </button>
            </div>

            {/* Notifications Alert */}
            {feedback.message && (
                <div className={`p-4 rounded-lg flex items-start gap-3 border transition-all ${
                    feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{feedback.message}</span>
                </div>
            )}

            {/* List Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {timetables.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm">
                            No classes scheduled. Click 'Add Schedule Entry' to create the first timetable block.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
                                        <th className="py-3.5 px-6">Unit Name</th>
                                        <th className="py-3.5 px-6">Day & Time</th>
                                        <th className="py-3.5 px-6">Room / Building</th>
                                        <th className="py-3.5 px-6">Lecturer</th>
                                        <th className="py-3.5 px-6">Student Group</th>
                                        <th className="py-3.5 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {timetables.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50">
                                            <td className="py-4 px-6 font-bold text-slate-800">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-blue-700 font-bold text-xs uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{t.unit_code}</span>
                                                    <span>{t.unit_name}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">{t.course_name}</div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-700">
                                                <div className="font-semibold text-slate-800">{t.day_of_week}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    {t.start_time.substring(0, 5)} - {t.end_time.substring(0, 5)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">
                                                <div className="font-semibold text-slate-800">{t.classroom_name}</div>
                                                <div className="text-xs text-slate-500">{t.building_name}</div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">{t.lecturer_name}</td>
                                            <td className="py-4 px-6">
                                                <span className="bg-blue-50 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">
                                                    {t.group_name}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setForm({
                                                            id: t.id,
                                                            school_id: t.school_id || '',
                                                            classroom_id: t.classroom_id,
                                                            group_id: t.group_id,
                                                            lecturer_id: t.lecturer_id,
                                                            course_id: t.course_id,
                                                            day_of_week: t.day_of_week,
                                                            start_time: t.start_time.substring(0, 5),
                                                            end_time: t.end_time.substring(0, 5),
                                                            unit_id: t.unit_id || ''
                                                        });
                                                        setConflicts({ roomConflict: false, groupConflict: false, lecturerConflict: false });
                                                        setTimeValidationError(false);
                                                        setShowModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold transition"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold transition"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* --- CREATION / CONFLICT PREVENTING MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{form.id ? 'Edit' : 'New'} Timetable Allocation</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {/* Static Info Banners on Conflict detection */}
                            {isCheckingConflicts && (
                                <div className="bg-blue-50/50 border border-blue-100 text-blue-700 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600"></div>
                                    Checking timetable database for overlaps...
                                </div>
                            )}

                            {!isCheckingConflicts && hasAnyConflict && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-lg space-y-2">
                                    <h4 className="font-bold text-sm flex items-center gap-1.5 text-rose-700">
                                        <AlertTriangle className="h-4.5 w-4.5 text-rose-600" /> Overlap Conflict Found
                                    </h4>
                                    <ul className="list-disc list-inside text-xs space-y-1 pl-1 font-medium text-rose-700">
                                        {timeValidationError && <li>Start time must be before end time.</li>}
                                        {conflicts.roomConflict && <li>The classroom is already booked for this timeslot.</li>}
                                        {conflicts.groupConflict && <li>The student group has another class scheduled during this time.</li>}
                                        {conflicts.lecturerConflict && <li>The lecturer is already teaching another class during this time.</li>}
                                    </ul>
                                </div>
                            )}

                            {!isCheckingConflicts && !hasAnyConflict && form.classroom_id && (
                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    No scheduling conflicts detected. Ready to save.
                                </div>
                            )}

                            {/* Core Inputs */}
                            <div>
                                <label htmlFor="timetableUnit" className="block text-sm font-semibold text-slate-700 mb-1">Unit / Subject</label>
                                <select
                                    id="timetableUnit"
                                    value={form.unit_id}
                                    onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                    disabled={!form.course_id}
                                    required
                                >
                                    <option value="" disabled>Select Unit</option>
                                    {filteredUnits.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.code} - {u.name} (Year {u.year}, Sem {u.semester})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="timetableSchool" className="block text-sm font-semibold text-slate-700 mb-1">School</label>
                                <select
                                    id="timetableSchool"
                                    value={form.school_id}
                                    onChange={(e) => setForm({ 
                                        ...form, 
                                        school_id: e.target.value,
                                        course_id: '',
                                        group_id: '',
                                        unit_id: ''
                                    })}
                                    className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="" disabled>Select School</option>
                                    {schools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                             </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="timetableCourse" className="block text-sm font-semibold text-slate-700 mb-1">Degree Course</label>
                                    <select
                                        id="timetableCourse"
                                        value={form.course_id}
                                        onChange={(e) => setForm({ 
                                            ...form, 
                                            course_id: e.target.value,
                                            group_id: '',
                                            unit_id: ''
                                        })}
                                        className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                        disabled={!form.school_id}
                                        required
                                    >
                                        <option value="" disabled>Select Course</option>
                                        {filteredCourses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="timetableGroup" className="block text-sm font-semibold text-slate-700 mb-1">Student Cohort</label>
                                    <select
                                        id="timetableGroup"
                                        value={form.group_id}
                                        onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                        disabled={!form.course_id}
                                        required
                                    >
                                        <option value="" disabled>Select Cohort</option>
                                        {filteredGroups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="timetableLecturer" className="block text-sm font-semibold text-slate-700 mb-1">Assigned Lecturer</label>
                                    <select
                                        id="timetableLecturer"
                                        value={form.lecturer_id}
                                        onChange={(e) => setForm({ ...form, lecturer_id: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white"
                                        required
                                    >
                                        <option value="" disabled>Select lecturer</option>
                                        {lecturers.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="timetableRoom" className="block text-sm font-semibold text-slate-700 mb-1">Classroom Location</label>
                                    <select
                                        id="timetableRoom"
                                        value={form.classroom_id}
                                        onChange={(e) => setForm({ ...form, classroom_id: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white"
                                        required
                                    >
                                        <option value="" disabled>Select classroom</option>
                                        {classrooms.map(c => (
                                            <option key={c.id} value={c.id}>{c.building_name} - {c.name} ({c.capacity} seats)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4 space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label htmlFor="timetableDay" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Weekday</label>
                                        <select
                                            id="timetableDay"
                                            value={form.day_of_week}
                                            onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                                            className="block w-full border border-slate-300 rounded-md p-2 text-slate-950 bg-white"
                                            required
                                        >
                                            {days.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="timetableStart" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            id="timetableStart"
                                            value={form.start_time}
                                            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                            className="block w-full border border-slate-300 rounded-md p-2 text-slate-950 bg-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="timetableEnd" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">End Time</label>
                                        <input
                                            type="time"
                                            id="timetableEnd"
                                            value={form.end_time}
                                            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                                            className="block w-full border border-slate-300 rounded-md p-2 text-slate-950 bg-white"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-100 disabled:opacity-50"
                                    disabled={hasAnyConflict || isCheckingConflicts}
                                >
                                    Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
