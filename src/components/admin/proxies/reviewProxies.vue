<template>
    <v-container>
        <v-row>
            Proxies for: {{ searchedPlayerTag }}
        </v-row>

        <v-row>
            nodeOverrides: {{ initProxySettings.nodeOverrides}}
        </v-row>

        <v-row>
            automaticNodeOverrides: {{ initProxySettings.automaticNodeOverrides}}
        </v-row>
        
        <v-row>

            <!-- nodeOverrides -->
            <v-col>
                <v-card class="px-1 m-0">
                    <node-overrides-card 
                        :passedOverrides="initProxySettings.nodeOverrides">
                    </node-overrides-card>
                </v-card>
            </v-col>

            <!-- automaticNodeOverrides -->
            <v-col>
                <v-card class="px-1 m-0" >
                    <node-overrides-card 
                        :passedOverrides="initProxySettings.automaticNodeOverrides"
                        :automaticNodes="true">
                    </node-overrides-card>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="!isProxyListUnmodified()">
            Proxies are modified
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
    public initProxySettings = { nodeOverrides:[], automaticNodeOverrides:[] } as ProxySettings;

    get availableProxies() : ProxySettings {
        return this.proxies;
    }

    get modifiedProxies() : ProxySettings {
        return this.$store.direct.state.admin.modifiedProxies
    }

    public isProxyListUnmodified() : boolean {
        // todo - WIP
        if (
            this.modifiedProxies.nodeOverrides.length !== this.initProxySettings.nodeOverrides.length &&
            this.modifiedProxies.automaticNodeOverrides.length !== this.initProxySettings.automaticNodeOverrides.length
            ) return false;
        
        if(this.checkOverridesAreSame(this.initProxySettings.nodeOverrides, this.modifiedProxies.nodeOverrides)) 
            return true;
        if(this.checkOverridesAreSame(this.initProxySettings.automaticNodeOverrides, this.modifiedProxies.automaticNodeOverrides)) 
            return true;
        
        return false;
    }

    public checkOverridesAreSame(initOverrides : string[], modifiedOverrides : string[]) : boolean {
        
        const uniqueValues = new Set([...initOverrides, ...modifiedOverrides]);

        for (const v of uniqueValues) {
            const initOverridesCount = initOverrides.filter(e => e === v).length;
            const modifiedOverridesCount = modifiedOverrides.filter(e => e === v).length;
            if (initOverridesCount !== modifiedOverridesCount) return false;
        }

        return true;
    }

    private async init() : Promise<void> {
        this.searchedPlayerTag = this.$store.direct.state.admin.searchedBattletag;
        this.initProxySettings = await this.$store.direct.dispatch.admin.getProxiesForPlayer(this.searchedPlayerTag);
        await this.$store.direct.dispatch.admin.updateModifiedProxies({overrides: this.initProxySettings.nodeOverrides, isAutomatic: false});
        await this.$store.direct.dispatch.admin.updateModifiedProxies({overrides: this.initProxySettings.automaticNodeOverrides, isAutomatic: true});
    }

    async mounted() : Promise<void> {
        await this.init();
    }

}
</script>

<style>
</style>