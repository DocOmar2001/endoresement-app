import { GoogleGenAI, Type } from "@google/genai";
import type { Diagnosis } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMedicalImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };
    const textPart = {
      text: "Analyze this medical image in detail. Describe any abnormalities, significant findings, and potential clinical implications. This analysis is for a medical professional. Be concise and structured.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing medical image:", error);
    throw new Error("Failed to communicate with the AI model for image analysis.");
  }
};

export const getDifferentialDiagnosis = async (notes: string, imageAnalysis: string): Promise<Diagnosis[]> => {
  const prompt = `
    As an expert medical diagnostician, provide a differential diagnosis based on the following clinical information.

    Patient Notes:
    ---
    ${notes || 'No notes provided.'}
    ---

    Medical Image Analysis:
    ---
    ${imageAnalysis || 'No image analysis provided.'}
    ---

    Based on the combined information, generate a list of potential diagnoses.
    For each diagnosis, provide:
    1.  potentialDiagnosis: The name of the condition.
    2.  confidence: Your confidence level (High, Medium, or Low).
    3.  rationale: A brief explanation of why this diagnosis is being considered, citing evidence from the notes and image analysis.
    4.  nextSteps: Recommended next steps, such as specific tests, imaging, or specialist referrals.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              potentialDiagnosis: { type: Type.STRING },
              confidence: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
              rationale: { type: Type.STRING },
              nextSteps: { type: Type.STRING },
            },
            required: ['potentialDiagnosis', 'confidence', 'rationale', 'nextSteps'],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result as Diagnosis[];
  } catch (error) {
    console.error("Error getting differential diagnosis:", error);
    throw new Error("Failed to generate differential diagnosis from the AI model.");
  }
};

export const getManagementPlan = async (diagnosisName: string): Promise<{ plan: string; sources: { uri: string; title: string }[] }> => {
  const prompt = `Provide the best and most recent evidence-based management plan for "${diagnosisName}" according to the latest clinical guidelines. Structure the response clearly as markdown, covering pharmacological and non-pharmacological treatments, monitoring, and follow-up.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const plan = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    
    const sources = groundingChunks
      .map(chunk => chunk.web)
      .filter((web): web is { uri: string; title: string } => !!web?.uri && !!web.title);

    if (!plan) {
      throw new Error("The model did not return a management plan.");
    }

    return { plan, sources };
  } catch (error) {
    console.error(`Error getting management plan for ${diagnosisName}:`, error);
    throw new Error("Failed to generate management plan from the AI model.");
  }
};
