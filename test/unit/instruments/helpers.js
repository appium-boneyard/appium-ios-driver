function getXcodeVersion (major = 7, minor = 3, patch = 1) {
  return {
    major,
    minor,
    patch,
    versionString: `${major}.${minor}.${patch}`,
    versionFloat: parseFloat(`{major}.${minor}`),
  };
}

export { getXcodeVersion };
