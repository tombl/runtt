import { bold, red } from "yoctocolors";
import { version } from "../../package.json";

const descriptions = {
  build: "compile a program into an optimized bundle",
  run: "execute a program",
};

const HELP: Record<string, string> = {
  runtt: `${bold("runtt")} ${version}
the smallest TypeScript runttime and builder of the litter

${bold("usage:")}
  runtt <command> [arguments]

${bold("commands:")}
  run     ${descriptions.run}
  build   ${descriptions.build}

run "runtt help <command>" for more information about a command`,
  build: `${bold("runtt build")}
${descriptions.build}

${bold("usage:")}
  runtt build [options] <files...>
  
${bold("options:")}
  --minify                            minify the output
  --out, -o [dir]                     the output directory
  --platform <browser|neutral|node>   the output platform
  --watch, -w                         rebuilds on file changes`,
  run: `${bold("runtt run")}
${descriptions.run}

${bold("usage:")}
runtt run [options] <file>
  
${bold("options:")}
  --watch, -w   rebuilds on file changes`,
};

export default async function (argv: string[]) {
  const topic = argv[0] ?? "runtt";
  if (!(topic in HELP)) {
    console.log(`${red("error")}: unknown help topic\nrun "runtt help"`);
    process.exit(1);
  }
  console.log(HELP[topic]);
}
