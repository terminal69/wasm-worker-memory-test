Tested using

wasm-pack 0.10.2
rustc 1.57.0 (stable)
nodejs 16.13.1

### 🛠️ Build with `wasm-pack build`

```
wasm-pack build --target nodejs
```

### Test with NodeJS

Run `node test.js`

```
Main started as process <PID>
Starting worker 0
Starting worker 1
Starting worker 2
...
```

Run `htop -p <PID>`

Virtual memory usage is about 10G per worker, once it gets to 1000G, resident is still under 500M, process crashes with

```
node:internal/event_target:777
  process.nextTick(() => { throw err; });
                           ^
RangeError [Error]: WebAssembly.Instance(): Out of memory: wasm memory
    at Object.<anonymous> (/home/stk/wasm-worker-memory-test/pkg/wasm_worker_memory_test.js:93:22)
    at Module._compile (node:internal/modules/cjs/loader:1101:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1153:10)
    at Module.load (node:internal/modules/cjs/loader:981:32)
    at Function.Module._load (node:internal/modules/cjs/loader:822:12)
    at Module.require (node:internal/modules/cjs/loader:1005:19)
    at require (node:internal/modules/cjs/helpers:102:18)
    at Object.<anonymous> (/home/stk/wasm-worker-memory-test/test.js:3:14)
    at Module._compile (node:internal/modules/cjs/loader:1101:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1153:10)
Emitted 'error' event on Worker instance at:
    at Worker.[kOnErrorMessage] (node:internal/worker:289:10)
    at Worker.[kOnMessage] (node:internal/worker:300:37)
    at MessagePort.<anonymous> (node:internal/worker:201:57)
    at MessagePort.[nodejs.internal.kHybridDispatch] (node:internal/event_target:562:20)
    at MessagePort.exports.emitMessage (node:internal/per_context/messageport:23:28)
```
