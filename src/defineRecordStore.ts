import { watchEffect } from 'vue'
import { type CacheStore, defineCacheStore } from './defineCacheStore'
import { makeOptionsHelper, type Options } from './storeOptions'

export function watchRecordStore<
  C extends (record: REC, context: CacheStore<ReturnType<C>>) => ReturnType<C>,
  G extends (id: any) => ReturnType<G>,
  REC = object & ReturnType<G>,
>
(
  getRecord: G,
  create: C,
  defaultOptions?: Options,
) {
  return defineRecordStore<C, G, REC>(getRecord as G, create as C, defaultOptions)()
}

const optionsHelper = makeOptionsHelper({
  autoMountAndUnMount: false,
  autoClearUnused: false,
})

defineRecordStore.setGlobalDefaultOptions = optionsHelper.set
defineRecordStore.getGlobalDefaultOptions = optionsHelper.get
defineRecordStore.resetGlobalDefaultOptions = optionsHelper.reset

export function defineRecordStore<
  C extends (record: REC, context: CacheStore<ReturnType<C>>) => ReturnType<C>,
  G extends (id: any) => ReturnType<G>,
  REC = object & ReturnType<G>,
>
(
  getRecord: G,
  create: C,
  defaultOptions?: Options,
) {
  const creatorFunction = (id: any, context: CacheStore<ReturnType<C>>) => {
    watchEffect(() => {
      if (!getRecord(id)) {
        context.remove(id)
      }
    })

    const record = getRecord(id)
    if (!record) {
      throw new Error(`defineRecordStore(): Record id "${id}" not found.`)
    }
    return create(record as REC, context)
  }

  const options = optionsHelper.merge(defaultOptions)

  return defineCacheStore(creatorFunction, options)
}