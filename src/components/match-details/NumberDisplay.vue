<template>
    <v-tooltip right>
        <template v-slot:activator="{ on, attrs }">
            <div v-bind="attrs" v-on={on}>{{stringValues}}</div>
        </template>
        <div>{{addValues}}</div>
    </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { AddValuesDelimiter } from "./PlayerPerformanceOnMatch.vue";

@Component({})
export default class NumberDisplay extends Vue {
  @Prop() object!: Record<string,number>[]
  @Prop() value!: string
  @Prop() delimiter: AddValuesDelimiter | undefined

  get getArray(){return this.object.map(o => o[this.value]).filter(Boolean)}
  get stringValues(){return this.getArray.join(this.delimiter || AddValuesDelimiter.PLUS)}
  
  get addValues(){return this.getArray.reduce((a,b) => a + b, 0).toString()}
}
</script>
