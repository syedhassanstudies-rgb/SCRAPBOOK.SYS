import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function findMoviePoster(title: string, year?: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search the web for a clean, direct image URL of the official movie poster for "${title}" ${year ? `(${year})` : ''}. 
      Reply with ONLY the raw image URL (e.g. starting with https://). No markdown, no introductory text. If you cannot find one, reply with "null"`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0,
      }
    });

    let text = response.text ? response.text.trim() : null;
    
    // Extract URL if it's formatted as markdown or has other text
    if (text) {
      const urlMatch = text.match(/(https?:\/\/[^\s"'()]+)/);
      if (urlMatch) {
         text = urlMatch[1];
      }
    }
    
    if (text && text.startsWith('http')) {
      return text;
    }
    return null;
  } catch (error) {
    console.error("Error finding movie poster:", error);
    return null;
  }
}
