import parseVersionedMapName from "./map-key-parser";

test("can parse mApNaMesv2_0", () => {
  expect(parseVersionedMapName("mApNaMesv2_0")).toEqual({
    mapKey: "mapnames",
    version: "v2_0",
  });
});

test("won't parse mApNaMes", () => {
  expect(parseVersionedMapName("mApNaMes")).toEqual({
    mapKey: "mApNaMes",
  });
});

test("only splits the last v off of a map name", () => {
  expect(parseVersionedMapName("Evolvev7_9")).toEqual({
    mapKey: "evolve",
    version: "v7_9",
  });
});
