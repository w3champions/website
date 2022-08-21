const versionRegExp = new RegExp(/v\d.*/);

export const parseVersionedMapName = (key: string) => {
  const version = versionRegExp.exec(key);
  if (version) {
    const mapKey = key.slice(0, version.index).toLowerCase();
    return {
      mapKey,
      version: version[0],
    };
  }

  return {
    mapKey: key,
  };
};

const mapNamesMixin = {
  methods: {
    mapNameKeyFromStatsItem: function (name: string) {
      const parsedKey = parseVersionedMapName(name).mapKey;
      return "mapNames." + parsedKey;
    },
  },
};

export default mapNamesMixin;
