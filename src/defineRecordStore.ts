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
  {
    create,
    getRecord,
    defaultOptions,
  }: RecordStoreDefinition<C, G>) {

  const creatorFunction = (id: any, context: CacheStore<ReturnType<C>>) => {
    watchEffect(() => {
      if (!getRecord(id)) {
        context.remove(id)
      }
    })

    const record = getRecord(id) as REC
    return create(record, context)
  }

  const options = optionsHelper.merge(defaultOptions)

  return defineCacheStore(creatorFunction, options)
}