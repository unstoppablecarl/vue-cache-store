import { watchEffect } from 'vue'
import { defineCacheStore } from './defineCacheStore'
import { makeOptionsHelper, type Options } from './storeOptions'
import type { CacheStore } from '../types'

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

export function defineRecordStore<
  C extends (record: REC, context: CacheStore<ReturnType<C>>, ...args: any[]) => ReturnType<C>,
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

const optionsHelper = makeOptionsHelper({
  autoMountAndUnMount: false,
  autoClearUnused: false,
})

optionsHelper.attach(defineRecordStore)
