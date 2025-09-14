export enum ChatRole {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessagePart {
  text: string;
}

export interface ChatMessage {
  role: ChatRole;
  parts: ChatMessagePart[];
}

export enum ChatCategory {
    VOCALS = 'Vocals',
    INSTRUMENTS = 'Instruments',
}