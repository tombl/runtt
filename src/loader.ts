import { URL } from "url";
import { workerData } from "worker_threads";

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

export const resolve: Resolver = async (specifier, context, defaultResolve) => {
  if (specifier.startsWith("file:")) {
    const replaced = replaceExtension(specifier, "js");
    if (replaced in files) {
      return { url: replaced, format: "module" };
    }
  } else if (specifier[0] === ".") {
    const replaced = replaceExtension(
      new URL(specifier, context.parentURL).toString(),
      "js"
    );
    if (replaced in files) {
      return { url: replaced, format: "module" };
    }
  }
  return defaultResolve(specifier, context, defaultResolve);
};

const { files, buf } = workerData as {
  files: Record<string, [number, number]>;
  buf: Uint8Array;
};
export const load: Loader = async (url, context, defaultLoad) => {
  const path = replaceExtension(url, "js");
  if (path in files) {
    const [start, end] = files[path];
    return { format: "module", source: buf.slice(start, end) };
  }
  return defaultLoad(url, context, defaultLoad);
};
