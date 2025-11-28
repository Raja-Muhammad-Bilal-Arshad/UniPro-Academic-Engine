
export enum ModuleType {
  ASSIGNMENT = 'ASSIGNMENT',
  PROJECT = 'PROJECT',
  THESIS = 'THESIS',
  UTILITIES = 'UTILITIES',
  ORGANIZER = 'ORGANIZER',
  MARKDOWN = 'MARKDOWN',
}

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isLoading?: boolean;
  // Parsed content for the model response
  parsedContent?: {
    theory?: string;
    code?: string;
    codeLanguage?: string;
    output?: string;
    // Utility Module Fields
    metrics?: string;
    refinedText?: string;
    changelog?: string;
    // Organizer Module Fields
    latex?: string;
    conversionNotes?: string;
    docStructure?: string;
    // Markdown Module Fields
    markdown?: string;
  };
}

export interface FileAttachment {
  name: string;
  type: string;
  data: string; // Base64
}

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentStreamText: string;
}
