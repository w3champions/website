<template>
  <v-combobox
    v-model="chips"
    :items="items"
    small-chips
    clearable
    label="Assign Groups (optional) - Select existing or enter a new group"
    multiple
  >
    <template v-slot:selection="{ attrs, item, select, selected }">
      <v-chip
        v-bind="attrs"
        :color="'blue lighten-3'"
        :input-value="selected"
        close
        @click="select"
        @click:close="remove(item)"
      >
        {{ item }}
      </v-chip>
    </template>
  </v-combobox>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";

@Component({ components: {} })
export default class PortraitGroupCombobox extends Vue {
  @Prop({}) public portraitId!: number;

  chips = [] as string[];
  items = [] as string[];

  @Watch("portraitId")
  async onPortraitIdChanged(): Promise<void> {
    await this.$store.direct.dispatch.admin.playerManagement.loadPortraitDefinitionGroups();
    this.chips = this.getChips();
  }

  @Watch("chips", { deep: true })
  onItemsChanged(): void {
    this.$emit("groups-changed", this.chips);
  }

  remove(item: string) {
    this.chips.splice(this.chips.indexOf(item), 1);
    this.chips = [...this.chips];
  }

  get portraitDefGroups() {
    return this.$store.direct.state.admin.playerManagement.portraitDefinitionGroups;
  }

  async init(): Promise<void> {
    const portraitDefGroups = this.$store.direct.state.admin.playerManagement.portraitDefinitionGroups;
    if (!portraitDefGroups || portraitDefGroups.length < 1) {
      await this.$store.direct.dispatch.admin.playerManagement.loadPortraitDefinitionGroups();
    }
    const allSpecialPortraits = this.$store.direct.state.admin.playerManagement.allSpecialPortraits;
    if (!allSpecialPortraits || allSpecialPortraits.length < 1) {
      await this.$store.direct.dispatch.admin.playerManagement.loadAllSpecialPortraits();
    }
    this.items = this.initItems();
    this.chips = this.getChips();
  }

  initItems(): string[] {
    return this.$store.direct.state.admin.playerManagement.portraitDefinitionGroups.map((x) => x.group);
  }

  getChips(): string[] {
    return this.$store.direct.state.admin.playerManagement.portraitDefinitionGroups
      .filter((x) => x.portraitIds.includes(this.portraitId))
      .map((x) => x.group);
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
