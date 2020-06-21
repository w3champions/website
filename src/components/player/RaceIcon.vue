<template>
    <div>
        <img v-if="race!==raceEnums.TOTAL" v-bind:src="renderIcon()" v-bind:title="enumToString()" class="race-icon" height="24px" width="auto"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { ERaceEnum } from "@/store/typings";
    import { Component, Prop } from "vue-property-decorator";

    @Component({})
    export default class RaceIcon extends Vue {

        public raceEnums = ERaceEnum;
        @Prop() race!: ERaceEnum;

        enumToString() {
            return ERaceEnum[this.race];
        }

        renderIcon() {
            return require("../../assets/raceIcons/" + this.enumToString() + ".png");
        }
    }
</script>

<style lang="scss" scoped>

</style>
