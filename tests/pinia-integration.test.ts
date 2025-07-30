import { describe, expect, it } from 'vitest'
import { type CacheStore, defineCacheRecordStore, defineCacheStore } from '../src'
import { createPinia, defineStore, setActivePinia, type Store, type StoreDefinition } from 'pinia'
import { computed, nextTick, ref, type ToRefs, toRefs, watch } from 'vue'

type Person = {
  id: number,
  name: string,
}
type PersonInfo = {
  id: number,
  name: string,
  nameLength: number,
}

type PeopleStore = ReturnType<typeof usePeople>

type ExtendedPeopleStore = Store<string, PeopleStore & {
  getInfo: (id: number) => PersonInfo,
  peopleInfo: CacheStore<Person>
}>

const usePeople = () => {
  const people = ref<Person[]>([])
  const peopleIdIncrement = ref(0)
  const getPerson = (id: number) => people.value.find(person => person.id === id)

  return {
    people,
    getPerson,
    add(name: string) {
      const id = peopleIdIncrement.value++
      people.value.push({ id, name })
      return id
    },
    remove(id: number) {
      const index = people.value.findIndex(person => person.id === id)
      if (index > -1) {
        people.value.splice(index, 1)
      }
    },
    update: (id: number, name: string) => {
      const item = getPerson(id)
      if (!item) {
        throw new Error(`Item "${id}" not found`)
      }

      item.name = name
    },
  }
}

describe('pinia integration', async () => {

  it('cache outside of store', async () => {

    const usePeopleInfo = defineCacheStore((id: number): ToRefs<PersonInfo> => {
      const peopleStore = usePeopleStore()
      const person = computed(() => peopleStore.getPerson(id))
      const { id: personId, name } = toRefs(peopleStore.getPerson(id) as Person)

      return {
        id: personId,
        name,
        nameLength: computed(() => person.value?.name.length || 0),
      }
    }, { autoMountAndUnMount: false, autoClearUnused: false })

    const usePeopleStore = defineStore('people', () => {
      const {
        people,
        getPerson,
        add,
        remove,
        update,
      } = usePeople()

      const peopleInfo = usePeopleInfo()

      watch(people, (newValue) => {
        peopleInfo.ids().forEach(id => {
          const exists = newValue.find((item) => item.id === id)
          if (!exists) {
            peopleInfo.remove(id)
          }
        })

      }, { deep: true })

      return {
        people,
        peopleInfo,
        getPerson,
        getInfo: (id: number) => peopleInfo.get(id),
        add,
        remove,
        update,
      }
    })

    const pinia = createPinia()
    setActivePinia(pinia)

    // @ts-expect-error
    const store = usePeopleStore() as ExtendedPeopleStore
    await test_store(store)
  })

  it('cache inside of store', async () => {

    const usePeopleStore: StoreDefinition = defineStore('people', () => {
      const {
        people,
        getPerson,
        add,
        remove,
        update,
      } = usePeople()

      const usePeopleInfo = defineCacheStore((id: number, { remove }) => {
        watch(people, (newValue) => {
          const exists = newValue.find((item) => item.id === id)
          if (!exists) {
            remove(id)
          }
        }, { deep: true })

        const person = computed(() => getPerson(id))
        const { id: personId, name } = toRefs(getPerson(id) as Person)

        return {
          id: personId,
          name,
          nameLength: computed(() => person.value?.name.length || 0),
        }
      }, { autoMountAndUnMount: false, autoClearUnused: false })

      const peopleInfo = usePeopleInfo()

      return {
        people,
        peopleInfo,
        getPerson,
        getInfo: (id: number) => peopleInfo.get(id),
        add,
        remove,
        update,
      }
    })

    const pinia = createPinia()
    setActivePinia(pinia)

    const store = usePeopleStore() as ExtendedPeopleStore
    await test_store(store)
  })

  it('cache record store inside of store', async () => {

    const usePeopleStore = defineStore('people', () => {

      const {
        people,
        getPerson,
        add,
        remove,
        update,
      } = usePeople()

      const usePeopleInfo = defineCacheRecordStore({
        getRecord(id: number) {
          return getPerson(id)
        },
        create(record: Person, context) {
          const person = computed(() => record)
          const { id: personId, name } = toRefs(record)

          return {
            id: personId,
            name,
            nameLength: computed(() => person.value?.name.length || 0),
          }
        },
      })

      const peopleInfo = usePeopleInfo()

      return {
        people,
        peopleInfo,
        getPerson,
        getInfo: (id: number) => peopleInfo.get(id),
        add,
        remove,
        update,
      }
    })


    const pinia = createPinia()
    setActivePinia(pinia)
    // @ts-expect-error
    const store = usePeopleStore() as ExtendedPeopleStore
    await test_store(store)

  })

})

async function test_store(store: ExtendedPeopleStore) {

  const id = store.add('jim')

  expect(store.getPerson(id)).toEqual({ id: id, name: 'jim' })
  expect(store.getInfo(id)).toEqual({ id: id, name: 'jim', nameLength: 3 })
  expect(store.peopleInfo.ids()).toEqual([id])
  expect(store.peopleInfo.has(id)).toEqual(true)

  store.update(id, 'jimmy')

  expect(store.getPerson(id)).toEqual({ id: 0, name: 'jimmy' })
  expect(store.getInfo(id)).toEqual({ id: 0, name: 'jimmy', nameLength: 5 })

  const id2 = store.add('jennifer')

  expect(store.getPerson(id2)).toEqual({ id: id2, name: 'jennifer' })
  expect(store.getInfo(id2)).toEqual({ id: id2, name: 'jennifer', nameLength: 8 })
  expect(store.peopleInfo.ids()).toEqual([id, id2])
  expect(store.peopleInfo.has(id)).toEqual(true)
  expect(store.peopleInfo.has(id2)).toEqual(true)

  store.remove(id)

  await nextTick()

  expect(store.getPerson(id)).toEqual(undefined)
  expect(store.peopleInfo.ids()).toEqual([id2])
  expect(store.peopleInfo.has(id)).toEqual(false)

  expect(store.getPerson(id2)).toEqual({ id: id2, name: 'jennifer' })
  expect(store.getInfo(id2)).toEqual({ id: id2, name: 'jennifer', nameLength: 8 })
  expect(store.peopleInfo.has(id2)).toEqual(true)
}