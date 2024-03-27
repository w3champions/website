<template>
  <div>
    <v-tooltip
      :right="align === 'right'"
      :left="align === 'left'"
      v-if="object.length > 1 && delimiter !== AddValuesDelimiter.SLASH"
    >
      <template v-slot:activator="{ on, attrs }">
        <span v-bind="attrs" v-on="on">{{ stringValues }}</span>
      </template>
      <div>{{ addValues }}</div>
    </v-tooltip>
    <span v-else>{{ stringValues }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-facing-decorator";
import { AddValuesDelimiter } from "./PlayerPerformanceOnMatch.vue";

@Component({})
export default class NumberDisplay extends Vue {
  @Prop() object!: Record<string, number>[];
  @Prop() value!: string;
  @Prop({ default: "left" }) align!: "left" | "right";
  @Prop() delimiter: AddValuesDelimiter | undefined;

  public AddValuesDelimiter = AddValuesDelimiter;

  get getArray() {
    return this.object
      .map((o) => o[this.value])
      .filter((v) => v !== undefined || v !== null);
  }
  get stringValues() {
    return this.getArray.join(this.delimiter || AddValuesDelimiter.PLUS);
  }
  get addValues() {
    return this.getArray.reduce((a, b) => a + b, 0).toString();
  }
}
</script>
