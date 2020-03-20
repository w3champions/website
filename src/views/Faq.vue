<template>
  <v-container>
    <v-card>
      <v-card-title>FAQ</v-card-title>
      <v-card-text>
        <v-expansion-panels>
          <v-expansion-panel v-for="(faq, i) in faqs" :key="i">
            <v-expansion-panel-header>{{
              faq.question
            }}</v-expansion-panel-header>
            <v-expansion-panel-content>
              <div v-html="faq.answer"></div>
            </v-expansion-panel-content>
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
      answer:
        "The short answer is <b>probably</b> not. The long answer is that we currently consider it very unlikely that you will be banned from using W3Champions, but we never can rule it out."
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
      question:
        "Is the developement team in some way involved or associated with Blizzard?",
      answer: "No. This is a community project."
    },
    {
      question:
        "Is the queue global or do I just queue up with players of my region?",
      answer:
        "The queue is restricted to the gateway you logged in on (Europe/America/Asia/)"
    },
    {
      question: "Are Ranks and ladder seperated by regions?",
      answer:
        "While the queueing is separated to prevent bad pings, the ranks and thereby the ladder is global right now."
    },
    {
      question:
        "The Queue button is not shown in the Versus screen, what can I do?",
      answer:
        '<a href="https://discord.gg/uJmQxG2">Reach out to us on discord</a>'
    },
    {
      question: "I started the Queue but I don't find matches, what can I do?",
      answer:
        "Don't restart queueing after a few seconds/minutes. It will enlarge queue times. If it's a unpopular time, try again later. If you are sure, it must be a bug, reach out to us."
    },
    {
      question: "Will you try to create a Netease-like 3rd party client?",
      answer:
        "We will try to integrate any features directly into the Reforged client to make a 3rd party client unnecessary."
    },
    {
      question:
        "What will happen to the ladder, when Blizzard will actually publish an own ladder?",
      answer:
        "The community will decide how to proceed with it. If you prefer the official ladder, we will use the technology for other projects like automated tournaments."
    },
    {
      question: "Will we get Rank-Titles like in SC2?",
      answer:
        "We have not yet decided. For now the ladder will work close to the classic Warcraft III ladder."
    },
    {
      question:
        'I get the message "Joining ladder game, please wait..." but nothing happens. What to do?',
      answer:
        "This is currently a well known bug. We investigate in it. Please restart Warcraft III via Alt+F4."
    }
  ];
}
</script>
