import React, { useState, useRef } from 'react';
import CameraCapture from '../common/CameraCapture';
import type { CameraCaptureHandle } from '../common/CameraCapture';
import { addStudent, registerStudentFace, updateStudent } from '../../services/mockApiService';
import type { Student } from '../../types';
import Spinner from '../common/Spinner';
import { TrashIcon } from '../icons/Icons';

interface StudentRegistrationFormProps {
  student?: Student | null;
  onStudentAdded: () => void;
  onCancel: () => void;
  isEditingDetails?: boolean;
  onDelete?: (studentId: number) => void;
}

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ student, onStudentAdded, onCancel, isEditingDetails = false, onDelete }) => {
  const [name, setName] = useState(student?.name || '');
  const [rollNumber, setRollNumber] = useState(student?.rollNumber || '');
  const [standard, setStandard] = useState(student?.standard || '');
  const [section, setSection] = useState(student?.section || '');
  
  const [activeStudent, setActiveStudent] = useState<Student | null>(student || null);
  const [step, setStep] = useState((student && !isEditingDetails) ? 2 : 1);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const cameraRef = useRef<CameraCaptureHandle>(null);

  const handleCapture = () => {
    if (cameraRef.current) {
      const frame = cameraRef.current.captureFrame();
      if (frame && capturedImages.length < 5) {
        setCapturedImages([...capturedImages, frame]);
      }
    }
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        if (isEditingDetails && activeStudent) {
            await updateStudent(activeStudent.id, { name, rollNumber, standard, section });
            onStudentAdded(); // This signals success and triggers a refetch
        } else {
            const newStudent = await addStudent({ name, rollNumber, standard, section });
            setActiveStudent(newStudent);
            setStep(2);
        }
    } catch(error) {
        console.error("Failed to save student details", error);
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleFinishRegistration = async () => {
    if (!activeStudent) return;
    setIsSaving(true);
    try {
        await registerStudentFace(activeStudent.id);
        onStudentAdded();
    } catch (error) {
        console.error("Failed to register face", error);
    } finally {
        setIsSaving(false);
    }
  };

  const getTitle = () => {
      if (isEditingDetails) return `Edit Details for ${student?.name}`;
      if (student) return `Register Face for ${student.name}`;
      return 'Add New Student';
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">{getTitle()}</h2>
        
        {!isEditingDetails && (
             <p className="text-gray-600 mb-6">
                Step {step} of 2: {step === 1 ? "Enter Details" : "Capture Face"}
            </p>
        )}

      {step === 1 && (
        <form onSubmit={handleSubmitDetails}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Roll Number</label>
                <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Standard</label>
                <input type="text" value={standard} onChange={e => setStandard(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <input type="text" value={section} onChange={e => setSection(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
          </div>
          <div className="mt-8 flex justify-between items-center">
            <div>
                {isEditingDetails && activeStudent && onDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(activeStudent.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        <TrashIcon className="h-5 w-5" />
                        <span>Delete Student</span>
                    </button>
                )}
            </div>
            <div className="flex justify-end space-x-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center min-w-[120px]">
                    {isSaving ? <Spinner /> : (isEditingDetails ? 'Save Changes' : 'Next: Capture Face')}
                </button>
            </div>
          </div>
        </form>
      )}

      {step === 2 && (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <CameraCapture ref={cameraRef} showOverlay={true}/>
                     <button onClick={handleCapture} disabled={capturedImages.length >= 5} className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                        Capture Image ({capturedImages.length}/5)
                    </button>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Captured Images</h3>
                    <div className="grid grid-cols-3 gap-2 bg-gray-100 p-2 rounded-lg min-h-[100px]">
                        {capturedImages.map((imgSrc, index) => (
                            <img key={index} src={imgSrc} alt={`Capture ${index+1}`} className="rounded-md object-cover aspect-square"/>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-8 flex justify-end space-x-4">
              <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleFinishRegistration} disabled={isSaving || capturedImages.length < 3} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center min-w-[180px]">
                 {isSaving ? <Spinner /> : 'Finish Registration'}
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistrationForm;