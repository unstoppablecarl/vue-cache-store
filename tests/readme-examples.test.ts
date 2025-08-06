import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  computed,
  type ComputedRef,
  nextTick,
  type Reactive,
  ref,
  type ToRefs,
  toValue,
  type WritableComputedRef,
} from 'vue'
import { makeRecordStore, type RecordStore, watchRecordStore } from '../src'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { toWritableComputed } from '../src'

describe('readme examples', async () => {
  it('person data', async () => {
    // person-data.ts
    type Person = {
      id: number,
      firstName: string,
      lastName: string,
    }

    type PersonInfo = {
      id: ComputedRef<number>,
      firstName: WritableComputedRef<string>,
      lastName: WritableComputedRef<string>,
      fullName: ComputedRef<string>,
    }

    const people = ref<Person[]>([{
      id: 99,
      firstName: 'Bobby',
      lastName: 'Testerson',
    }])
    const getPerson = (id: number) => people.value.find(person => person.id === id)

    const toComputed = (obj: ComputedRef | WritableComputedRef<any>, key: string) => computed({
      get: () => obj.value[key],
      set: (v: string) => {
        obj.value[key] = v
      },
    })

    const getPersonInfo = (person: ComputedRef<Person>): PersonInfo => {

      const firstName = toComputed(person, 'firstName')
      const lastName = toComputed(person, 'lastName')

      // 🧠 imagine this is non-trivial and complicated 🧠
      return {
        id: computed(() => person.value.id),
        firstName,
        lastName,
        fullName: computed(() => firstName.value + ' ' + lastName.value),
      }
    }

    const person = getPerson(99) as Person
    const info = getPersonInfo(computed(() => person))

    expect(info.firstName.value).toBe('Bobby')
    expect(info.lastName.value).toBe('Testerson')
    expect(info.fullName.value).toBe('Bobby Testerson')

    info.firstName.value = 'Jess'
    info.lastName.value = 'Jones'

    expect(info.firstName.value).toBe('Jess')
    expect(info.lastName.value).toBe('Jones')
    expect(info.fullName.value).toBe('Jess Jones')

    const personInfo = watchRecordStore<number, Person, PersonInfo>(
      // record watcher
      // auto clears cached object if returns falsy
      (id: number) => getPerson(id),
      // cached object creator
      (record: ComputedRef<Person>) => getPersonInfo(record),
    )

    const info2 = personInfo.get(99)

    expect(info2.firstName).toBe('Jess')
    expect(info2.lastName).toBe('Jones')
    expect(info2.fullName).toBe('Jess Jones')

    info2.firstName = 'Sam'
    info2.lastName = 'Thompson'

    expect(info2.firstName).toBe('Sam')
    expect(info2.lastName).toBe('Thompson')
    expect(info2.fullName).toBe('Sam Thompson')
  })

  it('check readme type explanation is accurate', async () => {
    type Item = {
      id: number,
      name: string,
    }

    type CustomRecordStore = {
      ids(): number[],
      get(id: number): Reactive<Item>,
      getRefs(id: number): ToRefs<Reactive<Item>>,
      has(id: number): boolean,
      remove(id: number): void,
      clear(): void,
      forEach(callbackFunction: (value: Reactive<Item>, key: number) => void): void;
    }

    const cache = makeRecordStore((id: number, context: RecordStore<number, Item>): Item => {
      return {
        id,
        name: 'susan',
      }
    })

    expectTypeOf(cache).toEqualTypeOf<CustomRecordStore>()
  })

  it('test readme pinia example', async () => {
    type Person = {
      id: number,
      name: string,
    }

    const usePersonStore = defineStore('people', () => {
      const people = ref<Person[]>([{
        id: 99,
        name: 'Jim',
      }])
      const peopleIdIncrement = ref(0)

      const find = (id: number) => people.value.find(person => person.id === id)
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
        const item = find(id)
        if (!item) {
          throw new Error(`Item "${id}" not found`)
        }

        item.name = name
      }

      const personInfo = watchRecordStore(
        (id: number) => find(id),
        (record: ComputedRef<Person>) => {
          const { name } = toWritableComputed(record)

          return {
            id: computed(() => record.value.id),
            name,
            nameLength: computed(() => name.value.length || 0),
          }
        },
      )

      return {
        find,
        people,
        personInfo,
        get: personInfo.get,
        getRefs: personInfo.getRefs,
        add,
        remove,
        update,
      }
    })

    const pinia = createPinia()
    setActivePinia(pinia)

    const personStore = usePersonStore()

    const person = personStore.get(99)
    expect(personStore.personInfo.has(99)).toBe(true)

    expect(person.name).toBe('Jim')
    expect(person.nameLength).toBe(3)

    person.name = 'Jess'

    expect(person.name).toBe('Jess')
    expect(person.nameLength).toBe(4)

    const { id, name } = personStore.getRefs(99)
    expect(name.value).toBe('Jess')

    expect(() => {
      id.value = 99
    }).toThrowError(`'set' on proxy: trap returned falsish for property 'id'`)

    name.value = 'Ricky'
    expect(name.value).toBe('Ricky')

    const samePerson = personStore.get(99)
    expect(samePerson.name).toBe('Ricky')

    const p = personStore.find(99) as Person
    p.id = 88

    await nextTick()
    expect(personStore.personInfo.has(99)).toBe(false)

    expect(() => personStore.get(99)).toThrowError('watchRecordStore(): Record id "99" not found.')

    personStore.remove(88)
    expect(toValue(personStore.people)).toEqual([])

    await nextTick()
    expect(personStore.personInfo.has(88)).toBe(false)
    expect(personStore.personInfo.ids()).toEqual([])
  })
})