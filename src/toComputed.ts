import type { ComputedRef, Ref, WritableComputedRef } from 'vue'
import { computed, toValue } from 'vue'

export type ToComputed<T = any> = {
  [K in keyof T]: ComputedRef<T[K]>;
};

export function toComputed<T extends object>(obj: Ref<T> | ComputedRef<T> | WritableComputedRef<T>) {
  const rawStore = toValue(obj)
  const refs = {} as ToComputed<T>
  for (const key in rawStore) {
    refs[key] = computed(() => obj.value[key as keyof T]) as ComputedRef<T[typeof key]>
  }

  return refs
}