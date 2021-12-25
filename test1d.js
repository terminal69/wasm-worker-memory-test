const { readFileSync } = require("fs");
const { setTimeout } = require("timers/promises");

const instantiate = async () => {
  const buffer = readFileSync("./import.wasm");
  const module = await WebAssembly.compile(buffer);
  const importObject = {
    js: { mem: new WebAssembly.Memory({ initial: 1, maximum: 1 }) },
  };
  const instance = await WebAssembly.instantiate(module, importObject);
  return instance.exports;
};

console.log(`Started process ${process.pid}`);
(async () => {
  await setTimeout(10000); // Gives you time to note the PID and start monitoring (e.g. htop -p <PID>)
  const wasm = await instantiate();
  const result = wasm.helloWorld();
  console.log(result);
  await setTimeout(5 * 60 * 1000); // Keep process alive
})();
