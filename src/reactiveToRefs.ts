// based on pinia storeToRefs()
import { computed, isReactive, isRef, toRaw, toRef, type ToRefs } from 'vue'

export function reactiveToRefs<T extends object>(obj: T) {
  const rawStore = toRaw(obj)
  const refs = {}
  for (const key in rawStore) {
    const value = rawStore[key]
    // There is no native method to check for a computed
    // https://github.com/vuejs/core/pull/4165
    // @ts-expect-error: too hard to type correctly
    if (value.effect) {
      // @ts-expect-error: too hard to type correctly
      refs[key] = computed({
        get: () => obj[key],
        set(value) {
          obj[key] = value
        },
      })
    } else if (isRef(value) || isReactive(value)) {
      // @ts-expect-error: the key is state or getter
      refs[key] =
        // ---
        toRef(obj, key)
    }
  }
  return refs as ToRefs<T>
}