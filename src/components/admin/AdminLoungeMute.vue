<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items-per-page="-1"
      :items="loungeMutes"
      sort-by="insertDate"
      :sort-desc="true"
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
                          v-model="endDate"
                          readonly
                          :label="$t(`views_admin.banenddate`)"
                          v-bind="attrs"
                          v-on="on"
                        />
                      </template>
                      <v-date-picker v-model="endDate" no-title scrollable max="2099-01-01">
                        <v-spacer />
                        <v-btn
                          text
                          @click="
                            endDate = '';
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
                      {{ battleTag }}
                      <v-spacer></v-spacer>
                    </v-card-title>
                  </v-row>

                  <v-row>
                    <v-col>
                      <v-btn
                        v-if="showConfirmation && isMuteEndDateSet"
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
import { Component, Vue } from "vue-facing-decorator";
import { LoungeMute, LoungeMuteResponse } from "@/store/admin/loungeMute/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useOauthStore } from "@/store/oauth/store";
import { useLoungeMuteStore } from "@/store/admin/loungeMute/store";
import { mdiDelete } from "@mdi/js";
import { dateToCurrentTimeDate } from "@/helpers/date-functions";

@Component({ components: { PlayerSearch } })
export default class AdminLoungeMute extends Vue {
  public dateMenu = false;
  public dialog = false;
  public showConfirmation = false;
  public battleTag = "";
  public endDate = "";
  public mdiDelete = mdiDelete;
  private oauthStore = useOauthStore();
  private loungeMuteStore = useLoungeMuteStore();

  public headers = [
    { text: "BattleTag", align: "start", sortable: true, value: "battleTag" },
    { text: "Mute End Date", sortable: true, value: "endDate" },
    { text: "Mute Insert Date", sortable: true, value: "insertDate" },
    { text: "Author", sortable: true, value: "author" },
    { text: "Actions", sortable: false, value: "actions" },
  ];

  get loungeMutes(): LoungeMuteResponse[] {
    return this.loungeMuteStore.loungeMutedPlayers;
  }

  async deleteItem(item: LoungeMute): Promise<void> {
    confirm("Are you sure you want to delete this item?") &&
    await this.loungeMuteStore.deleteLoungeMute(item.battleTag);
    this.loadMutes();
  }

  get isMuteEndDateSet(): boolean {
    return this.endDate != "";
  }

  public close(): void {
    this.dialog = false;
    this.showConfirmation = false;
  }

  public async save(): Promise<void> {
    this.close();

    const mute = {
      battleTag: this.battleTag,
      author: this.author,
      endDate: dateToCurrentTimeDate(this.endDate),
    } as LoungeMute;

    await this.loungeMuteStore.addLoungeMute(mute);
    this.loadMutes();
  }

  public async loadMutes(): Promise<void> {
    await this.loungeMuteStore.loadLoungeMutes();
  }

  async mounted(): Promise<void> {
    await this.init();
  }

  public async init(): Promise<void> {
    await this.loadMutes();
  }

  get author() {
    return this.oauthStore.blizzardVerifiedBtag;
  }

  searchCleared(): void {
    this.showConfirmation = false;
    this.endDate = "";
  }

  playerFound(bTag: string): void {
    this.showConfirmation = true;
    this.battleTag = bTag;
  }
}
</script>

<style lang="scss"></style>
