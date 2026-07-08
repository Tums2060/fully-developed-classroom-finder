'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { GraduationCap, Landmark, BookOpen, Users2, ShieldAlert, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle, Book, ChevronRight } from 'lucide-react';

export default function AcademicsPage() {
    const { authFetch } = useAuth();
    
    // Tab State: 'schools', 'courses', 'groups', 'lecturers'
    const [activeTab, setActiveTab] = useState('schools');
    
    // Data list states
    const [schools, setSchools] = useState([]);
    const [courses, setCourses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Active selection states for UI drill-downs
    const [activeSchoolForCourses, setActiveSchoolForCourses] = useState(null);
    const [activeSchoolForGroups, setActiveSchoolForGroups] = useState(null);
    const [activeCourseForGroups, setActiveCourseForGroups] = useState(null);
    const [activeSchoolForUnits, setActiveSchoolForUnits] = useState(null);
    const [activeCourseForUnits, setActiveCourseForUnits] = useState(null);

    // Reset drill-down states when tab changes
    useEffect(() => {
        setActiveSchoolForCourses(null);
        setActiveSchoolForGroups(null);
        setActiveCourseForGroups(null);
        setActiveSchoolForUnits(null);
        setActiveCourseForUnits(null);
    }, [activeTab]);
    
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

    const [unitForm, setUnitForm] = useState({ id: null, course_id: '', code: '', name: '', year: '1', semester: '1' });
    const [showUnitModal, setShowUnitModal] = useState(false);

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

            const unitsRes = await authFetch('/admin/units');
            if (unitsRes.ok) setUnits(await unitsRes.json());
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

    // --- UNIT CRUD ---
    const handleSaveUnit = async (e) => {
        e.preventDefault();
        const { id, course_id, code, name, year, semester } = unitForm;
        if (!course_id || !code.trim() || !name.trim() || !year || !semester) {
            triggerFeedback('error', 'All fields are required.');
            return;
        }

        const isEdit = id !== null;
        const url = isEdit ? `/admin/units/${id}` : '/admin/units';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify({
                    course_id: parseInt(course_id, 10),
                    code: code.trim(),
                    name: name.trim(),
                    year: parseInt(year, 10),
                    semester: parseInt(semester, 10)
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save unit');

            triggerFeedback('success', `Unit ${isEdit ? 'updated' : 'added'} successfully.`);
            setShowUnitModal(false);
            setUnitForm({ id: null, course_id: '', code: '', name: '', year: '1', semester: '1' });
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    const handleDeleteUnit = async (id) => {
        if (!confirm('Are you sure you want to delete this unit?')) return;
        try {
            const res = await authFetch(`/admin/units/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete unit');

            triggerFeedback('success', 'Unit deleted successfully.');
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
                <button
                    onClick={() => setActiveTab('units')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                        activeTab === 'units' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Book className="h-4 w-4" /> Units ({units.length})
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
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Academic Courses</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Degrees and qualifications sorted by school. Click a school to manage its courses.</p>
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

                            {schools.length === 0 ? (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 text-sm">
                                    No schools found. Please add a school first.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {schools.map(s => {
                                        const schoolCourses = courses.filter(c => c.school_id === s.id);
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => setActiveSchoolForCourses(s)}
                                                className="group cursor-pointer bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-40"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-blue-600">
                                                        <Landmark className="h-5 w-5" />
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">School</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                        {s.name}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {schoolCourses.length} {schoolCourses.length === 1 ? 'Course' : 'Courses'}
                                                    </span>
                                                    <span className="text-blue-600 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                        View Courses &rarr;
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Courses List Modal for Selected School */}
                            {activeSchoolForCourses && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
                                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                    <Landmark className="h-5 w-5 text-blue-600" />
                                                    Courses in {activeSchoolForCourses.name}
                                                </h3>
                                                <p className="text-slate-500 text-xs mt-0.5">
                                                    Total of {courses.filter(c => c.school_id === activeSchoolForCourses.id).length} courses registered.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setActiveSchoolForCourses(null)}
                                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="p-6 overflow-y-auto flex-grow bg-slate-50/50">
                                            {courses.filter(c => c.school_id === activeSchoolForCourses.id).length === 0 ? (
                                                <div className="text-center py-12 text-slate-400 text-sm">
                                                    No courses registered under this school yet.
                                                </div>
                                            ) : (
                                                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase">
                                                                <th className="py-3 px-5">Course Name</th>
                                                                <th className="py-3 px-5 text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200 text-sm bg-white">
                                                            {courses.filter(c => c.school_id === activeSchoolForCourses.id).map(c => (
                                                                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                                                    <td className="py-3.5 px-5 font-bold text-slate-800">{c.name}</td>
                                                                    <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                                                                        <button
                                                                            onClick={() => {
                                                                                setCourseForm({ id: c.id, school_id: c.school_id, name: c.name });
                                                                                setShowCourseModal(true);
                                                                            }}
                                                                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold transition"
                                                                            title="Edit Course"
                                                                        >
                                                                            <Edit2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteCourse(c.id)}
                                                                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold transition"
                                                                            title="Delete Course"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-slate-50 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setActiveSchoolForCourses(null)}
                                                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-sm text-slate-600 font-semibold transition"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- STUDENT GROUPS TAB --- */}
                    {activeTab === 'groups' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Student Groups</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Academic cohorts and study levels. Select a school to view courses and student groups.</p>
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

                            {schools.length === 0 ? (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 text-sm">
                                    No schools found. Please add a school first.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {schools.map(s => {
                                        const schoolCourses = courses.filter(c => c.school_id === s.id);
                                        const schoolGroups = groups.filter(g => schoolCourses.some(c => c.id === g.course_id));
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => {
                                                    setActiveSchoolForGroups(s);
                                                    setActiveCourseForGroups(null);
                                                }}
                                                className="group cursor-pointer bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-40"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-blue-600">
                                                        <Users2 className="h-5 w-5" />
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">School</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                        {s.name}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {schoolGroups.length} {schoolGroups.length === 1 ? 'Cohort' : 'Cohorts'} in {schoolCourses.length} {schoolCourses.length === 1 ? 'Course' : 'Courses'}
                                                    </span>
                                                    <span className="text-blue-600 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                        View Groups &rarr;
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Drill-down Modal for Student Groups */}
                            {activeSchoolForGroups && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
                                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                    <Users2 className="h-5 w-5 text-blue-600" />
                                                    {activeCourseForGroups ? `Groups for ${activeCourseForGroups.name}` : `Courses in ${activeSchoolForGroups.name}`}
                                                </h3>
                                                <p className="text-slate-500 text-xs mt-0.5">
                                                    {activeCourseForGroups 
                                                        ? `Filtered to registered cohorts.` 
                                                        : `Select a course to view its student groups.`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setActiveSchoolForGroups(null);
                                                    setActiveCourseForGroups(null);
                                                }}
                                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="p-6 overflow-y-auto flex-grow bg-slate-50/50">
                                            {/* Course Selection Level */}
                                            {!activeCourseForGroups ? (
                                                <div className="space-y-3">
                                                    {courses.filter(c => c.school_id === activeSchoolForGroups.id).length === 0 ? (
                                                        <div className="text-center py-12 text-slate-400 text-sm">
                                                            No courses registered in this school.
                                                        </div>
                                                    ) : (
                                                        courses.filter(c => c.school_id === activeSchoolForGroups.id).map(c => {
                                                            const courseGroupsCount = groups.filter(g => g.course_id === c.id).length;
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => setActiveCourseForGroups(c)}
                                                                    className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/40 hover:border-blue-300 transition-all flex items-center justify-between group/btn"
                                                                >
                                                                    <div>
                                                                        <span className="font-bold text-slate-800 block group-hover/btn:text-blue-700 transition-colors">
                                                                            {c.name}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500 font-semibold mt-0.5">
                                                                            {courseGroupsCount} {courseGroupsCount === 1 ? 'Student Group' : 'Student Groups'}
                                                                        </span>
                                                                    </div>
                                                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover/btn:text-blue-600 group-hover/btn:translate-x-1 transition-all" />
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            ) : (
                                                /* Groups Listing Level */
                                                <div className="space-y-4">
                                                    <button
                                                        onClick={() => setActiveCourseForGroups(null)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                                                    >
                                                        &larr; Back to Courses
                                                    </button>

                                                    {groups.filter(g => g.course_id === activeCourseForGroups.id).length === 0 ? (
                                                        <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl bg-slate-50">
                                                            No student groups registered under this course yet.
                                                        </div>
                                                    ) : (
                                                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase">
                                                                        <th className="py-3 px-5">Group Name</th>
                                                                        <th className="py-3 px-5 text-right">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-200 text-sm bg-white">
                                                                    {groups.filter(g => g.course_id === activeCourseForGroups.id).map(g => (
                                                                        <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                                                                            <td className="py-3.5 px-5 font-bold text-slate-800">{g.name}</td>
                                                                            <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setGroupForm({ id: g.id, course_id: g.course_id, name: g.name });
                                                                                        setShowGroupModal(true);
                                                                                    }}
                                                                                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold transition"
                                                                                    title="Edit Group"
                                                                                >
                                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteGroup(g.id)}
                                                                                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold transition"
                                                                                    title="Delete Group"
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5" />
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
                                        </div>

                                        <div className="px-6 py-4 border-t border-slate-200 flex justify-between bg-slate-50 flex-shrink-0">
                                            {activeCourseForGroups ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveCourseForGroups(null)}
                                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-sm text-slate-600 font-semibold transition"
                                                >
                                                    Back to List
                                                </button>
                                            ) : (
                                                <div />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveSchoolForGroups(null);
                                                    setActiveCourseForGroups(null);
                                                }}
                                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
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

                    {/* --- UNITS TAB --- */}
                    {activeTab === 'units' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Course Units</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Academic course units categorized by year and semester. Select a school to manage its units.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setUnitForm({ id: null, course_id: courses[0]?.id || '', code: '', name: '', year: '1', semester: '1' });
                                        setShowUnitModal(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 transition shadow"
                                    disabled={courses.length === 0}
                                >
                                    <Plus className="h-4 w-4" /> Add Unit
                                </button>
                            </div>

                            {schools.length === 0 ? (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 text-sm">
                                    No schools found. Please add a school first.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {schools.map(s => {
                                        const schoolCourses = courses.filter(c => c.school_id === s.id);
                                        const schoolUnits = units.filter(u => schoolCourses.some(c => c.id === u.course_id));
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => {
                                                    setActiveSchoolForUnits(s);
                                                    setActiveCourseForUnits(null);
                                                }}
                                                className="group cursor-pointer bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-40"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-blue-600">
                                                        <Book className="h-5 w-5" />
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">School</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                        {s.name}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {schoolUnits.length} {schoolUnits.length === 1 ? 'Unit' : 'Units'} in {schoolCourses.length} {schoolCourses.length === 1 ? 'Course' : 'Courses'}
                                                    </span>
                                                    <span className="text-blue-600 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                        View Units &rarr;
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Drill-down Modal for Course Units */}
                            {activeSchoolForUnits && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
                                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                    <Book className="h-5 w-5 text-blue-600" />
                                                    {activeCourseForUnits ? `Units for ${activeCourseForUnits.name}` : `Courses in ${activeSchoolForUnits.name}`}
                                                </h3>
                                                <p className="text-slate-500 text-xs mt-0.5">
                                                    {activeCourseForUnits 
                                                        ? `Filtered to academic units.` 
                                                        : `Select a course to view and edit its units.`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setActiveSchoolForUnits(null);
                                                    setActiveCourseForUnits(null);
                                                }}
                                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="p-6 overflow-y-auto flex-grow bg-slate-50/50">
                                            {/* Course Selection Level */}
                                            {!activeCourseForUnits ? (
                                                <div className="space-y-3">
                                                    {courses.filter(c => c.school_id === activeSchoolForUnits.id).length === 0 ? (
                                                        <div className="text-center py-12 text-slate-400 text-sm">
                                                            No courses registered in this school.
                                                        </div>
                                                    ) : (
                                                        courses.filter(c => c.school_id === activeSchoolForUnits.id).map(c => {
                                                            const courseUnitsCount = units.filter(u => u.course_id === c.id).length;
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => setActiveCourseForUnits(c)}
                                                                    className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/40 hover:border-blue-300 transition-all flex items-center justify-between group/btn"
                                                                >
                                                                    <div>
                                                                        <span className="font-bold text-slate-800 block group-hover/btn:text-blue-700 transition-colors">
                                                                            {c.name}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500 font-semibold mt-0.5">
                                                                            {courseUnitsCount} {courseUnitsCount === 1 ? 'Unit' : 'Units'}
                                                                        </span>
                                                                    </div>
                                                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover/btn:text-blue-600 group-hover/btn:translate-x-1 transition-all" />
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            ) : (
                                                /* Units Listing Level */
                                                <div className="space-y-4">
                                                    <button
                                                        onClick={() => setActiveCourseForUnits(null)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                                                    >
                                                        &larr; Back to Courses
                                                    </button>

                                                    {units.filter(u => u.course_id === activeCourseForUnits.id).length === 0 ? (
                                                        <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl bg-slate-50">
                                                            No units registered under this course yet.
                                                        </div>
                                                    ) : (
                                                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase">
                                                                        <th className="py-3 px-5">Unit Code</th>
                                                                        <th className="py-3 px-5">Unit Name</th>
                                                                        <th className="py-3 px-5">Year</th>
                                                                        <th className="py-3 px-5">Semester</th>
                                                                        <th className="py-3 px-5 text-right">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-200 text-sm bg-white">
                                                                    {units.filter(u => u.course_id === activeCourseForUnits.id).map(u => (
                                                                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                                                            <td className="py-3.5 px-5 font-bold text-blue-700">{u.code}</td>
                                                                            <td className="py-3.5 px-5 font-semibold text-slate-800">{u.name}</td>
                                                                            <td className="py-3.5 px-5 text-slate-600">Year {u.year}</td>
                                                                            <td className="py-3.5 px-5 text-slate-600">Semester {u.semester}</td>
                                                                            <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setUnitForm({
                                                                                            id: u.id,
                                                                                            course_id: u.course_id,
                                                                                            code: u.code,
                                                                                            name: u.name,
                                                                                            year: u.year.toString(),
                                                                                            semester: u.semester.toString()
                                                                                        });
                                                                                        setShowUnitModal(true);
                                                                                    }}
                                                                                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold transition"
                                                                                    title="Edit Unit"
                                                                                >
                                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteUnit(u.id)}
                                                                                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold transition"
                                                                                    title="Delete Unit"
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5" />
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
                                        </div>

                                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-slate-50 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveSchoolForUnits(null);
                                                    setActiveCourseForUnits(null);
                                                }}
                                                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-sm text-slate-600 font-semibold transition"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
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

            {/* --- UNIT MODAL --- */}
            {showUnitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{unitForm.id ? 'Edit' : 'Add'} Course Unit</h3>
                            <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="unitCourse" className="block text-sm font-semibold text-slate-700 mb-2">Academic Course</label>
                                <select
                                    id="unitCourse"
                                    value={unitForm.course_id}
                                    onChange={(e) => setUnitForm({ ...unitForm, course_id: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                    required
                                >
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="unitCode" className="block text-sm font-semibold text-slate-700 mb-2">Unit Code</label>
                                <input
                                    type="text"
                                    id="unitCode"
                                    value={unitForm.code}
                                    onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                    placeholder="e.g. ICS 2201"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="unitName" className="block text-sm font-semibold text-slate-700 mb-2">Unit Name</label>
                                <input
                                    type="text"
                                    id="unitName"
                                    value={unitForm.name}
                                    onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                    placeholder="e.g. Systems Programming"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="unitYear" className="block text-sm font-semibold text-slate-700 mb-2">Year</label>
                                    <select
                                        id="unitYear"
                                        value={unitForm.year}
                                        onChange={(e) => setUnitForm({ ...unitForm, year: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                        required
                                    >
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="unitSemester" className="block text-sm font-semibold text-slate-700 mb-2">Semester</label>
                                    <select
                                        id="unitSemester"
                                        value={unitForm.semester}
                                        onChange={(e) => setUnitForm({ ...unitForm, semester: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-3 text-slate-950 bg-white"
                                        required
                                    >
                                        <option value="1">Semester 1</option>
                                        <option value="2">Semester 2</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowUnitModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
