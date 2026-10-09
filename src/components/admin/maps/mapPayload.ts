import type { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { toGameMapPath } from "./mapFilePath";

// A map update replaces the whole document: the matchmaking service overwrites
// every field the request body mentions and drops the ones it does not. So a
// save has to send the map back exactly as it was read, minus the one thing that
// is being changed.
//
// That makes "copy everything, then override" the only safe shape here, and it
// is why these builders spread rather than listing the fields of `Map`: they sit
// upstream of the wire and hand a whole map to the editor or to
// MapsService.createMap/updateMap, and rebuilding the object from the type would
// silently drop whatever the caller had not looked at yet.
//
// What actually goes on the wire is narrowed at a single choke point instead:
// `toMapWriteContract` in @/services/maps/mapsRequest, which MapsService applies
// to every create and update. The read side now also carries server-owned fields
// (`temporary`, `fileState`, `lastHostedAt`, `uploader`), and an editor working
// on `cloneMapForEdit`'s deep clone would otherwise echo them straight back. So
// the rule here is not "a field this app does not know about round-trips to the
// backend" - it is "nothing is lost between the store and the choke point".
// Adding a field the backend must receive means adding it to
// `MapWriteContract` as well; that whitelist, not this file, is what the
// matchmaking service sees.

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
