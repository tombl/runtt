#!/usr/bin/env node
import arg from "arg";
import { inspect } from "util";
import { red, dim } from "yoctocolors";
import { UserError } from "./errors";

const commands: Record<
  string,
  () => Promise<{ default(argv: string[]): Promise<void> }>
> = {
  build: () => import("./commands/build"),
  run: () => import("./commands/run"),
  help: () => import("./commands/help"),
};

const argv = process.argv.slice(2);

if (argv.length === 0) argv.push("help");

if (!(argv[0] in commands)) {
  console.log(`${red("error")}: unknown command\nrun "runtt help" for usage`);
  process.exit(1);
}

const command = argv[0] in commands ? commands[argv[0]] : commands.help;

try {
  await (await command()).default(argv[0] in commands ? argv.slice(1) : argv);
} catch (error) {
  if (error instanceof arg.ArgError || error instanceof UserError) {
    console.error(`${red("error")}: ${error.message}`);
    process.exit(1);
  } else if (error instanceof Error) {
    console.error(`${red("error")}: ${error.message}`);
    console.error(dim(inspect(error, { colors: true })));
    process.exit(1);
  }
  throw error;
}
