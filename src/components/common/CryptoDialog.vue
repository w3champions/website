<template>
    <v-dialog v-model="show" max-width="500">
        <v-card>
            <v-card-title class="justify-center">
                {{ this.cryptoName }}
            </v-card-title>
                <v-container>
                    
                    <v-row>
                        <v-img :src="require(`@/assets/socials/QR/${crypto}_QR.png`)"></v-img>
                    </v-row>

                    <v-row class="mt-2">
                        <v-spacer></v-spacer>
                        <v-btn
                            small 
                            @click="copyAddress">
                            <v-icon>
                                mdi-content-copy
                            </v-icon>
                        </v-btn>
                        <v-spacer></v-spacer>
                    </v-row>

                    <v-row class="mt-2">
                        <v-spacer></v-spacer>
                        <v-card elevation="0" max-width="500">
                            <v-spacer></v-spacer>
                                <v-card-text>
                                    {{ cryptoAddress }}
                                </v-card-text>
                            <v-spacer></v-spacer>
                        </v-card>
                        <v-spacer></v-spacer>
                    </v-row>
                    
                    <v-row class="mt-2">
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
    @Prop() cryptoAddress! : string;
    @Prop() value! : boolean;

    private copyAddress() {
        navigator.clipboard.writeText(this.cryptoAddress);
    }

    get show() : boolean {
        return this.value;
    }

    set show(value : boolean) {
        this.$emit('input', value);
    }

}
</script>