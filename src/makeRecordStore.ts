import { type Reactive, reactive, type ToRefs } from 'vue'
import { reactiveToRefs } from './reactiveToRefs'

export type RecordStore<T extends object, ID = NonNullable<any>> = {
  // get cached ids
  ids(): ID[],
  // get reactive object
  get(id: ID): Reactive<T>,
  // get refs wrapped object like pinia's storeToRefs(useMyStore())
  getRefs(id: ID): ToRefs<Reactive<T>>,
  // check if id is cached
  has(id: ID): boolean,
  // remove cached id
  remove(id: ID): void,
  // clear all cache ids
  clear(): void,
  // loop over each cached item
  forEach(callbackFunction: (value: Reactive<T>, key: ID) => void): void;
}

export type GenericRecordStore = ReturnType<typeof makeRecordStore>

export function makeRecordStore<
  C extends (id: NonNullable<any>, context: RecordStore<object & ReturnType<C>, Parameters<C>[0]>) => object & ReturnType<C>,
>(creatorFunction: C) {
  type ID = Parameters<C>[0]
  type Result = object & ReturnType<C>
  type ReactiveResult = Reactive<Result>

  const cache = new Map<ID, ReactiveResult>()

  const get = (id: ID): ReactiveResult => {
    let result = cache.get(id)
    if (result) {
      return result
    }

    const object = creatorFunction(id, context)
    result = reactive(object) as ReactiveResult
    cache.set(id, result)

    return result
  }

  const getRefs = (id: ID) => {
    const obj = get(id) as ReactiveResult
    return reactiveToRefs(obj)
  }

  const context: RecordStore<Result, ID> = {
    ids: () => [...cache.keys()],
    get,
    getRefs,
    has: (id: ID) => cache.has(id),
    remove: (id: ID) => cache.delete(id),
    clear: () => cache.clear(),
    forEach: (callbackFunction: (value: ReactiveResult, key: ID) => void) => {
      cache.forEach(callbackFunction)
    }
  }

  return context
}