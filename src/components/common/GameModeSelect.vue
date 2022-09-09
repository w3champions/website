<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" class="transparent">
        <v-icon style="margin-right: 5px">mdi-controller-classic</v-icon>
        {{ gameModeName }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t("components_common_gamemodeselect.selectgamemode") }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item
            v-for="mode in gameModes"
            :key="mode.id"
            @click="selectGameMode(mode.id)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ mode.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from "vue-property-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import { LocaleMessage } from "vue-i18n";
import { EGameMode } from "../../store/typings";

@Component({})
export default class GameModeSelect extends Mixins(GameModesMixin) {
  @Prop() gameMode?: EGameMode;
  @Prop() disabledModes?: EGameMode[];

  async mounted(): Promise<void> {
    await this.loadActiveGameModes();
  }

  get gameModes(): Array<{ name: LocaleMessage; id: number }> {
    let modes = this.activeGameModes;

    if (this.disabledModes) {
      modes = modes?.filter((x) => !this.disabledModes?.includes(x.id));
    }

    return modes;
  }

  get gameModeName(): LocaleMessage {
    if (!this.gameMode) {
      return "";
    }

    const mode = this.activeGameModes?.filter((g) => g.id == this.gameMode)[0];

    if (!mode) {
      return "Not Supported";
    }

    return mode.name;
  }

  public selectGameMode(gameMode: EGameMode): void {
    this.$emit("gameModeChanged", gameMode);
  }
}
</script>

<style></style>
