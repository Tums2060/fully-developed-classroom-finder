'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { GraduationCap, Landmark, BookOpen, Users2, ShieldAlert, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AcademicsPage() {
    const { authFetch } = useAuth();
    
    // Tab State: 'schools', 'courses', 'groups', 'lecturers'
    const [activeTab, setActiveTab] = useState('schools');
    
    // Data list states
    const [schools, setSchools] = useState([]);
    const [courses, setCourses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Feedback Alerts
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Forms states & modals visibility
    const [schoolForm, setSchoolForm] = useState({ id: null, name: '' });
    const [showSchoolModal, setShowSchoolModal] = useState(false);

    const [courseForm, setCourseForm] = useState({ id: null, school_id: '', name: '' });
    const [showCourseModal, setShowCourseModal] = useState(false);

    const [groupForm, setGroupForm] = useState({ id: null, course_id: '', name: '' });
    const [showGroupModal, setShowGroupModal] = useState(false);

    const [lecturerForm, setLecturerForm] = useState({ id: null, name: '', email: '' });
    const [showLecturerModal, setShowLecturerModal] = useState(false);

    // Fetch all records
    const fetchData = async () => {
        setLoading(true);
        try {
            const schoolsRes = await authFetch('/admin/schools');
            if (schoolsRes.ok) setSchools(await schoolsRes.json());

            const coursesRes = await authFetch('/admin/courses');
            if (coursesRes.ok) setCourses(await coursesRes.json());

            const groupsRes = await authFetch('/admin/student-groups');
            if (groupsRes.ok) setGroups(await groupsRes.json());

            const lecturersRes = await authFetch('/admin/lecturers');
            if (lecturersRes.ok) setLecturers(await lecturersRes.json());
        } catch (err) {
            console.error('Failed to fetch academics data', err);
            triggerFeedback('error', 'Error loading academics data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const triggerFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    };

    // --- SCHOOL CRUD ---
    const handleSaveSchool = async (e) => {
        e.preventDefault();
        if (!schoolForm.name.trim()) return;

        const isEdit = schoolForm.id !== null;
        const url = isEdit ? `/admin/schools/${schoolForm.id}` : '/admin/schools';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify({ name: schoolForm.name.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save school');

            triggerFeedback('success', `School ${isEdit ? 'updated' : 'added'} successfully.`);
            setShowSchoolModal(false);
            setSchoolForm({ id: null, name: '' });
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    const handleDeleteSchool = async (id) => {
        if (!confirm('Are you sure you want to delete this school?')) return;
        try {
            const res = await authFetch(`/admin/schools/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete school');

            triggerFeedback('success', 'School deleted successfully.');
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    // --- COURSE CRUD ---
    const handleSaveCourse = async (e) => {
        e.preventDefault();
        const { id, school_id, name } = courseForm;
        if (!school_id || !name.trim()) {
            triggerFeedback('error', 'All fields are required.');
            return;
        }

        const isEdit = id !== null;
        const url = isEdit ? `/admin/courses/${id}` : '/admin/courses';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify({ school_id: parseInt(school_id, 10), name: name.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save course');

            triggerFeedback('success', `Course ${isEdit ? 'updated' : 'added'} successfully.`);
            setShowCourseModal(false);
            setCourseForm({ id: null, school_id: '', name: '' });
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!confirm('Are you sure you want to delete this course?')) return;
        try {
            const res = await authFetch(`/admin/courses/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete course');

            triggerFeedback('success', 'Course deleted successfully.');
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    // --- STUDENT GROUP CRUD ---
    const handleSaveGroup = async (e) => {
        e.preventDefault();
        const { id, course_id, name } = groupForm;
        if (!course_id || !name.trim()) {
            triggerFeedback('error', 'All fields are required.');
            return;
        }

        const isEdit = id !== null;
        const url = isEdit ? `/admin/student-groups/${id}` : '/admin/student-groups';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify({ course_id: parseInt(course_id, 10), name: name.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save group');

            triggerFeedback('success', `Student group ${isEdit ? 'updated' : 'added'} successfully.`);
            setShowGroupModal(false);
            setGroupForm({ id: null, course_id: '', name: '' });
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!confirm('Are you sure you want to delete this student group?')) return;
        try {
            const res = await authFetch(`/admin/student-groups/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete group');

            triggerFeedback('success', 'Student group deleted successfully.');
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    // --- LECTURER CRUD ---
    const handleSaveLecturer = async (e) => {
        e.preventDefault();
        const { id, name, email } = lecturerForm;
        if (!name.trim() || !email.trim()) {
            triggerFeedback('error', 'Name and email are required.');
            return;
        }

        const isEdit = id !== null;
        const url = isEdit ? `/admin/lecturers/${id}` : '/admin/lecturers';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify({ name: name.trim(), email: email.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save lecturer');

            triggerFeedback('success', `Lecturer ${isEdit ? 'updated' : 'added'} successfully.`);
            setShowLecturerModal(false);
            setLecturerForm({ id: null, name: '', email: '' });
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    const handleDeleteLecturer = async (id) => {
        if (!confirm('Are you sure you want to delete this lecturer?')) return;
        try {
            const res = await authFetch(`/admin/lecturers/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete lecturer');

            triggerFeedback('success', 'Lecturer deleted successfully.');
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap">
                <button
                    onClick={() => setActiveTab('schools')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                        activeTab === 'schools' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Landmark className="h-4 w-4" /> Schools ({schools.length})
                </button>
                <button
                    onClick={() => setActiveTab('courses')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                        activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <BookOpen className="h-4 w-4" /> Courses ({courses.length})
                </button>
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                        activeTab === 'groups' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Users2 className="h-4 w-4" /> Student Groups ({groups.length})
                </button>
                <button
                    onClick={() => setActiveTab('lecturers')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                        activeTab === 'lecturers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <GraduationCap className="h-4 w-4" /> Lecturers ({lecturers.length})
                </button>
            </div>

            {/* Notifications Alert */}
            {feedback.message && (
                <div className={`p-4 rounded-lg flex items-start gap-3 border transition-all ${
                    feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{feedback.message}</span>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                </div>
            ) : (
                <>
                    {/* --- SCHOOLS TAB --- */}
                    {activeTab === 'schools' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800">Schools / Departments</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Faculty Schools register.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSchoolForm({ id: null, name: '' });
                                        setShowSchoolModal(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 transition shadow"
                                >
                                    <Plus className="h-4 w-4" /> Add School
                                </button>
                            </div>
                            {schools.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm">No schools added yet.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase"><th className="py-3.5 px-6">School Name</th><th className="py-3.5 px-6 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {schools.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-6 font-bold text-slate-800">{s.name}</td>
                                                <td className="py-4 px-6 text-right space-x-2">
                                                    <button onClick={() => { setSchoolForm({ id: s.id, name: s.name }); setShowSchoolModal(true); }} className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold"><Edit2 className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => handleDeleteSchool(s.id)} className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* --- COURSES TAB --- */}
                    {activeTab === 'courses' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800">Academic Courses</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Degrees and qualifications sorted by school.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setCourseForm({ id: null, school_id: schools[0]?.id || '', name: '' });
                                        setShowCourseModal(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 transition shadow"
                                    disabled={schools.length === 0}
                                >
                                    <Plus className="h-4 w-4" /> Add Course
                                </button>
                            </div>
                            {courses.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm">No courses added.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase"><th className="py-3.5 px-6">Course Name</th><th className="py-3.5 px-6">School</th><th className="py-3.5 px-6 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {courses.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-6 font-bold text-slate-800">{c.name}</td>
                                                <td className="py-4 px-6 text-slate-600 font-semibold">{c.school_name}</td>
                                                <td className="py-4 px-6 text-right space-x-2">
                                                    <button onClick={() => { setCourseForm({ id: c.id, school_id: c.school_id, name: c.name }); setShowCourseModal(true); }} className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold"><Edit2 className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => handleDeleteCourse(c.id)} className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* --- STUDENT GROUPS TAB --- */}
                    {activeTab === 'groups' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800">Student Groups</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Academic cohorts and study levels.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setGroupForm({ id: null, course_id: courses[0]?.id || '', name: '' });
                                        setShowGroupModal(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 transition shadow"
                                    disabled={courses.length === 0}
                                >
                                    <Plus className="h-4 w-4" /> Add Group
                                </button>
                            </div>
                            {groups.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm">No student groups configured.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase"><th className="py-3.5 px-6">Group Name</th><th className="py-3.5 px-6">Course Name</th><th className="py-3.5 px-6 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {groups.map(g => (
                                            <tr key={g.id} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-6 font-bold text-slate-800">{g.name}</td>
                                                <td className="py-4 px-6 text-slate-600 font-semibold">{g.course_name}</td>
                                                <td className="py-4 px-6 text-right space-x-2">
                                                    <button onClick={() => { setGroupForm({ id: g.id, course_id: g.course_id, name: g.name }); setShowGroupModal(true); }} className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold"><Edit2 className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => handleDeleteGroup(g.id)} className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* --- LECTURERS TAB --- */}
                    {activeTab === 'lecturers' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800">Lecturers Register</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Faculty staff profiles.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setLecturerForm({ id: null, name: '', email: '' });
                                        setShowLecturerModal(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 transition shadow"
                                >
                                    <Plus className="h-4 w-4" /> Add Lecturer
                                </button>
                            </div>
                            {lecturers.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm">No lecturers registered.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase"><th className="py-3.5 px-6">Name</th><th className="py-3.5 px-6">Email Address</th><th className="py-3.5 px-6 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {lecturers.map(l => (
                                            <tr key={l.id} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-6 font-bold text-slate-800">{l.name}</td>
                                                <td className="py-4 px-6 text-slate-600 font-semibold">{l.email}</td>
                                                <td className="py-4 px-6 text-right space-x-2">
                                                    <button onClick={() => { setLecturerForm({ id: l.id, name: l.name, email: l.email }); setShowLecturerModal(true); }} className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold"><Edit2 className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => handleDeleteLecturer(l.id)} className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* --- SCHOOL MODAL --- */}
            {showSchoolModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{schoolForm.id ? 'Edit' : 'Add'} School</h3>
                            <button onClick={() => setShowSchoolModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSaveSchool} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="schoolName" className="block text-sm font-semibold text-slate-700 mb-2">School / Department Name</label>
                                <input
                                    type="text"
                                    id="schoolName"
                                    value={schoolForm.name}
                                    onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                                    placeholder="e.g. School of Business"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowSchoolModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save School</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- COURSE MODAL --- */}
            {showCourseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{courseForm.id ? 'Edit' : 'Add'} Course</h3>
                            <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="courseSchool" className="block text-sm font-semibold text-slate-700 mb-2">Department School</label>
                                <select
                                    id="courseSchool"
                                    value={courseForm.school_id}
                                    onChange={(e) => setCourseForm({ ...courseForm, school_id: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                    required
                                >
                                    {schools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="courseName" className="block text-sm font-semibold text-slate-700 mb-2">Course Name</label>
                                <input
                                    type="text"
                                    id="courseName"
                                    value={courseForm.name}
                                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                    placeholder="e.g. BSc in Computer Science"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCourseModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- GROUP MODAL --- */}
            {showGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{groupForm.id ? 'Edit' : 'Add'} Student Group</h3>
                            <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSaveGroup} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="groupCourse" className="block text-sm font-semibold text-slate-700 mb-2">Academic Course</label>
                                <select
                                    id="groupCourse"
                                    value={groupForm.course_id}
                                    onChange={(e) => setGroupForm({ ...groupForm, course_id: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                    required
                                >
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="groupName" className="block text-sm font-semibold text-slate-700 mb-2">Group Identifier / Code</label>
                                <input
                                    type="text"
                                    id="groupName"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                    placeholder="e.g. Y3-S1-CS"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Group</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- LECTURER MODAL --- */}
            {showLecturerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{lecturerForm.id ? 'Edit' : 'Add'} Lecturer</h3>
                            <button onClick={() => setShowLecturerModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSaveLecturer} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="lecturerName" className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    id="lecturerName"
                                    value={lecturerForm.name}
                                    onChange={(e) => setLecturerForm({ ...lecturerForm, name: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                    placeholder="e.g. Dr. John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="lecturerEmail" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    id="lecturerEmail"
                                    value={lecturerForm.email}
                                    onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                    placeholder="e.g. jdoe@university.edu"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowLecturerModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Lecturer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
