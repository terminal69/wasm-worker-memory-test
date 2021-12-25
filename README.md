Another approach, minimal WebAssembly using the guide at https://blog.scottlogic.com/2018/04/26/webassembly-by-hand.html

Converted from wat to wasm using https://github.com/wasmerio/vscode-wasm v1.3.1
Run using nodejs 16.13.1

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

Virtual memory usage is minimal, hello.wasm does not instantiate wasm memory. Ends eventually due to

```
...
Starting worker 1637
Starting worker 1638

<--- Last few GCs --->

[3091:0x7fb5e4a79b70]       18 ms: Scavenge 2.6 (3.8) -> 2.2 (4.6) MB, 1.3 / 0.0 ms  (average mu = 1.000, current mu = 1.000) allocation failure
[3091:0x7fb5e4a79b70]     8132 ms: Mark-sweep (reduce) 3.4 (4.8) -> 1.8 (4.1) MB, 1.6 / 0.0 ms  (+ 1.2 ms in 6 steps since start of marking, biggest step 0.3 ms, walltime since start of marking 3 ms) (average mu = 1.000, current mu = 1.000) finalize incre

<--- JS stacktrace --->

FATAL ERROR: MarkCompactCollector: young object promotion failed Allocation failed - JavaScript heap out of memory
Segmentation fault (core dumped)
```

Test 1(a)
memory.wasm initialises a single page memory (64kb) and exports it

Run `node test1a.js`

Even with this minimal implementation, we still run out of virtual memory

```
...
Starting worker 100
Starting worker 101

node:events:346
      throw er; // Unhandled 'error' event
      ^
RangeError [Error]: WebAssembly.instantiate(): Out of memory: wasm memory
    at instantiate (/home/stk/wasm-worker-memory-test/test1a.js:8:38)
Emitted 'error' event on process instance at:
    at emitUnhandledRejectionOrErr (node:internal/event_target:639:11)
    at MessagePort.[nodejs.internal.kHybridDispatch] (node:internal/event_target:464:9)
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

Similar to test 2, however we also instantiate a WebAssembly memory with initial size of 1 page in each worker

```
const memory = new WebAssembly.Memory({ initial: 1 });
```

This ends with

```
...
Starting worker 1631
Starting worker 1632

<--- Last few GCs --->


<--- JS stacktrace --->

FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory
 1: 0xa89e60 node::Abort() [node]
 2: 0x9ade29 node::FatalError(char const*, char const*) [node]
 3: 0xc7583e v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [node]
 4: 0xc75bb7 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [node]
 5: 0xe3f6d5  [node]
 6: 0xe4ec18  [node]
 7: 0xe5190c v8::internal::Heap::AllocateRawWithRetryOrFailSlowPath(int, v8::internal::AllocationType, v8::internal::AllocationOrigin, v8::internal::AllocationAlignment) [node]
 8: 0xe157da v8::internal::Factory::NewFillerObject(int, bool, v8::internal::AllocationType, v8::internal::AllocationOrigin) [node]
 9: 0x116d4ab v8::internal::Runtime_AllocateInYoungGeneration(int, unsigned long*, v8::internal::Isolate*) [node]
10: 0x15045f9  [node]
Aborted (core dumped)
```

If we set the maximum number of memory pages to 1

```
const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
```

Run `node test3a.js`

Ends with

```
...
Starting worker 1630
Starting worker 1631

<--- Last few GCs --->

[10466:0x7f58a4abcaa0]       18 ms: Scavenge 2.6 (3.8) -> 2.2 (4.3) MB, 0.7 / 0.0 ms  (average mu = 1.000, current mu = 1.000) allocation failure


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
