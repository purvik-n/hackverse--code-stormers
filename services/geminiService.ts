
import { GoogleGenAI } from "@google/genai";
import type { AttendanceRecord } from '../types';

// IMPORTANT: This key is for demonstration purposes. In a real application,
// this should be handled securely on a backend server.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateAttendanceSummary = async (records: AttendanceRecord[]): Promise<string> => {
  if (!API_KEY) {
    return "AI analysis is unavailable. API key is not configured.";
  }

  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const total = records.length;
  const attendancePercentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0;
  
  const manualCount = records.filter(r => r.isManual).length;
  const highConfidenceCount = records.filter(r => !r.isManual && r.confidenceScore > 0.9).length;

  const prompt = `
    Analyze the following daily attendance data and provide a concise, insightful summary in 3-4 bullet points.
    Focus on key metrics and potential areas of concern or positive trends.

    Data:
    - Total Students Recorded: ${total}
    - Present: ${presentCount}
    - Absent: ${absentCount}
    - Overall Attendance Rate: ${attendancePercentage}%
    - Manually Marked Entries: ${manualCount}
    - High-Confidence AI Recognitions (>90%): ${highConfidenceCount}

    Example Output Format:
    *   **Overall Attendance:** A strong attendance rate of ${attendancePercentage}% was observed, with ${presentCount} out of ${total} students present.
    *   **Data Quality:** The automated system performed well, with ${highConfidenceCount} high-confidence recognitions.
    *   **Manual Intervention:** There were ${manualCount} manual entries, which might warrant a review to ensure accuracy.
    *   **Absences:** The ${absentCount} absences should be followed up on according to school policy.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    return "Could not generate AI summary. There might be an issue with the API configuration.";
  }
};
