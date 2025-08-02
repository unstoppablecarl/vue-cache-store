import { describe, expect, it } from 'vitest'
import { makeRecordStore } from '../src'
import { computed, type ComputedRef, nextTick, ref, watch } from 'vue'

describe('define cache store', async () => {

  it('only run once', async () => {
    const count = ref(0)
    const cache = makeRecordStore((id: number) => {
      count.value++
      return {
        count: computed(() => count),
      }
    })

    expect(cache.get(99).count.value).toBe(1)
    expect(cache.ids()).toEqual([99])

    expect(cache.get(99).count.value).toBe(1)
    expect(cache.ids()).toEqual([99])
  })

  it('get other cached values', async () => {
    const data: { [K: string]: { name: string } } = {
      A: { name: 'Jim' },
      B: { name: 'Lisa' },
      C: { name: 'Susan' },
    }

    const cache = makeRecordStore<string, any>((id: string, { get }) => {
      return {
        id: computed(() => id),
        name: computed(() => data[id].name),
        friend: computed(() => {
          if (id === 'A') {
            return get('B')
          }

          if (id === 'B') {
            return get('C')
          }
        }),
      }
    })

    const { id, name, friend } = cache.getRefs('A')

    expect(id.value).toEqual('A')
    expect(name.value).toEqual(data['A'].name)
    expect(friend.value).toEqual({
      id: 'B',
      name: data['B'].name,
      friend: {
        id: 'C',
        name: data['C'].name,
      },
    })

    const person = cache.getRefs('B')
    expect(person.id.value).toEqual('B')
    expect(person.name.value).toEqual(data['B'].name)
    expect(person.friend.value).toEqual({
      id: 'C',
      name: data['C'].name,
    })
  })

  it('remove() other cached values', async () => {
    type Item = {
      readonly id: string;
      name: string;
    }
    const data = ref<Item[]>([
      {
        id: 'A',
        name: 'Jim',
      },
      {
        id: 'B',
        name: 'Lisa',
      },
    ])

    const cache = makeRecordStore((id: string, { remove }) => {

      watch(data, (newValue) => {
        const exists = newValue.find((item) => item.id === id)
        if (!exists) {
          remove(id)
        }

      }, { deep: true })

      return {
        id: computed(() => id),
        name: computed(() => {
          const exists = data.value.find((item) => item.id === id)
          return exists?.name
        }),
      }
    })

    expect(cache.get('A')).toEqual({
      id: 'A',
      name: 'Jim',
    })

    expect(cache.get('B')).toEqual({
      id: 'B',
      name: 'Lisa',
    })
    expect(cache.ids()).toEqual(['A', 'B'])

    data.value.splice(0, 1)

    expect(data.value).toEqual([{ id: 'B', name: 'Lisa' }])
    await nextTick()
    expect(cache.ids()).toEqual(['B'])

    cache.clear()
    expect(cache.ids()).toEqual([])
  })

  it('can use has() ids() forEach()', async () => {
    type Item = {
      id: ComputedRef<string>,
      ids: ComputedRef<string[]>,
      hasA: ComputedRef<boolean>,
      hasB: ComputedRef<boolean>,
    }

    const cache = makeRecordStore<string, Item>((id: string, { has, ids }) => {
      return {
        id: computed(() => id),
        ids: computed(() => ids()),
        hasA: computed(() => has('A')),
        hasB: computed(() => has('B')),
      }
    })

    const itemA = cache.get('A')
    expect(itemA.id).toEqual('A')
    expect(itemA.ids).toEqual(['A'])
    expect(itemA.hasA).toEqual(true)
    expect(itemA.hasB).toEqual(false)

    let map: any[] = []

    cache.forEach((value, key) => {
      map.push({
        key,
        value,
      })
    })

    expect(map).toEqual([
      {
        key: 'A',
        value: {
          id: 'A',
          ids: ['A'],
          hasA: true,
          hasB: false,
        },
      },
    ])

    const itemARefs = cache.getRefs('A')
    expect(itemARefs.id.value).toEqual('A')
    expect(itemARefs.ids.value).toEqual(['A'])
    expect(itemARefs.hasA.value).toEqual(true)
    expect(itemARefs.hasB.value).toEqual(false)

    const itemB = cache.get('B')
    expect(itemB.id).toEqual('B')
    expect(itemB.ids).toEqual(['A', 'B'])
    expect(itemB.hasA).toEqual(true)
    expect(itemB.hasB).toEqual(true)

    const itemBRefs = cache.getRefs('B')
    expect(itemBRefs.id.value).toEqual('B')
    expect(itemBRefs.ids.value).toEqual(['A', 'B'])
    expect(itemBRefs.hasA.value).toEqual(true)
    expect(itemBRefs.hasB.value).toEqual(true)
  })
})
