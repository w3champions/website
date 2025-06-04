export interface SmurfDetectionResult {
  battleTag: string;
  connectedBattleTags: string[];
  explanation: SmurfDetectionExplanationStep[];
}

export interface SmurfDetectionExplanationStep {
  iteration: number;
  identifierType: string;
  identifierGroups: SmurfDetectionIdentifierGroup[];
  filteredIdentifiers: string[];
}

export interface SmurfDetectionIdentifierGroup {
  // Battle tag -> number of logins
  fromBattleTags: BattleTagLoginCount[];
  identifier: string;
  // Battle tag -> number of logins
  toBattleTags: BattleTagLoginCount[];
}

export interface BattleTagLoginCount {
  battleTag: string;
  numberOfLogins: number;
}
