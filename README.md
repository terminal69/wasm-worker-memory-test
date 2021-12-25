Tested using

wasm-pack 0.10.2
rustc 1.57.0 (stable)
nodejs 16.13.1

### 🛠️ Pre-built

Added the following to .cargo/config.toml to allow importing memory

```
[target.wasm32-unknown-unknown]
rustflags = [
  "-C",
  "link-args=--import-memory --initial-memory=1114112 --max-memory=1114112",
]
```

```
wasm-pack build --target nodejs
```

Edited line 3 in wasm_worker_memory_test.js to
```
imports["env"] = { memory: new WebAssembly.Memory({ initial: 17, maximum: 17 }) };
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

The result is the similar, virtual memory usage is about 10G per worker, once it gets to 1000G (about 100 workers), resident is still under 500M, process crashes with the following error

```
...
Starting worker 100
Starting worker 101

node:events:346
      throw er; // Unhandled 'error' event
      ^
RangeError [Error]: WebAssembly.Memory(): could not allocate memory
    at Object.<anonymous> (/home/stk/wasm-worker-memory-test/build/wasm_worker_memory_test.js:3:28)
    at Module._compile (node:internal/modules/cjs/loader:1092:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1121:10)
    at Module.load (node:internal/modules/cjs/loader:972:32)
    at Function.Module._load (node:internal/modules/cjs/loader:813:14)
    at Module.require (node:internal/modules/cjs/loader:996:19)
    at require (node:internal/modules/cjs/helpers:92:18)
    at Object.<anonymous> (/home/stk/wasm-worker-memory-test/test.js:3:14)
    at Module._compile (node:internal/modules/cjs/loader:1092:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1121:10)
Emitted 'error' event on process instance at:
    at emitUnhandledRejectionOrErr (node:internal/event_target:639:11)
    at MessagePort.[nodejs.internal.kHybridDispatch] (node:internal/event_target:464:9)
    at MessagePort.exports.emitMessage (node:internal/per_context/messageport:23:28)
```

The previous error (commit 8a6d3f) was
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

### Second test

This shows that we are able to start way more than 100 workers when the workers are not doing anything but waiting for a timeout

Run `node test2.js` (adjust variables in the script)

When trying to start 10000 workers and WORKER_CREATION_INTERVAL set to 10ms, it crashes with the following error

```
...
Starting worker 1795
Starting worker 1796
Starting worker 1797

#
# Fatal process OOM in CodeRange setup: allocate virtual memory
#



#
# Fatal error in , line 0
# Check failed: ReleasePages(page_allocator_, reinterpret_cast<void*>(region_.begin()), old_size, region_.size()).
#
#
#
#FailureMessage Object: 0x7f6b06197c00

#
# Fatal process OOM in New space setup
#


#
# Fatal process OOM in CodeRange setup: allocate virtual memory
#

Illegal instruction (core dumped)
```

With `WORKER_CREATION_INTERVAL = 100`

```
...
Starting worker 1634
Starting worker 1635
Starting worker 1636

<--- Last few GCs --->

[19760:0x7f95dcac5b20]       26 ms: Scavenge 2.6 (3.8) -> 2.2 (4.3) MB, 0.7 / 0.0 ms  (average mu = 1.000, current mu = 1.000) allocation failure
[19760:0x7f95dcac5b20]     8140 ms: Mark-sweep (reduce) 3.4 (4.8) -> 1.8 (4.1) MB, 1.4 / 0.0 ms  (+ 0.7 ms in 7 steps since start of marking, biggest step 0.1 ms, walltime since start of marking 2 ms) (average mu = 1.000, current mu = 1.000) finalize incr

<--- JS stacktrace --->

