import { describe, expect, it } from 'vitest'
import { type GenericCacheStoreFactory, defineCacheStore } from '../src'
import { mount } from '@vue/test-utils'
import type { Options } from '../types'

const ID = 9

describe('define cache store options', async () => {

  it('autoMountAndUnMount = false & autoClearUnused = true', async () => {
    const [wrapper1, wrapper2] = makeOptionsTestCases({
      autoMountAndUnMount: false,
      autoClearUnused: true,
    })

    const cache1 = wrapper1.vm.cache as GenericCacheStoreFactory
    const cache2 = wrapper2.vm.cache as GenericCacheStoreFactory

    test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_true(cache1)
    test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_true(cache2)
  })

  it('autoMountAndUnMount = false & autoClearUnused = false', async () => {

    const [wrapper1, wrapper2] = makeOptionsTestCases({
      autoMountAndUnMount: false,
      autoClearUnused: false,
    })

    const cache1 = wrapper1.vm.cache as GenericCacheStoreFactory
    const cache2 = wrapper2.vm.cache as GenericCacheStoreFactory

    test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_false(cache1)
    test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_false(cache2)
  })

  it('autoMountAndUnMount = true & autoClearUnused = false', async () => {
    const [wrapper1, wrapper2] = makeOptionsTestCases({
      autoMountAndUnMount: true,
      autoClearUnused: false,
    })

    const cache1 = wrapper1.vm.cache as GenericCacheStoreFactory
    const cache2 = wrapper2.vm.cache as GenericCacheStoreFactory

    test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_false(cache1)
    test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_false(cache2)
  })

  it('autoMountAndUnMount = true & autoClearUnused = true', async () => {
    const [wrapper1, wrapper2] = makeOptionsTestCases({
      autoMountAndUnMount: true,
      autoClearUnused: true,
    })

    const cache1 = wrapper1.vm.cache as GenericCacheStoreFactory
    const cache2 = wrapper2.vm.cache as GenericCacheStoreFactory
    test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_true(cache1)
    test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_true(cache2)
  })


  const cases = [
    {
      autoMountAndUnMount: true,
      autoClearUnused: true,
      testFunc: test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_true,
    },
    {
      autoMountAndUnMount: false,
      autoClearUnused: true,
      testFunc: test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_true,
    },
    {
      autoMountAndUnMount: false,
      autoClearUnused: false,
      testFunc: test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_false,
    },
    {
      autoMountAndUnMount: true,
      autoClearUnused: false,
      testFunc: test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_false,
    },
  ]

  cases.forEach(({
                   autoMountAndUnMount: defaultAutomountAndUnmount,
                   autoClearUnused: defaultAutoClearUnused,
                 }) => {

    cases.forEach(({
                     autoMountAndUnMount,
                     autoClearUnused,
                     testFunc,
                   }) => {
      let testName = 'options override case: '
      testName += `default: autoMountAndUnMount=${JSON.stringify(defaultAutomountAndUnmount)},autoClearUnused=${JSON.stringify(defaultAutoClearUnused)}`
      testName += `override: autoMountAndUnMount=${JSON.stringify(autoMountAndUnMount)},autoClearUnused=${JSON.stringify(autoClearUnused)}`

      it(testName, async () => {

        const useTestCache = defineCacheStore((id) => {
          return {}
        }, {
          autoMountAndUnMount: defaultAutomountAndUnmount,
          autoClearUnused: defaultAutoClearUnused,
        })

        const component1 = makeComponentWithCacheOptions(useTestCache, {
          autoMountAndUnMount,
          autoClearUnused,
        })

        const wrapper = mount(component1)
        testFunc(wrapper.vm.cache)
      })
    })
  })
})

function makeComponentWithCache(useTestCache: ReturnType<typeof defineCacheStore>) {
  return {
    setup() {
      const cache = useTestCache()
      cache.get(ID)
      return {
        cache,
      }
    },
    template: `something`,
  }
}

function makeComponentWithCacheOptions(useTestCache: ReturnType<typeof defineCacheStore>, options: Options) {
  return {
    setup() {
      const cache = useTestCache.withOptions(options)
      cache.get(ID)
      return {
        cache,
      }
    },
    template: `something`,
  }
}

function makeOptionsTestCases(options: Options) {
  const useTestCache1 = defineCacheStore((id) => {
    return {}
  }, options)

  const Component1 = makeComponentWithCache(useTestCache1)

  const useTestCache2 = defineCacheStore((id) => {
    return {}
  })

  const Component2 = makeComponentWithCacheOptions(useTestCache2, options)

  return [
    mount(Component1, {}),
    mount(Component2, {}),
  ]
}

function test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_true(cache: GenericCacheStoreFactory) {
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([ID])

  cache.mount()
  expect(cache.getUseCount()).toBe(1)
  cache.unMount()
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([])
}

function test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_false(cache: GenericCacheStoreFactory) {
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([ID])

  cache.mount()
  expect(cache.getUseCount()).toBe(1)
  cache.unMount()
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([ID])
}

function test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_false(cache: GenericCacheStoreFactory) {
  expect(cache.getUseCount()).toBe(1)
  expect(cache.ids()).toEqual([ID])

  cache.mount()
  expect(cache.getUseCount()).toBe(2)
  cache.unMount()
  expect(cache.getUseCount()).toBe(1)
  cache.unMount()
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([ID])
}

function test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_true(cache: GenericCacheStoreFactory) {
  expect(cache.getUseCount()).toBe(1)
  expect(cache.ids()).toEqual([ID])

  cache.mount()
  expect(cache.getUseCount()).toBe(2)
  cache.unMount()
  expect(cache.getUseCount()).toBe(1)
  expect(cache.ids()).toEqual([ID])
  cache.unMount()
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([])
}