import { describe, expect, it } from 'vitest'
import { type Context, defineCacheStore } from '../src'
import { mount } from '@vue/test-utils'
import { computed, nextTick, reactive, ref, toValue, watch } from 'vue'
import { reactiveToRefs } from '../src/defineCacheStore'

describe('define cache store', async () => {
  it('ref()', async () => {
    const x = ref('a')
    const useTestCache = defineCacheStore((id: number, { get, remove }: Context) => {
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

        const item = reactiveToRefs(cache.get(ID))
        const { x } = reactiveToRefs(cache.get(ID))
        const { id } = reactiveToRefs(cache.get(ID))

        const itemRefs = cache.getRefs(ID)
        const { x: refsX, id: refsID } = cache.getRefs(ID)

        function setX(v: any) {
          itemRefs.x.value = v
        }

        return {
          comp,

          x,
          refsX,
          itemX: item.x,
          itemRefsX: itemRefs.x,
          id,
          compID: comp.value.id,
          refsID,
          itemID: item.id,
          itemRefsID: itemRefs.id,
          setX,

          cache,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})

    expect(wrapper.vm.id).toBe(ID)
    expect(wrapper.vm.refsID).toBe(ID)
    expect(wrapper.vm.itemID).toBe(ID)
    // @ts-expect-error
    expect(wrapper.vm.comp.id).toBe(ID)

    expect(wrapper.vm.itemX).toBe('a')
    expect(wrapper.vm.x).toBe('a')

    expect(wrapper.vm.itemRefsX).toBe('a')
    expect(wrapper.vm.refsX).toBe('a')
    // @ts-expect-error
    expect(wrapper.vm.comp.x).toBe('a')

    const VAL = 'b'
    // @ts-expect-error
    wrapper.vm.setX(VAL)

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.itemX).toBe(VAL)
    expect(wrapper.vm.x).toBe(VAL)

    expect(wrapper.vm.itemRefsX).toBe(VAL)
    expect(wrapper.vm.refsX).toBe(VAL)
    // @ts-expect-error
    expect(wrapper.vm.comp.x).toBe(VAL)

    const cache = wrapper.vm.cache as ReturnType<typeof useTestCache>
    expect(cache.getUseCount()).toBe(1)
    expect(cache.ids()).toEqual([ID])

    const VAL2 = 'c'
    // @ts-expect-error
    wrapper.vm.x = VAL2

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.itemX).toBe(VAL2)
    expect(wrapper.vm.x).toBe(VAL2)

    expect(wrapper.vm.itemRefsX).toBe(VAL2)
    expect(wrapper.vm.refsX).toBe(VAL2)
    // @ts-expect-error
    expect(wrapper.vm.comp.x).toBe(VAL2)

    expect(cache.getUseCount()).toBe(1)
    expect(cache.ids()).toEqual([ID])
    expect(cache.has(ID)).toEqual(true)

    wrapper.unmount()

    expect(cache.getUseCount()).toBe(0)
    expect(cache.ids()).toEqual([])
    expect(cache.has(ID)).toEqual(false)

  })

  it('computed()', async () => {

    const x = ref('a')
    const x2 = ref('x')

    const c = computed(() => x.value)
    const c2 = computed({
      get: () => x2.value,
      set: (value => x2.value = value),
    })

    const useTestCache = defineCacheStore((id: number, { get, remove }: Context) => {
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

        const item = reactiveToRefs(cache.get(ID))
        let { c, c2 } = reactiveToRefs(cache.get(ID))
        const { id } = reactiveToRefs(cache.get(ID))

        const itemRefs = cache.getRefs(ID)
        const { c: refsC } = cache.getRefs(ID)
        const { c2: refsC2 } = cache.getRefs(ID)

        const { id: refsID } = cache.getRefs(ID)

        function setX(v: any) {
          itemRefs.x.value = v
        }

        function setC2(v: any) {
          // @ts-expect-error
          c2.value = v
        }

        return {
          comp,

          c2,
          refsC2,

          c,
          refsC,
          itemC: item.c,
          itemRefsC: itemRefs.c,
          id,
          refsID,
          itemID: item.id,
          itemRefsID: itemRefs.id,
          setX,
          setC2,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})

    expect(wrapper.vm.id).toBe(ID)
    expect(wrapper.vm.refsID).toBe(ID)
    expect(wrapper.vm.itemID).toBe(ID)

    expect(wrapper.vm.itemC).toBe('a')
    expect(wrapper.vm.c).toBe('a')
    expect(wrapper.vm.itemRefsC).toBe('a')
    expect(wrapper.vm.refsC).toBe('a')
    // @ts-expect-error
    expect(wrapper.vm.comp.c).toBe('a')

    const VAL = 'b'
    x.value = VAL

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.itemC).toBe(VAL)
    expect(wrapper.vm.c).toBe(VAL)

    expect(wrapper.vm.itemRefsC).toBe(VAL)
    expect(wrapper.vm.refsC).toBe(VAL)
    // @ts-expect-error
    expect(wrapper.vm.comp.c).toBe(VAL)

    // @ts-expect-error
    wrapper.vm.setC2('z')

    expect(c2.value).toEqual('z')
  })

  it('reactive()', async () => {
    const r = reactive({ x: 'a' })

    const useTestCache = defineCacheStore((id: number, { get, remove }: Context) => {
      return {
        r,
      }
    })

    const ID = 88

    const App = {
      setup() {
        const cache = useTestCache()
        const comp = computed(() => cache.get(ID))

        const item = reactiveToRefs(cache.get(ID))
        const { r } = reactiveToRefs(cache.get(ID))

        const itemRefs = cache.getRefs(ID)
        const { r: refsR } = cache.getRefs(ID)

        return {
          comp,

          r,
          refsR,
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
    expect(wrapper.vm.refsR).toEqual({ x: 'a' })
    // @ts-expect-error
    expect(wrapper.vm.comp.r).toEqual({ x: 'a' })

    const VAL = { x: 'b' }
    r.x = 'b'

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.itemR).toEqual(VAL)
    expect(wrapper.vm.r).toEqual(VAL)

    expect(wrapper.vm.itemRefsR).toEqual(VAL)
    expect(wrapper.vm.refsR).toEqual(VAL)
    // @ts-expect-error
    expect(wrapper.vm.comp.r).toEqual(VAL)
  })

  it('autoMountAndUnMount = false & autoClearUnused = true', async () => {
    const useTestCache = defineCacheStore((id: number, { get, remove }: Context) => {
      return {}
    }, { autoMountAndUnMount: false, autoClearUnused: true })

    const App = {
      setup() {
        const cache = useTestCache()
        cache.get(9)
        return {
          cache,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})
    const cache = wrapper.vm.cache as ReturnType<typeof useTestCache>

    expect(cache.getUseCount()).toBe(0)
    expect(cache.ids()).toEqual([9])

    cache.mount()
    expect(cache.getUseCount()).toBe(1)
    cache.unMount()
    expect(cache.getUseCount()).toBe(0)
    expect(cache.ids()).toEqual([])
  })

  it('autoMountAndUnMount = false & autoClearUnused = false', async () => {
    const useTestCache = defineCacheStore((id: number, { get, remove }: Context) => {
      return {}
    }, { autoMountAndUnMount: false, autoClearUnused: false })

    const App = {
      setup() {
        const cache = useTestCache()
        cache.get(9)
        return {
          cache,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})
    const cache = wrapper.vm.cache as ReturnType<typeof useTestCache>

    expect(cache.getUseCount()).toBe(0)
    expect(cache.ids()).toEqual([9])

    cache.mount()
    expect(cache.getUseCount()).toBe(1)
    cache.unMount()
    expect(cache.getUseCount()).toBe(0)
    expect(cache.ids()).toEqual([9])
  })

  it('autoMountAndUnMount = true & autoClearUnused = false', async () => {
    const useTestCache = defineCacheStore((id: number, { get, remove }: Context) => {
      return {}
    }, { autoMountAndUnMount: true, autoClearUnused: false })

    const App = {
      setup() {
        const cache = useTestCache()
        cache.get(9)
        return {
          cache,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})
    const cache = wrapper.vm.cache as ReturnType<typeof useTestCache>

    expect(cache.getUseCount()).toBe(1)
    expect(cache.ids()).toEqual([9])

    cache.mount()
    expect(cache.getUseCount()).toBe(2)
    cache.unMount()
    expect(cache.getUseCount()).toBe(1)
    cache.unMount()
    expect(cache.getUseCount()).toBe(0)
    expect(cache.ids()).toEqual([9])
  })

  it('autoMountAndUnMount = true & autoClearUnused = true', async () => {
    const useTestCache = defineCacheStore((id: number, { get, remove }: Context) => {
      return {}
    }, { autoMountAndUnMount: true, autoClearUnused: true })

    const App = {
      setup() {
        const cache = useTestCache()
        cache.get(9)
        return {
          cache,
        }
      },
      template: `something`,
    }

    const wrapper = mount(App, {})
    const cache = wrapper.vm.cache as ReturnType<typeof useTestCache>

    expect(cache.getUseCount()).toBe(1)
    expect(cache.ids()).toEqual([9])

    cache.mount()
    expect(cache.getUseCount()).toBe(2)
    cache.unMount()
    expect(cache.getUseCount()).toBe(1)
    expect(cache.ids()).toEqual([9])
    cache.unMount()
    expect(cache.getUseCount()).toBe(0)
    expect(cache.ids()).toEqual([])
  })

  it('passing args', async () => {
    const useTestCache = defineCacheStore((id: number, { get, remove }: Context, foo, bar) => {
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

  it('only caches once', async () => {
    const count = ref(0)
    const useTestCache = defineCacheStore((id: number) => {
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

    const useTestCache = defineCacheStore((id: string, { get, remove }: Context) => {

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

    const useTestCache = defineCacheStore((id: string, { get, remove }: Context) => {

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
    const useTestCache = defineCacheStore((id: string, { has, getUseCount }: Context) => {
      return {
        id: computed(() => id),
        hasA: computed(() => has('A')),
        hasB: computed(() => has('B')),
        count: computed(() => getUseCount()),
      }
    }, {autoMountAndUnMount: false, autoClearUnused: false })

    const cache = useTestCache()

    expect(toValue(cache.get('A'))).toEqual({
      id: 'A',
      hasA: true,
      hasB: false,
      count: 0
    })

    cache.mount()

    expect(toValue(cache.get('B'))).toEqual({
      id: 'B',
      hasA: true,
      hasB: true,
      count: 1
    })
  })
})