<template>
  <v-container class="pa-3 w3-container-width">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="pt-3">Cookie Policy</v-card-title>
          <v-card-text>Last updated: 7 June 2026</v-card-text>

          <v-card-text>
            <p>
              This page explains the cookies and similar browser storage we use. We use two categories:
              <strong>Necessary</strong> (always on, required for the site to work) and <strong>Analytics</strong>
              (off until you allow them). You can change or withdraw your choices at any time:
            </p>
            <v-btn color="primary" variant="flat" class="mt-2" @click="openCookieSettings">Manage cookie settings</v-btn>
          </v-card-text>

          <v-card-text>
            <h3>Necessary</h3>
            <p>
              Required to provide the service, including signing in, security, and remembering your choices. These are
              first-party, and no separate consent is needed. "Functional preference" items below store a choice you
              actively make (such as theme or language) and are not used for tracking.
            </p>
            <h3>Analytics (consent required)</h3>
            <p>
              Google Analytics 4 helps us understand how the site is used. These cookies are only set after you allow
              analytics (and only when JavaScript is enabled), and stop being used when you withdraw consent.
            </p>
          </v-card-text>

          <v-card-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th class="text-left" scope="col">Name</th>
                  <th class="text-left" scope="col">Storage</th>
                  <th class="text-left" scope="col">Category</th>
                  <th class="text-left" scope="col">Purpose</th>
                  <th class="text-left" scope="col">Retention</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>w3CAuth</td><td>Cookie</td><td>Necessary</td><td>Authentication (sign-in token)</td><td>365 days</td></tr>
                <tr><td>w3CAuthRegion</td><td>Cookie</td><td>Necessary</td><td>Selected sign-in region</td><td>365 days</td></tr>
                <tr><td>Cloudflare Turnstile (cf_*)</td><td>Cookie</td><td>Necessary</td><td>Bot/abuse protection on sign-in</td><td>Session / short</td></tr>
                <tr><td>_ga, _ga_*</td><td>Cookie</td><td>Analytics (consent)</td><td>Google Analytics usage measurement</td><td>Up to 2 years</td></tr>
                <tr><td>theme</td><td>localStorage</td><td>Necessary</td><td>Functional preference: interface theme</td><td>Persistent</td></tr>
                <tr><td>w3c-locale</td><td>localStorage</td><td>Necessary</td><td>Functional preference: language</td><td>Persistent</td></tr>
                <tr><td>w3c-gateway</td><td>localStorage</td><td>Necessary</td><td>Functional preference: gateway</td><td>Persistent</td></tr>
                <tr><td>spoilerFree settings</td><td>localStorage</td><td>Necessary</td><td>Functional preference: spoiler-free mode</td><td>Persistent</td></tr>
                <tr><td>patreon_oauth_state</td><td>localStorage</td><td>Necessary</td><td>OAuth security (CSRF protection)</td><td>Transient</td></tr>
                <tr><td>stcm.consent.*</td><td>localStorage</td><td>Necessary</td><td>Stores your cookie choices</td><td>Persistent</td></tr>
                <tr><td>Login return path</td><td>sessionStorage</td><td>Necessary</td><td>Redirect back after sign-in</td><td>Session</td></tr>
              </tbody>
            </v-table>
          </v-card-text>

          <v-card-text>
            <p>
              For more on how we handle personal data, see our
              <router-link :to="{ name: EMainRouteName.PRIVACY }" class="text-primary">Privacy Policy</router-link>.
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
import { openCookieSettings } from "@/analytics/analytics";

export default defineComponent({
  name: "CookiePolicyView",
  setup() {
    return { EMainRouteName, openCookieSettings };
  },
});
</script>
