import arg from "arg";
import { build, type Platform } from "esbuild";
import { dim } from "yoctocolors";
import { commonOptions } from "../esbuild";
import { UserError } from "../errors";

export default async function (argv: string[]) {
  const args = arg(
    {
      "--minify": Boolean,
      "--out": String,
      "--platform": String,
      "--watch": Boolean,
      "-o": "--out",
      "-w": "--watch",
    },
    { argv },
  );
  const options = {
    watch: args["--watch"] ?? false,
    platform: args["--platform"] ?? "node",
    out: args["--out"] ?? "dist",
    files: args._,
    minify: args["--minify"] ?? false,
  };
  if (!["node", "neutral", "browser"].includes(options.platform)) {
    throw new UserError("invalid platform");
  }
  if (options.files.length === 0) {
    throw new UserError("no input files");
  }
  try {
    await build({
      ...commonOptions,
      entryPoints: options.files,
      minify: options.minify,
      outdir: options.out,
      platform: options.platform as Platform,
      watch: options.watch
        ? {
          onRebuild(_error, result) {
            if (result !== null) {
              console.log(dim(`rebuilt ${options.files.join(", ")}`));
            }
          },
        }
        : false,
    });
  } catch {}
}
