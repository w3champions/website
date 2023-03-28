<template>
  <v-container>
    <v-row>
      <v-card-title class="ma-0 pa-0">
        Proxy settings for: {{ searchedPlayerTag }}
      </v-card-title>
    </v-row>

    <v-row>
      <v-subheader class="ma-0 pa-0">
        Do not modify the automated nodes unless you know what you're doing.
      </v-subheader>
    </v-row>

    <v-row>nodeOverrides: {{ initProxySettings.nodeOverrides }}</v-row>

    <v-row>
      automaticNodeOverrides: {{ initProxySettings.automaticNodeOverrides }}
    </v-row>

    <v-row>
      <!-- nodeOverrides -->
      <v-col class="px-0">
        <v-card class="px-1 m-1">
          <node-overrides-card
            :passedOverrides="initProxySettings.nodeOverrides"
          ></node-overrides-card>
        </v-card>
      </v-col>

      <!-- automaticNodeOverrides -->
      <v-col class="px-0">
        <v-card class="px-1 m-0">
          <node-overrides-card
            :passedOverrides="initProxySettings.automaticNodeOverrides"
            :automaticNodes="true"
          ></node-overrides-card>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="getProxyModified()">
      <v-spacer></v-spacer>
      <v-dialog v-model="dialog" width="600">
        <template v-slot:activator="{ on }">
          <v-btn color="primary" v-on="on">Update Proxies</v-btn>
        </template>

        <v-card>
          <v-container>
            <!-- title + subtitle -->
            <v-row class="my-0 py-0">
              <v-card-title class="my-0 py=0">Update Proxies</v-card-title>
            </v-row>
            <v-row class="my-0 py-0">
              <v-card-subtitle class="my-0 py=0">
                Set the following proxies for this player:
              </v-card-subtitle>
            </v-row>

            <!-- Show selected nodes container -->
            <v-container class="mb-4">
              <v-row v-if="newNodeOverrides(false).length > 0">
                <v-spacer></v-spacer>
                <v-card-subtitle class="font-weight-bold">
                  Node Overrides:
                </v-card-subtitle>
                <v-spacer></v-spacer>

                <template v-for="node in newNodeOverrides(false)">
                  <v-container class="py-0 my-0 justify-center" :key="node">
                    <v-card-text class="py-0 my-0">
                      {{ $t(`proxies.${sanitizeString(node)}`) }}
                    </v-card-text>
                  </v-container>
                </template>
              </v-row>

              <v-row v-if="newNodeOverrides(true).length > 0">
                <v-spacer></v-spacer>
                <v-card-subtitle class="font-weight-bold">
                  Auto Node Overrides:
                </v-card-subtitle>
                <v-spacer></v-spacer>

                <template v-for="node in newNodeOverrides(true)">
                  <v-container class="py-0 my-0 justify-center" :key="node">
                    <v-card-text class="py-0 my-0">
                      {{ $t(`proxies.${sanitizeString(node)}`) }}
                    </v-card-text>
                  </v-container>
                </template>
              </v-row>
            </v-container>

            <!-- Confirm/deny row -->
            <v-row>
              <v-col class="d-flex justify-center">
                <v-btn
                  color="primary"
                  @click="(dialog = false), putNewProxies()"
                >
                  Confirm
                </v-btn>
              </v-col>

              <v-col class="d-flex justify-center">
                <v-btn color="error" @click="dialog = false">Cancel</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-dialog>
      <v-spacer></v-spacer>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import nodeOverridesCard from "@/components/admin/proxies/nodeOverridesCard.vue";
import { ProxySettings } from "@/store/admin/types";
import { useAdminStore } from "@/store/admin/store";

//! There's a visual bug with this component + nodeOverridesCard component, if anyone would like to figure it out
//! When the component is created, sometimes the :input-value for the v-chip in nodeOverridesCard.vue is not set fast enough.
//! this only seems to happen for Nodes (not autonodes) and is purely visual, the state and submission works fine.

@Component({ components: { nodeOverridesCard } })
export default class reviewProxies extends Vue {
  @Prop() public proxies!: ProxySettings;

  public searchedPlayerTag = ``;
  public initProxySettings = {
    nodeOverrides: [],
    automaticNodeOverrides: [],
  } as ProxySettings;
  public originalProxySettings = {
    nodeOverrides: [],
    automaticNodeOverrides: [],
  } as ProxySettings;
  public dialog = false;
  private adminStore = useAdminStore();

  get availableProxies(): ProxySettings {
    return this.proxies;
  }

  get modifiedProxies(): ProxySettings {
    return this.adminStore.modifiedProxies;
  }

  public putNewProxies(): void {
    if (this.getProxyModified()) {
      this.adminStore.putNewProxies(
        this.adminStore.modifiedProxies
      );
    }
  }

  public sanitizeString(string: string): string {
    let str = string;
    str = str.replace(/-/g, `_`);
    return str;
  }

  public newNodeOverrides(auto: boolean): string[] {
    if (auto) {
      return this.adminStore.modifiedProxies
        .automaticNodeOverrides;
    }

    return this.adminStore.modifiedProxies.nodeOverrides;
  }

  public getProxyModified(): boolean {
    return this.adminStore.proxyModified;
  }

  public checkOverridesAreSame(
    initOverrides: string[],
    modifiedOverrides: string[]
  ): boolean {
    const uniqueValues = new Set([...initOverrides, ...modifiedOverrides]);

    for (const v of uniqueValues) {
      const initOverridesCount = initOverrides.filter((e) => e === v).length;
      const modifiedOverridesCount = modifiedOverrides.filter(
        (e) => e === v
      ).length;
      if (initOverridesCount !== modifiedOverridesCount) return false;
    }

    return true;
  }

  private async init(): Promise<void> {
    this.searchedPlayerTag = this.adminStore.searchedBattletag;
    this.initProxySettings =
      await this.adminStore.getProxiesForPlayer(
        this.searchedPlayerTag
      );
    await this.adminStore.updateModifiedProxies({
      overrides: this.initProxySettings.nodeOverrides,
      isAutomatic: false,
    });
    await this.adminStore.updateModifiedProxies({
      overrides: this.initProxySettings.automaticNodeOverrides,
      isAutomatic: true,
    });
    this.originalProxySettings = JSON.parse(
      JSON.stringify(this.initProxySettings)
    );
    this.adminStore.SET_PROXY_MODIFIED(false);
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style></style>