FATAL ERROR: MarkCompactCollector: young object promotion failed Allocation failed - JavaScript heap out of memory
 1: 0xa89e60 node::Abort() [node]
 2: 0x9ade29 node::FatalError(char const*, char const*) [node]
 3: 0xc7583e v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [node]
 4: 0xc75bb7 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [node]
 5: 0xe3f6d5  [node]
 6: 0xe6ec63 v8::internal::EvacuateNewSpaceVisitor::Visit(v8::internal::HeapObject, int) [node]
 7: 0xe7b816 v8::internal::FullEvacuator::RawEvacuatePage(v8::internal::MemoryChunk*, long*) [node]
 8: 0xe6793f v8::internal::Evacuator::EvacuatePage(v8::internal::MemoryChunk*) [node]
 9: 0xe67bb8 v8::internal::PageEvacuationTask::RunInParallel(v8::internal::ItemParallelJob::Task::Runner) [node]
10: 0xe599d9 v8::internal::ItemParallelJob::Run() [node]
11: 0xe7d7a0 void v8::internal::MarkCompactCollectorBase::CreateAndExecuteEvacuationTasks<v8::internal::FullEvacuator, v8::internal::MarkCompactCollector>(v8::internal::MarkCompactCollector*, v8::internal::ItemParallelJob*, v8::internal::MigrationObserver*, long) [node]
12: 0xe7dfe3 v8::internal::MarkCompactCollector::EvacuatePagesInParallel() [node]
13: 0xe7e3a5 v8::internal::MarkCompactCollector::Evacuate() [node]
14: 0xe90b11 v8::internal::MarkCompactCollector::CollectGarbage() [node]
15: 0xe4c9d8 v8::internal::Heap::MarkCompact() [node]
16: 0xe4e368 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags) [node]
17: 0xe4f0b7 v8::internal::Heap::FinalizeIncrementalMarkingIfComplete(v8::internal::GarbageCollectionReason) [node]
18: 0xe53503 v8::internal::IncrementalMarkingJob::Task::RunInternal() [node]
19: 0xd6c50b non-virtual thunk to v8::internal::CancelableTask::Run() [node]
20: 0xafa1c4 node::PerIsolatePlatformData::RunForegroundTask(std::unique_ptr<v8::Task, std::default_delete<v8::Task> >) [node]
21: 0xafc029 node::PerIsolatePlatformData::FlushForegroundTasksInternal() [node]
22: 0x14806f6  [node]
23: 0x1493485  [node]
24: 0x1481028 uv_run [node]
25: 0x9d4095 node::SpinEventLoop(node::Environment*) [node]
26: 0xb521b9 node::worker::Worker::Run() [node]
27: 0xb529c8  [node]
28: 0x7f97ae2e5427  [/lib64/libc.so.6]
29: 0x7f97ae36e810  [/lib64/libc.so.6]
Aborted (core dumped)
```

### Third test

Run `node test3.js`

Similar to test 2, however we also instantiate a WebAssembly memory with initial size of 17 pages in each worker (equal to what is required by our wasm-pack example)

```
const memory = new WebAssembly.Memory({ initial: 17 });
```

This ends with

```
...
Starting worker 1631
Starting worker 1632


#
# Fatal error in , line 0
# Check failed: ReleasePages(page_allocator_, reinterpret_cast<void*>(region_.begin()), old_size, region_.size()).
#
#
#
#FailureMessage Object: 0x7fd2b26f9c00
 1: 0xaf8b71  [node]
 2: 0x1b04234 V8_Fatal(char const*, ...) [node]
 3: 0x1212649  [node]
 4: 0xe9cbbd v8::internal::MemoryAllocator::PartialFreeMemory(v8::internal::BasicMemoryChunk*, unsigned long, unsigned long, unsigned long) [node]
 5: 0xec53f0 v8::internal::Page::ShrinkToHighWaterMark() [node]
 6: 0xeb1d48 v8::internal::PagedSpace::ShrinkImmortalImmovablePages() [node]
 7: 0xe3ea88 v8::internal::Heap::NotifyDeserializationComplete() [node]
 8: 0xde77b2 v8::internal::Isolate::Init(v8::internal::ReadOnlyDeserializer*, v8::internal::StartupDeserializer*) [node]
 9: 0x1204def  [node]
