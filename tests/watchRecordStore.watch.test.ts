import { describe, expect, it, vi } from 'vitest'
import { watchRecordStore } from '../src'
import { type Person, type PersonInfo, usePeople } from './helpers/people'
import { type ComputedRef, nextTick, watch } from 'vue'

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    watch: vi.fn((source, cb) => {
      const result = actual.watch(source, cb)

      return vi.fn(result)
    }),
  }
})

describe('watchRecordStore() watcher', async () => {
  it('watch is stopped when removed', async () => {

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
      name: 'Jessica',
    })

    const info = personInfo.get(99)
    expect(info.id).toBe(99)
    expect(info.name).toBe('Jessica')

    remove(99)

    await nextTick()

    expect(personInfo.has(99)).toBe(false)

    // @ts-expect-error
    const unwatch = watch.mock.results[0].value
    expect(unwatch).toHaveBeenCalledOnce()
  })
})
