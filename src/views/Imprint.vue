<template>
  <v-container class="pa-3 w3-container-width">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="pt-3">Legal Notice / Imprint</v-card-title>
          <v-card-text>
            W3Champions is owned and operated by:
            <br />
            <br />
            <h3>Deespul LLC</h3>
            Registered in North Carolina, USA
            <br />
            D-U-N-S Number: 101376347
            <br />
            Company Number: 2115577
          </v-card-text>
          <v-card-text>
            <h3>Contact Information</h3>
            <p>
              Telephone: 404 857 4571
              <br />
              E-Mail:
              <a href="mailto:w3champions.team@gmail.com" class="text-primary">w3champions.team@gmail.com</a>
              <br />
              Internet address:
              <a href="https://w3champions.com" target="_blank" class="text-primary">https://w3champions.com</a>
            </p>
          </v-card-text>
          <v-card-text>
            <h3>EU Representative (GDPR Article 27)</h3>
            <p>
              For individuals in the European Union, our representative under Article 27 GDPR is:
              <br />
              Alexander Beninski
              <br />
              Cherni Vrah 51
              <br />
              1404 Sofia, Bulgaria
              <br />
              Phone: +359 89 759 9552
            </p>
          </v-card-text>
          <v-card-text class="py-0">
            <h3>Graphics and Image Sources</h3>
            <p>
              <a href="https://blizzard.gamespress.com/de/Warcraft-III-Reforged-Launch-Press-Kit" target="_blank" class="text-primary">
                https://blizzard.gamespress.com/de/Warcraft-III-Reforged-Launch-Press-Kit
              </a>
            </p>
            <h3>Country flags:</h3>
            <p>
              <a href="https://github.com/HatScripts/circle-flags" target="_blank" rel="noopener noreferrer" class="text-primary">
                https://github.com/HatScripts/circle-flags
              </a>
            </p>
            <h3>VPN and Proxy detection:</h3>
            <p>
              <a href="https://getipintel.net/" target="_blank" rel="noopener noreferrer" class="text-primary">
                getipintel.net
              </a>
            </p>
          </v-card-text>
          <v-card-text>
            <h3>Privacy</h3>
            <p>
              For information about how we handle personal data and cookies, please see our
              <router-link :to="{ name: EMainRouteName.PRIVACY }" class="text-primary">Privacy Policy</router-link>
              and
              <router-link :to="{ name: EMainRouteName.COOKIES }" class="text-primary">Cookie Policy</router-link>.
            </p>
          </v-card-text>
          <v-card-text>
            <h3>Disclaimer</h3>
            <p>
              The contents of these pages were created with care, but we do not guarantee their accuracy, completeness,
              or timeliness. We are not responsible for the content of external websites we link to; responsibility for
              those lies with their respective operators. If we become aware of any legal infringement, we will remove
              the relevant link or content promptly.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { EMainRouteName } from "@/router/types";

export default defineComponent({
  name: "ImprintView",
  setup() {
    return { EMainRouteName };
  },
});
</script>
