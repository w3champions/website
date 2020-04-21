<script lang="ts">
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
    this.openPlayerProfile(this.account);
  }

  public openPlayerProfile(playerName: string) {
    this.$router.push({
      path: this.getPlayerPath(playerName)
    });
  }

  private getPlayerPath(playerName: string) {
    return "/player/" + encodeURIComponent(`${playerName}@${this.$store.direct.state.rankings.gateway}`);
  }
}
</script>
