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
              <v-img
                min-width="32"
                max-width="48"
                min-height="32"
                max-height="48"
                :src="`/assets/flags/${gateway.id}.svg`"
              ></v-img>
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
import { computed, defineComponent, WritableComputedRef } from "vue";
import { REDIRECT_URL, BNET_API_CLIENT_ID } from "@/main";
import { BnetOAuthRegion } from "@/store/oauth/types";
import { i18n } from "@/main";

export default defineComponent({
  name: "SignInDialog",
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  setup: (props, context) => {
    const gateways = [
      {
        id: BnetOAuthRegion.eu,
        name: i18n.t("gatewayNames.Europe"),
        uri: "https://eu.battle.net",
      },
      {
        id: BnetOAuthRegion.cn,
        name: i18n.t("gatewayNames.China"),
        uri: "https://www.battlenet.com.cn",
      },
    ];

    const show: WritableComputedRef<boolean> = computed({
      get(): boolean {
        return props.value;
      },
      set(val: boolean): void {
        context.emit("input", val);
      },
    });

    function signIn({ id, uri }: { id: BnetOAuthRegion; uri: string }) {
      context.emit("region-change", {
        region: id,
        done: () => {
          location.href = `${uri}/oauth/authorize?region=${id}&response_type=code&client_id=${BNET_API_CLIENT_ID}&redirect_uri=${REDIRECT_URL}`;
        },
      });
    }

    return {
      gateways,
      signIn,
      show,
    };
  },
});

</script>
