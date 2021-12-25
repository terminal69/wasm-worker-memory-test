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

const NO_WASM = 10000;
const WASM_CREATION_INTERVAL = 100;

const wasms = [];

console.log(`Started process ${process.pid}`);
(async () => {
  const wasm = await instantiate();
  const result = wasm.helloWorld();
  console.log(result);
  wasms.push(wasm);
  await setTimeout(10000); // Gives you time to note the PID and start monitoring (e.g. htop -p <PID>)
  for (let i = 1; i < NO_WASM; i++) {
    console.log(`Starting wasm ${i}`);
    const was = await instantiate();
    wasms.push(was);
    await setTimeout(WASM_CREATION_INTERVAL);
  }
})();
