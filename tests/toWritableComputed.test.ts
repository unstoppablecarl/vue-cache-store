import { describe, expect, expectTypeOf, it } from 'vitest'
import { computed, type ComputedRef, nextTick, type Ref, ref, watch, type WritableComputedRef } from 'vue'

import { toWritableComputed } from '../src'

describe('toWriteableComputed()', async () => {

  it('computed() -> computed() -> ref()', async () => {
    const av = 'something'
    const bv = 99

    let count = 0
    const obj = ref({ a: av, b: bv })
    const compA = computed(() => obj.value)

    watch(() => {
      return compA.value.a
    }, () => {
      count++
    })
    const comp = computed(() => compA.value)

    const { a, b } = toWritableComputed(comp)

    await nextTick()
    test(obj, comp, a, b, av, bv)

    await nextTick()

    expect(count).toBe(1)
  })

  it('computed() -> ref()', async () => {

    const av = 'something'
    const bv = 99
    const obj = ref({ a: av, b: bv })

    const comp = computed(() => obj.value)
    const { a, b } = toWritableComputed(comp)

    test(obj, comp, a, b, av, bv)
  })

  it('writable computed() -> ref()', async () => {
    const av = 'something'
    const bv = 99
    const obj = ref({ a: av, b: bv })
    const comp = computed({
      get: () => obj.value,
      set: (val) => {
        obj.value = val
      },
    })

    const { a, b } = toWritableComputed(comp)

    test(obj, comp, a, b, av, bv)
  })

  it('ref()', async () => {
    const av = 'something'
    const bv = 99
    const obj = ref({ a: av, b: bv })

    const { a, b } = toWritableComputed(obj)

    const comp = computed(() => obj.value)
    test(obj, comp, a, b, av, bv)
  })
})

function test(
  obj: Ref,
  comp: ComputedRef<any> | WritableComputedRef<any>,
  a: WritableComputedRef<string>,
  b: WritableComputedRef<number>,
  av: string,
  bv: number,
) {

  expectTypeOf(a).toEqualTypeOf<WritableComputedRef<string>>()
  expectTypeOf(b).toEqualTypeOf<WritableComputedRef<number>>()
  expectTypeOf(a.value).toEqualTypeOf<string>()
  expectTypeOf(b.value).toEqualTypeOf<number>()

  expect(obj.value).toEqual({ a: av, b: bv })
  expect(comp.value).toEqual({ a: av, b: bv })
  expect(a.value).toEqual(av)
  expect(b.value).toEqual(bv)

  a.value = 'test'

  expect(a.value).toEqual('test')
  expect(b.value).toEqual(bv)

  expect(obj.value).toEqual({ a: 'test', b: bv })
  expect(comp.value).toEqual({ a: 'test', b: bv })

  obj.value.a = 'test2'

  expect(a.value).toEqual('test2')
  expect(b.value).toEqual(bv)

  expect(obj.value).toEqual({ a: 'test2', b: bv })
  expect(comp.value).toEqual({ a: 'test2', b: bv })

}