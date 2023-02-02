import arg from "arg";
import { context, type Platform } from "esbuild";
import { dim } from "yoctocolors";
import { UserError } from "../errors";
import { commonOptions } from "../esbuild";

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
    const ctx = await context({
      ...commonOptions,
      entryPoints: options.files,
      minify: options.minify,
      outdir: options.out,
      platform: options.platform as Platform,
      plugins: [...commonOptions.plugins ?? [], {
        name: "runtt-build",
        setup(build) {
          build.onEnd(() => {
            console.log(dim("building..."));
          });
        },
      }],
    });
    if (options.watch) {
      await ctx.watch();
    } else {
      await ctx.rebuild();
      await ctx.dispose();
    }
  } catch {}
}
