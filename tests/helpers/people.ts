import type { Store } from 'pinia'
import type { CacheStore } from '../../src'
import { ref } from 'vue'

export type Person = {
  id: number,
  name: string,
}
export type PersonInfo = {
  id: number,
  name: string,
  nameLength: number,
}
export type PeopleStore = ReturnType<typeof usePeople>

export type ExtendedPeopleStore = Store<string, PeopleStore & {
  getInfo: (id: number) => PersonInfo,
  personInfo: CacheStore<Person>
}>
export const usePeople = () => {
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