import type { BuildOptions } from "esbuild";
export const commonOptions: BuildOptions = {
  bundle: true,
  format: "esm",
  sourcemap: "external",
  splitting: true,
  plugins: [
    {
      name: "external",
      setup(build) {
        build.onResolve(
          { filter: /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ },
          ({ path }) => ({ path, external: true })
        );
      },
    },
  ],
};
