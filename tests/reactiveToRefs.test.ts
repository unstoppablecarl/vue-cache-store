import { describe, expect, it } from 'vitest'
import { computed, reactive, ref } from 'vue'
import { reactiveToRefs } from '../src'

describe('reactiveToRefs()', async () => {
  it('ref()', async () => {

    const obj = reactive({
      foo: computed(() => 'foo'),
      bar: ref('bar'),
      func: () => 'func',
      re: reactive({ a: 'b' }),
      raw: 'string',
    })

    const refs = reactiveToRefs(obj)

    expect(refs.foo.value).toEqual('foo')
    expect(refs.bar.value).toEqual('bar')
    expect(refs.func).toBe(undefined)
    expect(refs.re.value).toEqual({ a: 'b' })
    expect(refs.raw).toEqual(undefined)
  })
})