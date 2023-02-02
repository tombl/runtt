#!/usr/bin/env node
import arg from "arg";
import { inspect } from "node:util";
import { dim, red } from "yoctocolors";
import { UserError } from "./errors";

type Command = () => Promise<{ default(argv: string[]): Promise<void> }>;

const commands: Record<string, Command> = {
  build: () => import("./commands/build"),
  run: () => import("./commands/run"),
  help: () => import("./commands/help"),
};

const argv = process.argv.slice(2);

const command = commands[argv[0] ?? "help"];

if (!command) {
  console.log(`${red("error")}: unknown command\nrun "runtt help" for usage`);
  process.exit(1);
}

try {
  await (await command()).default(argv);
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
