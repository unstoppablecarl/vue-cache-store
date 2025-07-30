import { computed, watchEffect } from 'vue'
import { type CacheStore, defineCacheStore, type Options } from './defineCacheStore'

export function makeRecordStore<
  C extends (record: REC, context: CacheStore<ReturnType<C>>) => ReturnType<C>,
  G extends (id: any) => ReturnType<G>,
  REC = object & ReturnType<G>,
>({
    create,
    getRecord,
    defaultOptions,
  }: {
  create: C,
  getRecord: G,
  defaultOptions?: Options
}) {
  return defineRecordStore<C, G, REC>({ create, getRecord, defaultOptions })()
}

export function defineRecordStore<
  C extends (record: REC, context: CacheStore<ReturnType<C>>, ...args: any[]) => ReturnType<C>,
  G extends (id: any) => ReturnType<G>,
  REC = object & ReturnType<G>,
>
(
  {
    create,
    getRecord,
    defaultOptions = {
      autoMountAndUnMount: false,
      autoClearUnused: false,
    },
  }: {
    create: C,
    getRecord: G,
    defaultOptions?: Options
  }) {

  const creatorFunction = (id: any, context: CacheStore<ReturnType<C>>) => {
    const record = getRecord(id)
    if (!record) {
      throw new Error(`record id: "${id}" not found`)
    }

    watchEffect(() => {
      if (!getRecord(id)) {
        context.remove(id)
      }
    })

    return create(record as REC, context)
  }

  return defineCacheStore(creatorFunction, defaultOptions)
}