import { describe, it } from 'vitest'
import { makeRecordStore } from '../src'
import { computed, toRefs } from 'vue'
import { type Person, usePeople } from './helpers/people'

describe('makeRecordStore()', async () => {
  it('case 1', async () => {

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

  })
})