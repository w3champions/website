export interface ChatState {
  editChatMessage: string;
  apiKey: string;
  canNotSend: boolean;
  isLoggedIn: boolean;
  messages: ChatMessage[]
  currentUser: ChatUser
  otherUsers: ChatUser[]
}

export interface ChatMessage {
  user: string;
  name: string;
  message: string;
  index: number;
}

export interface  ChatUser {
  battleTag: string;
  name: string;
  apiKey?: string;
}
