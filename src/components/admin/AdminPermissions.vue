<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items-per-page="-1"
      :items="permissions"
    >
      <template v-slot:top>
        <v-toolbar flat color="transparent">
          <v-spacer></v-spacer>
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="primary"
                class="mb-2 w3-race-bg--text"
                v-bind="attrs"
                v-on="on"
              >
                Add Admin
              </v-btn>
            </template>

            <v-card>
              <v-card-title>
                <span class="text-h5">{{ formTitle() }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <player-search
                      v-if="isAddDialog"
                      @playerFound="playerFound"
                      class="mx-5"
                      :clearSearchFromParent="clearPlayerSearchToggle"
                    ></player-search>
                    <v-text-field
                      v-else
                      v-model="editedItem.battleTag"
                      label="BattleTag"
                      class="mx-5"
                    ></v-text-field>
                  </v-row>
                  <v-row>
                    <v-col cols="12" sm="12" md="12" class="px-5 pb-0">
                      <v-text-field
                        v-model="editedItem.description"
                        :label="'Description'"
                      ></v-text-field>
                    </v-col>
                    <v-col class="py-0">
                      <template>
                        <v-col>
                          <b>Permissions</b>
                          <v-checkbox
                            v-for="permission in availablePermissions" :key="permission.value"
                            :multiple="true"
                            v-model="editedItem.permissions"
                            :label="permission.name"
                            :value="permission.value"
                            :dense=true
                          ></v-checkbox>
                        </v-col>
                      </template>
                    </v-col>
                  </v-row>
                  <v-alert v-model="isValidationError" type="warning" dense class="ml-4 mr-4">
                    {{ validationError }}
                  </v-alert>
                  <v-row>
                    <v-col>
                      <v-btn
                        color="primary"
                        class="w3-race-bg--text"
                        @click="save"
                      >
                        {{ $t(`views_admin.ok`) }}
                      </v-btn>
                    </v-col>
                    <v-col class="text-right">
                      <v-btn
                        color="primary"
                        class="w3-race-bg--text"
                        @click="close"
                      >
                        {{ $t(`views_admin.cancel`) }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template #[`item.permissionName`]="{ item }">
      <td>
        <div v-for="id in item.permissions" :key="id">{{ getPermissionName(id) }}</div>
      </td>
    </template>
      <template #[`item.actions`]="{ item }">
        <v-icon small class="mr-2" @click="openEditDialog(item)">{{ mdiPencil }}</v-icon>
        <v-icon small @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { IPermission, EPermission } from "@/store/admin/permission/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useOauthStore } from "@/store/oauth/store";
import { usePermissionStore } from "@/store/admin/permission/store";
import { mdiDelete, mdiPencil } from "@mdi/js";

@Component({ components: { PlayerSearch } })
export default class AdminPermissions extends Vue {
  public dialog = false;
  public editedIndex = -1;
  public battleTag = "";
  public description = "";
  public roles = [] as EPermission[];
  public mdiDelete = mdiDelete;
  public mdiPencil = mdiPencil;
  private oauthStore = useOauthStore();
  private permissionStore = usePermissionStore();
  public clearPlayerSearchToggle = false;

  public availablePermissions = [
    { name: EPermission[EPermission.Permissions], value: EPermission.Permissions },
    { name: EPermission[EPermission.Moderation], value: EPermission.Moderation },
    { name: EPermission[EPermission.Queue], value: EPermission.Queue },
    { name: EPermission[EPermission.Logs], value: EPermission.Logs },
    { name: EPermission[EPermission.Maps], value: EPermission.Maps },
    { name: EPermission[EPermission.Tournaments], value: EPermission.Tournaments },
    { name: EPermission[EPermission.Content], value: EPermission.Content },
    { name: EPermission[EPermission.Proxies], value: EPermission.Proxies },
  ];

  public headers = [
    { text: "BattleTag", align: "start", sortable: true, value: "battleTag" },
    { text: "Description", sortable: true, filterable: false, value: "description" },
    { text: "Permissions", sortable: true, filterable: false, value: "permissionName" },
    { text: "Author", sortable: true, filterable: false, value: "author" },
    { text: "Actions", sortable: false, value: "actions" },
  ];

  public editedItem = {
    id: "",
    battleTag: "",
    description: "",
    permissions: [] as EPermission[],
    author: "",
  };

  public defaultItem = {
    id: "",
    battleTag: "",
    description: "",
    permissions: [] as EPermission[],
    author: "",
  };

  get permissions(): IPermission[] {
    return this.permissionStore.permissions;
  }

  async addAdmin(item: IPermission): Promise<void> {
    await this.permissionStore.addAdmin(item);
  }

  get validationError(): string {
    return this.permissionStore.validationError;
  }

  set validationError(error: string) {
    this.permissionStore.validationError = error;
  }

  openEditDialog(item: IPermission): void {
    this.editedIndex = this.permissions.indexOf(item);
    this.editedItem = Object.assign({}, item);
    this.dialog = true;
  }

  async deleteItem(item: IPermission): Promise<void> {
    confirm("Are you sure you want to delete this item?") &&
    await this.permissionStore.deleteAdmin(item.id);
    await this.loadPermissions();
  }

  public close(): void {
    this.dialog = false;
  }

  clearPlayerSearch() {
    this.clearPlayerSearchToggle = !this.clearPlayerSearchToggle;
  }

  get isValidationError(): boolean {
    return this.permissionStore.validationError !== "";
  }

  async save(): Promise<void> {
    this.editedItem.author = this.author;
    if (this.isAddDialog) {
      this.editedItem.battleTag = this.battleTag;
      await this.permissionStore.addAdmin(this.editedItem);
    } else {
      await this.permissionStore.editPermission(this.editedItem);
    }

    if (!this.isValidationError) {
      this.close();
      await this.loadPermissions();
    }
  }

  public async loadPermissions(): Promise<void> {
    await this.permissionStore.loadPermissions();
  }

  async mounted(): Promise<void> {
    await this.init();
  }

  public async init(): Promise<void> {
    await this.loadPermissions();
  }

  get author() {
    return this.oauthStore.blizzardVerifiedBtag;
  }

  get isAddDialog() {
    return this.editedIndex === -1;
  }

  resetDialog(): void {
    this.$nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    });
    this.clearPlayerSearch();
    this.validationError = "";
  }

  @Watch("dialog")
  onDialogToggled(): void {
    // Only trigger on dialog close, not dialog open
    if (!this.dialog) {
      this.resetDialog();
    }
  }

  playerFound(bTag: string): void {
    this.battleTag = bTag;
  }

  getPermissionName(id: EPermission) {
    return EPermission[id];
  }

  formTitle(): string {
    return this.isAddDialog ? "New Admin" : "Edit Admin";
  }
}
</script>

<style lang="scss"></style>
