function parseVersion(version) {
  if (typeof version !== "string") {
    return [];
  }

  return version
    .trim()
    .split(".")
    .map((part) => {
      const numericPart = part.match(/^\d+/)?.[0];
      return numericPart ? Number(numericPart) : 0;
    });
}

function compareSemanticVersions(currentVersion, latestVersion) {
  const currentParts = parseVersion(currentVersion);
  const latestParts = parseVersion(latestVersion);
  const maxLength = Math.max(currentParts.length, latestParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const currentPart = currentParts[index] || 0;
    const latestPart = latestParts[index] || 0;

    if (currentPart < latestPart) {
      return -1;
    }

    if (currentPart > latestPart) {
      return 1;
    }
  }

  return 0;
}

module.exports = compareSemanticVersions;