import { watchEffect } from 'vue'
import { type CacheStore, defineCacheStore } from './defineCacheStore'
import { makeOptionsHelper, type Options } from './storeOptions'

export type RecordStoreDefinition<C, G> = {
  create: C,
  getRecord: G,
  defaultOptions?: Options
}

export function makeRecordStore<
  C extends (record: REC, context: CacheStore<ReturnType<C>>) => ReturnType<C>,
  G extends (id: any) => ReturnType<G>,
  REC = object & ReturnType<G>,
>({
    create,
    getRecord,
    defaultOptions,
  }: RecordStoreDefinition<C, G>) {
  return defineRecordStore<C, G, REC>({ create, getRecord, defaultOptions })()
}

const optionsHelper = makeOptionsHelper({
  autoMountAndUnMount: true,
  autoClearUnused: true,
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
  {
    create,
    getRecord,
    defaultOptions,
  }: RecordStoreDefinition<C, G>) {

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

  const options = optionsHelper.merge(defaultOptions)

  return defineCacheStore(creatorFunction, options)
}