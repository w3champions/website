<template>
    <v-container>
        <v-row>
            Proxies for: {{ searchedPlayerTag }}
        </v-row>

        <v-row>
            {{ setNewProxies.nodeOverrides}}
        </v-row>

        <v-row>
            {{ setNewProxies.automaticNodeOverrides}}
        </v-row>
        
        <v-row>

            <!-- nodeOverrides -->
            <v-col>
                <v-card class="px-1 m-0">
                    <node-overrides-card 
                        :passedOverrides="setNewProxies.nodeOverrides">
                    </node-overrides-card>
                </v-card>
            </v-col>

            <!-- automaticNodeOverrides -->
            <v-col>
                <v-card class="px-1 m-0" >
                    <node-overrides-card 
                        :passedOverrides="setNewProxies.automaticNodeOverrides"
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

    public searchedPlayerTag = ``;
    public setNewProxies = {} as ProxySettings;
    // initiate setNewProxies as the proxies the player already has

    get availableProxies() : ProxySettings {
        return this.proxies;
    }

    private async init() : Promise<void> {
        this.searchedPlayerTag = this.$store.direct.state.admin.searchedBattletag;
        this.setNewProxies = await this.$store.direct.dispatch.admin.getProxiesForPlayer(this.searchedPlayerTag);
    }

    async mounted() : Promise<void> {
        await this.init();
    }

}
</script>

<style>
</style>