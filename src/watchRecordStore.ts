import { computed, watch } from 'vue'
import { makeRecordStore, type RecordStore } from './makeRecordStore'

export function watchRecordStore<
  ID extends NonNullable<any> = Parameters<Parameters<typeof watchRecordStore>[0]>[0],
  R extends object = NonNullable<ReturnType<Parameters<typeof watchRecordStore>[0]>>,
  T extends object = ReturnType<Parameters<typeof watchRecordStore>[1]>,
>
(
  getRecord: (id: ID) => R | undefined,
  create: (record: R, context: RecordStore<ID, T>) => T,
) {
  type Result = RecordStore<ID, T>

  const creatorFunction = (id: ID, context: Result) => {

    const comp = computed(() => getRecord(id))
    watch(comp, () => {
      if (!comp.value) {
        context.remove(id)
      }
    })

    const record = comp.value
    if (!record) {
      throw new Error(`watchRecordStore(): Record id "${id}" not found.`)
    }
    return create(record, context)
  }

  return makeRecordStore<ID, T>(creatorFunction)
}
