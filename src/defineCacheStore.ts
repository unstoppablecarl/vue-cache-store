import { computed, isReactive, isRef, onUnmounted, type Reactive, reactive, toRaw, toRef, type ToRefs } from 'vue'

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

export type Options = {
  autoMountAndUnMount?: boolean;
  autoClearUnused?: boolean;
}

export type GenericCacheStoreFactory = ReturnType<ReturnType<typeof defineCacheStore>>

export type CacheStoreFactory<C extends (id: any, context: CacheStore<C>) => ReturnType<C>> = {
  (creatorFunction: C, defaultOptions?: Options): CacheStore<ReturnType<C>>;
}

const optionDefaults = {
  autoMountAndUnMount: true,
  autoClearUnused: true,
}

export function defineCacheStore<C extends (id: any, context: CacheStore<ReturnType<C>>) => ReturnType<C>>(creatorFunction: C, defaultOptions?: Options) {
  type CacheStoreResult = CacheStore<ReturnType<C>>

  const cache = new Map<any, Reactive<ReturnType<C>>>()
  let count = 0

  function store() {
    return makeCacheStore(creatorFunction, defaultOptions)
  }

  store.withOptions = (options: Options) => {
    return makeCacheStore(creatorFunction, options)
  }

  return store

  function makeCacheStore(creatorFunction: C, options?: Options): CacheStoreResult {

    const cacheOptions = Object.assign(optionDefaults, options)

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
      if (cacheOptions.autoClearUnused) {
        if (count < 1) {
          cache.clear()
        }
      }
    }
    if (cacheOptions.autoMountAndUnMount) {
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

// based on pinia storeToRefs()
export function reactiveToRefs<T extends object>(obj: T) {
  const rawStore = toRaw(obj)
  const refs = {}
  for (const key in rawStore) {
    const value = rawStore[key]
    // There is no native method to check for a computed
    // https://github.com/vuejs/core/pull/4165
    // @ts-expect-error: too hard to type correctly
    if (value.effect) {
      // @ts-expect-error: too hard to type correctly
      refs[key] = computed({
        get: () => obj[key],
        set(value) {
          obj[key] = value
        },
      })
    } else if (isRef(value) || isReactive(value)) {
      // @ts-expect-error: the key is state or getter
      refs[key] =
        // ---
        toRef(obj, key)
    }
  }
  return refs as ToRefs<T>
}