# Vue Cache Store
Dynamically create, re-use, and destroy [Pinia](https://pinia.vuejs.org/) like stores.

## Use Case
When you need reusable non-trivial computed/reactive objects in multiple components.

## Installation

`$ npm i vue-cache-store`

## Usage

### Define a Cache Store
Cache stores are designed to behave similar to [Pinia](https://pinia.vuejs.org/) stores. 
The value returned by `usePersonCache()` can be used similar to Pinia.
```ts
// person-cache.ts
import { defineCacheStore } from 'vue-cache-store'
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
// person-cache.ts
import { defineCacheStore } from 'vue-cache-store'
import { type ToRefs, type Reactive} from 'vue'

export const usePersonCache = defineCacheStore((id: number): Item => {
  return {
    id,
    name: 'sue',
    // ...
  }
})

type Item = {
  id: number,
  name: string,
  //...
}

// equivalent interface (not actual)
type CacheStore = {
  // get cached ids
  ids(): any[],
  // get reactive object
  get(id: any): Reactive<Item>,
  // get refs wrapped object like pinia's storeToRefs(useMyStore())
  getRefs(id: any): ToRefs<Item>,
  // check if id is cached
  has(id: any): boolean,
  // remove cached id
  remove(id: any): void,
  // get number of mounted components using this cache store
  getUseCount(): number,
  // clear all cache ids
  clear(): void,
  // increase use count by 1
  mount(): void,
  // decrease use count by 1 
  // and clear if count is 0
  // and autoClearUnused option is true
  unMount(): void,
}
const cache: CacheStore = usePersonCache()
```

### Cache Store Context
The `context` argument is the current cache store instance.

```ts
// person-cache.ts
import { defineCacheStore } from 'vue-cache-store'
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

| option                | description                                                                                      |
|:----------------------|:-------------------------------------------------------------------------------------------------|
| `autoMountAndUnMount` | If true, automatically tracks the number of mounted components using the cache store             |
| `autoClearUnused`     | If true, when there are no longer any mounted components using a cache store it will be cleared. |



```ts
// person-cache.ts
import { defineCacheStore } from 'vue-cache-store'

// defineCacheStore() global default values
// {
//   autoMountAndUnMount: true,
//   autoClearUnused: true,
// }

// set new global defaults for all stores created with defineCacheStore()
defineCacheStore.setGlobalDefaultOptions({
  autoMountAndUnMount: false,
  autoClearUnused: false,
})

// defining a cache store with store default options overriding global defaults
export const usePersonCache = defineCacheStore((id) => {
  return {
    // ...
  }
}, {
  autoMountAndUnMount: false,
  autoClearUnused: false,
})

// inside a component
// overrides usePersonCache default options and defineCacheStore global defaults
const personCache = usePersonCache({
  autoMountAndUnMount: true,
  autoClearUnused: false,
})
```

### Define a Record Store
Designed to cache a store based on a record object.

```ts
// person-info.ts
import { computed, ref } from 'vue'
import { defineRecordStore } from 'vue-cache-store'

// minimal example
type Person = {
  id: number,
  name: string,
}

const people = ref<Person[]>([{
  id: 99,
  name: 'Jim'
}])

const getPerson = (id: number) => people.value.find(person => person.id === id)
const removePerson = (id: number) => {
  const index = people.value.findIndex(person => person.id === id)
  if (index > -1) {
    people.value.splice(index, 1)
  }
}

const usePersonInfo = defineRecordStore({
  getRecord(id: number) {
    // return value is watched
    // if the return value becomes falsy
    // the cached object is removed automatically
    return getPerson(id)
  },
  create(record: Person) {
    // return value of this function is cached
    // even if used by multiple components
    // it will not be called repeatedly
    const { id: personId, name } = toRefs(record)

    return {
      id: personId,
      name,
      nameLength: computed(() => record.name.length || 0),
    }
  },
})

const personInfo = usePersonInfo()

const person = personInfo.get(99)
person.name // 'Jim'
person.nameLength // 3

person.name = 'Jess'
person.name // 'Jess'
person.nameLength // 4

// dereference reactive to refs
const { name } = personInfo.getRefs(99)
name.value // 'Jess'
name.value = 'Ricky'
name.value // 'Ricky'

const samePerson = getPerson(99) as Person
samePerson.name // 'Ricky'

// source record is removed
removePerson(99)
people.value // []

await nextTick()
personInfo.has(99) // false
personInfo.ids() // []
```


### API

#### `reactiveToRefs()`
Used internally by the package but is very useful.
It is the same as pinia's `storeToRefs()` function,
but it allows the argument to be any object.
```ts
import { reactiveToRefs } from 'vue-cache-store'
import { reactive } from 'vue'

const item = reactive({foo: 'bar'})
const { foo } = reactiveToRefs(item)
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
