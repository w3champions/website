import { AdminPlayerManagementState, ChangePortraitsCommand, PortraitDefinition, PortraitDefinitionDTO, PortraitDefinitionGroup } from "../types";
import { useOauthStore } from "@/store/oauth/store";
import PersonalSettingsService from "@/services/PersonalSettingsService";
import AdminService from "@/services/admin/AdminService";
import { defineStore } from "pinia";

export const usePlayerManagementStore = defineStore("playerManagement", {
  state: (): AdminPlayerManagementState => ({
    allSpecialPortraits: [] as PortraitDefinition[],
    searchedPlayerSpecialPortraits: [] as number[],
  } as AdminPlayerManagementState),
  actions: {
    async loadAllSpecialPortraits() {
      const oauthStore = useOauthStore();
      const availablePortraits = await AdminService.getAllSpecialPortraits(oauthStore.token);
      this.SET_SPECIAL_PORTRAITS(availablePortraits);
    },
    async loadSpecialPortraitsForPlayer(btag: string): Promise<void> {
      const playerSettings = await PersonalSettingsService.retrievePersonalSetting(btag);
      if (playerSettings.specialPictures != null) {
        this.SET_SEARCHED_PLAYER_SPECIAL_PORTRAITS(playerSettings.specialPictures.map((x) => x.pictureId));
      } else {
        this.SET_SEARCHED_PLAYER_SPECIAL_PORTRAITS([] as number[]);
      }
      this.SET_MANAGED_PLAYER_BATTLETAG(btag);
    },
    async addPortraits(portraitCommand: ChangePortraitsCommand): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.putPortraits(oauthStore.token, portraitCommand);
    },
    async removePortraits(portraitCommand: ChangePortraitsCommand): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.deletePortraits(oauthStore.token, portraitCommand);
    },
    clearManagedPlayer(): void {
      this.SET_MANAGED_PLAYER_BATTLETAG("");
    },
    async loadPortraitDefinitionGroups(): Promise<void> {
      const portDefGroups = await AdminService.getAllPortraitDefinitionGroups();
      this.SET_PORTRAIT_DEFINITION_GROUPS(portDefGroups);
    },
    async addNewPortraitDefinition(definition: PortraitDefinitionDTO): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.postPortraitDefinitions(oauthStore.token, definition);
    },
    async removePortraitDefinition(definition: PortraitDefinitionDTO): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.deletePortraitDefinitions(oauthStore.token, definition);
    },
    async updatePortraitDefinition(definition: PortraitDefinitionDTO): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.putPortraitDefinitions(oauthStore.token, definition);
    },
    SET_MANAGED_PLAYER_BATTLETAG(battleTag: string): void {
      this.managedBattleTag = battleTag;
    },
    SET_SPECIAL_PORTRAITS(specialPortraits: PortraitDefinition[]): void {
      this.allSpecialPortraits = specialPortraits;
    },
    SET_SEARCHED_PLAYER_SPECIAL_PORTRAITS(specialPortraits: number[]): void {
      this.searchedPlayerSpecialPortraits = specialPortraits;
    },
    SET_PORTRAIT_DEFINITION_GROUPS(portDefGroups: PortraitDefinitionGroup[]): void {
      this.portraitDefinitionGroups = portDefGroups;
    },
  },
});
