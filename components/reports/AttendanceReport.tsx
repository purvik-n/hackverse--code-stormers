
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAttendanceRecords, getStudents } from '../../services/mockApiService';
import { generateAttendanceSummary } from '../../services/geminiService';
import type { AttendanceRecord, Student } from '../../types';
import Spinner from '../common/Spinner';
import { DownloadIcon, PrintIcon } from '../icons/Icons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../../contexts/AuthContext';


const AttendanceReport: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  
  const reportContentRef = useRef<HTMLDivElement>(null);
  
  const [totalWorkingDays, setTotalWorkingDays] = useState(20);
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const fetchAllData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [recordsData, studentsData] = await Promise.all([
                getAttendanceRecords(user, {}),
                getStudents(user)
            ]);
            setRecords(recordsData);
            setStudents(studentsData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchAllData();
  }, [user]);
  
   // Lock filters for student role
    useEffect(() => {
        if (user?.role === 'Student' && user.studentId) {
            setSelectedStudentId(user.studentId.toString());
            setSelectedClass('all'); // Not relevant for single student view
        }
    }, [user]);

  const uniqueClasses = useMemo(() => {
      if (user?.role === 'Teacher' && user.assignedClasses) {
          return user.assignedClasses.sort();
      }
      const classSet = new Set<string>();
      students.forEach(s => classSet.add(`${s.standard} - ${s.section}`));
      return Array.from(classSet).sort();
  }, [students, user]);

  const handleGenerateSummary = async () => {
      if (records.length === 0) {
          setAiSummary("No attendance data is available to generate a summary.");
          return;
      }
      setLoadingSummary(true);
      try {
          const summary = await generateAttendanceSummary(records);
          setAiSummary(summary);
      } catch (error) {
          setAiSummary("Failed to generate summary.");
      } finally {
          setLoadingSummary(false);
      }
  };

  const filteredRecords = useMemo(() => {
    const now = new Date();
    const today = now.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - now.getDay());
    
    const studentClassMap = new Map<number, string>();
    students.forEach(s => studentClassMap.set(s.id, `${s.standard} - ${s.section}`));

    return records
      .filter(r => selectedStudentId === 'all' || r.studentId === parseInt(selectedStudentId, 10))
      .filter(r => selectedClass === 'all' || studentClassMap.get(r.studentId) === selectedClass)
      .filter(r => {
        const recordDate = new Date(r.timestamp);
        switch (dateFilter) {
          case 'daily':
            return recordDate.setHours(0, 0, 0, 0) === today;
          case 'weekly':
            return recordDate >= weekStart;
          case 'monthly':
            return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
          case 'all':
          default:
            return true;
        }
      });
  }, [records, students, selectedStudentId, selectedClass, dateFilter]);

  const { presentRecords, absentStudents } = useMemo(() => {
      const present = filteredRecords.filter(r => r.status === 'Present');
      const presentStudentIds = new Set(present.map(r => r.studentId));
      
      const classStudents = students.filter(s => 
          selectedClass === 'all' || `${s.standard} - ${s.section}` === selectedClass
      );
      
      const absent = classStudents.filter(s => !presentStudentIds.has(s.id));
      
      return { presentRecords: present, absentStudents: absent };
  }, [filteredRecords, students, selectedClass]);


  const attendanceStats = useMemo(() => {
    const presentCount = presentRecords.length;
    
    let title = "Attendance Report";
    if (user?.role === 'Student' && user?.name) {
        title = `${user.name}'s Attendance`;
        const percentage = totalWorkingDays > 0 ? ((presentCount / totalWorkingDays) * 100).toFixed(1) : 0;
        return { presentCount, percentage, title, description: `${presentCount} / ${totalWorkingDays} days present` };
    }
     if (selectedClass !== 'all') {
        title = `${selectedClass} Report`;
    }
    
    const totalClassStudents = students.filter(s => selectedClass === 'all' || `${s.standard} - ${s.section}` === selectedClass).length;
    const percentage = totalClassStudents > 0 ? ((presentCount / totalClassStudents) * 100).toFixed(1) : 0;

    return { presentCount, percentage, title, description: `${presentCount} / ${totalClassStudents} students present` };

  }, [presentRecords, totalWorkingDays, selectedClass, students, user]);

  const handleDownloadCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,Student Name,Roll Number,Timestamp,Status,Confidence\n";
    
    presentRecords.forEach(record => {
        const student = students.find(s => s.id === record.studentId);
        const row = [
            record.studentName,
            student?.rollNumber || 'N/A',
            `"${new Date(record.timestamp).toLocaleString()}"`,
            record.status,
            record.isManual ? 'Manual' : `${(record.confidenceScore * 100).toFixed(1)}%`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "present_attendance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = async () => {
    if (!reportContentRef.current || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
        const canvas = await html2canvas(reportContentRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps= pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('attendance_report.pdf');
    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsDownloadingPdf(false);
    }
  };
  
  return (
    <div className="space-y-6">
        {user?.role !== 'Student' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Report Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Working Days</label>
                            <input type="number" value={totalWorkingDays} onChange={e => setTotalWorkingDays(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Class</label>
                            <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudentId('all'); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="all">All Classes</option>
                                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                            <div className="flex space-x-2">
                                {['all', 'daily', 'weekly', 'monthly'].map(filter => (
                                    <button key={filter} onClick={() => setDateFilter(filter)} className={`capitalize px-3 py-1 text-sm rounded-full ${dateFilter === filter ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                        {filter === 'all' ? 'All Time' : filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
                    <h2 className="text-xl font-semibold text-gray-700 text-center">{attendanceStats.title}</h2>
                    <p className="mt-2 text-5xl font-bold text-indigo-600">{attendanceStats.percentage}%</p>
                    <p className="mt-1 text-gray-500">{attendanceStats.description}</p>
                </div>
            </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b no-print">
                <h2 className="text-xl font-semibold text-gray-700">
                    {user?.role === 'Student' ? "Your Attendance Details" : "Attendance Details"}
                </h2>
                <div className='flex items-center space-x-2'>
                    <button onClick={handleDownloadPdf} disabled={isDownloadingPdf || loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 disabled:bg-blue-300">
                        <PrintIcon className="h-5 w-5"/>
                        <span>{isDownloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
                    </button>
                </div>
            </div>
            {loading ? <div className="flex justify-center p-8"><Spinner /></div> : (
                 <div ref={reportContentRef} className="p-6 bg-white">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-green-700 mb-2">Present ({presentRecords.length})</h3>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {user?.role !== 'Student' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {presentRecords.length > 0 ? (
                                        presentRecords.map((record) => (
                                            <tr key={record.id}>
                                                {user?.role !== 'Student' && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.studentName}</td>}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(record.timestamp).toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.isManual ? 'Manual' : `${(record.confidenceScore * 100).toFixed(1)}%`}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={user?.role === 'Student' ? 2 : 3} className="px-6 py-4 text-center text-gray-500">
                                                No 'Present' records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                     {user?.role !== 'Student' && selectedStudentId === 'all' && (
                        <div>
                            <h3 className="text-lg font-bold text-red-700 mb-2">Absent ({absentStudents.length})</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {absentStudents.length > 0 ? (
                                            absentStudents.map((student) => (
                                                <tr key={student.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.rollNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${student.standard} - ${student.section}`}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                                    All students were present.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                 </div>
            )}
        </div>

         {user?.role !== 'Student' && (
            <div className="bg-white p-6 rounded-lg shadow-md no-print">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">AI Summary</h2>
                    <button onClick={handleGenerateSummary} disabled={loadingSummary} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                        {loadingSummary ? 'Generating...' : 'Generate AI Summary'}
                    </button>
                </div>
                {loadingSummary ? <div className="flex justify-center"><Spinner/></div> : 
                aiSummary ? (
                    <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">{aiSummary}</div>
                ) : (
                    <p className="text-gray-500">Click the button to generate an AI-powered summary of the attendance data.</p>
                )}
            </div>
         )}
    </div>
  );
};

export default AttendanceReport;