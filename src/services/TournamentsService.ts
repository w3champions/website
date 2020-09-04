import { ITournament } from './../store/tournaments/types';
import { API_URL } from "@/main";

export interface ITournamentsResponse{
  tournaments: ITournament[]
}

export default class AdminService {
  public async getTournaments(): Promise<ITournamentsResponse> {
    const url = `${API_URL}api/tournaments`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status == 404) {
        return {tournaments: []};
    }

    return await response?.json();
  }

  public async updateTournament(
    tournament: ITournament,
    token: string
  ): Promise<boolean> {
    const url = `${API_URL}api/tournaments/${tournament.id}?authorization=${token}`;

    const data = JSON.stringify(tournament);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: data,
    });

    return response?.json();
  }
}
