import { API_URL } from "@/main";
import { authorizedFetch, authDownload } from "@/helpers/general";

export default class ServerLogsService {
  public static async fetchLogfileNames(token: string): Promise<string[]> {
    const url = `${API_URL}api/admin/logs?authorization=${token}`;

    const response = await authorizedFetch("GET", url, token);

    return  response.ok ? await response.json() : [];
  }

  public static async fetchLogContent(token: string, logfileName: string): Promise<string[]> {
    const url = `${API_URL}api/admin/logs/${logfileName}?authorization=${token}`;

    const response = await authorizedFetch("GET", url, token);

    return response.ok ? await response.json() : [];
  }

  public static downloadLogfile(token: string, logfileName: string): void {
    const url = `${API_URL}api/admin/logs/download/${logfileName}?authorization=${token}`;
    authDownload(url, token, logfileName);
  }
}
