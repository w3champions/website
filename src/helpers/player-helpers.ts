export function stripGateWayFromPlayerId(playerId: string) {
    if (!playerId) return '';

    const atIndex = playerId.indexOf('@');

    if (atIndex === -1) {
      return playerId;
    }

    return playerId.substring(0, atIndex);
}