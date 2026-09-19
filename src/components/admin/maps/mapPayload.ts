import type { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { toGameMapPath } from "./mapFilePath";

// A map update replaces the whole document: the matchmaking service overwrites
// every field the request body mentions and drops the ones it does not. So a
// save has to send the map back exactly as it was read, minus the one thing that
// is being changed.
//
// That makes "copy everything, then override" the only safe shape here, and it
// is why these builders spread rather than listing the fields of `Map`. A field
// the backend stores but this app's types do not know about still round-trips;
// rebuilding the object from the type would erase it.

/**
 * The map as it should be sent to the editor, detached from the store.
 *
 * `mappedForces` and `gameMap` are nested, so a shallow copy would let the
 * dialog edit the store's row even when the edit is cancelled.
 */
export function cloneMapForEdit(map: Map): Map {
  return JSON.parse(JSON.stringify(map)) as Map;
}

/**
 * The map pointed at one of its stored files.
 *
 * Both the map and the file's metadata are copied: the metadata object belongs
 * to the store's file list, and writing the game path into it would edit that
 * list.
 */
export function withSelectedMapFile(map: Map, file: MapFileData): Map {
  return {
    ...map,
    gameMap: { ...file.metaData, path: toGameMapPath(file.filePath) },
  };
}
