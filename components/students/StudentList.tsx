
import React, { useMemo } from 'react';
import type { Student } from '../../types';

interface StudentListProps {
  students: Student[];
  onFaceRegistered: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: number) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onFaceRegistered, onEdit, onDelete }) => {
    
    const groupedAndSortedStudents = useMemo(() => {
        const grouped: { [key: string]: Student[] } = {};

        students.forEach(student => {
            const key = `${student.standard} - ${student.section}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(student);
        });

        // Sort students within each group by roll number
        for (const key in grouped) {
            grouped[key].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));
        }
        
        // Sort the groups by class name
        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));

    }, [students]);

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Face Registered</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                {students.length === 0 ? (
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No students found. Add a new student to get started.</td>
                        </tr>
                    </tbody>
                ) : (
                    groupedAndSortedStudents.map(([className, studentGroup]) => (
                        <tbody key={className} className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colSpan={4} className="px-6 py-3 bg-gray-100 text-sm font-bold text-gray-700">
                                    {className}
                                </td>
                            </tr>
                            {studentGroup.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full" src={student.photoUrl} alt={student.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.rollNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {student.faceRegistered ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                No
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => onEdit(student)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        {!student.faceRegistered && (
                                            <button onClick={() => onFaceRegistered(student)} className="text-teal-600 hover:text-teal-900">
                                                Register Face
                                            </button>
                                        )}
                                        <button onClick={() => onDelete(student.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    ))
                )}
            </table>
        </div>
    );
};

export default StudentList;
