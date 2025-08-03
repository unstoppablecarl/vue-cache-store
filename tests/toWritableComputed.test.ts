import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'
import { toWritableComputed } from '../src/toWritableComputed'

describe('toWriteableComputed()', async () => {
  it('computed() -> ref()', async () => {
    const obj = ref({ a: '1', b: '2' })

    const comp = computed(() => obj.value)
    const { a, b } = toWritableComputed(comp)

    test(obj, comp, a, b)
  })

  it('writable computed() -> ref()', async () => {
    const obj = ref({ a: '1', b: '2' })
    const comp = computed({
      get: () => obj.value,
      set: (val) => {
        obj.value = val
      },
    })

    const { a, b } = toWritableComputed(comp)

    test(obj, comp, a, b)
  })

  it('ref()', async () => {
    const obj = ref({ a: '1', b: '2' })

    const { a, b } = toWritableComputed(obj)

    expect(obj.value).toEqual({ a: '1', b: '2' })
    expect(a.value).toEqual('1')
    expect(b.value).toEqual('2')

    a.value = 'test'

    expect(a.value).toEqual('test')
    expect(b.value).toEqual('2')

    expect(obj.value).toEqual({ a: 'test', b: '2' })
  })
})

// @ts-expect-error
function test(obj, comp, a, b) {
  expect(obj.value).toEqual({ a: '1', b: '2' })
  expect(comp.value).toEqual({ a: '1', b: '2' })
  expect(a.value).toEqual('1')
  expect(b.value).toEqual('2')

  a.value = 'test'

  expect(a.value).toEqual('test')
  expect(b.value).toEqual('2')

  expect(obj.value).toEqual({ a: 'test', b: '2' })
  expect(comp.value).toEqual({ a: 'test', b: '2' })
}