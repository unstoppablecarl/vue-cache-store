import { computed, type ComputedRef, type Ref, toValue, type WritableComputedRef } from 'vue'

export type ToWritableComputed<T = any> = {
  [K in keyof T]: WritableComputedRef<T[K]>;
};

/**
 *
 * @param obj
 */
export function toWritableComputed<T extends object>(obj: Ref<T> | ComputedRef<T> | WritableComputedRef<T>) {
  const rawStore = toValue(obj)
  const refs = {}
  for (const key in rawStore) {
    // @ts-expect-error: too hard to type correctly
    refs[key] = computed({
      get: () => obj.value[key],
      set: (v) => {
        obj.value[key] = v
      },
    })
  }

  return refs as ToWritableComputed<T>
}