<template>
  <v-card class="w3-plaque socials-card">
    <h2 class="banner pt-3 px-4">{{ $t("views_home.joinus") }}</h2>
    <div class="socials-list">
      <a href="https://discord.gg/uJmQxG2" target="_blank" class="social-logo">
        <img src="/assets/socials/Discord_button.png" alt="Discord" />
      </a>
    </div>

    <h2 class="banner px-4">{{ $t("views_home.socialmedia") }}</h2>
    <div class="socials-list">
      <a href="https://twitter.com/W3ChampionsTeam" target="_blank" class="social-logo">
        <img src="/assets/socials/Twitter_button.png" alt="Twitter" />
      </a>
    </div>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SocialBox",
  components: {},
});
</script>

<style lang="scss" scoped>
.socials-card {
  padding-bottom: 12px;
}

.socials-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 12px 4px;
}

.social-logo {
  display: block;
  opacity: 0.85;
  transition: opacity 0.15s;

  img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 2px;
  }

  &:hover {
    opacity: 1;
  }
}
</style>
