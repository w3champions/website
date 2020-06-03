export type TwitchState = {
  twitchStreamResponse: TwitchStreamResponse;
};

export type TwitchStreamResponse = {
  data: TwitchStreamStatus[];
};

export type TwitchStreamStatus = {
  id: string;
  user_id?: string;
  user_name: string;
  game_id: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
};
