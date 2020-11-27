<template>
    <v-container class="pa-0">
        <v-row class="pa-0" align="center" justify="center">
            <v-col class= "pa-1"><img :src="flag()" width="30px" height="30px"/></v-col>
            <v-col>{{ this.locale.toUpperCase() }}</v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from 'vue'
import { Prop, Component } from "vue-property-decorator";

@Component({})
export default class LocaleIcon extends Vue {
    @Prop() locale!: string;

    flag(): string {
        return require(`../../assets/localeFlags/${this.locale}.svg`);
    }
}
</script>