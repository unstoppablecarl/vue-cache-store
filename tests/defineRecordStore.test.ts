import { describe, expect, it } from 'vitest'
import { defineRecordStore, makeRecordStore } from '../src'
import { createPinia, defineStore, setActivePinia, type StoreDefinition } from 'pinia'
import { computed, nextTick, ref, toRefs, toValue } from 'vue'
import { type ExtendedPeopleStore, type Person, usePeople } from './helpers/people'

describe('pinia integration', async () => {

  it('default options', async () => {
    expect(
      defineRecordStore.getGlobalDefaultOptions(),
    ).toEqual({
      autoMountAndUnMount: false,
      autoClearUnused: false,
    })
  })

  it('test readme example', async () => {
    type Person = {
      id: number,
      name: string,
    }
    const people = ref<Person[]>([{
      id: 99,
      name: 'Jim',
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
        // if the return value changes to falsy
        // the cached object is removed automatically
        return getPerson(id)
      },
      create(record: Person) {
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

    expect(person.name).toBe('Jim')
    expect(person.nameLength).toBe(3)

    person.name = 'Jess'

    expect(person.name).toBe('Jess')
    expect(person.nameLength).toBe(4)

    const { name } = personInfo.getRefs(99)
    expect(name.value).toBe('Jess')

    name.value = 'Ricky'
    expect(name.value).toBe('Ricky')

    const samePerson = getPerson(99) as Person
    expect(samePerson.name).toBe('Ricky')

    removePerson(99)
    expect(people.value).toEqual([])

    await nextTick()
    expect(personInfo.has(99)).toBe(false)
    expect(personInfo.ids()).toEqual([])
  })

  it('test readme pinia example', async () => {
    type Person = {
      id: number,
      name: string,
    }

    const usePersonStore = defineStore('people', () => {
      const people = ref<Person[]>([{
        id: 99,
        name: 'Jim'
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

      const personInfo = makeRecordStore({
        getRecord(id: number) {
          return getPerson(id)
        },
        create(record: Person) {
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
        personInfo,
        getPerson,
        getInfo: (id: number) => personInfo.get(id),
        getInfoRefs: (id: number) => personInfo.getRefs(id),
        add,
        remove,
        update,
      }
    })

    const pinia = createPinia()
    setActivePinia(pinia)

    const personStore = usePersonStore()

    const person = personStore.getInfo(99)

    expect(person.name).toBe('Jim')
    expect(person.nameLength).toBe(3)

    person.name = 'Jess'

    expect(person.name).toBe('Jess')
    expect(person.nameLength).toBe(4)

    const { name } = personStore.getInfoRefs(99)
    expect(name.value).toBe('Jess')

    name.value = 'Ricky'
    expect(name.value).toBe('Ricky')

    const samePerson = personStore.getPerson(99) as Person
    expect(samePerson.name).toBe('Ricky')

    personStore.remove(99)
    expect(toValue(personStore.people)).toEqual([])

    await nextTick()
    expect(personStore.personInfo.has(99)).toBe(false)
    expect(personStore.personInfo.ids()).toEqual([])
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
        create(record: Person) {
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

  expect(() => store.getInfo(id)).toThrowError(`defineRecordStore(): Record id "${id}" not found.`)
}