import { describe, expectTypeOf, it } from 'vitest'
import type { Reactive, ToRefs } from 'vue'
import { type GenericRecordStore, makeRecordStore, type RecordStore } from '../src'


type Item = {
  id: number,
  name: string,
}

type ItemInfo = {
  id: number,
  name: string,
  context: RecordStore<number, ItemInfo>
}

describe('makeCacheStore() types', async () => {

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

  it('test inferred types', async () => {

    const store = makeRecordStore((id: number, context): Item => {

      if (id !== 44) {
        const otherItem = context.get(44)
        expectTypeOf(otherItem).toEqualTypeOf<Item>()
      }

      expectTypeOf<
        Parameters<typeof context.get>[0]
      >().toEqualTypeOf<number>()

      return {
        id,
        name: 'susan',
      }
    })

    const item = store.get(99)

    expectTypeOf(item).toEqualTypeOf<Item>()
  })

  it('makeRecordStore() types: id number', () => {

    const cache = makeRecordStore<number, ItemInfo>((id, context) => {
      return {
        id,
        name: 'susan',
        context,
      }
    })

    expectTypeOf(cache).toEqualTypeOf<RecordStore<number, ItemInfo>>()
    expectTypeOf<Parameters<typeof cache.get>[0]>().toEqualTypeOf<number>()
    expectTypeOf<Parameters<typeof cache.getRefs>[0]>().toEqualTypeOf<number>()
    expectTypeOf<Parameters<typeof cache.has>[0]>().toEqualTypeOf<number>()
    expectTypeOf<Parameters<typeof cache.remove>[0]>().toEqualTypeOf<number>()
    expectTypeOf(cache.get(99)).toEqualTypeOf<ItemInfo>()
    expectTypeOf(cache.get(99)).toEqualTypeOf<Reactive<ItemInfo>>()
    expectTypeOf<ReturnType<typeof cache.get>>().toEqualTypeOf<ItemInfo>()
    expectTypeOf<ReturnType<typeof cache.getRefs>>().toEqualTypeOf<ToRefs<Reactive<ItemInfo>>>()
    expectTypeOf<ReturnType<typeof cache.ids>>().toEqualTypeOf<number[]>()

    const context = cache.get(99).context
    expectTypeOf(context).toEqualTypeOf<RecordStore<number, ItemInfo>>()
    expectTypeOf<Parameters<typeof context.get>[0]>().toEqualTypeOf<number>()
    expectTypeOf<Parameters<typeof context.getRefs>[0]>().toEqualTypeOf<number>()
    expectTypeOf<Parameters<typeof context.has>[0]>().toEqualTypeOf<number>()
    expectTypeOf<Parameters<typeof context.remove>[0]>().toEqualTypeOf<number>()
    expectTypeOf(context.get(99)).toEqualTypeOf<ItemInfo>()
    expectTypeOf(context.get(99)).toEqualTypeOf<Reactive<ItemInfo>>()
    expectTypeOf<ReturnType<typeof context.get>>().toEqualTypeOf<ItemInfo>()
    expectTypeOf<ReturnType<typeof context.getRefs>>().toEqualTypeOf<ToRefs<Reactive<ItemInfo>>>()
    expectTypeOf<ReturnType<typeof context.ids>>().toEqualTypeOf<number[]>()

  })

  it('makeRecordStore() types: id string', () => {

    type ItemInfo = {
      id: string,
      name: string,
      context: RecordStore<string, ItemInfo>
    }

    const cache = makeRecordStore<string, ItemInfo>((id, context) => {
      return {
        id,
        name: 'susan',
        context,
      }
    })

    expectTypeOf(cache).toEqualTypeOf<RecordStore<string, ItemInfo>>()
    expectTypeOf<Parameters<typeof cache.get>[0]>().toEqualTypeOf<string>()
    expectTypeOf<Parameters<typeof cache.getRefs>[0]>().toEqualTypeOf<string>()
    expectTypeOf<Parameters<typeof cache.has>[0]>().toEqualTypeOf<string>()
    expectTypeOf<Parameters<typeof cache.remove>[0]>().toEqualTypeOf<string>()
    expectTypeOf(cache.get('A')).toEqualTypeOf<ItemInfo>()
    expectTypeOf(cache.get('A')).toEqualTypeOf<Reactive<ItemInfo>>()
    expectTypeOf<ReturnType<typeof cache.get>>().toEqualTypeOf<ItemInfo>()
    expectTypeOf<ReturnType<typeof cache.getRefs>>().toEqualTypeOf<ToRefs<Reactive<ItemInfo>>>()
    expectTypeOf<ReturnType<typeof cache.ids>>().toEqualTypeOf<string[]>()

    const context = cache.get('A').context
    expectTypeOf(context).toEqualTypeOf<RecordStore<string, ItemInfo>>()
    expectTypeOf<Parameters<typeof context.get>[0]>().toEqualTypeOf<string>()
    expectTypeOf<Parameters<typeof context.getRefs>[0]>().toEqualTypeOf<string>()
    expectTypeOf<Parameters<typeof context.has>[0]>().toEqualTypeOf<string>()
    expectTypeOf<Parameters<typeof context.remove>[0]>().toEqualTypeOf<string>()
    expectTypeOf(context.get('A')).toEqualTypeOf<ItemInfo>()
    expectTypeOf(context.get('A')).toEqualTypeOf<Reactive<ItemInfo>>()
    expectTypeOf<ReturnType<typeof context.get>>().toEqualTypeOf<ItemInfo>()
    expectTypeOf<ReturnType<typeof context.getRefs>>().toEqualTypeOf<ToRefs<Reactive<ItemInfo>>>()
    expectTypeOf<ReturnType<typeof context.ids>>().toEqualTypeOf<string[]>()

  })
})