
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', Present: 28, Absent: 2 },
  { name: 'Tue', Present: 29, Absent: 1 },
  { name: 'Wed', Present: 30, Absent: 0 },
  { name: 'Thu', Present: 27, Absent: 3 },
  { name: 'Fri', Present: 25, Absent: 5 },
  { name: 'Sat', Present: 30, Absent: 0 },
];

const AttendanceChart: React.FC = () => {
  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart
            data={data}
            margin={{
                top: 5, right: 30, left: 20, bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Present" fill="#4f46e5" />
            <Bar dataKey="Absent" fill="#ef4444" />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
