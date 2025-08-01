import { describe, expect, expectTypeOf, it } from 'vitest'
import type { Reactive, ToRefs } from 'vue'
import { makeRecordStore, type GenericRecordStore, type RecordStore } from '../src'

type Item = {
  id: number,
  name: string,
}

describe('defineCacheStore() types', async () => {
  it('check readme type explanation is accurate', async () => {
    type CustomCacheStore = {
      ids(): any[],
      get(id: any): Reactive<Item>,
      getRefs(id: any): ToRefs<Reactive<Item>>,
      has(id: any): boolean,
      remove(id: any): void,
      clear(): void,
    }

    const cache: CustomCacheStore = makeRecordStore((id: number, context: RecordStore<Item>): Item => {
      return {
        id,
        name: 'susan',
      }
    })

    expectTypeOf(cache).toEqualTypeOf<CustomCacheStore>()
  })

  it('type GenericCacheStore', async () => {
    function creatorFunction(id: number) {
      return {
        id,
        name: 'susan',
      }
    }

    const store: GenericRecordStore = makeRecordStore(creatorFunction)
    expectTypeOf(store).toEqualTypeOf<GenericRecordStore>()
  })

  it('type CacheStore', () => {
    let called = 0

    function creatorFunction(id: number, context: RecordStore<Item, number>) {
      called++
      expectTypeOf(context).toEqualTypeOf<RecordStore<Item, number>>()
      return {
        id,
        name: 'susan',
      }
    }

    const cache = makeRecordStore(creatorFunction)

    expectTypeOf(cache).toEqualTypeOf<RecordStore<Item, number>>()

    cache.get(99)
    expect(called).toEqual(1)
  })
})