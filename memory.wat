(module
  (func (result i32)
    (i32.const 42)
  )
  (export "helloWorld" (func 0))
  (memory $mem 1)
  (export "memory" (memory $mem))
)