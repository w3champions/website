import pickBy from "lodash/pickBy";
import isUndefined from "lodash/isUndefined";
import { ITournament, ITournamentFloNode, ITournamentPlayer } from "@/store/tournaments/types";
import { API_URL } from "@/main";
import { authorizedFetch } from "@/helpers/general";

export interface ITournamentsResponse {
  tournaments: ITournament[];
}

export interface ITournamentResponse {
  tournament: ITournament;
}

export default class TournamentsService {
  public static async getTournaments(): Promise<ITournamentsResponse> {
    const url = `${API_URL}api/tournaments`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status == 404) {
      return { tournaments: [] };
    }

    const data = await response?.json();

    data.tournaments.forEach((tournament: ITournament) => {
      tournament.startDateTime = new Date(tournament.startDateTime);
    });

    return data;
  }

  public static async getUpcomingTournament(): Promise<ITournamentResponse> {
    const url = `${API_URL}api/tournaments/upcoming`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status == 404) {
      return { tournament: {} as ITournament };
    }

    const data = await response?.json();

    if (!data.tournament) {
      return { tournament: {} as ITournament };
    }

    data.tournament.startDateTime = new Date(data.tournament.startDateTime);

    return data;
  }

  public static async registerPlayer(tournamentId: string, player: ITournamentPlayer, token: string): Promise<boolean> {
    const url = `${API_URL}api/tournaments/${tournamentId}/players`;
    const response = await authorizedFetch("POST", url, token, JSON.stringify(player));

    const responseBody: ITournamentResponse = await response?.json();

    return !!responseBody.tournament;
  }

  public static async unregisterPlayer(tournamentId: string, battleTag: string, token: string): Promise<boolean> {
    const url = `${API_URL}api/tournaments/${tournamentId}/players`;
    const response = await authorizedFetch("DELETE", url, token, JSON.stringify({ battleTag }));

    const responseBody: ITournamentResponse = await response?.json();

    return !!responseBody.tournament;
  }

  public static async createTournament(tournament: ITournament, token: string): Promise<boolean> {
    const url = `${API_URL}api/tournaments`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = tournament;

    const response = await authorizedFetch("POST", url, token, JSON.stringify(data));

    const responseBody: ITournamentResponse = await response?.json();

    return !!responseBody.tournament;
  }

  public static async updateTournament(tournament: ITournament, token: string): Promise<boolean> {
    const id = tournament.id;
    const url = `${API_URL}api/tournaments/${id}`;

    const fieldNames = [
      "name", "startDateTime", "gateway", "mode", "format", "mapPool", "state",
      "registrationTimeMinutes", "readyTimeSeconds", "vetoTimeSeconds",
      "showWinnerTimeHours", "matcherinoUrl",
    ];
    const body = pickBy(
      tournament,
      (value, key) => fieldNames.includes(key) && !isUndefined(value)
    );
    body.registrationTimeMinutes = +body.registrationTimeMinutes!;
    body.readyTimeSeconds = +body.readyTimeSeconds!;
    body.vetoTimeSeconds = +body.vetoTimeSeconds!;
    body.showWinnerTimeHours = +body.showWinnerTimeHours!;

    const response = await authorizedFetch("PATCH", url, token, JSON.stringify(body));

    const responseBody: ITournamentResponse = await response?.json();

    return !!responseBody.tournament;
  }

  public static async getEnabledFloNodes(): Promise<ITournamentFloNode[]> {
    const url = `${API_URL}api/tournaments/flo-nodes`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = await response?.json();

    return data;
  }
}
