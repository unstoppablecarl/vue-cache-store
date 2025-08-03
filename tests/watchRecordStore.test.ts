import { describe, expect, it } from 'vitest'
import { type ComputedRef, nextTick, watch } from 'vue'
import { watchRecordStore } from '../src'
import { type Person, type PersonInfo, usePeople } from './helpers/people'

describe('watchRecordStore() 1', async () => {
  it('basic reactivity', async () => {

    const {
      people,
      getPerson,
      getPersonInfo,
    } = usePeople()

    const personInfo = watchRecordStore<number, Person, PersonInfo>(
      (id: number) => getPerson(id),
      (person: ComputedRef<Person>): PersonInfo => getPersonInfo(person),
    )

    people.value.push({
      id: 99,
      name: 'Jim',
    })
    const info = personInfo.get(99)

    expect(info.id).toBe(99)
    expect(info.name).toBe('Jim')
    expect(info.nameLength).toBe(3)

    info.name = 'Ricky'

    expect(info.name).toBe('Ricky')
    expect(info.nameLength).toBe(5)

    const person = getPerson(99) as Person

    person.name = 'A'
    expect(info.name).toBe('A')
    expect(info.nameLength).toBe(1)

  })

  it('record id changed', async () => {

    const {
      people,
      getPerson,
      getPersonInfo,
      remove,
    } = usePeople()

    const personInfo = watchRecordStore<number, Person, PersonInfo>(
      (id: number) => getPerson(id),
      (person: ComputedRef<Person>): PersonInfo => getPersonInfo(person),
    )

    people.value.push({
      id: 99,
      name: 'Jim',
    })

    const info = personInfo.get(99)
    const person = getPerson(99) as Person
    person.id = 88

    await nextTick()
    expect(personInfo.has(99)).toBe(false)

    people.value.push({
      id: 99,
      name: 'Jessica',
    })

    expect(info.name).toBe('Jessica')
    expect(info.nameLength).toBe(7)
  })

  it('record replaced', async () => {

    const {
      people,
      getPerson,
      getPersonInfo,
      remove,
    } = usePeople()

    const personInfo = watchRecordStore<number, Person, PersonInfo>(
      (id: number) => getPerson(id),
      (person: ComputedRef<Person>): PersonInfo => getPersonInfo(person),
    )

    people.value.push({
      id: 99,
      name: 'Jim',
    })

    const info = personInfo.get(99)

    expect(info.id).toBe(99)
    expect(info.name).toBe('Jim')
    expect(info.nameLength).toBe(3)

    const index = people.value.findIndex(({ id }) => id === 99)
    people.value[index] = {
      id: 33,
      name: 'Richard',
    }

    await nextTick()

    expect(personInfo.has(99)).toBe(false)

    expect(() => personInfo.get(99)).toThrowError('watchRecordStore(): Record id "99" not found.')

    const info2 = personInfo.get(33)

    expect(info2.id).toBe(33)
    expect(info2.name).toBe('Richard')
    expect(info2.nameLength).toBe(7)
    expect(personInfo.has(33)).toBe(true)
  })

  it('watch is does not trigger remove when id is the same', async () => {

    const {
      people,
      getPerson,
      getPersonInfo,
    } = usePeople()

    const personInfo = watchRecordStore<number, Person, PersonInfo>(
      (id: number) => getPerson(id),
      (person: ComputedRef<Person>): PersonInfo => getPersonInfo(person),
    )

    people.value.push({
      id: 99,
      name: 'Jessica',
    })

    const info = personInfo.get(99)

    const index = people.value.findIndex(({ id }) => id === 99)
    people.value[index] = {
      id: 99,
      name: 'Richard',
    }

    await nextTick()

    expect(personInfo.has(99)).toBe(true)
    expect(info.id).toBe(99)
    expect(info.name).toBe('Richard')
  })
})
