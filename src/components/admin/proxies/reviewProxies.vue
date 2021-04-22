<template>
    <v-container>
        <v-row >
            <v-card-title class="ma-0 pa-0">
                Proxy settings for: {{ searchedPlayerTag }}
            </v-card-title>
        </v-row>

        <v-row>
            <v-subheader class="ma-0 pa-0">
                Do not modify the automated nodes unless you know what you're doing.
            </v-subheader>
        </v-row>

        <v-row>
            nodeOverrides: {{ initProxySettings.nodeOverrides}}
        </v-row>

        <v-row>
            automaticNodeOverrides: {{ initProxySettings.automaticNodeOverrides}}
        </v-row>
        
        <v-row>

            <!-- nodeOverrides -->
            <v-col class="px-0">
                <v-card class="px-1 m-1">
                    <node-overrides-card 
                        :passedOverrides="initProxySettings.nodeOverrides">
                    </node-overrides-card>
                </v-card>
            </v-col>

            <!-- automaticNodeOverrides -->
            <v-col class="px-0">
                <v-card class="px-1 m-0" >
                    <node-overrides-card 
                        :passedOverrides="initProxySettings.automaticNodeOverrides"
                        :automaticNodes="true">
                    </node-overrides-card>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="getProxyModified()">
            <v-spacer></v-spacer>
                <v-dialog
                    v-model="dialog"
                    width=500>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn 
                            color="primary"
                            v-bind="attrs"
                            v-on="on">
                                Update Proxies
                        </v-btn>
                    </template>

                    <v-card>
                        <v-card-title>
                            Update Proxies
                        </v-card-title>
                        <v-card-subtitle>
                            Set the following proxies for this player:
                        </v-card-subtitle>
                    </v-card>
                </v-dialog>
            <v-spacer></v-spacer>
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
    public originalProxySettings = { nodeOverrides:[], automaticNodeOverrides:[] } as ProxySettings;
    public dialog = false;

    get availableProxies() : ProxySettings {
        return this.proxies;
    }

    get modifiedProxies() : ProxySettings {
        return this.$store.direct.state.admin.modifiedProxies
    }

    public getProxyModified() : boolean {
        return this.$store.direct.state.admin.proxyModified;
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
        this.originalProxySettings = JSON.parse(JSON.stringify(this.initProxySettings));
        this.$store.direct.dispatch.admin.proxyModified(false);

    }

    async mounted() : Promise<void> {
        await this.init();
    }

}
</script>

<style>
</style>