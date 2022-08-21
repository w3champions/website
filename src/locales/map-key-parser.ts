const versionRegExp = new RegExp(/v\d.*/);

const parseVersionedMapName = (key: string) => {
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

export default parseVersionedMapName;
