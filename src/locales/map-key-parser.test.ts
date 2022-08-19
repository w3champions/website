import parseMapName from "./map-key-parser";

test("can parse mApNaMesv2_0", () => {
  expect(parseMapName("mApNaMesv2_0")).toEqual({
    mapKey: "mapnames",
    version: "v2_0",
  });
});

test("won't parse mApNaMes", () => {
  expect(parseMapName("mApNaMes")).toEqual({
    mapKey: "mApNaMes",
  });
});
