import { watchEffect } from 'vue'
import { defineRecordStore, type RecordStore } from './defineRecordStore'

export function watchRecordStore<
  G extends (id: any) => object & ReturnType<G> | undefined,
  C2 extends (record: object & NonNullable<ReturnType<G>>, context: RecordStore<object & ReturnType<C2>, Parameters<G>[0]>) => object & ReturnType<C2>,
>
(
  getRecord: G,
  create: C2,
) {
  type ID = Parameters<G>[0]
  type Result = RecordStore<object & ReturnType<typeof create>, ID>

  const creatorFunction = (id: ID, context: Result) => {
    watchEffect(() => {
      if (!getRecord(id)) {
        context.remove(id)
      }
    })

    const record = getRecord(id)
    if (!record) {
      throw new Error(`watchRecordStore(): Record id "${id}" not found.`)
    }
    return create(record, context)
  }

  return defineRecordStore<typeof creatorFunction>(creatorFunction)
}
