<template>
  <v-row>
    hi
    <v-col cols="5" md="12">
      <v-tooltip top v-bind:disabled="!portraitDescription">
        <template v-slot:activator="{ on }">
          <v-card-text
            v-on="on"
            style="cursor: pointer"
            @click.stop="openDialog"
            class="player-avatar text-center"
            :style="{
              'background-image':
                'url(' + picture(portraitCategory, portraitId) + ')',
            }"
          />
        </template>
        <span>{{ portraitDescription }}</span>
      </v-tooltip>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { PersonalSetting } from "@/store/personalSettings/types";
import { EAvatarCategory } from "@/store/typings";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { getAvatarUrl } from "@/helpers/url-functions";


@Component({ components: {} })
export default class AdminPlayerManagementPortraits extends Vue {
  @Prop() tag!: string;
  public dialogOpened = false;
  public managedPlayerSettings = {} as PersonalSetting;

  get portraitCategory() : EAvatarCategory { return this.managedPlayerSettings.profilePicture?.race; }
  get portraitId() : number { return this.managedPlayerSettings.profilePicture?.pictureId; }
  get portraitDescription() : string { return this.managedPlayerSettings.profilePicture?.description || "" }

  picture(category: EAvatarCategory, picId: number) { 
    return getAvatarUrl(category, picId, this.managedPlayerSettings.profilePicture.isClassic);
  }


  async init() : Promise<void> {
    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting(this.tag);
    this.managedPlayerSettings = this.$store.direct.state.personalSettings.managedPlayerSettings;
  }

  async mounted() { 
    await this.init(); 
  }
}
</script>

<style lang="scss"></style>
