import { type Reactive, reactive, type ToRefs } from 'vue'
import { reactiveToRefs } from './reactiveToRefs'

export interface RecordStore<T> {
  // get cached ids
  ids(): any[],
  // get reactive object
  get(id: any): Reactive<T>,
  // get refs wrapped object like pinia's storeToRefs(useMyStore())
  getRefs(id: any): ToRefs<Reactive<T>>,
  // check if id is cached
  has(id: any): boolean,
  // remove cached id
  remove(id: any): void,
  // clear all cache ids
  clear(): void,
}

export type GenericRecordStore = ReturnType<typeof defineRecordStore>

export function defineRecordStore<
  C extends (id: any, context: RecordStore<ReturnType<C>>) => ReturnType<C>
>(creatorFunction: C) {
  type RecordStoreResult = RecordStore<ReturnType<C>>

  const cache = new Map<any, Reactive<ReturnType<C>>>()

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

  const context: RecordStoreResult = {
    ids: () => [...cache.keys()],
    get,
    getRefs,
    has: (id: any) => cache.has(id),
    remove: (id: any) => cache.delete(id),
    clear: () => cache.clear(),
  }

  return context
}