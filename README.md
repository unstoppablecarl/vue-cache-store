# Vue Cache Store
Dynamically create, re-use, and destroy [Pinia](https://pinia.vuejs.org/) like stores.

## Use Case
When you need reusable non-trivial computed/reactive objects in multiple components.

## Installation

`$ npm i pinia-cache-store`

## Usage

### Define a Cache Store
Cache stores are designed to behave similar to [Pinia](https://pinia.vuejs.org/) stores. 
The value returned by `usePersonCache()` can be used similar to Pinia.
```ts
// person-cache.ts
import { defineCacheStore } from 'pinia-cache-store'
import { computed } from 'vue'
// example service
import { getRecordInfo } from 'record-info-getter'

export const usePersonCache = defineCacheStore((id) => {
  const info = getRecordInfo(id)
  const firstName = computed(() => info.firstName)
  const lastName = computed(() => info.lastName)
  
  return {
    id: computed(() => id),
    firstName,
    lastName,
    fullName: computed(() => firstName.value + ' ' + lastName.value)
  }
})
```

```vue
// my-component.vue
<script setup lang="ts">
  import { computed, defineProps } from 'vue'
  import { usePersonCache } from 'person-cache.ts'
  
  // define this in the root of the component setup function
  const personCache = usePersonCache()
  
  const { id } = defineProps({
    id: Number,
  })

  // returns reactive object
  const reactivePerson = personCache.get(id)
  // ❌ dereferencing reactive objects breaks them
  const { lastName } = personCache.get(id)
  // ✅ use the getRefs() instead
  const { fullName } = personCache.getRefs(id)
  
  const computedLastName = computed(() => personCache.get(id).lastName)
</script>
<template>
  {{reactivePerson.firstName}}
  {{computedPerson.firstName}}	
  {{computedLastName}}
  {{fullName}}
</template>
```
### Cache Store API
```ts
import { defineCacheStore } from 'pinia-cache-store'
// person-cache.ts
export const usePersonCache = defineCacheStore((id) => {
  return {
    // ...
  }
})

// equivalent interface (not actual)
interface CacheStore {
  // get cached ids
  ids(): any[],
  // get reactive object
  get(id: any): Reactive<ReturnType<typeof creatorFunction>>;
  // get refs wrapped object like pinia's storeToRefs(useMyStore())
  getRefs(id: any): ToRefs<Reactive<ReturnType<typeof creatorFunction>>>;
  // check if id is cached
  has(id: any): boolean;
  // remove cached id
  remove(id: any): void;
  // get number of mounted components using this cache store
  getUseCount(): number;
  // clear all cache ids
  clear(): void;
  // increase use count by 1
  mount(): void;
  // decrease use count by 1 
  // and clear if count is 0
  // and autoClearUnused option is true
  unMount(): void;
}
const cache: CacheStore = usePersonCache()
```

### Cache Store Context
The `context` argument is the current cache store instance.

```ts
// person-cache.ts
import { defineCacheStore } from 'pinia-cache-store'
import { getRecordInfo } from 'record-info-getter'
import { computed } from 'vue'

export const usePersonCache = defineCacheStore((id, context: CacheStore) => {
  const info = getRecordInfo(id)
  const firstName = computed(() => info.firstName)
  const lastName = computed(() => info.lastName)
  const manager = context.get(info.managerId)
  
  return {
    id: computed(() => id),
    firstName,
    lastName,
    fullName: computed(() => firstName.value + ' ' + lastName.value),
    manager,
  }
})
```

### Cache Store Options

When defining a cache store the second argument is a default options object.

| option                | default | description                                                                                      |
|:----------------------|:--------|:-------------------------------------------------------------------------------------------------|
| `autoMountAndUnMount` | `true`  | If true, automatically tracks the number of mounted components using the cache store             |
| `autoClearUnused`     | `true`  | If true, when there are no longer any mounted components using a cache store it will be cleared. |

```ts
// person-cache.ts
import { defineCacheStore } from 'pinia-cache-store'

// defining a cache store with default options
export const usePersonCache = defineCacheStore((id) => {
  return {
    // ...
  }
}, {
  autoMountAndUnMount: false,
  autoClearUnused: false,
})

// inside a component
// default options can be overridden
const personCache = usePersonCache.withOptions({
  autoMountAndUnMount: true,
  autoClearUnused: false,
})
```

### Cache Store Additional Arguments

A cache store can accept extra arguments if needed.

```ts
// person-cache.ts
import { defineCacheStore } from 'pinia-cache-store'

// defining a cache store with default options
export const usePersonCache = defineCacheStore((id, context, myArg1, myArg2) => {
  console.log(myArg1) // 'example-arg-value'
  console.log(myArg2) // 999

  return {
    // ...
  }
})

// inside a component
const personCache1 = usePersonCache('example-arg-value', 999)

// when using withOptions()
const personCache2 = usePersonCache.withOptions({
  autoMountAndUnMount: true,
  autoClearUnused: false,
}, 'example-arg-value', 999)
```

## Building

`$ pnpm install`
`$ pnpm run build`

## Testing

`$ pnpm run test`
`$ pnpm run test:mutation`

## Releases Automation

- update `package.json` file version (example: `1.0.99`)
- manually create a github release with a tag matching the `package.json` version prefixed with `v` (example: `v1.0.99`)
- npm should be updated automatically
