<template>
  <v-dialog v-model="show" max-width="500">
    <v-card>
      <v-card-title class="justify-center">Select Your Gateway</v-card-title>
      <v-container>
        <v-row
          class="pa-2"
          v-for="gateway in gateways"
          :key="gateway.id"
          justify="center"
          align="center"
        >
          <v-btn @click="signIn(gateway)" block x-large>
            <v-col cols="2" align-self="center">
            </v-col>
            <v-col cols="2" align-self="center">
              {{ gateway.name }}
            </v-col>
          </v-btn>
        </v-row>

        <v-row class="mt-4">
          <v-spacer></v-spacer>
          <v-btn @click.stop="show = false">Close</v-btn>
          <v-spacer></v-spacer>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { REDIRECT_URL, BNET_API_CLIENT_ID } from "@/main";
import { BnetOAuthRegion } from "@/store/oauth/types";

@Component({})
export default class SignInDialog extends Vue {
  @Prop() value!: boolean;

  get gateways() {
    return [
      {
        id: BnetOAuthRegion.eu,
        name: this.$t("gatewayNames.Europe"),
        uri: "https://eu.battle.net",
      },
      {
        id: BnetOAuthRegion.cn,
        name: this.$t("gatewayNames.China"),
        uri: "https://www.battlenet.com.cn",
      },
    ];
  }

  get show(): boolean {
    return this.value;
  }

  set show(value: boolean) {
    this.$emit("input", value);
  }

  signIn({ id, uri }: { id: BnetOAuthRegion; uri: string }) {
    this.$emit("region-change", {
      region: id,
      done: () => {
        location.href = `${uri}/oauth/authorize?region=${id}&response_type=code&client_id=${BNET_API_CLIENT_ID}&redirect_uri=${REDIRECT_URL}`;
      },
    });
  }
}
</script>
