import { computed, type ComputedRef, watch } from 'vue'
import { makeRecordStore, type RecordStore } from './makeRecordStore'

export function watchRecordStore<
  ID extends NonNullable<any>,
  R extends object,
  T extends object,
>
(
  getRecord: (id: ID) => R | undefined,
  create: (computedRecord: ComputedRef<R>, context: RecordStore<ID, T>) => T,
) {
  type Result = RecordStore<ID, T>

  return makeRecordStore<ID, T>((id: ID, context: Result) => {

    const comp = computed(() => getRecord(id))
    const unwatch = watch(comp, () => {
      if (!comp.value) {
        context.remove(id)
        unwatch()
      }
    })

    const record = comp.value
    if (!record) {
      throw new Error(`watchRecordStore(): Record id "${id}" not found.`)
    }
    return create(comp as ComputedRef<R>, context)
  })
}
