import { IPermission } from "@/store/admin/permission/types";
import { API_URL } from "@/main";

export interface IPermissionsResponse {
  permissions: IPermission[];
}

export default class TournamentsService {
  public static async getPermissions(token: string): Promise<IPermission[]> {
    const url = `${API_URL}api/admin/permissions?authorization=${token}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status == 404) {
      return [];
    }

    return await response?.json();
  }

  public static async addAdmin(token: string, permission: IPermission): Promise<string> {
    const url = `${API_URL}api/admin/permissions/add?authorization=${token}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(permission),
    });

    return response.ok ? "" : await response.json();
  }

  public static async editPermission(token: string, permission: IPermission): Promise<string> {
    const url = `${API_URL}api/admin/permissions/edit?authorization=${token}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(permission),
    });

    return response.ok ? "" : await response.json();
  }

  public static async deleteAdmin(token: string, id: string): Promise<string> {
    console.log("token");
    console.log(token);
    const encodedBattleTag = encodeURIComponent(id);
    const url = `${API_URL}api/admin/permissions/delete?id=${encodedBattleTag}&authorization=${token}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      }
    });

    return response.ok ? "" : await response.json();
  }
}
