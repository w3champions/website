<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items-per-page="-1"
      :items="globallyMutedPlayers"
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
                {{ $t(`views_admin.mutePlayer`) }}
              </v-btn>
            </template>

            <v-card>
              <v-card-title>
                {{ $t(`views_admin.mutePlayer`) }}
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <player-search
                      @searchCleared="searchCleared"
                      @playerFound="playerFound"
                      classes="ml-5 mr-5"
                    ></player-search>
                  </v-row>
                  <v-row v-if="showConfirmation" class="ma-2">
                    <v-menu
                      v-model="dateMenu"
                      :close-on-content-click="false"
                      min-width="290px"
                    >
                      <template #activator="{ on, attrs }">
                        <v-text-field
                          v-model="banExpiry"
                          readonly
                          :label="$t(`views_admin.banenddate`)"
                          v-bind="attrs"
                          v-on="on"
                        />
                      </template>
                      <v-date-picker v-model="banExpiry" no-title scrollable max="2099-01-01">
                        <v-spacer />
                        <v-btn
                          text
                          @click="
                            banExpiry = '';
                            dateMenu = false;
                          "
                        >
                          {{ $t(`views_admin.cancel`) }}
                        </v-btn>
                        <v-btn
                          color="primary"
                          class="w3-race-bg--text"
                          @click="dateMenu = false"
                        >
                          {{ $t(`views_admin.ok`) }}
                        </v-btn>
                      </v-date-picker>
                    </v-menu>

                    <v-card-text>
                      Are you sure you want to mute this player?
                    </v-card-text>
                    <v-card-title>
                      {{ player }}
                      <v-spacer></v-spacer>
                    </v-card-title>
                  </v-row>

                  <v-row>
                    <v-col>
                      <v-btn
                        v-if="showConfirmation && banDateSet"
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

      <template #[`item.actions`]="{ item }">
        <v-icon small @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { GloballyMutedPlayer, GlobalMute } from "@/store/admin/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useAdminStore } from "@/store/admin/store";
import { mdiDelete } from "@mdi/js";

@Component({ components: { PlayerSearch } })
export default class AdminGlobalMute extends Vue {
  public mdiDelete = mdiDelete;
  private adminStore = useAdminStore();
  public headers = [
    {
      text: "Flo Ban Id",
      align: "start",
      sortable: true,
      value: "id",
    },
    {
      text: "BattleTag",
      align: "start",
      sortable: true,
      value: "battleTag",
    },
    {
      text: "Ban Expiry Date",
      sortable: true,
      value: "expiresAt",
    },
    {
      text: "Actions",
      sortable: false,
      value: "actions",
    },
  ];

  get globallyMutedPlayers(): GloballyMutedPlayer[] {
    return this.adminStore.globallyMutedPlayers;
  }

  async deleteItem(item: GloballyMutedPlayer): Promise<void> {
    confirm("Are you sure you want to delete this item?") &&
    await this.adminStore.deleteGlobalMute(item);
    this.loadMutes();
  }

  get banDateSet(): boolean {
    return this.banExpiry != "";
  }

  public banExpiry = "";
  public dateMenu = false;
  public dialog = false;
  public showConfirmation = false;
  public player = "";

  public close(): void {
    this.dialog = false;
    this.showConfirmation = false;
  }

  public async save(): Promise<void> {
    this.close();

    const mute = {
      battleTag: this.player,
      expiresAt: this.banExpiry,
    } as GlobalMute;

    await this.adminStore.addGlobalMute(mute);
    this.loadMutes();
  }

  public async loadMutes(): Promise<void> {
    await this.adminStore.loadGlobalMutes();
  }

  async mounted(): Promise<void> {
    await this.init();
  }

  public async init(): Promise<void> {
    await this.loadMutes();
  }

  searchCleared(): void {
    this.showConfirmation = false;
    this.banExpiry = "";
  }

  playerFound(bTag: string): void {
    this.showConfirmation = true;
    this.player = bTag;
  }
}
</script>

<style lang="scss"></style>
