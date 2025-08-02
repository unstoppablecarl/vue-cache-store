import { describe, expect, it } from 'vitest'
import { watchRecordStore } from '../src'
import { createPinia, defineStore, setActivePinia, type StoreDefinition } from 'pinia'
import { computed, nextTick, ref, toRefs, toValue } from 'vue'
import { type ExtendedPeopleStore, type Person, usePeople } from './helpers/people'

describe('pinia integration', async () => {

  it('cache record store inside of store', async () => {

    const usePeopleStore: StoreDefinition = defineStore('people', () => {

      const {
        people,
        getPerson,
        add,
        remove,
        update,
      } = usePeople()

      const personInfo = watchRecordStore(
        (id: number) => {
          return getPerson(id)
        },
        (record: Person) => {
          const person = computed(() => record)
          const { id: personId, name } = toRefs(record)

          return {
            id: personId,
            name,
            nameLength: computed(() => person.value?.name.length || 0),
          }
        },
      )

      return {
        people,
        personInfo,
        getPerson,
        getInfo: (id: number) => personInfo.get(id),
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
  expect(store.personInfo.ids()).toEqual([id])
  expect(store.personInfo.has(id)).toEqual(true)

  store.update(id, 'jimmy')

  expect(store.getPerson(id)).toEqual({ id: 0, name: 'jimmy' })
  expect(store.getInfo(id)).toEqual({ id: 0, name: 'jimmy', nameLength: 5 })

  const id2 = store.add('jennifer')

  expect(store.getPerson(id2)).toEqual({ id: id2, name: 'jennifer' })
  expect(store.getInfo(id2)).toEqual({ id: id2, name: 'jennifer', nameLength: 8 })
  expect(store.personInfo.ids()).toEqual([id, id2])
  expect(store.personInfo.has(id)).toEqual(true)
  expect(store.personInfo.has(id2)).toEqual(true)

  store.remove(id)

  await nextTick()

  expect(store.getPerson(id)).toEqual(undefined)

  expect(store.personInfo.ids()).toEqual([id2])
  expect(store.personInfo.has(id)).toEqual(false)

  expect(store.getPerson(id2)).toEqual({ id: id2, name: 'jennifer' })
  expect(store.getInfo(id2)).toEqual({ id: id2, name: 'jennifer', nameLength: 8 })
  expect(store.personInfo.has(id2)).toEqual(true)

  expect(() => store.getInfo(id)).toThrowError(`watchRecordStore(): Record id "${id}" not found.`)
}