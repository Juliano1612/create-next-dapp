import { execSync } from "child_process";

export const launchUrl = (url) => {
  let command;
  const options = {};

  switch (process.platform) {
    case "win32":
      command = `start "" "${url}"`;
      options["windowsHide"] = true;
      break;

    case "darwin":
      command = `open "${url}"`;
      break;

    case "freebsd":
    case "openbsd":
    case "sunos":
    case "linux":
      command = `xdg-open "${url}"`;
      break;

    case "aix":
      command = `defaultbrowser "${url}`;
      break;

    case "android":
      command = ``;
      break;
  }

  try {
    execSync(command, options);
  } catch (e) {
    return e;
  }

  return null;
}
