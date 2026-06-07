<template>
  <v-container class="pa-3 w3-container-width">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="pt-3">Privacy Policy</v-card-title>
          <v-card-text>Last updated: 7 June 2026</v-card-text>

          <v-card-text>
            <p>
              This Privacy Policy explains how W3Champions ("we", "us") collects and uses personal data when you use
              <a href="https://w3champions.com" target="_blank" rel="noopener noreferrer" class="text-primary">w3champions.com</a>
              and related services. We are committed to protecting your privacy and complying with the EU General Data
              Protection Regulation (GDPR) and applicable data-protection law.
            </p>
          </v-card-text>

          <v-card-text>
            <h3>1. Who we are (Data Controller)</h3>
            <p>
              Deespul LLC<br />
              Registered in North Carolina, USA<br />
              D-U-N-S Number: 101376347 &middot; Company Number: 2115577<br />
              E-Mail:
              <a href="mailto:w3champions.team@gmail.com" class="text-primary">w3champions.team@gmail.com</a>
            </p>
            <h3>EU Representative (GDPR Article 27)</h3>
            <p>
              For individuals in the European Union, our representative under Article 27 GDPR is:<br />
              Alexander Beninski<br />
              Cherni Vrah 51<br />
              1404 Sofia, Bulgaria<br />
              Phone: +359 89 759 9552
            </p>
          </v-card-text>

          <v-card-text>
            <h3>2. What we collect, why, and our legal basis</h3>
            <p>
              <strong>Account &amp; gameplay data</strong> (BattleTag and account identifiers, profile, match history,
              rankings, clan and arranged-team data, chat messages) &mdash; to provide the service you sign up for.
              <em>Legal basis: performance of a contract (Art. 6(1)(b) GDPR).</em>
            </p>
            <p>
              <strong>Security &amp; anti-abuse data</strong> (IP address, bot-protection checks via Cloudflare
              Turnstile, VPN/proxy detection) &mdash; to keep the platform secure and fair.
              <em>Legal basis: our legitimate interests (Art. 6(1)(f) GDPR).</em>
            </p>
            <p>
              <strong>Analytics data</strong> (usage and device data via Google Analytics 4) &mdash; only if you allow
              analytics cookies. <em>Legal basis: your consent (Art. 6(1)(a) GDPR), which you can withdraw at any time.</em>
            </p>
          </v-card-text>

          <v-card-text>
            <h3>3. Who we share data with (recipients)</h3>
            <p>We use the following processors and third parties. Each accesses only the data needed for its purpose:</p>
            <ul>
              <li><strong>Google</strong> (Google Ireland Ltd. / Google LLC) &mdash; Google Analytics 4.</li>
              <li><strong>Blizzard Entertainment / Battle.net</strong> &mdash; account login (BattleTag).</li>
              <li><strong>Patreon</strong> and <strong>Ko-Fi</strong> &mdash; optional reward/subscription linking.</li>
              <li><strong>Cloudflare</strong> &mdash; bot protection (Turnstile).</li>
              <li><strong>getIPintel</strong> &mdash; VPN/proxy detection for anti-abuse.</li>
              <li>Hosting and infrastructure providers that operate our servers.</li>
            </ul>
          </v-card-text>

          <v-card-text>
            <h3>4. International data transfers</h3>
            <p>
              When you allow analytics, data is transferred to Google LLC in the United States. This transfer relies on
              Google's certification under the <strong>EU-US Data Privacy Framework</strong> (an EU adequacy decision),
              with the EU Standard Contractual Clauses as an additional safeguard. See
              <a href="https://policies.google.com/privacy/frameworks" target="_blank" rel="noopener noreferrer" class="text-primary">Google's data-transfer frameworks</a>.
              You can withdraw analytics consent at any time (see "Managing cookies" below).
            </p>
          </v-card-text>

          <v-card-text>
            <h3>5. How long we keep data</h3>
            <p>
              We keep account and gameplay data for as long as your account is active, and afterwards only as needed for
              legitimate purposes (e.g. abuse prevention, legal obligations) or until you ask us to delete it. Analytics
              data is retained according to our Google Analytics retention settings.
            </p>
          </v-card-text>

          <v-card-text>
            <h3>6. Your rights</h3>
            <p>
              Subject to applicable law, you have the right to access, correct, erase, restrict, or object to the
              processing of your personal data, to data portability, and to <strong>withdraw consent</strong> at any
              time. To exercise these rights, contact us at
              <a href="mailto:w3champions.team@gmail.com" class="text-primary">w3champions.team@gmail.com</a>
              or our EU representative above. You also have the right to lodge a complaint with your data-protection
              supervisory authority.
            </p>
          </v-card-text>

          <v-card-text>
            <h3>7. Automated decision-making</h3>
            <p>
              We use automated systems for matchmaking, rankings, and some moderation. These do not produce legal or
              similarly significant effects on you within the meaning of Article 22 GDPR.
            </p>
          </v-card-text>

          <v-card-text>
            <h3>8. Children</h3>
            <p>
              This service is not directed to children. You must be at least 16 years old to create an account. We do
              not knowingly collect personal data from children under 16; if we learn that we have, we will delete it.
            </p>
          </v-card-text>

          <v-card-text>
            <h3>9. US / California privacy rights</h3>
            <p>
              We do not sell your personal information. If you are a US resident, you may have rights to access or delete
              your personal information; contact us at the address above to exercise them.
            </p>
          </v-card-text>

          <v-card-text>
            <h3>10. Managing cookies</h3>
            <p>
              We use cookies and similar technologies as described in our
              <router-link :to="{ name: EMainRouteName.COOKIES }" class="text-primary">Cookie Policy</router-link>.
              You can change or withdraw your choices at any time using the "Cookie settings" link in the page footer.
            </p>
          </v-card-text>

          <v-card-text>
            <h3>11. Changes to this policy</h3>
            <p>We may update this policy from time to time. The "Last updated" date above reflects the latest version.</p>
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
  name: "PrivacyPolicyView",
  setup() {
    return { EMainRouteName };
  },
});
</script>
