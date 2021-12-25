const { readFileSync } = require("fs");
const { isMainThread, Worker } = require("worker_threads");
const { setTimeout } = require("timers/promises");

const instantiate = async () => {
  const buffer = readFileSync("./memory.wasm");
  const module = await WebAssembly.compile(buffer);
  const instance = await WebAssembly.instantiate(module);
  return instance.exports;
};

const NO_WORKERS = 10000;
const WORKER_CREATION_INTERVAL = 100;
const WORKER_END_INTERVAL = 1000 * 60 * 5;

if (isMainThread) {
  console.log(`Main started as process ${process.pid}`);
  (async () => {
    const wasm = await instantiate();
    const result = wasm.helloWorld();
    console.log(result);
    await setTimeout(10000); // Gives you time to note the PID and start monitoring (e.g. htop -p <PID>)
    for (let i = 0; i < NO_WORKERS; i++) {
      console.log(`Starting worker ${i}`);
      new Worker(__filename);
      await setTimeout(WORKER_CREATION_INTERVAL);
    }
  })();
} else {
  const wasm = instantiate();
  setTimeout(WORKER_END_INTERVAL).then(async () => {
    const was = await wasm;
    was.helloWorld();
  });
}
