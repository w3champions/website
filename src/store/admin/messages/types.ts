export interface AdminInfoMessageState {
  messageOfTheDay: MessageOfTheDay;
  news: NewsMessage[];
  tips: LoadingScreenTip[];
}

export interface MessageOfTheDay {
  motd: string;
}

export interface NewsMessage {
  message: string;
  date: string;
  bsonId: string;
}

export interface LoadingScreenTip {
  message: string;
  author: string;
  creationDate: string;
  bsonId: string;
}
