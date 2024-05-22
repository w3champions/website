<template>
  <div>
    <v-card-title>
      Manage Permissions
    </v-card-title>
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
                  <span class="text-h5">{{ formTitle }}</span>
                </v-card-title>

                <v-card-text>
                  <v-container>
                    <v-row>
                      <player-search
                        v-if="isAddDialog"
                        @playerFound="playerFound"
                        class="mx-5"
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
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, nextTick, ref, watch, WritableComputedRef } from "vue";
import { IPermission, EPermission } from "@/store/admin/permission/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useOauthStore } from "@/store/oauth/store";
import { usePermissionStore } from "@/store/admin/permission/store";
import { mdiDelete, mdiPencil } from "@mdi/js";
import { usePlayerSearchStore } from "@/store/playerSearch/store";

export default defineComponent({
  name: "AdminPermissions",
  components: {
    PlayerSearch,
  },
  setup() {
    const oauthStore = useOauthStore();
    const permissionStore = usePermissionStore();
    const playerSearchStore = usePlayerSearchStore();
    const dialog = ref<boolean>(false);
    const editedIndex = ref<number>(-1);
    const battleTag = ref<string>("");
    const editedItem = ref<IPermission>({} as IPermission);

    const isAdmin: ComputedRef<boolean> = computed((): boolean => oauthStore.isAdmin);
    const permissions: ComputedRef<IPermission[]> = computed((): IPermission[] => permissionStore.permissions);
    const author: ComputedRef<string> = computed((): string => oauthStore.blizzardVerifiedBtag);
    const isAddDialog: ComputedRef<boolean> = computed((): boolean => editedIndex.value === -1);
    const formTitle: ComputedRef<string> = computed((): string => isAddDialog.value ? "New Admin" : "Edit Admin");
    const isValidationError: ComputedRef<boolean> = computed((): boolean => permissionStore.validationError !== "");

    const validationError: WritableComputedRef<string> = computed({
      get(): string {
        return permissionStore.validationError;
      },
      set(error: string): void {
        permissionStore.validationError = error;
      },
    });

    const availablePermissions = [
      { name: EPermission[EPermission.Permissions], value: EPermission.Permissions },
      { name: EPermission[EPermission.Moderation], value: EPermission.Moderation },
      { name: EPermission[EPermission.Queue], value: EPermission.Queue },
      { name: EPermission[EPermission.Logs], value: EPermission.Logs },
      { name: EPermission[EPermission.Maps], value: EPermission.Maps },
      { name: EPermission[EPermission.Tournaments], value: EPermission.Tournaments },
      { name: EPermission[EPermission.Content], value: EPermission.Content },
      { name: EPermission[EPermission.Proxies], value: EPermission.Proxies },
    ];

    const defaultItem: IPermission = {
      id: "",
      battleTag: "",
      description: "",
      permissions: [] as EPermission[],
      author: "",
    };

    function openEditDialog(item: IPermission): void {
      editedIndex.value = permissions.value.indexOf(item);
      editedItem.value = Object.assign({}, item);
      dialog.value = true;
    }

    async function deleteItem(item: IPermission): Promise<void> {
      confirm("Are you sure you want to delete this item?") &&
      await permissionStore.deleteAdmin(item.id);
      await loadPermissions();
    }

    function close(): void {
      dialog.value = false;
    }


    async function save(): Promise<void> {
      editedItem.value.author = author.value;
      if (isAddDialog.value) {
        editedItem.value.battleTag = battleTag.value;
        await permissionStore.addAdmin(editedItem.value);
      } else {
        await permissionStore.editPermission(editedItem.value);
      }

      if (!isValidationError.value) {
        close();
        await loadPermissions();
      }
    }

    async function loadPermissions(): Promise<void> {
      await permissionStore.loadPermissions();
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await loadPermissions();
      editedItem.value = Object.assign({}, defaultItem);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    function resetDialog(): void {
      nextTick(() => {
        editedItem.value = Object.assign({}, defaultItem);
        editedIndex.value = -1;
      });
      playerSearchStore.clearPlayerSearch();
      validationError.value = "";
    }

    watch(dialog, onDialogToggled);
    function onDialogToggled(): void {
      // Only trigger on dialog close, not dialog open
      if (!dialog.value) {
        resetDialog();
      }
    }

    function playerFound(bTag: string): void {
      battleTag.value = bTag;
    }

    function getPermissionName(id: EPermission) {
      return EPermission[id];
    }

    const headers = [
      { text: "BattleTag", sortable: true, value: "battleTag" },
      { text: "Description", sortable: true, filterable: false, value: "description", width: "12vw" },
      { text: "Permissions", sortable: true, filterable: false, value: "permissionName" },
      { text: "Author", sortable: true, filterable: false, value: "author" },
      { text: "Actions", sortable: false, value: "actions" },
    ];

    return {
      mdiDelete,
      mdiPencil,
      headers,
      permissions,
      dialog,
      formTitle,
      isAddDialog,
      playerFound,
      editedItem,
      availablePermissions,
      isValidationError,
      validationError,
      save,
      close,
      getPermissionName,
      openEditDialog,
      deleteItem,
    };
  },
});
</script>
