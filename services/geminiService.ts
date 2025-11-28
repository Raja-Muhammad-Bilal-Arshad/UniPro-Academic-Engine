import { GoogleGenAI, Chat } from '@google/genai';
import { UNIPRO_SYSTEM_INSTRUCTION } from '../constants';
import { FileAttachment } from '../types';

let client: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const getClient = (): GoogleGenAI => {
  if (!client) {
    if (!process.env.API_KEY) {
      throw new Error("API Key not found in environment variables");
    }
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const initializeChat = async () => {
  const ai = getClient();
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: UNIPRO_SYSTEM_INSTRUCTION,
      temperature: 0.7, // Balance creativity and rigor
    },
  });
  return chatSession;
};

export const sendMessageStream = async (
  message: string, 
  attachment: FileAttachment | null,
  onChunk: (text: string) => void
) => {
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) throw new Error("Failed to initialize chat session");

  const parts: any[] = [];

  // Add text part if message exists
  if (message) {
    parts.push({ text: message });
  }

  // Add attachment part if exists
  if (attachment) {
    // Gemini 2.5 Flash supports images/PDFs directly
    // Need to strip the prefix "data:image/png;base64,"
    const base64Data = attachment.data.split(',')[1];
    parts.push({
      inlineData: {
        mimeType: attachment.type,
        data: base64Data,
      },
    });
  }

  // Ensure there is at least something to send
  if (parts.length === 0) {
      throw new Error("Cannot send empty message");
  }

  try {
    // If we only have one text part, send it as a string for simplicity, 
    // otherwise send the array of parts (Content).
    const contentToSend = (parts.length === 1 && parts[0].text) 
        ? parts[0].text 
        : parts;

    const resultStream = await chatSession.sendMessageStream({ 
      message: contentToSend 
    });
    
    let fullText = "";

    for await (const chunk of resultStream) {
      const text = chunk.text; // Access .text property directly
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};