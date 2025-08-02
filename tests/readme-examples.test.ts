import { describe, expect, expectTypeOf, it } from 'vitest'
import { computed, type ComputedRef, nextTick, type Reactive, type Ref, ref, toRefs, type ToRefs, toValue } from 'vue'
import { makeRecordStore, type RecordStore, watchRecordStore } from '../src'
import { createPinia, defineStore, setActivePinia } from 'pinia'

type Item = {
  id: number,
  name: string,
}

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
      firstName: Ref<string>,
      lastName: Ref<string>,
      fullName: ComputedRef<string>,
    }

    const people = ref<Person[]>([{
      id: 99,
      firstName: 'Jim',
      lastName: 'Kirk',
    }])
    const getPerson = (id: number) => people.value.find(person => person.id === id)

    const getPersonInfo = (person: Person): PersonInfo => {
      const { firstName, lastName } = toRefs(person)

      // 🧠 imagine this is non-trivial and complicated 🧠
      return {
        id: computed(() => person.id),
        firstName,
        lastName,
        fullName: computed(() => firstName.value + ' ' + lastName.value),
      }
    }

    const person = getPerson(99) as Person
    const info = getPersonInfo(person)

    expect(info.firstName.value).toBe('Jim')
    expect(info.lastName.value).toBe('Kirk')
    expect(info.fullName.value).toBe('Jim Kirk')

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
      (person: Person) => getPersonInfo(person),
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
        },
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
})