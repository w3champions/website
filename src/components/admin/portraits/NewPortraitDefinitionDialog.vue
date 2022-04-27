<template>
  <v-row>
    <v-col>
      <v-dialog max-width="1000">
        <template v-slot:activator="{ on }">
          <v-row class="justify-center ma-0 pa-0">
            <v-btn class="primary w3-race-bg--text" v-on="on">Add New PortraitDefinition</v-btn>
          </v-row>
        </template>
        <template>
          <v-card>
            <v-container>
              <v-row class="justify-center">
                <v-card-title>Add New PortraitDefinition</v-card-title>
              </v-row>
              <v-row>
                <v-container class="ml-3 mr-3">
                  <v-text-field
                    v-model="portraitId"
                    :rules="[rules.required, rules.min, rules.taken, rules.number, rules.notZero]"
                    label="Portrait Id"
                  ></v-text-field>
                </v-container>
              </v-row>
              <v-row></v-row>
            </v-container>
          </v-card>
        </template>
      </v-dialog>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { PortraitDefinition } from "@/store/admin/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({ components: {} })
export default class NewPortraitDefinitionDialog extends Vue {
  @Prop({ default: false }) edit!: boolean;
  portraitId = 0;

  get allSpecialPortraits(): PortraitDefinition[] {
    return this.$store.direct.state.admin.playerManagement.allSpecialPortraits;
  }

  get rules(): unknown {
    return {
      required: (value: string) => !!value || "Required",
      min: (text: string) => text.length >= 1 || "Min 1 characters",
      taken: (id: string) => !this.allSpecialPortraits.map((x) => x.id).includes(id) || "Portrait already exists",
      number: (value: number) => {
        const pattern = /^[0-9]*$/;
        return pattern.test(value.toString()) || "Must be a number";
      },
      notZero: (value: number) => value != 0 || "Don't use zero",
    };
  }

  async init(): Promise<void> {
    const allSpecialPortraits = this.$store.direct.state.admin.playerManagement.allSpecialPortraits;
    if (!(allSpecialPortraits.length > 0)) {
      await this.$store.direct.dispatch.admin.playerManagement.loadAllSpecialPortraits();
    }
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
