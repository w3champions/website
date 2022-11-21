<template>
  <v-card>
    <v-card-title>
      <span class="headline">Remove Player</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col cols="12" sm="6" md="12">
            <v-select
              :items="players"
              v-model="battleTag"
              item-text="battleTag"
              item-value="battleTag"
              label="Player"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="cancel">
        {{ $t('views_admin.cancel') }}
      </v-btn>
      <v-btn color="primary" class="w3-race-bg--text" @click="save" :disabled="saving || battleTag.length === 0">
        {{ $t('views_admin.save') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import _ from "lodash";
import { ITournament } from "@/store/tournaments/types";
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";

@Component({})
export default class RemovePlayerModal extends Vue {
  @Prop() public tournament!: ITournament;
  @Prop() public saving!: boolean;

  public battleTag = "";

  get players() {
    return this.tournament.players;
  }

  public cancel() {
    this.$emit("cancel");
  }

  public save() {
    this.$emit("save", this.battleTag);
  }
}
</script>
