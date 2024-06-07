import { IPermission } from "@/store/admin/permission/types";
import { API_URL } from "@/main";
import { authorizedFetch } from "@/helpers/general";

export interface IPermissionsResponse {
  permissions: IPermission[];
}

export default class PermissionService {
  public static async getPermissions(token: string): Promise<IPermission[]> {
    const url = `${API_URL}api/admin/permissions`;
    const response = await authorizedFetch("GET", url, token);

    return response.ok ? await response.json() : [];
  }

  public static async addAdmin(token: string, permission: IPermission): Promise<string> {
    const url = `${API_URL}api/admin/permissions/add`;
    const response = await authorizedFetch("POST", url, token, JSON.stringify(permission));
    return response.ok ? "" : await response.json();
  }

  public static async editPermission(token: string, permission: IPermission): Promise<string> {
    const url = `${API_URL}api/admin/permissions/edit`;

    const response = await authorizedFetch("PUT", url, token, JSON.stringify(permission));

    return response.ok ? "" : await response.json();
  }

  public static async deleteAdmin(token: string, id: string): Promise<string> {
    const encodedBattleTag = encodeURIComponent(id);
    const url = `${API_URL}api/admin/permissions/delete?id=${encodedBattleTag}`;

    const response = await authorizedFetch("DELETE", url, token);

    return response.ok ? "" : await response.json();
  }
}
