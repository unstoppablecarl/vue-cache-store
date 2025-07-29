import { describe, expect, it } from 'vitest'
import { type Context, defineCacheStore } from '../src'
import { mount } from '@vue/test-utils'
import { computed, nextTick, reactive, ref, toValue, watch } from 'vue'

describe('define cache store', async () => {

  it('ref()', async () => {
    const x = ref('a')
    const useTestCache = defineCacheStore((id) => {
      return {
        id: ref(id),
        x,
      }
    })

    const ID = 99

    const App = {
      setup() {
        const cache = useTestCache()
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
          compID: comp.value.id,
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

    const cache = wrapper.vm.cache as ReturnType<typeof useTestCache>

    expect(cache.getUseCount()).toBe(1)
    expect(cache.ids()).toEqual([ID])
    expect(cache.has(ID)).toEqual(true)

    wrapper.unmount()

    expect(cache.getUseCount()).toBe(0)
    expect(cache.ids()).toEqual([])
    expect(cache.has(ID)).toEqual(false)

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

    const useTestCache = defineCacheStore((id) => {
      return {
        id: computed(() => id),
        c,
        c2,
      }
    })

    const ID = 88

    const App = {
      setup() {
        const cache = useTestCache()
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

    const useTestCache = defineCacheStore((id) => {
      return {
        r,
      }
    })

    const ID = 88

    const App = {
      setup() {
        const cache = useTestCache()
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

  it('passing args', async () => {
    const useTestCache = defineCacheStore((id, context, foo, bar) => {
      return {
        foo: computed(() => foo),
        bar: computed(() => bar),
      }
    })

    const App = {
      setup() {
        const cache = useTestCache('f', 'b')

        const { foo, bar } = cache.getRefs(99)

        return {
          cache,
          foo,
          bar,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})
    const cache = wrapper.vm.cache as ReturnType<typeof useTestCache>

    expect(cache.getUseCount()).toBe(1)
    expect(cache.ids()).toEqual([99])

    expect(wrapper.vm.foo).toEqual('f')
    expect(wrapper.vm.bar).toEqual('b')
  })

  it('passing args with options', async () => {
    const useTestCache = defineCacheStore((id, context, foo, bar) => {
      return {
        foo: computed(() => foo),
        bar: computed(() => bar),
      }
    }, { autoMountAndUnMount: false, autoClearUnused: false })

    const App = {
      setup() {
        const cache = useTestCache.withOptions({ autoMountAndUnMount: true, autoClearUnused: true }, 'f', 'b')

        const { foo, bar } = cache.getRefs(99)

        return {
          cache,
          foo,
          bar,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})
    const cache = wrapper.vm.cache as ReturnType<typeof useTestCache>

    expect(cache.getUseCount()).toBe(1)
    expect(cache.ids()).toEqual([99])

    expect(wrapper.vm.foo).toEqual('f')
    expect(wrapper.vm.bar).toEqual('b')
  })

  it('only caches once', async () => {
    const count = ref(0)
    const useTestCache = defineCacheStore((id) => {
      count.value++
      return {
        count: computed(() => count),
      }
    })

    const App = {
      setup() {
        const cache = useTestCache()
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

    const cache = wrapper.vm.cache as ReturnType<typeof useTestCache>

    // @ts-expect-error
    expect(wrapper2.vm.count.value).toBe(1)
    expect(cache.getUseCount()).toBe(2)
    expect(cache.ids()).toEqual([99])
    expect(wrapper.text()).toEqual('1')
  })

  it('get other cached values', async () => {
    const data: { [K: string]: { name: string } } = {
      A: { name: 'Jim' },
      B: { name: 'Lisa' },
      C: { name: 'Susan' },
    }

    const useTestCache = defineCacheStore((id: string, { get }) => {

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
        const cache = useTestCache()

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

  it('remove other cached values', async () => {
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

    const useTestCache = defineCacheStore((id: string, { get, remove }) => {

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
    }, { autoMountAndUnMount: false, autoClearUnused: false })

    const cache = useTestCache()

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
    const useTestCache = defineCacheStore((id: string, { has, getUseCount }) => {
      return {
        id: computed(() => id),
        hasA: computed(() => has('A')),
        hasB: computed(() => has('B')),
        count: computed(() => getUseCount()),
      }
    }, { autoMountAndUnMount: false, autoClearUnused: false })

    const cache = useTestCache()

    expect(toValue(cache.get('A'))).toEqual({
      id: 'A',
      hasA: true,
      hasB: false,
      count: 0,
    })

    cache.mount()

    expect(toValue(cache.get('B'))).toEqual({
      id: 'B',
      hasA: true,
      hasB: true,
      count: 1,
    })
  })
})
