import { readdir, readFile } from "fs/promises";
import { pathToFileURL, URL } from "url";

type Format = "builtin" | "commonjs" | "json" | "module" | "wasm";
type Resolver = (
  specifier: string,
  context: {
    conditions: string[];
    importAssertations: unknown[];
    parentURL?: string;
  },
  defaultResolve: Resolver
) => Promise<{
  format?: Format;
  url: string;
}>;
type Loader = (
  url: string,
  context: {
    format?: Format;
    importAssertations: unknown[];
  },
  defaultLoad: Loader
) => Promise<
  | {
      format: "builtin";
    }
  | { format: "commonjs" }
  | { format: "json"; source: string | ArrayBuffer | NodeJS.TypedArray }
  | { format: "module"; source: string | ArrayBuffer | NodeJS.TypedArray }
  | { format: "wasm"; source: ArrayBuffer | NodeJS.TypedArray }
>;

const replaceExtension = (path: string, ext: string) =>
  `${path.slice(0, path.lastIndexOf("."))}.${ext}`;

const srcDir = pathToFileURL(process.env.RUNTT_SRC! + "/");
const transpiledDir = pathToFileURL(process.env.RUNTT_TRANSPILED! + "/");
const files = new Map(
  (await readdir(transpiledDir)).map(
    (name) =>
      [new URL(name, srcDir).toString(), new URL(name, transpiledDir)] as const
  )
);

export const resolve: Resolver = async (specifier, context, defaultResolve) => {
  if (specifier.startsWith("file:")) {
    const replaced = replaceExtension(specifier, "js");
    if (files.has(replaced)) {
      return { url: replaced, format: "module" };
    }
  } else if (specifier[0] === ".") {
    const replaced = replaceExtension(
      new URL(specifier, context.parentURL).toString(),
      "js"
    );
    if (files.has(replaced)) {
      return { url: replaced, format: "module" };
    }
  }
  return defaultResolve(specifier, context, defaultResolve);
};

export const load: Loader = async (url, context, defaultLoad) => {
  const transpiled = files.get(replaceExtension(url, "js"));
  if (transpiled !== undefined) {
    return { format: "module", source: await readFile(transpiled) };
  }
  return defaultLoad(url, context, defaultLoad);
};
