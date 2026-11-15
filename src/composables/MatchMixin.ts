import { Match } from "@/store/types";
import { stripWc3Text } from "@/components/common/wc3Text";

export function mapNameFromMatch(match: Match): string {
  if (match.mapName) {
    // `mapName` is a curated W3C name and is clean in practice, but it is ultimately
    // seeded from map-file metadata, which carries Warcraft colour codes. Stripping
    // here covers every caller (grids, match details, ongoing matches) at once, and
    // this is a plain string bound for table cells and `title` attributes, so codes
    // could only ever render as literal garbage.
    return stripWc3Text(match.mapName);
  }
  // Without a name, show the map file name as it is.
  return match.map;
}
