import { describe, expectTypeOf, it } from 'vitest'
import { watchRecordStore } from '../src'
import { type Person, type PersonInfo, usePeople } from './helpers/people'
import { type Reactive } from 'vue'

describe('watchRecordStore() types', async () => {

  it('type inferred types', async () => {
    const {
      people,
      getPerson,
      getPersonInfo,
    } = usePeople()

    people.value.push({
      id: 99,
      name: 'Jim',
    })

    people.value.push({
      id: 44,
      name: 'Sam',
    })
    const store = watchRecordStore(
      (id: number): Person => {
        return getPerson(id) as Person
      },
      (person, context): PersonInfo => {
        if (person.value.id !== 44) {
          const otherItem = context.get(44)
          expectTypeOf(otherItem).toEqualTypeOf<Reactive<PersonInfo>>()
        }

        expectTypeOf<
          ReturnType<typeof context.get>
        >().toEqualTypeOf<Reactive<PersonInfo>>()

        expectTypeOf<
          Parameters<typeof context.get>[0]
        >().toEqualTypeOf<number>()

        return getPersonInfo(person)
      },
    )

    const item = store.get(99)

    expectTypeOf(item).toEqualTypeOf<Reactive<PersonInfo>>()

    expectTypeOf<
      ReturnType<typeof store.get>
    >().toEqualTypeOf<Reactive<PersonInfo>>()

    expectTypeOf<
      Parameters<typeof store.get>[0]
    >().toEqualTypeOf<number>()
  })
})