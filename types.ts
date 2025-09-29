
export type Role = 'Admin' | 'Teacher' | 'Student';

export interface User {
  id: number;
  name: string;
  role: Role;
  username: string;
  assignedClasses?: string[]; // For Teachers
  studentId?: number; // For Students
}

export interface Student {
  id: number;
  rollNumber: string;
  name: string;
  section: string;
  standard: string;
  photoUrl: string;
  faceRegistered: boolean;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  timestamp: string;
  status: 'Present' | 'Absent';
  confidenceScore: number;
  isManual: boolean;
}

export type View = 'dashboard' | 'students' | 'attendance' | 'reports';