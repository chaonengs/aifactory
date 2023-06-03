import { OpenAIModel } from './openai';

export interface Message {
  role: Role;
  content: string;
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  model: OpenAIModel;
  messages: [];
  key: string;
  prompt: string;
  temperature: number;
}

export interface VectorIndexBody {
  context: string;
  vector: string | null;
  query: string;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  model: OpenAIModel;
  prompt: string;
  temperature: number;
  folderId: string | null;
  resumeFileName: string | null;
  resumeFileTitle: string | null;
}
