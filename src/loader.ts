import { readdir, readFile } from "node:fs/promises";
import { pathToFileURL, URL } from "node:url";

type Format = "builtin" | "commonjs" | "json" | "module" | "wasm";
type Resolver = (
  specifier: string,
  context: {
    conditions: string[];
    importAssertations: unknown[];
    parentURL?: string;
  },
  defaultResolve: Resolver,
) => Promise<{ format?: Format; url: string; shortCircuit?: boolean }>;
type Loader = (
  url: string,
  context: { format?: Format; importAssertations: unknown[] },
  defaultLoad: Loader,
) => Promise<
  & { shortCircuit?: boolean }
  & (
    | { format: "builtin" }
    | { format: "commonjs" }
    | { format: "json"; source: string | ArrayBuffer | NodeJS.TypedArray }
    | { format: "module"; source: string | ArrayBuffer | NodeJS.TypedArray }
    | { format: "wasm"; source: ArrayBuffer | NodeJS.TypedArray }
  )
>;

const replaceExtension = (path: string, ext: string) =>
  `${path.slice(0, path.lastIndexOf("."))}.${ext}`;

const srcDir = pathToFileURL(process.env["RUNTT_SRC"]! + "/");
const transpiledDir = pathToFileURL(process.env["RUNTT_TRANSPILED"]! + "/");
const files = new Map(
  (await readdir(transpiledDir)).map(
    (name) =>
      [new URL(name, srcDir).toString(), new URL(name, transpiledDir)] as const,
  ),
);

export const resolve: Resolver = async (specifier, context, defaultResolve) => {
  const replaced = specifier.startsWith("file:")
    ? replaceExtension(specifier, "js")
    : specifier[0] === "."
    ? replaceExtension(
      new URL(specifier, context.parentURL).toString(),
      "js",
    )
    : null;
  if (replaced !== null && files.has(replaced)) {
    return { url: replaced, format: "module", shortCircuit: true };
  }
  return defaultResolve(specifier, context, defaultResolve);
};

export const load: Loader = async (url, context, defaultLoad) => {
  const transpiled = files.get(replaceExtension(url, "js"));
  if (transpiled !== undefined) {
    return {
      format: "module",
      source: await readFile(transpiled),
      shortCircuit: true,
    };
  }
  return defaultLoad(url, context, defaultLoad);
};
