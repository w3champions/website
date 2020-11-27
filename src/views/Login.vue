<template>
  <v-container>
    <v-card class="text-center">
      <v-progress-circular
        :size="100"
        color="primary"
        indeterminate
        class="loader"
      >
        <div class="inner-text">Logging you in...</div>
      </v-progress-circular>
    </v-card>
  </v-container>
</template>
<script lang="ts">
import { getProfileUrl } from '@/helpers/url-functions';
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class LoginView extends Vue {
  @Prop() public code!: string;

  mounted() {
    this.init();
  }

  get account(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  get authCode(): string {
    return this.$store.direct.state.oauth.token;
  }

  private async init() {
    await this.$store.direct.dispatch.oauth.authorizeWithCode(this.code);
    await this.$store.direct.dispatch.oauth.loadBlizzardBtag(this.authCode);
    this.openPlayerProfile();
  }

  public openPlayerProfile() {
    this.$router.push({
      path: getProfileUrl(this.account) + `?freshLogin=true`,
    });
  }

}
</script>
<style type="text/css" scoped>
.inner-text {
  margin: 20px;
  text-align: center;
}

.loader {
  margin: 180px auto;
}
</style>
