import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function searchMovieDetails(query: string): Promise<{ title: string; year: string; rating: string; posterUrl: string | null } | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search the web for details about the movie "${query}". We need the movie's title, release year, a short rating (e.g., "PG-13", "R", or an IMDB score like "8.5/10"), and a direct image URL of the official movie poster.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.STRING },
            rating: { type: Type.STRING },
            posterUrl: { type: Type.STRING, nullable: true },
          },
          required: ["title", "year", "rating"],
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error: any) {
    console.error("Error searching movie details:", error);
    if (error?.status === 429 || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota') || error?.message?.includes('429')) {
      throw new Error("AI Quota Exceeded. Please enter details manually or try again later.");
    }
    throw new Error("Failed to search for movie details.");
  }
}

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
  } catch (error: any) {
    if (error?.status === 429 || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota') || error?.message?.includes('429')) {
      console.warn("AI Quota Exceeded (findMoviePoster). Defaulting to placeholder.");
      return null;
    }
    console.error("Error finding movie poster:", error);
    return null;
  }
}
