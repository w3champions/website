<template>
    <v-icon>{{ flag }}</v-icon>
</template>

<script lang="ts">
import Vue from 'vue'
import { ELocaleFlags } from '@/store/typings.ts'
import { Prop, Component } from "vue-property-decorator";

@Component({})
export default class LocaleIcon extends Vue {
    @Prop() locale!: string;

    flagSvg = `../../${ELocaleFlags.EN}`

    get flag(): string {
        return `${this.locale}`;
    }
}
</script>