/**
 * @param {Object[]} schema
 * @param {String} schema[].long - long form option: `--long-form`
 * @param {String} schema[].sort - sort form option: `--sort-form`
 * @param {String} schema[].value - default value
 * @param {String[]} argv
 * @returns {Array[Map,String[]]} Map of options and Array of positional arguments
 *
 * @example

  // Imagine this is a tar like program

  // returns:
  [
   Map([
   (--verbose) => { value: false, }
   (-v) => { value: false },
   (--file) => { value: "archive.tar.gz" }
   (-f) -> { value: "archive.tar.gz" }
   ]),
   [ "target-dir" ]
  ]

  getopts([{
   long: "--verbose",
   short: "-v"
   },{
   long: "--file",
   short: "-f"
   }],
   [ "--verbose", "-f", "archive.tar.gz", "target-dir"]
   )
 *
 */

function getopts(schema, argv) {
  const options = new Map();
  const posargs = [];

  schema.forEach((option) => {
    option.long && options.set(option.long, option);
    option.short && options.set(option.short, option);
  });

  parseArgs(argv.slice(0), options, posargs);

  for (const [name, option] of options.entries()) {
    options.set(name, option.value ?? (isFlagArg(option) ? false : ""));
  }

  return [options, posargs];

  function parseArgs(args, options, posargs) {
    if (!args.length) {
      return;
    } else if (isPosArg(args[0])) {
      posargs.push(args.shift());
      parseArgs(args, options, posargs);
    } else if (isShortChainArg(args[0])) {
      parseArgs(
        args
          .shift()
          .split("")
          .slice(1)
          .map((arg) => `-${arg}`)
          .concat(args),
        options,
        posargs,
      );
    } else {
      let [name, value] = parseEqualDelimited(args);
      const option = options.get(name ?? args[0]);
      if (!option) {
        throw new Error(`Unrecognized option: '${name ?? args[0]}'`);
      } else if (!name) {
        [name, value] = parseSpaceDelimited(args, option);
      }

      option.value = value ?? option.value;
      parseArgs(args, options, posargs);
    }
  }

  const rePosArg = new RegExp(/^[^-\s].*$/);
  function isPosArg(arg) {
    return rePosArg.test(arg);
  }
  const reShortChainArg = new RegExp(/^-\w{2,}$/);
  function isShortChainArg(arg) {
    return reShortChainArg.test(arg);
  }
  function isFlagArg(arg) {
    return arg.flag ?? true;
  }
  function parseEqualDelimited(args) {
    const match = args[0].match("=");
    if (!match) return [];
    const arg = args.shift();
    return [arg.slice(0, match.index), arg.slice(match.index + 1)];
  }
  function parseSpaceDelimited(args, option) {
    return [
      args.shift(),
      isFlagArg(option) ? true : isPosArg(args[0]) ? args.shift() : null,
    ];
  }
}

export { getopts };
