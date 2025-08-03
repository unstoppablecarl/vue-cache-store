import { computed, type ComputedRef, type Ref, ref } from 'vue'
import { toWritableComputed } from '../../src/toWritableComputed'

export type Person = {
  id: number,
  name: string,
}

export type PersonInfo = {
  id: ComputedRef<number>,
  name: Ref<string>,
  nameLength: ComputedRef<number>,
}

export const usePeople = () => {
  const people = ref<Person[]>([])
  const getPerson = (id: number) => people.value.find(person => person.id === id)

  const getPersonInfo = (person: ComputedRef<Person>): PersonInfo => {

    const { name } = toWritableComputed(person)

    return {
      id: computed(() => person.value.id),
      name,
      nameLength: computed(() => name.value.length),
    }
  }

  return {
    people,
    getPerson,
    getPersonInfo,
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