<template>
  <div>
    <v-card-title class="pt-3">
      Manage Permissions
    </v-card-title>
    <v-container class="w3-container-width">
      <v-data-table
        :headers="headers"
        :items-per-page="-1"
        :items="permissions"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
      >
        <template v-slot:top>
          <div class="d-flex align-center px-4">
            <v-spacer />
            <v-dialog v-model="dialog" max-width="500px">
              <template v-slot:activator="{ props }">
                <v-btn
                  class="mb-2 bg-primary text-w3-race-bg"
                  v-bind="props"
                >
                  Add Admin
                </v-btn>
              </template>

              <v-card>
                <v-card-title>
                  {{ formTitle }}
                </v-card-title>

                <v-card-text>
                  <v-container>
                    <v-row class="w-100">
                      <player-search
                        v-if="isAddDialog"
                        class="w-100 ml-5"
                        @playerFound="playerFound"
                      />
                      <v-text-field
                        v-else
                        v-model="editedItem.battleTag"
                        label="BattleTag"
                        class="mx-5"
                        variant="underlined"
                        color="primary"
                      />
                    </v-row>
                    <v-row>
                      <v-col cols="12" sm="12" md="12" class="px-5 pb-0">
                        <v-text-field
                          v-model="editedItem.description"
                          :label="'Description'"
                          variant="underlined"
                          color="primary"
                        />
                      </v-col>
                      <v-col class="px-5 py-0">
                        <b>Permissions</b>
                        <v-checkbox
                          v-for="permission in availablePermissions"
                          :key="permission.value"
                          v-model="editedItem.permissions"
                          :multiple="true"
                          :label="permission.name"
                          :value="permission.value"
                          hide-details
                        />
                      </v-col>
                    </v-row>
                    <v-alert v-model="isValidationError" type="warning" density="compact" class="ml-4 mr-4">
                      {{ validationError }}
                    </v-alert>
                    <v-row>
                      <v-col>
                        <v-btn
                          class="bg-primary text-w3-race-bg"
                          @click="save"
                        >
                          {{ $t(`views_admin.ok`) }}
                        </v-btn>
                      </v-col>
                      <v-col class="text-right">
                        <v-btn
                          class="bg-primary text-w3-race-bg"
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
          </div>
        </template>
        <template v-slot:[`item.permissionName`]="{ item }">
          <td>
            <div v-for="id in item.permissions" :key="id">{{ getPermissionName(id) }}</div>
          </td>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon size="small" class="mr-2" @click="openEditDialog(item)">{{ mdiPencil }}</v-icon>
          <v-icon size="small" @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, nextTick, ref, watch } from "vue";
import { IPermission, EPermission } from "@/store/admin/permission/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useOauthStore } from "@/store/oauth/store";
import { usePermissionStore } from "@/store/admin/permission/store";
import { mdiDelete, mdiPencil } from "@mdi/js";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import { DataTableHeader } from "vuetify";

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

    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);
    const permissions = computed<IPermission[]>(() => permissionStore.permissions);
    const author = computed<string>(() => oauthStore.blizzardVerifiedBtag);
    const isAddDialog = computed<boolean>(() => editedIndex.value === -1);
    const formTitle = computed<string>(() => isAddDialog.value ? "New Admin" : "Edit Admin");
    const isValidationError = computed<boolean>(() => permissionStore.validationError !== "");

    const validationError = computed<string>({
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
      { name: EPermission[EPermission.SmurfCheckerQuery], value: EPermission.SmurfCheckerQuery },
      { name: EPermission[EPermission.SmurfCheckerQueryExplanation], value: EPermission.SmurfCheckerQueryExplanation },
      { name: EPermission[EPermission.SmurfCheckerAdministration], value: EPermission.SmurfCheckerAdministration },
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

    const headers: DataTableHeader[] = [
      { title: "BattleTag", sortable: true, value: "battleTag" },
      { title: "Description", sortable: true, value: "description", width: "12vw" },
      { title: "Permissions", sortable: true, value: "permissionName" },
      { title: "Author", sortable: true, value: "author" },
      { title: "Actions", sortable: false, value: "actions" },
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
