import { IPermission, PermissionState } from "@/store/admin/permission/types";
import PermissionService from "@/services/admin/PermissionService";
import { useOauthStore } from "@/store/oauth/store";
import { defineStore } from "pinia";

export const usePermissionStore = defineStore("permission", {
  state: (): PermissionState => ({
    permissions: [] as IPermission[],
    validationError: "",
  }),
  actions: {
    async loadPermissions(): Promise<void> {
      const oauthStore = useOauthStore();
      const res = await PermissionService.getPermissions(oauthStore.token);
      this.SET_PERMISSIONS(res);
    },
    async addAdmin(permission: IPermission): Promise<void> {
      const oauthStore = useOauthStore();
      const response = await PermissionService.addAdmin(oauthStore.token, permission);
      this.SET_VALIDATION_ERROR(response);
    },
    async deleteAdmin(id: string): Promise<void> {
      const oauthStore = useOauthStore();
      const response = await PermissionService.deleteAdmin(oauthStore.token, id);
      this.SET_VALIDATION_ERROR(response);
    },
    async editPermission(permission: IPermission): Promise<void> {
      const oauthStore = useOauthStore();
      const response = await PermissionService.editPermission(oauthStore.token, permission);
      this.SET_VALIDATION_ERROR(response);
    },
    SET_PERMISSIONS(permissions: IPermission[]): void {
      this.permissions = permissions;
    },
    SET_VALIDATION_ERROR(error: string): void {
      this.validationError = error;
    },
  },
});
