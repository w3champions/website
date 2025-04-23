<template>
  <v-container>
    <v-card class="text-center">
      <v-progress-circular
        :size="100"
        color="primary"
        indeterminate
        class="loader"
      >
        <div class="inner-text">{{ $t("views_login.loggingyouin") }}</div>
      </v-progress-circular>
    </v-card>
  </v-container>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import { getProfileUrl } from "@/helpers/url-functions";
import { useOauthStore } from "@/store/oauth/store";
import { useRouter } from "vue-router/composables";

export default defineComponent({
  name: "LoginView",
  components: {},
  props: {
    code: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const oauthStore = useOauthStore();

    const account = computed<string>(() => oauthStore.blizzardVerifiedBtag);
    const authCode = computed<string>(() => oauthStore.token);

    function openPlayerProfile() {
      router.push({
        path: getProfileUrl(account.value) + `?freshLogin=true`,
      });
    }

    async function init(): Promise<void> {
      await oauthStore.authorizeWithCode(props.code);
      await oauthStore.loadBlizzardBtag(authCode.value);
      openPlayerProfile();
    }

    onMounted((): void => {
      init();
    });

    return {};
  },
});
</script>

<style lang="scss" scoped>
.inner-text {
  margin: 20px;
  text-align: center;
}

.loader {
  margin: 180px auto;
}
</style>
