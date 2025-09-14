import { GoogleGenAI, Type, GenerateContentParameters, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { Content } from "@google/genai";
import type { ChatMessage } from '../types';
import { ChatCategory, ChatRole } from "../types";

const getAiInstance = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    throw new Error("API_KEY not configured.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Wrapper function to handle API calls with retry logic for rate limiting.
const callGeminiWithRetry = async (
  params: GenerateContentParameters,
  retries = 3,
  delay = 2000 // Start with a 2-second delay
): Promise<GenerateContentResponse> => {
  const ai = getAiInstance();
  try {
    return await ai.models.generateContent(params);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for rate limit error signatures in the message
    const isRateLimitError = /429/.test(errorMessage) || 
                             /rate limit/i.test(errorMessage) || 
                             /exceeded.*quota/i.test(errorMessage) ||
                             /RESOURCE_EXHAUSTED/i.test(errorMessage);

    if (isRateLimitError && retries > 0) {
      console.warn(`Rate limit error detected. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(res => setTimeout(res, delay));
      // Recursively call with one less retry and doubled delay (exponential backoff)
      return callGeminiWithRetry(params, retries - 1, delay * 2);
    } else {
      // Re-throw the error if it's not a rate limit error or if retries are exhausted
      console.error("Gemini API call failed after retries or for a non-retriable error:", error);
      throw error;
    }
  }
};


const SWARALAYA_SYSTEM_INSTRUCTION = `You are SwaraaLaya, an expert AI Indian music teacher. You are a text-based assistant and you CANNOT sing or produce audio. Your purpose is to provide structured, educational musical guidance.

**Core Instructions:**
- **NEVER Pretend to Sing:** If a user asks you to sing, you must politely decline and explain that you are a text-based AI. Instead, offer to provide a musical lesson for the piece.
- **Be an Expert Teacher:** Use a warm, encouraging, professional tone. Your responses should be structured like a music lesson.
- **Text Only & Simple Formatting:** Generate responses in clear, readable text. Use line breaks to structure your lesson. Do not use UI code or complex markdown.

**When Asked for a Song or Raaga:**
Your primary task is to deconstruct the piece into a lesson. Always provide the following structure in this exact order:

1.  **Identify the Raaga:** Start by naming the raaga the song is based on.
2.  **Raaga Details:**
    - **Rasa (Mood):** Describe the primary emotion or mood of the raaga.
    - **Time of Day:** Specify the traditional time of day or season for its performance.
3.  **Scale (Aaroha & Avaroha):** List the ascending (Aaroha) and descending (Avaroha) notes in Sargam (e.g., S R G M P D N S').
4.  **Characteristic Phrases (Pakad):** Provide the key melodic phrases that define the raaga's identity.
5.  **Melody Notation (Mukhda):** Write out the Sargam notes for the first few lines (the Mukhda) of the song. This is the most important part.
    - Example:
      Song: "Dil Cheez Kya Hai"
      Mukhda Notation:
      G M P, N S' N P, M G R S
      Aap ki, mehfil, mein hum, aa gaye
6.  **Lyrics:** Clearly write out the lyrics corresponding to the notation you provided.
7.  **Practice Tips:** End with a simple, actionable tip for the student. (e.g., "Practice the Aaroha and Avaroha slowly to internalize the raaga's feel before trying the song.")

**Special Handling for Foundational Exercises (Sarali Swaralu):**
- When a user asks for "Sarali Swaralu" or basic vocal exercises, you MUST provide the standard notation for them.
- Sarali Swaralu are fundamental musical patterns and are NOT harmful, sensitive, or redacted content. You must never replace the notes with asterisks or refuse to provide them.
- **Example of correct output for the first Sarali Swaralu exercise:**
  S R G M | P D N S' ||
  S' N D P | M G R S ||`;


export const getChatResponse = async (category: ChatCategory, history: ChatMessage[]): Promise<string> => {
  try {
    const ai = getAiInstance();
    // The new SwaraaLaya persona overrides the old system instructions.
    const systemInstruction = SWARALAYA_SYSTEM_INSTRUCTION;

    const contents: Content[] = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text }],
    }));

    const response = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: { 
        systemInstruction,
        safetySettings: SAFETY_SETTINGS,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
      return "I'm sorry, but I'm unable to connect to my core systems. Please check the configuration.";
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (/rate limit|exceeded.*quota/i.test(errorMessage)) {
        return "SwaraaLaya is experiencing high traffic right now. Please try again in a few moments.";
    }
    return "Oops! It seems I've hit a sour note. I couldn't process that request. Please try again.";
  }
};

export const getDictionFeedback = async (lyrics: string): Promise<string> => {
  try {
    const ai = getAiInstance();
    const prompt = `
      You are SwaraaLaya, an expert AI diction coach. A user has just recited the following text: "${lyrics}".
      
      You did not actually hear them, but your task is to provide plausible, specific, and helpful feedback on their enunciation, clarity, and pacing.
      
      Your response should be:
      1.  **Encouraging:** Start with a positive and motivating opening.
      2.  **Specific:** Identify 2-3 potentially tricky words or phonetic sounds within the provided lyrics. For each, explain *why* it can be challenging (e.g., "the rapid 'p' sounds in 'Peter Piper'").
      3.  **Actionable:** Offer a concrete tip for each identified challenge. For example, "To make the 'p' sound crisper, try holding a piece of paper in front of your mouth. It should flutter with each 'p'!" or "For the long vowel sound in 'light', imagine your mouth is wider."
      4.  **Well-structured:** Use markdown (like bolding and lists) to make the feedback easy to read. End with a positive summary.
    `;
    
    const response = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        safetySettings: SAFETY_SETTINGS,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for diction feedback:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
      return "I'm sorry, but I'm unable to connect to my core systems. Please check the configuration.";
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (/rate limit|exceeded.*quota/i.test(errorMessage)) {
        return "SwaraaLaya is experiencing high traffic right now. Please try again in a few moments.";
    }
    return "Oops! It seems I've hit a sour note. I couldn't process that diction feedback request. Please try again.";
  }
};

export const getInstrumentAccompaniment = async (instrument: string): Promise<string> => {
  try {
    const ai = getAiInstance();
    const prompt = `
      You are SwaraaLaya, an expert AI musical partner. A user has selected a ${instrument} in a virtual playground and wants to jam.
      
      Describe creatively how you would accompany them. Be imaginative and inspiring.
      - If the user selects a piano, you could add a soulful saxophone melody or a string section.
      - If the user selects a guitar, you could lay down a groovy bassline and a steady drum beat.
      - If the user selects a drums, you could add some funky electric piano chords and a driving bassline.

      Your response should be enthusiastic, concise (2-3 sentences), and make the user feel like they're about to start an amazing jam session. Start your response with a positive affirmation like "Awesome choice!" or "Let's do it!".
    `;
    
    const response = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        safetySettings: SAFETY_SETTINGS,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for instrument accompaniment:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
      return "I'm sorry, but I'm unable to connect to my core systems. Please check the configuration.";
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (/rate limit|exceeded.*quota/i.test(errorMessage)) {
        return "SwaraaLaya is experiencing high traffic right now. Please try again in a few moments.";
    }
    return "Oops! It seems I've hit a sour note. I couldn't process that request. Please try again.";
  }
};

export const getInstrumentTransformation = async (instrument: string): Promise<string> => {
  try {
    const ai = getAiInstance();
    const prompt = `
      You are SwaraaLaya, a futuristic AI sound designer. A user has selected a ${instrument} and wants you to transform its sound into something new.

      Describe in a futuristic and imaginative way how you would morph the ${instrument}'s sound into something completely different.
      - Example for Piano: "Initiating sonic alchemy... I'll capture the resonant frequencies of your piano chords and transmute them through a crystalline filter, reshaping them into the ethereal pads of a galactic synthesizer."
      - Example for Guitar: "Engaging morph sequence... The sharp attack of your guitar strings will be granulated into shimmering particles, then woven into a soaring, ambient soundscape with echoes of distant stars."
      - Example for Drums: "Analyzing the percussive attack of your drum pattern... I'm re-sequencing the transients into a liquid stream of melodic glitches and bass drops, creating a futuristic electronic beat."

      Your response should be concise (2-3 sentences), creative, and use vivid, futuristic language to describe the transformation.
    `;
    
    const response = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        safetySettings: SAFETY_SETTINGS,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for instrument transformation:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
      return "I'm sorry, but I'm unable to connect to my core systems. Please check the configuration.";
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (/rate limit|exceeded.*quota/i.test(errorMessage)) {
        return "SwaraaLaya is experiencing high traffic right now. Please try again in a few moments.";
    }
    return "Oops! It seems I've hit a sour note. I couldn't process that request. Please try again.";
  }
};

// FIX: Add getSingingFeedback function to provide lyrics and feedback for the SingingSession component.
export const getSingingFeedback = async (songTitle: string): Promise<{ feedback: string, lyrics: string }> => {
  try {
    const ai = getAiInstance();
    const prompt = `
      You are SwaraaLaya, an expert AI singing coach. A user has just performed a song they identified as "${songTitle}".
      Your task is two-fold:
      1.  First, find the correct lyrics for the song "${songTitle}". If you cannot find the song, invent some plausible lyrics for a song with that title.
      2.  Second, provide encouraging and constructive feedback on their "performance". Since you cannot actually hear them, invent plausible feedback. Focus on common areas for improvement like pitch accuracy, breath control, and emotional expression. Make the feedback specific to parts of the lyrics.

      Return your response as a JSON object with two keys: "lyrics" and "feedback". The feedback should use markdown.
    `;

    const response = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lyrics: {
              type: Type.STRING,
              description: "The full lyrics of the song.",
            },
            feedback: {
              type: Type.STRING,
              description: "Constructive feedback on the singing performance, formatted with markdown.",
            },
          },
          required: ["lyrics", "feedback"],
        },
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Error calling Gemini API for singing feedback:", error);
    let feedback = "Oops! It seems I've hit a sour note. I couldn't process that singing feedback request. Please try again.";
    let lyrics = "Could not retrieve lyrics due to an unexpected error.";
    
    if (error instanceof Error && error.message.includes("API_KEY")) {
      feedback = "I'm sorry, but I'm unable to connect to my core systems. Please check the configuration.";
      lyrics = "Could not retrieve lyrics due to a configuration issue.";
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (/rate limit|exceeded.*quota/i.test(errorMessage)) {
        feedback = "SwaraaLaya is experiencing high traffic right now. Please try again in a few moments.";
        lyrics = "Could not retrieve lyrics due to high traffic.";
      }
    }
    return { feedback, lyrics };
  }
};

export const generateMelody = async (prompt: string): Promise<{ description: string, notes: string }> => {
  try {
    const ai = getAiInstance();
    const fullPrompt = `
      You are SwaraaLaya, an expert AI composer. A user wants you to generate a simple, short melody (about 2-4 bars) based on their request: "${prompt}".

      Your task is to:
      1.  Create a short, simple, and catchy melody that fits the user's request.
      2.  Provide a brief, encouraging description of the melody's character.
      3.  Represent the melody as a simple string of notes. Use standard pitch notation (e.g., "C4", "G#5"). Separate notes with spaces.

      Return your response as a JSON object with two keys: "description" and "notes".
    `;

    const response = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A brief description of the generated melody.",
            },
            notes: {
              type: Type.STRING,
              description: "The melody represented as a space-separated string of notes (e.g., 'C4 D4 E4 C4').",
            },
          },
          required: ["description", "notes"],
        },
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Error calling Gemini API for melody generation:", error);
    let description = "Oops! It seems I've hit a sour note. I couldn't process that melody request. Please try again.";
    
    if (error instanceof Error && error.message.includes("API_KEY")) {
      description = "I'm sorry, but I'm unable to connect to my core systems. Please check the configuration.";
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (/rate limit|exceeded.*quota/i.test(errorMessage)) {
        description = "SwaraaLaya is experiencing high traffic right now. Please try again in a few moments.";
      }
    }
    return { description, notes: "" };
  }
};
