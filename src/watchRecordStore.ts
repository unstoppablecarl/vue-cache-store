import { watchEffect } from 'vue'
import { defineRecordStore, type RecordStore } from './defineRecordStore'

export function watchRecordStore<
  C extends (record: REC, context: RecordStore<ReturnType<C>>) => ReturnType<C>,
  G extends (id: any) => ReturnType<G>,
  REC = object & ReturnType<G>,
>
(
  getRecord: G,
  create: C,
) {
  const creatorFunction = (id: any, context: RecordStore<ReturnType<C>>) => {
    watchEffect(() => {
      if (!getRecord(id)) {
        context.remove(id)
      }
    })

    const record = getRecord(id)
    if (!record) {
      throw new Error(`watchRecordStore(): Record id "${id}" not found.`)
    }
    return create(record as REC, context)
  }

  return defineRecordStore<C>(creatorFunction as C)
}