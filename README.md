# Vue Cache Store
Dynamically create, re-use, and destroy [Pinia](https://pinia.vuejs.org/) like stores.

## Installation

`$ npm i vue-cache-store`

## Primary Use Case
When using non-trivial derived reactive objects in multiple components.

```ts
// person-data.ts
type Person = {
  id: number,
  name: string,
}

export const people = ref<Person[]>([{
  id: 99,
  firstName: 'Jim',
  lastName: 'Kirk'
}])
export const getPerson = (id: number) => people.value.find(person => person.id === id)

export const getPersonInfo = (person: Person) => {
  const firstName = computed(() => person.firstName)
  const lastName = computed(() => person.lastName)
  // 🧠 imagine this is non-trivial and complicated 🧠
  return {
    id: computed(() => id),
    firstName,
    lastName,
    fullName: computed(() => firstName.value + ' ' + lastName.value)
  }
}

// in multiple components
const person = getPerson(99)
const info = getPersonInfo(person)
// each time getPersonInfo() is called 
// it is re-run and creates redundant copies of its info object
```

### Solution
Reusable non-trivial computed/reactive objects in multiple components.

```ts 
// person-info.ts
import { computed } from 'vue'
import { watchRecordStore } from 'vue-cache-store'
import { getPerson, getPersonInfo } from 'person-data.ts'

export const personInfo = watchRecordStore(
  // record watcher
  // auto clears cached object if returns falsy
  (id: number) => getPerson(id),
  // cached object creator
  (person: Person) => getPersonInfo(person),
)
```
```ts
// inside multiple components
import { personInfo } from 'person-info.ts'

// returns reactive object
const reactivePerson = personInfo.get(id)
// ❌ dereferencing reactive objects breaks them
const { lastName } = personInfo.get(id)
// ✅ use the getRefs() instead
const { firstName, fullName } = personInfo.getRefs(id)

const computedLastName = computed(() => personInfo.get(id).lastName)
```

## Usage

### Define a Cache Store
Cache stores are designed to behave similar to [Pinia](https://pinia.vuejs.org/) stores. 
The value returned by `usePersonCache().get(id)` can be used similar to a Pinia store.
```ts
// person-cache.ts
import { defineCacheStore } from 'vue-cache-store'
import { computed } from 'vue'

// simplified data source
const people = ref([{
  id: 99,
  firstName: 'Jim',
  lastName: 'Kirk'
}])

const getPerson = (id: number) => people.value.find(person => person.id === id)

export const usePersonCache = defineCacheStore((id) => {
  const person = getPerson(id)
  const firstName = computed(() => person.firstName)
  const lastName = computed(() => person.lastName)
  
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
  // if autoClearUnused option is true,
  // calls clear(), clearing the whole store if count becomes 0
  unMount(): void,
}
const cache: CacheStore = usePersonCache()

const personInfo = cache.get(99)
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

### Record Stores

Designed to cache an object store based on a record object.

#### `defineRecordStore()` 
Internally calls and returns `defineCacheStore()`

```ts
// person-info.ts
import { computed, ref } from 'vue'
import { defineRecordStore } from 'vue-cache-store'

// minimal example
const people = ref([{
  id: 99,
  name: 'Jim',
}])

const getPerson = (id) => people.value.find(person => person.id === id)
const removePerson = (id) => {
  const index = people.value.findIndex(person => person.id === id)
  if (index > -1) {
    people.value.splice(index, 1)
  }
}
// defineRecordStore() internally calls and returns defineCacheStore()
export const usePersonInfo = defineRecordStore(
  // record watcher
  (id: number) => {
    // this function is watched
    // if the return value becomes falsy
    // the cached object is removed automatically
    return getPerson(id)
  },

  // cached object creator
  (record: Person) => {
    // return value of this function is cached.
    // even if used by multiple components
    // it will not be called repeatedly
    const { id: personId, name } = toRefs(record)

    return {
      id: personId,
      name,
      nameLength: computed(() => record.name.length || 0),
    }
  },
)

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

#### `watchRecordStore()`
```ts
import { watchRecordStore } from 'vue-cache-store'

export const personInfo = watchRecordStore(/* ... */)

// watchRecordStore() internally does the following:
const useInfo = defineRecordStore(/* ... */)()
// with typing intact
return useInfo()
```

#### Usage within a [Pinia](https://pinia.vuejs.org/) store

```ts
// person-store.ts
import { defineStore } from 'pinia'
import { watchRecordStore } from 'vue-cache-store'

// minimal example
type Person = {
  id: number,
  name: string,
}

export const usePersonStore = defineStore('people', () => {
  const people = ref<Person[]>([{
    id: 99,
    name: 'Jim',
  }])
  const peopleIdIncrement = ref(0)

  const getPerson = (id: number) => people.value.find(person => person.id === id)
  const add = (name: string) => {
    const id = peopleIdIncrement.value++
    people.value.push({ id, name })
    return id
  }
  const remove = (id: number) => {
    const index = people.value.findIndex(person => person.id === id)
    if (index > -1) {
      people.value.splice(index, 1)
    }
  }
  const update = (id: number, name: string) => {
    const item = getPerson(id)
    if (!item) {
      throw new Error(`Item "${id}" not found`)
    }

    item.name = name
  }

  const personInfo = watchRecordStore(
    (id: number) => getPerson(id),
    (record: Person) => {
      const person = computed(() => record)
      const { id: personId, name } = toRefs(record)

      return {
        id: personId,
        name,
        nameLength: computed(() => person.value?.name.length || 0),
      }
    }
  )

  return {
    people,
    personInfo,
    getPerson,
    getInfo: (id: number) => personInfo.get(id),
    getInfoRefs: (id: number) => personInfo.getRefs(id),
    add,
    remove,
    update,
  }
})

// inside component
const personStore = usePersonStore()

// re-usable composite reactive record
const person = personStore.getInfo(99)
person.name // 'Jim'
person.nameLength // 3

person.name = 'Jess'
person.name // 'Jess'
person.nameLength // 4

// dereference reactive to refs
const { name } = personStore.getInfoRefs(99)
name.value // 'Jess'
name.value = 'Ricky'
name.value // 'Ricky'

const samePerson = personStore.getPerson(99) as Person
samePerson.name // 'Ricky'

// source record is removed
personStore.remove(99)
personStore.people.value // []

await nextTick()
personStore.personInfo.has(99) // false
personStore.personInfo.ids() // []
```

### Cache Store Options

When defining a cache store the second argument is a default options object.

| option                | description                                                                                                                                                                                           |
|:----------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `autoMountAndUnMount` | If true, automatically tracks the number of mounted components using the cache store. <br> Mounting is tracked when calling in the root of a component. Example: `const personInfo = usePersonInfo()` |
| `autoClearUnused`     | If true, when there are no longer any mounted components using a cache store it will be cleared.                                                                                                      |

#### `defineCacheStore()` Options
```ts
// global default option values
const options = {
  autoMountAndUnMount: true,
  autoClearUnused: true,
}
```
#### `defineCacheStore()` Options Usage
```ts
// person-cache.ts
import { defineCacheStore } from 'vue-cache-store'

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

#### `defineRecordStore()` Options
The intended use case for record stores removes cache objects when their source has been removed.
So its global defaults are different.
```ts
// global default option values
const options = {
  autoMountAndUnMount: false,
  autoClearUnused: false,
}
```
#### `defineRecordStore()` Options Usage

```ts
// person-record.ts
import { defineRecordStore } from 'vue-cache-store'

// set new global defaults for all stores created with defineRecordStore()
defineRecordStore.setGlobalDefaultOptions({
  autoMountAndUnMount: false,
  autoClearUnused: false,
})

// defining a record store with store default options overriding global defaults
export const usePersonRecord = defineRecordStore(
  (id) => {
    // ...
  },
  () => {
    // ...
  },
  {
    autoMountAndUnMount: false,
    autoClearUnused: false,
  },
)

// inside a component
// overrides usePersonRecord default options and defineRecordStore global defaults
const personCache = usePersonRecord({
  autoMountAndUnMount: true,
  autoClearUnused: false,
})
```
#### `watchRecordStore()` Options
`watchRecordStore()` calls `defineRecordStore()` internally so it uses the global default options `defineRecordStore()`
```ts
import { watchRecordStore } from 'vue-cache-store'

// defining a record store with store default options overriding global defaults
export const usePersonRecord = watchRecordStore(
  (id) => {
    // ...
  },
  () => {
    // ...
  },
  {
    autoMountAndUnMount: false,
    autoClearUnused: false,
  },
)
```


### API

#### `reactiveToRefs()`
Used internally by the package but is very powerful.
It is the same as [Pinia's](https://pinia.vuejs.org/) `storeToRefs()` function,
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
