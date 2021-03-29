<template>
<v-dialog>
    <v-card>
        <v-card-title>
            Hi this is a dialog
        </v-card-title>
    </v-card>
</v-dialog>
    
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class CryptoDialog extends Vue {
    @Prop() Crypto! : string;
}
</script>