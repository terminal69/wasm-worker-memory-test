(module
  (memory (import "js" "mem") 1)
  (func (result i32)
    (i32.const 42)
  )
  (export "helloWorld" (func 0))
)