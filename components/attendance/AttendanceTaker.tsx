import React, { useState, useRef, useCallback, useEffect } from 'react';
import CameraCapture from '../common/CameraCapture';
import type { CameraCaptureHandle } from '../common/CameraCapture';
import { recognizeFace, markAttendance, deleteAttendanceRecord, getStudentByRollNumber } from '../../services/mockApiService';
import type { AttendanceRecord } from '../../types';
import Spinner from '../common/Spinner';
import { TrashIcon, CameraIcon, BarcodeIcon } from '../icons/Icons';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';


const AttendanceTaker: React.FC = () => {
    const [mode, setMode] = useState<'face' | 'barcode'>('face');
    
    // Face Recognition State
    const cameraRef = useRef<CameraCaptureHandle>(null);
    const [isFaceScanning, setIsFaceScanning] = useState(false);
    const faceIntervalRef = useRef<number | null>(null);

    // Barcode Scanner State
    const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);
    const barcodeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Shared State
    const [markedAttendance, setMarkedAttendance] = useState<AttendanceRecord[]>([]);
    const [message, setMessage] = useState<{type: 'success'|'error'|'info', text: string} | null>(null);
    const messageTimeoutRef = useRef<number | null>(null);
    
    // --- Message Handling ---
    const showTemporaryMessage = (type: 'success' | 'error' | 'info', text: string, duration = 3000) => {
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        setMessage({ type, text });
        messageTimeoutRef.current = window.setTimeout(() => setMessage(null), duration);
    };

    // --- Face Recognition Logic ---
    const stopFaceScanning = useCallback(() => {
        if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
        faceIntervalRef.current = null;
        setIsFaceScanning(false);
    }, []);

    const startFaceScanning = useCallback(() => {
        setIsFaceScanning(true);
        setMessage(null);

        faceIntervalRef.current = window.setInterval(async () => {
            if (cameraRef.current) {
                const imageData = cameraRef.current.captureFrame();
                if (imageData) {
                    try {
                        const result = await recognizeFace(imageData);
                        // If a student is recognized, stop scanning.
                        if (result) {
                            stopFaceScanning();
                            
                            // Check if student is already marked.
                            if (!markedAttendance.some(a => a.studentId === result.student.id)) {
                                const newRecord = await markAttendance({ studentId: result.student.id, status: 'Present', confidenceScore: result.confidence, isManual: false });
                                setMarkedAttendance(prev => [newRecord, ...prev]);
                                showTemporaryMessage('success', `${result.student.name} marked Present`);
                            } else {
                                showTemporaryMessage('info', `${result.student.name} is already marked present.`);
                            }
                        }
                        // If no student is recognized (result is null), continue scanning silently.
                    } catch (error) {
                        console.error("Recognition failed:", error);
                        stopFaceScanning(); // Also stop on any unexpected error
                        showTemporaryMessage('error', 'An error occurred during recognition.');
                    }
                }
            }
        }, 2000);
    }, [markedAttendance, stopFaceScanning]);
    
    // --- Barcode Scanning Logic ---
     const stopBarcodeScanning = useCallback(() => {
        if (barcodeReaderRef.current) {
            barcodeReaderRef.current.reset();
        }
        setIsBarcodeScanning(false);
    }, []);
    
    const handleBarcodeScanResult = async (rollNumber: string) => {
        if (!rollNumber) return;
        
        stopBarcodeScanning(); // Stop after one successful scan
        
        if (markedAttendance.some(a => a.studentName.toLowerCase().includes(`(${rollNumber.toLowerCase()})`))) {
            showTemporaryMessage('info', `Student with Roll No. ${rollNumber} already marked.`);
            return;
        }

        try {
            const student = await getStudentByRollNumber(rollNumber);
            if (student) {
                if (markedAttendance.some(a => a.studentId === student.id)) {
                    showTemporaryMessage('info', `${student.name} is already marked present.`);
                    return;
                }
                const newRecord = await markAttendance({ studentId: student.id, status: 'Present', confidenceScore: 1.0, isManual: false });
                setMarkedAttendance(prev => [newRecord, ...prev]);
                showTemporaryMessage('success', `${student.name} marked Present`);
            } else {
                showTemporaryMessage('error', `Student with Roll No. "${rollNumber}" not found.`);
            }
        } catch (error) {
            console.error("Error marking attendance via barcode:", error);
            showTemporaryMessage('error', 'An error occurred while marking attendance.');
        }
    };


    const startBarcodeScanning = useCallback(() => {
        if (videoRef.current) {
            setIsBarcodeScanning(true);
            setMessage(null);
            barcodeReaderRef.current = new BrowserMultiFormatReader();
            // FIX: The callback for `decodeFromVideoElement` expects a single `result` argument.
            // The previous implementation used `(result, error)`, causing a type error.
            // Errors are now correctly handled by chaining a `.catch()` to the promise.
            barcodeReaderRef.current.decodeFromVideoElement(videoRef.current, (result) => {
                if (result) {
                    handleBarcodeScanResult(result.getText());
                }
            }).catch(error => {
                if (error && !(error instanceof NotFoundException)) {
                    console.error("Barcode scanning error:", error);
                    showTemporaryMessage('error', 'Could not start barcode scanner. Check camera permissions.');
                    stopBarcodeScanning();
                }
            });
        }
    }, [handleBarcodeScanResult, stopBarcodeScanning]);

    // --- General Logic and Cleanup ---
    useEffect(() => {
        return () => {
            stopFaceScanning();
            stopBarcodeScanning();
            if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        }
    }, [stopFaceScanning, stopBarcodeScanning]);

    const handleDeleteMarkedAttendance = async (recordId: number, studentName: string) => {
        if (window.confirm(`Are you sure you want to remove ${studentName}'s attendance record for today?`)) {
            try {
                await deleteAttendanceRecord(recordId);
                setMarkedAttendance(prev => prev.filter(r => r.id !== recordId));
            } catch (error) {
                console.error("Failed to delete attendance record", error);
                showTemporaryMessage('error', 'Failed to delete entry.');
            }
        }
    };

    const renderMessage = () => {
        if (!message) return null;
        const colorClasses = {
            success: 'bg-green-100 text-green-800',
            error: 'bg-red-100 text-red-800',
            info: 'bg-blue-100 text-blue-800'
        };
        return (
             <div className={`mt-4 p-3 rounded-md text-center transition-opacity duration-300 ${colorClasses[message.type]}`}>
                {message.text}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4 border-b border-gray-200">
                    <div className="flex -mb-px space-x-4">
                        <button onClick={() => setMode('face')} className={`flex items-center space-x-2 py-2 px-4 border-b-2 font-semibold ${mode === 'face' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                           <CameraIcon className="h-5 w-5" /> <span>Face Recognition</span>
                        </button>
                         <button onClick={() => setMode('barcode')} className={`flex items-center space-x-2 py-2 px-4 border-b-2 font-semibold ${mode === 'barcode' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                           <BarcodeIcon className="h-5 w-5" /> <span>Barcode Scanner</span>
                        </button>
                    </div>
                </div>

                {mode === 'face' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Live Camera Feed</h2>
                        <CameraCapture ref={cameraRef} showOverlay={isFaceScanning} />
                        <div className="mt-4">
                            {isFaceScanning ? (
                                <button onClick={stopFaceScanning} className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center space-x-2">
                                    <Spinner /> <span>Stop Scanning</span>
                                </button>
                            ) : (
                                <button onClick={startFaceScanning} className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                    Start Face Scanning
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {mode === 'barcode' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Scan Student Barcode</h2>
                        <div className="relative bg-gray-900 rounded-lg overflow-hidden w-full aspect-video flex items-center justify-center">
                            <video ref={videoRef} className="w-full h-full" playsInline />
                             {isBarcodeScanning && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-4/5 h-1/3 relative">
                                        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-red-500 rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-red-500 rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-red-500 rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-red-500 rounded-br-lg"></div>
                                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 animate-pulse"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                         <div className="mt-4">
                            {isBarcodeScanning ? (
                                <button onClick={stopBarcodeScanning} className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center space-x-2">
                                    <Spinner /> <span>Stop Scanning</span>
                                </button>
                            ) : (
                                <button onClick={startBarcodeScanning} className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                    Start Barcode Scan
                                </button>
                            )}
                        </div>
                    </div>
                )}
                 {renderMessage()}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Marked Today ({markedAttendance.length})</h2>
                <ul className="space-y-3 h-96 overflow-y-auto">
                    {markedAttendance.map(record => (
                        <li key={record.id} className="flex items-center justify-between p-2 rounded-md bg-gray-50 group">
                            <div>
                                <span className="font-medium text-gray-800">{record.studentName}</span>
                                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {record.status}
                                </span>
                            </div>
                             <button 
                                onClick={() => handleDeleteMarkedAttendance(record.id, record.studentName)} 
                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Remove ${record.studentName}'s record`}
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </li>
                    ))}
                    {markedAttendance.length === 0 && (
                        <p className="text-gray-500 text-center mt-4">No students marked yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AttendanceTaker;