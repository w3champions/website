import { TwitchState, TwitchStreamResponse } from "./types";
import { defineStore } from "pinia";
import AuthorizationService from "@/services/AuthorizationService";
import TwitchService from "@/services/TwitchService";

export const useTwitchStore = defineStore("twitch", {
  state: (): TwitchState => ({
    twitchStreamResponse: {} as TwitchStreamResponse,
  }),
  actions: {
    async getStreamStatus(
      twitchNames: Array<string | null | undefined>,
    ) {
      const token = await AuthorizationService.authorizeWithTwitch();

      const sanitizedTwitchNames = twitchNames
        .map((name) => (name ? name.replace("https://twitch.tv/", "") : ""))
        .filter((name) => !!name && encodeURIComponent(name) === name);

      const response = await TwitchService.getStreamStatus(
        token,
        sanitizedTwitchNames,
      );

      this.SET_TWITCH_STREAM_RESPONSE(response);
    },
    SET_TWITCH_STREAM_RESPONSE(response: TwitchStreamResponse) {
      this.twitchStreamResponse = response;
    },
  },
});
