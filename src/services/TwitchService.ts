import { TwitchStreamResponse } from "@/store/twitch/types";
import { TwitchToken } from '@/store/oauth/types';

export default class TwitchService {
    public async getStreamStatus(
        token: TwitchToken,
        twitchNames: string[]
    ): Promise<TwitchStreamResponse> {
        const baseUrl = "https://api.twitch.tv";
        const params = `user_login=${twitchNames.join('&user_login=')}`;

        const url = `${baseUrl}/helix/streams?first=100&${params}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Client-ID": "38ac0gifyt5khcuq23h2p8zpcqosbc",
                "Authorization": `Bearer ${token.access_token}`
            },
        });
        const json = await response?.json();
        return (json) ?? {};
    }
}
