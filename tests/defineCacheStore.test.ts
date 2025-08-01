import { describe, expect, it } from 'vitest'
import { defineRecordStore } from '../src'
import { mount } from '@vue/test-utils'
import { computed, nextTick, reactive, ref, toRef, toValue, watch } from 'vue'
import type { RecordStore } from '../types'

describe('define cache store', async () => {

  it('ref()', async () => {
    const x = ref('a')
    const cache = defineRecordStore((id) => {
      return {
        id: ref(id),
        x,
      }
    })

    const ID = 99

    const App = {
      setup() {
        const comp = computed(() => cache.get(ID))
        const item = cache.get(ID)
        const itemRefs = cache.getRefs(ID)
        const { x } = cache.getRefs(ID)
        const { id } = cache.getRefs(ID)

        function setX(v: any) {
          itemRefs.x.value = v
        }

        return {
          comp,
          item,
          itemRefs,
          x,
          id,
          itemRefsX: itemRefs.x,
          itemRefsID: itemRefs.id,
          setX,

          cache,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})

    testState('a', ID)

    const VAL = 'b'
    // @ts-expect-error
    wrapper.vm.setX(VAL)

    await wrapper.vm.$nextTick()

    testState(VAL, ID)

    const VAL2 = 'c'
    // @ts-expect-error
    wrapper.vm.x = VAL2

    await wrapper.vm.$nextTick()

    testState(VAL2, ID)

    expect(cache.ids()).toEqual([ID])
    expect(cache.has(ID)).toEqual(true)

    function testState(x: string, id: number) {
      // @ts-expect-error
      expect(wrapper.vm.comp.value).toBe(undefined)
      // @ts-expect-error
      expect(wrapper.vm.comp.id).toBe(id)
      // @ts-expect-error
      expect(wrapper.vm.comp.x).toBe(x)

      expect(wrapper.vm.id).toBe(id)
      expect(wrapper.vm.x).toBe(x)
      expect(wrapper.vm.itemRefsX).toBe(x)
      expect(wrapper.vm.item).toEqual({ id, x })
      // @ts-expect-error
      expect(wrapper.vm.item.x).toEqual(x)
      // @ts-expect-error
      expect(wrapper.vm.item.id).toEqual(id)
    }
  })

  it('computed()', async () => {
    const x = ref('a')
    const x2 = ref('b')

    const c = computed(() => x.value)
    const c2 = computed({
      get: () => x2.value,
      set: (value => x2.value = value),
    })

    const cache = defineRecordStore((id) => {
      return {
        id: computed(() => id),
        c,
        c2,
      }
    })

    const ID = 88

    const App = {
      setup() {
        const comp = computed(() => cache.get(ID))
        const item = cache.get(ID)
        const itemRefs = cache.getRefs(ID)
        const { id, c, c2 } = cache.getRefs(ID)

        function setC2(v: any) {
          c2.value = v
        }

        return {
          comp,
          item,
          id,
          c,
          c2,
          itemRefs,
          itemRefsC: itemRefs.c,
          itemRefsID: itemRefs.id,
          setC2,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})

    testState('a', 'b', ID)

    const VAL = 'b'
    x.value = VAL

    await wrapper.vm.$nextTick()

    testState(VAL, 'b', ID)

    // @ts-expect-error
    wrapper.vm.setC2('z')

    await wrapper.vm.$nextTick()
    testState(VAL, 'z', ID)

    function testState(c: string, c2: string, id: number) {
      expect(wrapper.vm.id).toBe(id)
      // @ts-expect-error
      expect(wrapper.vm.itemRefs.id.value).toBe(id)
      expect(wrapper.vm.c).toBe(c)
      expect(wrapper.vm.c2).toBe(c2)
      // @ts-expect-error
      expect(wrapper.vm.itemRefs.id.value).toBe(id)
      // @ts-expect-error
      expect(wrapper.vm.itemRefs.c.value).toBe(c)
      expect(wrapper.vm.itemRefsC).toBe(c)
      expect(wrapper.vm.itemRefsID).toBe(id)
      // @ts-expect-error
      expect(wrapper.vm.comp.c).toBe(c)
      // @ts-expect-error
      expect(wrapper.vm.comp.id).toBe(id)

      expect(wrapper.vm.item).toEqual({ id, c, c2 })
      // @ts-expect-error
      expect(wrapper.vm.item.id).toEqual(id)
      // @ts-expect-error
      expect(wrapper.vm.item.c).toEqual(c)
    }
  })

  it('reactive()', async () => {
    const r = reactive({ x: 'a' })

    const cache = defineRecordStore((id) => {
      return {
        r,
      }
    })

    const ID = 88

    const App = {
      setup() {
        const comp = computed(() => cache.get(ID))
        const item = cache.get(ID)
        const { r } = cache.getRefs(ID)
        const itemRefs = cache.getRefs(ID)

        return {
          comp,
          item,
          r,
          itemR: item.r,
          itemRefsR: itemRefs.r,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})

    expect(wrapper.vm.itemR).toEqual({ x: 'a' })
    expect(wrapper.vm.r).toEqual({ x: 'a' })
    expect(wrapper.vm.itemRefsR).toEqual({ x: 'a' })
    // @ts-expect-error
    expect(wrapper.vm.comp.r).toEqual({ x: 'a' })
    // @ts-expect-error
    expect(wrapper.vm.item.r).toEqual({ x: 'a' })

    const VAL = { x: 'b' }
    r.x = 'b'

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.itemR).toEqual(VAL)
    expect(wrapper.vm.r).toEqual(VAL)
    expect(wrapper.vm.itemRefsR).toEqual(VAL)
    // @ts-expect-error
    expect(wrapper.vm.comp.r).toEqual(VAL)
    // @ts-expect-error
    expect(wrapper.vm.item.r).toEqual(VAL)
  })

  it('prop driven cache id', async () => {

    type Item = {
      id: string,
      name: string,
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

    function findItem(id: string) {
      return data.value.find((item) => item.id === id) as Item
    }

    const cache = defineRecordStore((id: string) => {
      const item = findItem(id) as Item
      return {
        id: ref(id),
        name: toRef(item, 'name'),
      }
    })

    const App = {
      props: {
        cacheId: String,
      },
      setup(props: { cacheId: string }) {
        const cacheId = computed(() => props.cacheId)
        const comp = computed(() => cache.get(cacheId.value))
        const compRefs = computed(() => cache.getRefs(cacheId.value))
        const name = computed({
          get: () => {
            const item = cache.get(cacheId.value)
            return item.name
          },
          set: (value: string) => {
            const item = cache.get(cacheId.value)
            item.name = value
          },
        })
        const id = computed(() => {
          const { id } = cache.getRefs(cacheId.value)
          return id
        })

        function setName(v: any) {
          const item = cache.get(cacheId.value)
          item.name = v
        }

        return {
          comp,
          compRefs,
          name,
          id,
          setName,
          cache,
        }
      },
      template: `something`,
    }

    const ID = 'A'

    const wrapper = mount(App, {
      props: {
        cacheId: ID,
      },
    })

    testState('Jim', ID)

    // set via function
    const newName = 'Jimmy'
    // @ts-expect-error
    wrapper.vm.setName(newName)
    await wrapper.vm.$nextTick()
    testState(newName, ID)

    // set via computed refs
    const newName2 = 'bob'
    // @ts-expect-error
    wrapper.vm.compRefs.name.value = newName2
    await wrapper.vm.$nextTick()
    testState(newName2, ID)

    // set via computed destructured ref
    const newName3 = 'ryan'
    // @ts-expect-error
    wrapper.vm.name = newName3
    await wrapper.vm.$nextTick()
    testState(newName3, ID)

    // set via computed raw
    const newName4 = 'jessica'
    // @ts-expect-error
    wrapper.vm.comp.name = newName4
    await wrapper.vm.$nextTick()
    testState(newName4, ID)

    const ID2 = 'B'
    wrapper.setProps({ cacheId: ID2 })
    await wrapper.vm.$nextTick()
    testState('Lisa', ID2)

    function testState(name: string, id: string) {
      expect(wrapper.vm.cacheId).toBe(id)
      // @ts-expect-error
      expect(wrapper.vm.comp.value).toBe(undefined)
      // @ts-expect-error
      expect(wrapper.vm.comp.id).toBe(id)
      // @ts-expect-error
      expect(wrapper.vm.comp.name).toBe(name)
      // @ts-expect-error
      expect(wrapper.vm.id.value).toBe(id)
      expect(wrapper.vm.name).toBe(name)
      expect(findItem(id)).toEqual({ id, name })
      // @ts-expect-error
      expect(wrapper.vm.compRefs.id.value).toBe(id)
      // @ts-expect-error
      expect(wrapper.vm.compRefs.name.value).toBe(name)
    }
  })

  it('only caches once', async () => {
    const count = ref(0)
    const cache = defineRecordStore((id) => {
      count.value++
      return {
        count: computed(() => count),
      }
    })

    const App = {
      setup() {
        const { count } = cache.getRefs(99)

        return {
          cache,
          count,
        }
      },
      template: `{{count}}`,
    }

    const wrapper = mount(App, {})
    const wrapper2 = mount(App, {})

    // @ts-expect-error
    expect(wrapper2.vm.count.value).toBe(1)
    expect(cache.ids()).toEqual([99])
    expect(wrapper.text()).toEqual('1')
  })

  it('get other cached values', async () => {
    const data: { [K: string]: { name: string } } = {
      A: { name: 'Jim' },
      B: { name: 'Lisa' },
      C: { name: 'Susan' },
    }

    const cache = defineRecordStore((id: string, { get }: RecordStore<any, string>) => {

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

    const App = {
      props: {
        itemId: String,
      },
      setup(props: any) {

        const { id, name, friend } = cache.getRefs(props.itemId)

        return {
          id,
          name,
          friend,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {
      props: {
        itemId: 'A',
      },
    })

    expect(wrapper.vm.id).toEqual('A')
    expect(wrapper.vm.name).toEqual(data['A'].name)
    expect(wrapper.vm.friend).toEqual({
      id: 'B',
      name: data['B'].name,
      friend: {
        id: 'C',
        name: data['C'].name,
      },
    })
  })

  it('remove() other cached values', async () => {
    type Item = {
      id: string;
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

    const cache = defineRecordStore((id: string, { get, remove }) => {

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

  it('can use has() and getUseCount() internally', async () => {
    const cache = defineRecordStore((id: string, { has }) => {
      return {
        id: computed(() => id),
        hasA: computed(() => has('A')),
        hasB: computed(() => has('B')),
      }
    })

    expect(toValue(cache.get('A'))).toEqual({
      id: 'A',
      hasA: true,
      hasB: false,
    })

    expect(toValue(cache.get('B'))).toEqual({
      id: 'B',
      hasA: true,
      hasB: true,
    })
  })
})
