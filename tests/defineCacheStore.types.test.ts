import { describe, expect, expectTypeOf, it } from 'vitest'
import { type CacheStore, defineCacheStore, type CacheStoreFactory, type GenericCacheStoreFactory } from '../src'
import type { Reactive, ToRefs } from 'vue'

describe('defineCacheStore() types', async () => {
  it('check readme type explanation is accurate', async () => {
    interface CustomCacheStore {
      ids(): any[],
      get(id: any): Reactive<ReturnType<typeof creatorFunction>>;
      getRefs(id: any): ToRefs<Reactive<ReturnType<typeof creatorFunction>>>;
      has(id: any): boolean;
      remove(id: any): void;
      getUseCount(): number;
      clear(): void;
      mount(): void;
      unMount(): void;
    }

    function creatorFunction(id: number, context: CacheStore<typeof creatorFunction>) {
      return {
        id,
        name: 'susan',
      }
    }

    const useTestCache = defineCacheStore(creatorFunction, { autoMountAndUnMount: false })

    const cache: CustomCacheStore = useTestCache()

    expectTypeOf(cache).toEqualTypeOf<CustomCacheStore>()
  })

  it('type CacheStoreFactory', async () => {

    function creatorFunction(id: number) {
      return {
        id,
        name: 'susan',
      }
    }

    const useTestCache: CacheStoreFactory<typeof creatorFunction> = defineCacheStore(creatorFunction, { autoMountAndUnMount: false })

    expectTypeOf(useTestCache).toEqualTypeOf<CacheStoreFactory<typeof creatorFunction>>()
  })


  it('type CacheStore', () => {
    let called = 0

    function creatorFunction(id: number, context: CacheStore<typeof creatorFunction>) {
      called++
      expectTypeOf(context).toEqualTypeOf<CacheStore<typeof creatorFunction>>()
      return {
        id,
        name: 'susan',
      }
    }

    const useTestCache = defineCacheStore(creatorFunction, { autoMountAndUnMount: false })

    const cache = useTestCache()

    expectTypeOf(cache).toEqualTypeOf<CacheStore<typeof creatorFunction>>()

    cache.get(99)
    expect(called).toEqual(1)
  })
})