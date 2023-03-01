<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" class="transparent">
        <v-icon style="margin-right: 5px">mdi-pencil</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-list dense>
        <v-list-item
          v-for="a in actions"
          :key="a.name"
          @click="invoke(a.action)"
        >
          <v-list-item-content>
            <v-list-item-title>{{ a.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { EClanRole } from "@/store/clan/types";

@Component({})
export default class MemberManagementMenu extends Vue {
  @Prop() battleTag!: string;
  @Prop() role!: EClanRole;
  @Prop() loggedInUserRole!: EClanRole;

  public async kickPlayer(): Promise<void> {
      await this.$store.direct.dispatch.clan.kickPlayer(this.battleTag);
  }

  public async promoteToShaman(): Promise<void> {
    await this.$store.direct.dispatch.clan.addShaman(this.battleTag);
  }

  public async demoteShaman(): Promise<void> {
    await this.$store.direct.dispatch.clan.removeShaman(this.battleTag);
  }

  public async makeChiefTain(): Promise<void> {
    await this.$store.direct.dispatch.clan.switchChieftain(this.battleTag);
  }

  get actions(): Array<{ name: string; action: () => Promise<void> }> {
    switch (this.role) {
      case EClanRole.Member:
        switch (this.loggedInUserRole) {
          case EClanRole.Shaman:
            return [
              { name: "Kick Player", action: this.kickPlayer }
            ];
          case EClanRole.ChiefTain:
            return [
              { name: "Promote To Shaman", action: this.promoteToShaman },
              { name: "Kick Player", action: this.kickPlayer }
            ];
          default:
            return [];
        }
      case EClanRole.Shaman:
        switch (this.loggedInUserRole) {
          case EClanRole.Shaman:
            return [];
          case EClanRole.ChiefTain:
            return [
              { name: "Demote To Member", action: this.demoteShaman },
              { name: "Kick Player", action: this.kickPlayer },
              { name: "Make Chieftain", action: this.makeChiefTain }
            ];
          default:
            return [];
        }
      default:
        return [];
    }
  }

  public async invoke(f: () => Promise<never>): Promise<void> {
    await f();
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
    await this.$store.direct.dispatch.clan.retrievePlayersMembership();
  }
}
</script>

<style></style>
