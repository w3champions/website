<template>
    <v-dialog v-model="show" max-width="300">
        <v-card>
            <v-card-title class="justify-center">
                {{ this.cryptoName }}
            </v-card-title>
                <v-container>
                    <v-row>
                        <v-img :src="require(`@/assets/socials/QR/${crypto}_QR.png`)"></v-img>
                    </v-row>
                    <v-row>
                        <!-- Put the wallet copy/paste string component here -->
                    </v-row>
                    <v-row>
                        <v-spacer></v-spacer>
                        <v-btn @click.stop="show=false">Close</v-btn>    
                        <v-spacer></v-spacer>
                    </v-row>
                </v-container>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class CryptoDialog extends Vue {
    @Prop() crypto! : string;
    @Prop() cryptoName! : string;
    @Prop() value! : boolean;

    get cryptoQrSrc() : string {
        return `@/assets/socials/QR/${this.crypto}_QR.png`
    }

    get show() : boolean {
        return this.value;
    }

    set show(value : boolean) {
        this.$emit('input', value);
    }

}
</script>