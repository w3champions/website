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
                    <v-autocomplete
                      class="ml-5 mr-5"
                      v-model="searchPlayerModel"
                      append-icon="mdi-magnify"
                      label="Search BattleNet Tag"
                      clearable
                      placeholder=" "
                      :items="searchedPlayers"
                      :search-input.sync="search"
                      item-text="battleTag"
                      item-value="battleTag"
                      return-object
                      @click:clear="revertToDefault"
                      autofocus
                    ></v-autocomplete>
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
                      <v-date-picker v-model="banExpiry" no-title scrollable>
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
                        v-if="showConfirmation && banSet"
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
        <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { GloballyMutedPlayer, GlobalMute } from "@/store/admin/types";
import { PlayerProfile } from "@/store/player/types";

@Component({})
export default class AdminGlobalMute extends Vue {
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
    return this.$store.direct.state.admin.globallyMutedPlayers;
  }

  async deleteItem(item: GloballyMutedPlayer): Promise<void> {
    const index = this.globallyMutedPlayers.indexOf(item);
    confirm("Are you sure you want to delete this item?") &&
    await this.$store.direct.dispatch.admin.deleteGlobalMute(item);
    this.loadMutes();
  }

  get banSet(): boolean {
    return this.banExpiry != "";
  }

  public banExpiry = "";
  public dateMenu = false;
  public dialog = false;
  public searchPlayerModel = {} as PlayerProfile;
  public search = "";
  public showConfirmation = false;
  public oldSearchTerm = "";
  public player = "";

  public revertToDefault(): void {
    this.showConfirmation = false;
    this.banExpiry = "";
    this.oldSearchTerm = "";
    this.$store.direct.dispatch.admin.clearSearch();
  }

  @Watch("searchPlayerModel")
  public async onSearchStringChanged(
    searchedPlayer: PlayerProfile
  ): Promise<string> {
    if (!searchedPlayer) return "";

    if (searchedPlayer) {
      this.player = searchedPlayer.battleTag;

      await this.$store.direct.dispatch.admin.searchBnetTag({
        searchText: this.player.toLowerCase(),
      });

      if ((this.player != null || undefined) && this.player.length > 0) {
        this.showConfirmation = true;
      } else {
        this.revertToDefault();
      }
    }

    this.player = searchedPlayer.battleTag;
    this.showConfirmation = true;
    return this.player;
  }

  @Watch("search")
  public onSearchChanged(newValue: string): void {
    if (newValue && newValue.length > 2 && newValue !== this.oldSearchTerm) {
      this.$store.direct.dispatch.admin.searchBnetTag({
        searchText: newValue.toLowerCase(),
      });
      this.oldSearchTerm = newValue;
    } else {
      this.revertToDefault();
    }
  }

  get searchedPlayers(): PlayerProfile[] {
    return this.$store.direct.state.admin.searchedPlayers;
  }

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

    await this.$store.direct.dispatch.admin.addGlobalMute(mute);
    this.loadMutes();
  }

  public async loadMutes(): Promise<void> {
    await this.$store.direct.dispatch.admin.loadGlobalMutes();
  }

  async mounted(): Promise<void> {
    await this.init();
  }

  public async init(): Promise<void> {
    await this.loadMutes();
  }
}
</script>

<style lang="scss"></style>
