<template>
  <v-dialog v-model="dialog" max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn
        @click="dialog = true"
        class="ma-0"
        outlined
        v-on="on"
        color="primary"
      >
        <v-icon left>mdi-pencil</v-icon>
        <span>{{ $t("components_clans_inviteplayermodal.inviteplayer") }}</span>
      </v-btn>
    </template>
    <v-card class="pa-4">
      <v-card-title>
        <span>{{ $t("components_clans_inviteplayermodal.inviteplayer") }}</span>
      </v-card-title>
      <v-card-text>
        <v-autocomplete
          v-model="searchModel"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          clearable
          :items="searchPlayers"
          :search-input.sync="search"
          :no-data-text="noDataText"
          item-text="battleTag"
          item-value="battleTag"
          :placeholder="$t(`views_rankings.searchPlaceholder`)"
          return-object
        >
          <template v-slot:item="data">
            <template v-if="typeof data.item !== 'object'">
              <v-list-item-content>{{ data.item }}</v-list-item-content>
            </template>
            <template v-else>
              <v-list-item-content>
                <v-list-item-title>
                  <span v-if="!isDuplicateName(data.item.name)">
                    {{ data.item.name }}
                  </span>
                  <span v-if="isDuplicateName(data.item.name)">
                    {{ data.item.battleTag }}
                  </span>
                </v-list-item-title>
              </v-list-item-content>
            </template>
          </template>
        </v-autocomplete>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="blue darken-1"
          text
          :disabled="!search"
          @click="invitePlayer"
        >
          {{ $t("components_clans_inviteplayermodal.inviteplayer") }}
        </v-btn>
      </v-card-actions>

      <v-alert
        v-model="isValidationError"
        type="warning"
        dense
        class="ml-4 mr-4"
        dismissible
      >
        {{ clanValidationError }}
      </v-alert>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { PlayerProfile } from "@/store/player/types";
import { Clan } from "@/store/clan/types";
import { useOauthStore } from "@/store/oauth/store";
import { useClanStore } from "@/store/clan/store";

@Component({})
export default class InvitePlayerModal extends Vue {
  private oauthStore = useOauthStore();
  public searchModel = {} as PlayerProfile;
  public search = "";

  public dialog = false;
  private clanStore = useClanStore();

  get loggedInPlayerIsChiefTain(): boolean {
    return this.playersClan.chiefTain === this.verifiedBtag;
  }

  get verifiedBtag(): string {
    return this.oauthStore.blizzardVerifiedBtag;
  }

  get clanValidationError(): string {
    return this.clanStore.clanValidationError;
  }

  get isValidationError(): boolean {
    return this.clanStore.clanValidationError !== "";
  }

  public isDuplicateName(name: string): boolean {
    return this.searchPlayers.filter((r) => r.name === name).length > 1;
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at least 3 letters";
    }

    return "No player found";
  }

  public async invitePlayer(): Promise<void> {
    await this.clanStore.invitePlayer(
      this.searchModel.battleTag
    );

    await this.clanStore.retrievePlayersClan();
    this.search = "";
  }

  @Watch("search")
  public onSearchChanged(newValue: string): void {
    if (newValue && newValue.length > 2) {
      this.clanStore.searchForPlayers(newValue.toLowerCase());
    } else {
      this.clanStore.SET_PLAYERS_SEARCH([]);
    }
  }

  get searchPlayers(): PlayerProfile[] {
    return this.clanStore.searchPlayers;
  }

  get playersClan(): Clan {
    return this.clanStore.playersClan;
  }
}
</script>
