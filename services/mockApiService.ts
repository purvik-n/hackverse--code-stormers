import type { Student, AttendanceRecord, User, Role } from '../types';

// Add username and password for each mock user
let mockUsers: (User & { password?: string })[] = [
    { id: 1, name: 'Admin User', role: 'Admin', username: 'admin', password: 'admin123' },
    { id: 2, name: 'Barbara Oakwood', role: 'Teacher', username: 'teacher', password: 'teacher123', assignedClasses: ['10 - A', '10 - B'] },
    { id: 3, name: 'Peter Parker', role: 'Student', username: 'student', password: 'student123', studentId: 1 }
];

let mockStudents: Student[] = [];

let mockAttendance: AttendanceRecord[] = [];


const simulateDelay = <T,>(data: T, delay = 300): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), delay));
};

// --- Auth ---
// Updated login to check for username and password
export const login = async (username: string, password: string): Promise<User | null> => {
    const user = mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
        // Return user data without the password
        const { password, ...userWithoutPassword } = user;
        return simulateDelay(userWithoutPassword);
    }
    return simulateDelay(null);
}

// --- Data Fetching (Now Role-Aware) ---
export const getStudents = async (user: User): Promise<Student[]> => {
  if (user.role === 'Admin') {
    return simulateDelay(mockStudents);
  }
  if (user.role === 'Teacher' && user.assignedClasses) {
    const teacherClasses = new Set(user.assignedClasses);
    const filtered = mockStudents.filter(s => teacherClasses.has(`${s.standard} - ${s.section}`));
    return simulateDelay(filtered);
  }
  // Students cannot view student lists
  return simulateDelay([]);
};

export const getAttendanceRecords = async (user: User, filters: { date?: string, standard?: string }): Promise<AttendanceRecord[]> => {
  let userVisibleRecords = mockAttendance;

  if (user.role === 'Student' && user.studentId) {
      userVisibleRecords = mockAttendance.filter(r => r.studentId === user.studentId);
  } else if (user.role === 'Teacher' && user.assignedClasses) {
      const teacherStudentIds = new Set(
          mockStudents
              .filter(s => user.assignedClasses!.includes(`${s.standard} - ${s.section}`))
              .map(s => s.id)
      );
      userVisibleRecords = mockAttendance.filter(r => teacherStudentIds.has(r.studentId));
  }
  // Admin sees all records
  
  return simulateDelay(userVisibleRecords);
};


export const getStudentByRollNumber = async (rollNumber: string): Promise<Student | null> => {
  const student = mockStudents.find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
  return simulateDelay(student || null);
};

export const addStudent = async (studentData: Omit<Student, 'id' | 'photoUrl' | 'faceRegistered'>): Promise<Student> => {
    const newStudent: Student = {
        id: (mockStudents.length > 0 ? Math.max(...mockStudents.map(s => s.id)) : 0) + 1,
        ...studentData,
        photoUrl: `https://picsum.photos/seed/${studentData.name.split(' ')[0]}/200`,
        faceRegistered: false
    };
    mockStudents.push(newStudent);
    return simulateDelay(newStudent);
};

export const updateStudent = async (studentId: number, studentData: Omit<Student, 'id' | 'photoUrl' | 'faceRegistered' | 'photo'>): Promise<Student> => {
    const studentIndex = mockStudents.findIndex(s => s.id === studentId);
    if (studentIndex > -1) {
        const originalStudent = mockStudents[studentIndex];
        mockStudents[studentIndex] = { ...originalStudent, ...studentData };
        return simulateDelay(mockStudents[studentIndex]);
    }
    throw new Error("Student not found for update");
};

export const deleteStudent = async (studentId: number): Promise<{ success: boolean }> => {
    const initialStudentLength = mockStudents.length;
    mockStudents = mockStudents.filter(s => s.id !== studentId);
    mockAttendance = mockAttendance.filter(a => a.studentId !== studentId);
    if (mockStudents.length < initialStudentLength) {
        return simulateDelay({ success: true });
    }
    throw new Error("Student not found for deletion");
};


export const registerStudentFace = async (studentId: number): Promise<Student> => {
    const student = mockStudents.find(s => s.id === studentId);
    if (student) {
        student.faceRegistered = true;
        return simulateDelay(student);
    }
    throw new Error("Student not found");
};

export const recognizeFace = async (imageData: string): Promise<{ student: Student; confidence: number } | null> => {
  const registeredStudents = mockStudents.filter(s => s.faceRegistered);
  if (registeredStudents.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return null;
  }
  await new Promise(resolve => setTimeout(resolve, 1000)); 
  if (Math.random() > 0.3) { 
    const student = registeredStudents[Math.floor(Math.random() * registeredStudents.length)];
    if (!student) return null;
    const confidence = Math.random() * (0.99 - 0.7) + 0.7;
    return { student, confidence };
  }
  return null;
};

export const markAttendance = async (record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'studentName'>): Promise<AttendanceRecord> => {
    const student = mockStudents.find(s => s.id === record.studentId);
    if (!student) throw new Error("Student not found");
    const newRecord: AttendanceRecord = {
        id: (mockAttendance.length > 0 ? Math.max(...mockAttendance.map(a => a.id)) : 0) + 1,
        ...record,
        studentName: student.name,
        timestamp: new Date().toISOString(),
    };
    mockAttendance.push(newRecord);
    return simulateDelay(newRecord);
};

export const deleteAttendanceRecord = async (recordId: number): Promise<{ success: boolean }> => {
    const initialLength = mockAttendance.length;
    mockAttendance = mockAttendance.filter(r => r.id !== recordId);
    if (mockAttendance.length < initialLength) {
        return simulateDelay({ success: true });
    }
    throw new Error("Attendance record not found for deletion");
};