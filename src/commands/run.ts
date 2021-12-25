import arg from "arg";
import { build, BuildResult } from "esbuild";
import * as path from "path";
import { fileURLToPath, pathToFileURL, URL } from "url";
import { Worker } from "worker_threads";
import { commonOptions } from "../esbuild";
import { UserError } from "../errors";
import { dim } from "yoctocolors";

export default async function (argv: string[]) {
  const args = arg(
    {
      "--watch": Boolean,
      "-w": "--watch",
    },
    { argv, stopAtPositional: true }
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
  let worker: Worker | null = null;
  function handleResult(result: BuildResult) {
    const files: Record<string, [number, number]> = {};
    const size = result
      .outputFiles!.map((file) => file.contents.byteLength)
      .reduce((acc, size) => acc + size);
    let index = 0;
    const buf = new Uint8Array(size);
    for (const file of result.outputFiles!) {
      buf.set(file.contents, index);
      files[pathToFileURL(file.path).toString()] = [
        index,
        (index += file.contents.byteLength),
      ];
    }

    const loaderPath = (0, eval)(
      (() => {
        import("../loader");
      })
        .toString()
        .replace("import", "return")
    )();
    if (loaderPath === undefined) {
      throw new UserError("run is unsupported in the bootstrap environment");
    }
    worker?.terminate();
    worker = new Worker(file, {
      workerData: { files, buf },
      transferList: [buf.buffer],
      execArgv: [
        "--enable-source-maps",
        "--experimental-loader",
        fileURLToPath(new URL(loaderPath, import.meta.url)),
        "--no-warnings",
      ],
      argv: options.argv,
    });
    worker.on("error", (error) => {
      console.error(error);
    });
    worker.on("exit", (code) => {
      if (options.watch) {
        console.log(dim(`process exited with code ${code}`));
      } else {
        process.exitCode = code;
      }
    });
  }

  try {
    const result = await build({
      ...commonOptions,
      entryPoints: [path.resolve(options.file)],
      outdir: path.dirname(file),
      platform: "node",
      allowOverwrite: true,
      write: false,
      watch: options.watch
        ? {
            async onRebuild(error, result) {
              if (result !== null) {
                console.log(dim(`restarting ${options.file}`));
                handleResult(result);
              }
            },
          }
        : false,
    });
    handleResult(result);
  } catch {}
}
