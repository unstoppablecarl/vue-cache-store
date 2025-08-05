import { computed, type ComputedRef, type Ref, toValue, type WritableComputedRef } from 'vue'

export type ToWritableComputed<T = any> = {
  [K in keyof T]: WritableComputedRef<T[K]>;
};

export function toWritableComputed<T extends object>(obj: Ref<T> | ComputedRef<T> | WritableComputedRef<T>) {
  const rawStore = toValue(obj)
  const refs = {} as ToWritableComputed<T>
  for (const key in rawStore) {
    refs[key] = computed({
      get: () => obj.value[key as keyof T],
      set: (v) => {
        obj.value[key as keyof T] = v
      },
    }) as WritableComputedRef<T[typeof key]>
  }

  return refs
}