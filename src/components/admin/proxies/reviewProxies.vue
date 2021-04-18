<template>
    <v-container>
        <v-row>
          <v-card>
                <node-overrides-card 
                    :v-model="setNewProxies">
                </node-overrides-card>
          </v-card>
        </v-row>

        <v-row>
          <!-- Node override cards -->
          <v-col>
            <v-card class="px-1 m-0">
                <node-overrides-card></node-overrides-card>
            </v-card>
          </v-col>

          <v-col>
            <v-card class="px-1 m-0" >
                <node-overrides-card
                    :automaticNodes="true">
                </node-overrides-card>
            </v-card>
          </v-col>
        </v-row>

    </v-container>
</template>

<script lang="ts">
import Vue from 'vue'
import { Prop, Component } from 'vue-property-decorator'
import nodeOverridesCard from '@/components/admin/proxies/nodeOverridesCard.vue'
import { ProxySettings } from '@/store/admin/types'

@Component({ components: { nodeOverridesCard } })
export default class reviewProxies extends Vue {
    @Prop() public proxies! : ProxySettings;

    get availableProxies() {
        return this.proxies;
    }

}
</script>

<style>
</style>