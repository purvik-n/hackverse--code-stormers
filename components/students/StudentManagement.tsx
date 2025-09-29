
import React, { useState, useEffect, useCallback } from 'react';
import StudentList from './StudentList';
import StudentRegistrationForm from './StudentRegistrationForm';
import { getStudents, deleteStudent } from '../../services/mockApiService';
import type { Student } from '../../types';
import Spinner from '../common/Spinner';
import { useAuth } from '../../contexts/AuthContext';

const StudentManagement: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState<'list' | 'add' | 'edit' | 'registerFace'>('list');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const studentData = await getStudents(user);
      setStudents(studentData);
    } catch (error) {
      console.error("Failed to fetch students", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    if (viewState === 'list') {
        fetchStudents();
    }
  }, [viewState, fetchStudents]);

  const handleAddNew = () => {
      setActiveStudent(null);
      setViewState('add');
  };

  const handleEdit = (student: Student) => {
      setActiveStudent(student);
      setViewState('edit');
  };

  const handleRegisterFace = (student: Student) => {
      setActiveStudent(student);
      setViewState('registerFace');
  };

  const handleDelete = async (studentId: number) => {
      if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
          try {
              await deleteStudent(studentId);
              // After a successful delete, always go back to the list and refetch
              setViewState('list');
              fetchStudents(); 
          } catch (error) {
              console.error("Failed to delete student", error);
              alert('Failed to delete the student. Please try again.');
          }
      }
  };

  const handleFormSuccess = () => {
      setViewState('list');
      // fetchStudents is called by useEffect
  };
  
  const handleFormCancel = () => {
      setViewState('list');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }
  
  if (viewState !== 'list') {
      return <StudentRegistrationForm 
                key={activeStudent?.id || 'add'}
                isEditingDetails={viewState === 'edit'}
                student={activeStudent}
                onStudentAdded={handleFormSuccess}
                onCancel={handleFormCancel}
                onDelete={handleDelete}
             />
  }

  return (
    <div>
        <>
            <div className="flex justify-end mb-4">
                {user?.role !== 'Student' && (
                    <button 
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Add New Student
                    </button>
                )}
            </div>
            <StudentList 
                students={students} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onFaceRegistered={handleRegisterFace}
            />
        </>
    </div>
  );
};

export default StudentManagement;