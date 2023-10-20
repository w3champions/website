import { API_URL } from "@/main";

export default class ServerLogsService {
  public static async fetchLogfileNames(token: string): Promise<string[]> {
    const url = `${API_URL}api/admin/logs?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const logfileNames = response.ok ? await response.json() : [];
    return logfileNames;
  }

  public static async fetchLogContent(token: string, logfileName: string): Promise<string[]> {
    const url = `${API_URL}api/admin/logs/${logfileName}?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const lines = response.ok ? await response.json() : [];
    return lines;
  }

  public static downloadLogfile(token: string, logfileName: string): void {
    const url = `${API_URL}api/admin/logs/download/${logfileName}?authorization=${token}`;
    window.open(url);
  }
}
