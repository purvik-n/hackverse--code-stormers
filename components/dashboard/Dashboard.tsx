
import React, { useState, useEffect } from 'react';
import { getAttendanceRecords, getStudents } from '../../services/mockApiService';
import StatCard from './StatCard';
import AttendanceChart from './AttendanceChart';
import type { AttendanceRecord, Student } from '../../types';
import Spinner from '../common/Spinner';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const [studentData, attendanceData] = await Promise.all([
                    getStudents(user),
                    getAttendanceRecords(user, {})
                ]);
                setStudents(studentData);
                
                const today = new Date().toISOString().split('T')[0];
                const todaysAttendance = attendanceData.filter(r => r.timestamp.startsWith(today));
                setAttendance(todaysAttendance);

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }
    
    const presentCount = attendance.filter(r => r.status === 'Present').length;
    const totalStudents = students.length;
    const attendancePercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : "0";
    const facesRegistered = students.filter(s => s.faceRegistered).length;
    const absentCount = totalStudents - presentCount;

    const getDashboardTitle = () => {
        if (user?.role === 'Student') return `Welcome, ${user.name}!`;
        if (user?.role === 'Teacher') return 'Teacher Dashboard';
        return 'Admin Dashboard';
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">{getDashboardTitle()}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={user?.role === 'Student' ? 'Your Total Classes' : 'Total Students'} value={totalStudents.toString()} />
                <StatCard title="Today's Attendance" value={`${attendancePercentage}%`} description={`${presentCount} of ${totalStudents} present`} />
                {user?.role !== 'Student' && <StatCard title="Faces Registered" value={`${facesRegistered} / ${totalStudents}`} />}
                <StatCard title="Absent Today" value={absentCount.toString()} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Weekly Attendance Overview</h2>
                <AttendanceChart />
            </div>
        </div>
    );
};

export default Dashboard;