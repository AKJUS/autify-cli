/* eslint-disable unicorn/filename-case */

import { Errors } from "@oclif/core";
import { execFileSync } from "node:child_process";
import { createWriteStream, lstatSync } from "node:fs";
import { basename, dirname, resolve, join } from "node:path";
import which from "which";
import archiver from "archiver";
import { once } from "node:events";
import StreamZip from "node-stream-zip";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

const checkBuildPath = (buildPath: string) => {
  if (!lstatSync(buildPath).isDirectory()) {
    throw new Errors.CLIError(
      `Build path (${buildPath}) is expected to directory.`
    );
  }

  const parentPath = resolve(dirname(buildPath));
  const name = basename(buildPath);
  return [parentPath, name];
};

const findZip = () => which.sync("zip", { nothrow: true });

export const createZip = async (buildPath: string): Promise<string> => {
  const [parentPath, name] = checkBuildPath(buildPath);
  const zipFile = join(
    await mkdtemp(join(tmpdir(), "autify-cli-")),
    "build.zip"
  );
  const zip = findZip();
  if (zip) {
    execFileSync(zip, ["-r", zipFile, name], { cwd: parentPath });
  } else {
    const archive = archiver("zip");
    const output = createWriteStream(zipFile);
    const close = once(output, "close");
    archive.pipe(output);
    archive.directory(buildPath, name);
    await archive.finalize();
    await close;
  }

  // Ensure zip file is valid.
  try {
    // eslint-disable-next-line new-cap
    const zipStream = new StreamZip.async({ file: zipFile });
    await zipStream.close();
  } catch (error) {
    throw new Errors.CLIError(
      `Failed to create a valid zip file (${zipFile}): ${error}`
    );
  }

  return zipFile;
};
