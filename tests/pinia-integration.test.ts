import { describe, expect, it } from 'vitest'
import { defineCacheStore } from '../src'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { computed, ref, toRefs } from 'vue'

describe('pinia integration', async () => {
  it('example 1', async () => {
    type Person = {
      id: number;
      name: string;
    }

    const usePeopleInfo = defineCacheStore((id: number) => {
      const peopleStore = usePeopleStore()
      const person = computed(() => peopleStore.get(id))
      const { id: personId, name } = toRefs(peopleStore.get(id) as Person)

      return {
        id: personId,
        name,
        nameLength: computed(() => person.value?.name.length || 0),
      }
    }, { autoMountAndUnMount: false, autoClearUnused: false })

    const usePeopleStore = defineStore('people', () => {
      const people = ref<Person[]>([])
      const peopleIdIncrement = ref(0)
      const peopleInfo = usePeopleInfo()

      const get = (id: number) => people.value.find(person => person.id === id)

      return {
        people,
        get,
        getInfo: (id: number) => peopleInfo.get(id),
        add(name: string) {
          const id = peopleIdIncrement.value++
          people.value.push({ id, name })
          return id
        },
        update: (id: number, name: string) => {
          const item = get(id)
          if (!item) {
            throw new Error(`Item "${id}" not found`)
          }

          item.name = name
        },
      }
    })

    const pinia = createPinia()
    setActivePinia(pinia)

    const store = usePeopleStore()
    const id = store.add('jim')

    expect(store.get(id)).toEqual({ id: 0, name: 'jim' })
    expect(store.getInfo(id)).toEqual({ id: 0, name: 'jim', nameLength: 3 })

    store.update(id, 'jimmy')

    expect(store.get(id)).toEqual({ id: 0, name: 'jimmy' })
    expect(store.getInfo(id)).toEqual({ id: 0, name: 'jimmy', nameLength: 5 })

    const infoStore = usePeopleInfo()
    const info = infoStore.get(id)

    info.name = 'beth'

    expect(store.get(id)).toEqual({ id: 0, name: 'beth' })
    expect(store.getInfo(id)).toEqual({ id: 0, name: 'beth', nameLength: 4 })

    const { name } = infoStore.getRefs(id)

    name.value = 'suzanne'

    expect(store.get(id)).toEqual({ id: 0, name: 'suzanne' })
    expect(store.getInfo(id)).toEqual({ id: 0, name: 'suzanne', nameLength: 7 })

  })
})