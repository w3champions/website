const versionRegExp = new RegExp(/v\d.*/);

export const parseVersionedMapName = (key: string) => {
  const version = versionRegExp.exec(key);
  if (version) {
    const mapKey = key.slice(0, version.index).toLowerCase();
    return {
      mapKey,
      mapKeyPrefixed: "mapNames." + mapKey,
      version: version[0],
      versionTag: `(${version[0]})`,
    };
  }

  return {
    mapKey: key,
    mapKeyPrefixed: "mapNames." + key,
    versionTag: "",
  };
};

export const mapNameKeyFromStatsItem = function (name: string) {
  return parseVersionedMapName(name).mapKeyPrefixed;
};

const mapNamesMixin = {
  methods: {
    mapNameKeyFromStatsItem,
  },
};

export default mapNamesMixin;