10: 0xca0518 v8::Isolate::Initialize(v8::Isolate*, v8::Isolate::CreateParams const&) [node]
11: 0xb51612 node::worker::Worker::Run() [node]
12: 0xb529c8  [node]
13: 0x7fd74ab46427  [/lib64/libc.so.6]
14: 0x7fd74abcf810  [/lib64/libc.so.6]
Illegal instruction (core dumped)
```

If we set the maximum number of memory pages to 17

```
const memory = new WebAssembly.Memory({ initial: 17, maximum: 17 });
```

Run `node test3a.js`

Ends with

```
...
Starting worker 1630
Starting worker 1631

<--- Last few GCs --->

[26143:0x7f4e4ca0ff90]       37 ms: Scavenge 2.6 (3.8) -> 2.2 (4.3) MB, 0.8 / 0.0 ms  (average mu = 1.000, current mu = 1.000) allocation failure


<--- JS stacktrace --->

FATAL ERROR: MarkCompactCollector: young object promotion failed Allocation failed - JavaScript heap out of memory
 1: 0xa89e60 node::Abort() [node]
 2: 0x9ade29 node::FatalError(char const*, char const*) [node]
 3: 0xc7583e v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [node]
 4: 0xc75bb7 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [node]
 5: 0xe3f6d5  [node]
 6: 0xe6ec63 v8::internal::EvacuateNewSpaceVisitor::Visit(v8::internal::HeapObject, int) [node]
 7: 0xe7b816 v8::internal::FullEvacuator::RawEvacuatePage(v8::internal::MemoryChunk*, long*) [node]
 8: 0xe6793f v8::internal::Evacuator::EvacuatePage(v8::internal::MemoryChunk*) [node]
 9: 0xe67bb8 v8::internal::PageEvacuationTask::RunInParallel(v8::internal::ItemParallelJob::Task::Runner) [node]
10: 0xe599d9 v8::internal::ItemParallelJob::Run() [node]
11: 0xe7d7a0 void v8::internal::MarkCompactCollectorBase::CreateAndExecuteEvacuationTasks<v8::internal::FullEvacuator, v8::internal::MarkCompactCollector>(v8::internal::MarkCompactCollector*, v8::internal::ItemParallelJob*, v8::internal::MigrationObserver*, long) [node]
12: 0xe7dfe3 v8::internal::MarkCompactCollector::EvacuatePagesInParallel() [node]
13: 0xe7e3a5 v8::internal::MarkCompactCollector::Evacuate() [node]
14: 0xe90b11 v8::internal::MarkCompactCollector::CollectGarbage() [node]
15: 0xe4c9d8 v8::internal::Heap::MarkCompact() [node]
16: 0xe4e368 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags) [node]
17: 0xe4f95a v8::internal::Heap::CollectGarbageOnMemoryPressure() [node]
18: 0xe4fbfd v8::internal::Heap::CheckMemoryPressure() [node]
19: 0xe4ff68 v8::internal::Heap::MemoryPressureNotification(v8::MemoryPressureLevel, bool) [node]
20: 0xf64211 v8::internal::BackingStore::TryAllocateWasmMemory(v8::internal::Isolate*, unsigned long, unsigned long, v8::internal::SharedFlag) [node]
21: 0xf64535 v8::internal::BackingStore::AllocateWasmMemory(v8::internal::Isolate*, unsigned long, unsigned long, v8::internal::SharedFlag) [node]
22: 0x131612c v8::internal::WasmMemoryObject::New(v8::internal::Isolate*, unsigned int, unsigned int, v8::internal::SharedFlag) [node]
23: 0x12f7576  [node]
24: 0xce3245  [node]
25: 0xce3862  [node]
26: 0xce3e76 v8::internal::Builtin_HandleApiCall(int, unsigned long*, v8::internal::Isolate*) [node]
27: 0x15046d9  [node]
Aborted (core dumped)
```
