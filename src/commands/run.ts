import arg from "arg";
import { context } from "esbuild";
import { ChildProcess, fork } from "node:child_process";
import { once } from "node:events";
import * as path from "node:path";
import { fileURLToPath, URL } from "node:url";
import tempy from "tempy";
import { dim } from "yoctocolors";
import { UserError } from "../errors";
import { commonOptions } from "../esbuild";

export default async function (argv: string[]) {
  const args = arg(
    {
      "--watch": Boolean,
      "-w": "--watch",
    },
    { argv, stopAtPositional: true },
  );
  const options = {
    watch: args["--watch"] ?? false,
    file: args._[0],
    argv: args._.slice(1),
  };
  if (options.file === undefined) {
    throw new UserError("no file to run");
  }
  const file = path.resolve(options.file);
  const outdir = tempy.directory({ prefix: "runtt_" });
  let subprocess: ChildProcess | null = null;
  async function run() {
    const loaderPath = (0, eval)(
      (() => {
        import("../loader");
      })
        .toString()
        .replace("import", "return"),
    )();
    if (loaderPath === undefined) {
      throw new UserError("run is unsupported in the bootstrap environment");
    }
    if (subprocess !== null) {
      subprocess.kill("SIGINT");
      await once(subprocess, "exit");
    }
    subprocess = fork(file, options.argv, {
      env: { RUNTT_SRC: path.dirname(file), RUNTT_TRANSPILED: outdir },
      execArgv: [
        "--enable-source-maps",
        "--experimental-loader",
        fileURLToPath(new URL(loaderPath, import.meta.url)),
        "--no-warnings",
      ],
    });
    subprocess.on("exit", (code) => {
      if (options.watch) {
        console.log(dim(`process exited with code ${code}`));
      } else {
        process.exitCode = code ?? 0;
      }
    });
  }
  const ctx = await context({
    ...commonOptions,
    entryPoints: [file],
    outdir,
    platform: "node",
    plugins: [...commonOptions.plugins ?? [], {
      name: "runtt-run",
      setup(build) {
        build.onEnd(() => {
          console.log(dim("building..."));
          run();
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
}
