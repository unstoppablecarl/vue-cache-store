import { computed, isReactive, isRef, type MaybeRefOrGetter, onUnmounted, reactive, toRaw, toRef } from 'vue'

export type Context = {
  get(id: any): any;
  has(id: any): boolean;
  remove(id: any): void;
  getUseCount(): number;
}

export type Options = {
  autoMountAndUnMount?: boolean;
  autoClearUnused?: boolean;
}

export type CacheableStore = ReturnType<ReturnType<typeof defineCacheStore>>

const optionDefaults = {
  autoMountAndUnMount: true,
  autoClearUnused: true,
}

export function defineCacheStore<C extends (id: any, context: Context, ...args: any[]) => ReturnType<C>>(creatorFunction: C, defaultOptions?: Options) {
  const cache = new Map<any, ReturnType<C>>()
  let count = 0

  function store(...args: any[]) {
    return makeCacheStore(creatorFunction, defaultOptions, ...args)
  }

  store.withOptions = (options: Options, ...args: any[]) => {
    return makeCacheStore(creatorFunction, options, ...args)
  }

  return store

  function makeCacheStore(creatorFunction: C, options?: Options, ...args: any[]) {
    const cacheOptions = Object.assign(optionDefaults, options)

    function get(id: any): ReturnType<C> {
      let result = cache.get(id)
      if (result) {
        return result
      }

      const context = {
        get,
        remove,
        has,
        getUseCount,
      }
      const object = creatorFunction(id, context, ...args) as object
      result = reactive(object) as ReturnType<C>
      cache.set(id, result)

      return result
    }

    const getRefs = (id: any): any => reactiveToRefs(get(id) as object)
    const mount = () => count++
    const unMount = () => {
      count--
      if (cacheOptions.autoClearUnused) {
        if (count < 1) {
          cache.clear()
        }
      }
    }
    const remove = (id: any) => cache.delete(id)
    const clear = () => cache.clear()
    const has = (id: any) => cache.has(id)
    const getUseCount = () => count

    if (cacheOptions.autoMountAndUnMount) {
      mount()
      onUnmounted(unMount)
    }

    return {
      ids: () => [...cache.keys()],
      get,
      has,
      getUseCount,
      getRefs,
      remove,
      clear,
      mount,
      unMount,
    }
  }
}

export function reactiveToRefs<T extends object>(obj: T) {
  type Result<T> = {
    [Property in keyof T]: MaybeRefOrGetter<T[Property]>
  }
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
  return refs as Result<T>
}