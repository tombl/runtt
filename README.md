# runtt
> The smallest Node.js TypeScript runttime and builder of the litter

## Goals
- A `go`/`cargo`/`deno` inspired all-in-one experience
- Fast for development
- Builds an efficient prod bundle

## Usage
```
$ runtt help

usage:
  runtt <command> [arguments]

commands:
  build   compile a program into a bundle
  run     execute a program

run "runtt help <command>" for more information about a command
```

```
$ runtt help build
runtt build
compile a program into a bundle

usage:
  runtt build [options] <files...>
  
options:
  --minify                            minify the output
  --out, -o [dir]                     the output directory
  --platform <browser|neutral|node>   the output platform
  --watch, -w                         rebuilds on file changes
```

```
$ runtt help run
runtt run
execute a program

usage:
  runtt run [options] <file>
  
options:
  --watch, -w   rebuilds on file changes
```