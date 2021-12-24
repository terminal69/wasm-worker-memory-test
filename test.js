const { isMainThread, Worker } = require("worker_threads");
const { setTimeout } = require("timers/promises");
const rust = require("./pkg");

const NO_WORKERS = 1000;
const WORKER_CREATION_INTERVAL = 1000;
const WORKER_END_INTERVAL = 1000 * 60 * 5;

if (isMainThread) {
  console.log(`Main started as process ${process.pid}`);
  (async () => {
    await setTimeout(10000); // Gives you time to note the PID and start monitoring (e.g. htop -p <PID>)
    for (let i = 0; i < NO_WORKERS; i++) {
      console.log(`Starting worker ${i}`);
      new Worker(__filename);
      await setTimeout(WORKER_CREATION_INTERVAL);
    }
  })();
} else {
  setTimeout(WORKER_END_INTERVAL).then(() => {
    rust.greet(`Worker end`);
  });
}
