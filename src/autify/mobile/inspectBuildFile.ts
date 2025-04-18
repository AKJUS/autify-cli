/* eslint-disable unicorn/filename-case */
import { Errors } from "@oclif/core";
import { lstatSync } from "node:fs";
import { createZip } from "./createZip";

const isIosApp = (buildPath: string) => {
  return (
    (lstatSync(buildPath).isDirectory() &&
      buildPath.replace(/\/$/, "").endsWith(".app")) ||
    (lstatSync(buildPath).isFile() && buildPath.endsWith(".ipa"))
  );
};

const isAndroidApp = (buildPath: string) => {
  return lstatSync(buildPath).isFile() && buildPath.endsWith(".apk");
};

const getOs = (buildPath: string) => {
  if (isIosApp(buildPath)) return "ios";
  if (isAndroidApp(buildPath)) return "android";
  throw new Errors.CLIError(
    `${buildPath} doesn't look like iOS app nor Android apk.`
  );
};

const getUploadPath = async (buildPath: string, os: "ios" | "android") => {
  if (os === "ios") {
    if (buildPath.endsWith(".ipa")) return buildPath;
    return createZip(buildPath);
  }

  if (os === "android") return buildPath;
  throw new Errors.CLIError(`Invalid os: ${os}`);
};

export const inspectBuildFile = async (
  buildPath: string
): Promise<[string, "ios" | "android"]> => {
  const os = getOs(buildPath);
  const uploadPath = await getUploadPath(buildPath, os);
  return [uploadPath, os];
};
