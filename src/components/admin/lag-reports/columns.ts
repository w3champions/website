import { DataTableHeader } from "vuetify";

// The one column model both tables render from: the flat list filters it by
// the per-user column preferences, the grouped view additionally drops the
// columns its layout already carries (server heads each group, the whole row
// opens the report).
export const ALL_HEADERS: DataTableHeader[] = [
  { title: "Created", value: "createdAt", sortable: false, width: "150px" },
  { title: "Flo Game", value: "floGameId", sortable: false, width: "100px" },
  { title: "Game ID", value: "gameId", sortable: false, width: "100px" },
  { title: "Game", value: "gameName", sortable: false },
  { title: "Map", value: "mapPath", sortable: false },
  { title: "Server", value: "serverNodeName", sortable: false, width: "120px" },
  { title: "Node ID", value: "serverNodeId", sortable: false, width: "80px", align: "center" },
  { title: "Players #", value: "playerCount", sortable: false, width: "90px", align: "center" },
  { title: "Proxied", value: "proxiedCount", sortable: false, width: "80px", align: "center" },
  { title: "Lag ev.", value: "lagEvents", sortable: false, width: "80px", align: "center" },
  { title: "Conn ev.", value: "connectionEvents", sortable: false, width: "80px", align: "center" },
  { title: "Submitted", value: "hasExplicitReport", sortable: false, width: "100px", align: "center" },
  { title: "Submitted by", value: "submittedBy", sortable: false },
  { title: "Players", value: "players", sortable: false },
  { title: "", value: "actions", sortable: false, width: "100px", align: "center" },
];
