import { API_URL } from "@/main";
import { ChatUser } from "@/store/chat/types";

export default class ChatService {
  public async retrieveChatUser(
    battleTag: string,
    bearer: string
  ): Promise<ChatUser> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(
      battleTag
    )}/api-key?authentication=${bearer}`;

    const response = await fetch(url);
    return (await response?.json()) ?? {};
  }

  public async createApiKey(
    battleTag: string,
    bearer: string
  ): Promise<ChatUser> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(
      battleTag
    )}/api-key?authentication=${bearer}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return (await response?.json()) ?? {};
  }
}
