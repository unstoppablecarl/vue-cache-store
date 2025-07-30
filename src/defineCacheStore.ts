import { onUnmounted, type Reactive, reactive, type ToRefs } from 'vue'
import { makeOptionsHelper, type Options, type RequiredOptions } from './storeOptions'
import { reactiveToRefs } from './reactiveToRefs'

export interface CacheStore<T> {
  // get cached ids
  ids(): any[],

  // get reactive object
  get(id: any): Reactive<T>;

  // get refs wrapped object like pinia's storeToRefs(useMyStore())
  getRefs(id: any): ToRefs<Reactive<T>>;

  // check if id is cached
  has(id: any): boolean;

  // remove cached id
  remove(id: any): void;

  // get number of mounted components using this cache store
  getUseCount(): number;

  // clear all cache ids
  clear(): void;

  // increase use count by 1
  mount(): void;

  // decrease use count by 1
  // and clear if count is 0
  // and autoClearUnused option is true
  unMount(): void;
}

export type GenericCacheStoreFactory = ReturnType<typeof defineCacheStore>

export type GenericCacheStore = ReturnType<ReturnType<typeof defineCacheStore>>

export type CacheStoreFactory<C extends (id: any, context: CacheStore<ReturnType<C>>) => ReturnType<C>> = {
  (options?: Options): CacheStore<ReturnType<C>>;
}

const optionsHelper = makeOptionsHelper({
  autoMountAndUnMount: true,
  autoClearUnused: true,
})

defineCacheStore.setGlobalDefaultOptions = optionsHelper.set
defineCacheStore.getGlobalDefaultOptions = optionsHelper.get
defineCacheStore.resetGlobalDefaultOptions = optionsHelper.reset

export function defineCacheStore<
  C extends (id: any, context: CacheStore<ReturnType<C>>) => ReturnType<C>
>(creatorFunction: C, defaultOptions?: Options) {
  type CacheStoreResult = CacheStore<ReturnType<C>>

  const cache = new Map<any, Reactive<ReturnType<C>>>()
  let count = 0

  return (options?: Options) => {
    const merged = optionsHelper.merge(defaultOptions, options)
    return makeCacheStore(creatorFunction, merged)
  }

  function makeCacheStore(creatorFunction: C, options: RequiredOptions): CacheStoreResult {

    function get(id: any): Reactive<ReturnType<C>> {
      let result = cache.get(id)
      if (result) {
        return result
      }

      const object = creatorFunction(id, context) as object
      result = reactive(object) as Reactive<ReturnType<C>>
      cache.set(id, result)

      return result
    }

    const getRefs = (id: any) => {
      const obj = get(id) as Reactive<ReturnType<C>>
      return reactiveToRefs(obj)
    }
    const mount = () => count++
    const unMount = () => {
      count--
      if (options.autoClearUnused) {
        if (count < 1) {
          cache.clear()
        }
      }
    }
    if (options.autoMountAndUnMount) {
      mount()
      onUnmounted(unMount)
    }

    const context: CacheStoreResult = {
      ids: () => [...cache.keys()],
      get,
      getRefs,
      has: (id: any) => cache.has(id),
      getUseCount: () => count,
      remove: (id: any) => cache.delete(id),
      clear: () => cache.clear(),
      mount,
      unMount,
    }

    return context
  }
}