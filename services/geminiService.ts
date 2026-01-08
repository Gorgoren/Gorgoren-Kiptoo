
import { GoogleGenAI } from "@google/genai";
import { Customer } from "../types";

export const getWaterInsights = async (customer: Customer) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const recentReadings = customer.readings.slice(-5).map(r => `Date: ${r.date}, Consumed: ${r.consumption} m3`).join('\n');
  
  const prompt = `
    Analyze this water consumption history for customer "${customer.name}":
    ${recentReadings}
    
    Current Reading: ${customer.lastReading}
    
    Provide a brief, helpful summary (max 3 sentences) for a mobile app user.
    Identify any potential leaks (sudden spikes) or saving tips based on usage patterns.
    Return the response in JSON format with two keys: "analysis" and "alertLevel" (low, medium, high).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      analysis: "Unable to generate insights at the moment. Please check back later.",
      alertLevel: "low"
    };
  }
};

export const extractMeterReadingFromImage = async (base64Image: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };
  const textPart = {
    text: "This is a photo of a water meter. Please extract the numeric reading shown on the meter display. Return ONLY the number. If the number contains decimals, include them. If you cannot find a clear reading, return 'ERROR'."
  };
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, textPart] },
    });
    const text = response.text?.trim();
    if (text && text !== 'ERROR' && !isNaN(Number(text.replace(/,/g, '')))) {
      return text.replace(/,/g, '');
    }
    return null;
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
};
