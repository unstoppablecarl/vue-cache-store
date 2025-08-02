# Vue Cache Store
Dynamically create, re-use, and destroy [Pinia](https://pinia.vuejs.org/) like stores.

## Installation

`$ npm i vue-cache-store`

## Primary Use Case
When using non-trivial derived reactive objects in multiple components.

⭐️ Examples in this readme reference this case when it has `import { /* ... */ } from 'person-data.ts'`
```ts
// person-data.ts
import { computed, ref, reactive, type Reactive } from 'vue'

type Person = {
  id: number,
  firstName: string,
  lastName: string,
}

type PersonInfo = {
  id: ComputedRef<number>,
  firstName: Ref<string>,
  lastName: Ref<string>,
  fullName: ComputedRef<string>,
}

const people = ref<Person[]>([{
  id: 99,
  firstName: 'Bobby',
  lastName: 'Testerson'
}])

export const getPerson = (id: number) => people.value.find(person => person.id === id)
export const removePerson = (id: number) => {
  const index = people.value.findIndex(person => person.id === id)
  if (index > -1) {
    people.value.splice(index, 1)
  }
}

export const getPersonInfo = (person: Person): PersonInfo => {
  const { firstName, lastName } = toRefs(person)
  
  // 🧠 imagine this is non-trivial and complicated 🧠
  return {
    id: computed(() => person.id),
    firstName,
    lastName,
    fullName: computed(() => firstName.value + ' ' + lastName.value),
  }
}
```

### Generic Example

```vue
// inside multiple vue components
<script setup lang="ts">
  import { getPerson, getPersonInfo } from 'person-data.ts'
  import { computed, defineProps } from 'vue'

  const { id } = defineProps({
    id: Number,
  })

  const info = computed(() => {
    const person = getPerson(id)
    // each time getPersonInfo() is called 
    // it is re-run and creates new copies of the info object
    return getPersonInfo(person)
  })
</script>
<template>
  {{info.id}}
  {{info.fullName}}
  <input type="text" v-model="info.firstName"/>
  <input type="text" v-model="info.lastName"/>
</template>
```

### Vue Cache Store Solution

```ts 
// person-info.ts
import { watchRecordStore } from 'vue-cache-store'
// see person-data.ts above ⬆️
import { getPerson, getPersonInfo, type Person, type PersonInfo } from 'person-data.ts'

export const personInfo = watchRecordStore<number, Person, PersonInfo>(
  // watches for reactive changes
  // auto clears cached object if returns falsy
  (id: number) => getPerson(id),
  // cached object creator
  // re-uses result on subsequent calls
  (person: Person) => getPersonInfo(person),
)
```

```vue
// inside multiple vue components
<script setup lang="ts">
  import { computed, defineProps } from 'vue'
  import { personInfo } from 'person-info.ts'
  
  const { id } = defineProps({
    id: Number,
  })
  
  // returns reactive object
  const reactivePerson = personInfo.get(id)
  // ❌ dereferencing reactive objects breaks them
  const { lastName } = personInfo.get(id)
  // ✅ use the getRefs() instead
  const { firstName, fullName } = personInfo.getRefs(id)

  const computedLastName = computed(() => personInfo.get(id).lastName)
</script>
<template>
  {{info.id}}
  {{info.fullName}}
  <input type="text" v-model="firstName"/>
  <input type="text" v-model="lastName"/>
</template>
```

## How It Works

### Record Stores `makeRecordStore()`

```ts
// person-info.ts
import { type ToRefs, type Reactive} from 'vue'
import { makeRecordStore } from 'vue-cache-store'
// see person-data.ts above ⬆️
import { getPerson, getPersonInfo, type Person, type PersonInfo } from 'person-data.ts'

// equivalent interface (not actual)
type CacheStore = {
  // get cached ids
  ids(): number[],
  // get reactive object like a pinia store
  get(id: number): Reactive<PersonInfo>,
  // get refs wrapped object like pinia's storeToRefs(useMyStore())
  getRefs(id: number): ToRefs<Reactive<PersonInfo>>,
  // check if id is cached
  has(id: number): boolean,
  // loop over each cache object
  forEach(callbackFunction: (value: Reactive<PersonInfo>, key: number) => void): void;
  // remove cached id
  remove(id: number): void,
  // clear all cache ids
  clear(): void,
}

export const personInfo: CacheStore = makeRecordStore<number, ItemInfo>((id: number, context) => {
  const person = getPerson(id)
  
  return getPersonInfo(person)
})
```

### Record Store Context
The `context` argument is the current record store instance.

```ts
// person-info.ts
import { makeRecordStore } from 'vue-cache-store'

export const personInfo = makeRecordStore<number, ItemInfo>((id: number, context: CacheStore) => {
  const person = getPerson(id)

  // 🧠 imagine a managerId property existed in the example above 🧠
  const managerInfo = context.get(person.managerId)

  return {
    ...getPersonInfo(person),
    manager: managerInfo,
  }
})
```

### Watch Record Stores `watchRecordStore()`

```ts
// person-info.ts
import { watchRecordStore } from 'vue-cache-store'
// see person-data.ts above ⬆️
import { getPerson, removePerson, getPersonInfo, type Person, type PersonInfo } from 'person-data.ts'
import { makeRecordStore } from './makeRecordStore'

export const personInfo = watchRecordStore<number, Person, PersonInfo>(
  // watches for reactive changes
  // auto clears cached object if returns falsy
  (id: number) => getPerson(id),
  // cached object creator
  // re-uses result on subsequent calls
  (person: Person) => getPersonInfo(person),
)

// watchRecordStore() wraps makeRecordStore()
// with behavior equivalent to the following:
export const personInfoWatched = makeRecordStore((id: number) => {
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
  return getPersonInfo(record)
})

// this allows the cached info object to be automatically cleared 
// when the person object it is based on is removed
const person = personInfo.get(99)

// source record is removed
removePerson(99)
people.value // []

await nextTick()
personInfo.has(99) // false
personInfo.ids() // []
```

#### Usage within a [Pinia](https://pinia.vuejs.org/) store

```ts
// person-store.ts
import { defineStore } from 'pinia'
import { watchRecordStore } from 'vue-cache-store'

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
      const { name } = toRefs(record)

      return {
        id: computed(() => person.id),
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
