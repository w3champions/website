export type AdminState = {
    total: number;
    players: Array<BannedPlayer>;
};

export interface BannedPlayer {
    battleTag: string;
    endDate: string;
    isIpBan: boolean;
    ipBanValue: string
    banReason: string;
}