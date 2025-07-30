import { describe, expect, it } from 'vitest'
import { defineCacheStore, makeRecordStore } from '../src'
import { createPinia, defineStore, setActivePinia, type StoreDefinition } from 'pinia'
import { computed, nextTick, type ToRefs, toRefs, watch } from 'vue'
import { type ExtendedPeopleStore, type Person, type PersonInfo, usePeople } from './helpers/people'

describe('pinia integration', async () => {
  it('cache using external store', async () => {

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

    const usePeopleStore: StoreDefinition = defineStore('people', () => {
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

    const usePeopleStore: StoreDefinition = defineStore('people', () => {

      const {
        people,
        getPerson,
        add,
        remove,
        update,
      } = usePeople()

      const peopleInfo = makeRecordStore({
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