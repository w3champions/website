export type AdminMapsState = {
  totalMaps: number;
};

export type FloMap = {
  id: string;
  // rest of fields
};

export type GameMapPlayer = {
  name: string;
  type: number;
  race: number;
  flags: number;
};
