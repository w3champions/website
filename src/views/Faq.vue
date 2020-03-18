<template>
  <v-container>
    <v-card>
      <v-card-title>FAQ</v-card-title>
      <v-card-text>
        <v-expansion-panels>
          <v-expansion-panel v-for="(faq,i) in faqs" :key="i">
            <v-expansion-panel-header>{{faq.question}}</v-expansion-panel-header>
            <v-expansion-panel-content ><div v-html="faq.answer"></div></v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class FaqView extends Vue {
  public faqs = [
    {
      question: "Will I get banned by Blizzard, if I use W3Champions ladder?",
      answer: "The short answer is <b>probably</b> not. The long answer is that we currently consider it very unlikely that you will be banned from using W3Champions, but we never can rule it out."
    },
    {
      question: "What will happen to the ladder, when Blizzard will actually publish an own ladder?",
      answer: "We will continue with what we do as long as the Blizzard ladder does not meet the expections of the community."
    },
    {
      question: "Are you planning on doing different seasons?",
      answer: "Who knows =)"
    },
    {
      question: "Are there any plans to add 2v2, 4v4, or FFA ladder?",
      answer: "Yes, eventually. Right now we focus on 1v1 ladder,"
    },
    {
      question: "Is the developement team in some way involved or associated with Blizzard?",
      answer: "No. This is a community project."
    },
    {
      question: "Are Americas and Europe ladder separate?",
      answer: "NA and EU ladders are combined atm, but the matchmaking is separate. NA plays NA, EU plays EU."
    },
  ];
}
</script>