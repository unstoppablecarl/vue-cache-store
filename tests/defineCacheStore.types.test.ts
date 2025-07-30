import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  type CacheStore,
  type CacheStoreFactory,
  defineCacheStore,
  type GenericCacheStore,
  type GenericCacheStoreFactory,
} from '../src'
import type { Reactive, ToRefs } from 'vue'
import type { Person } from './helpers/people'

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
      getUseCount(): number,
      clear(): void,
      mount(): void,
      unMount(): void,
    }

    const useTestCache = defineCacheStore((id: number, context: CacheStore<Item>): Item => {
      return {
        id,
        name: 'susan',
      }
    }, { autoMountAndUnMount: false })

    const cache: CustomCacheStore = useTestCache()

    expectTypeOf(cache).toEqualTypeOf<CustomCacheStore>()
  })


  it('type CacheStoreFactory', async () => {

    function creatorFunction(id: number): Person {
      return {
        id,
        name: 'susan',
      }
    }

    const useTestCache: CacheStoreFactory<typeof creatorFunction> = defineCacheStore(creatorFunction, { autoMountAndUnMount: false })
    expectTypeOf(useTestCache).toEqualTypeOf<CacheStoreFactory<typeof creatorFunction>>()

    const cache = useTestCache()
    expectTypeOf(cache.get(99)).toEqualTypeOf<Person>()
  })

  it('type GenericCacheStoreFactory', async () => {
    function creatorFunction(id: number) {
      return {
        id,
        name: 'susan',
      }
    }

    const useTestCache: GenericCacheStoreFactory = defineCacheStore(creatorFunction, { autoMountAndUnMount: false })
    expectTypeOf(useTestCache).toEqualTypeOf<GenericCacheStoreFactory>()
  })

  it('type GenericCacheStore', async () => {
    function creatorFunction(id: number) {
      return {
        id,
        name: 'susan',
      }
    }

    const useTestCache = defineCacheStore(creatorFunction, { autoMountAndUnMount: false })
    const store: GenericCacheStore = useTestCache()
    expectTypeOf(store).toEqualTypeOf<GenericCacheStore>()
  })

  it('type CacheStore', () => {
    let called = 0

    function creatorFunction(id: number, context: CacheStore<Item>) {
      called++
      expectTypeOf(context).toEqualTypeOf<CacheStore<Item>>()
      return {
        id,
        name: 'susan',
      }
    }

    const useTestCache = defineCacheStore(creatorFunction, { autoMountAndUnMount: false })

    const cache = useTestCache()

    expectTypeOf(cache).toEqualTypeOf<CacheStore<Item>>()

    cache.get('asd')
    expect(called).toEqual(1)
  })
})