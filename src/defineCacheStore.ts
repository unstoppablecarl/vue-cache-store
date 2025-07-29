import { computed, isReactive, isRef, onUnmounted, type Reactive, reactive, toRaw, toRef, type ToRefs } from 'vue'

export interface Context<C extends (id: any, context: Context<C>, ...args: any[]) => ReturnType<C>> {
  ids(): any[],
  get(id: any): Reactive<ReturnType<C>>;
  getRefs(id: any): ToRefs<Reactive<ReturnType<C>>>;
  has(id: any): boolean;
  remove(id: any): void;
  getUseCount(): number;
  clear(): void;
  mount(): void;
  unMount(): void;
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

export function defineCacheStore<C extends (id: any, context: Context<C>, ...args: any[]) => ReturnType<C>>(creatorFunction: C, defaultOptions?: Options) {
  const cache = new Map<any, Reactive<ReturnType<C>>>()
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

    function get(id: any): Reactive<ReturnType<C>> {
      let result = cache.get(id)
      if (result) {
        return result
      }

      const object = creatorFunction(id, context, ...args) as object
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

    const context: Context<C> = {
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