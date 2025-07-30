import { describe, expect, it, onTestFailed } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineCacheStore, type GenericCacheStore } from '../src'
import type { Options, RequiredOptions } from '../src/storeOptions'

const ID = 9


describe('define cache store options', async () => {

  it('permute', async () => {

  })

  const cases = [
    {
      options: {
        autoMountAndUnMount: true,
        autoClearUnused: true,
      },
      testFunc: test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_true,
    },
    {
      options: {
        autoMountAndUnMount: false,
        autoClearUnused: true,
      },
      testFunc: test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_true,
    },
    {
      options: {
        autoMountAndUnMount: false,
        autoClearUnused: false,
      },
      testFunc: test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_false,
    },
    {
      options: {
        autoMountAndUnMount: true,
        autoClearUnused: false,
      },
      testFunc: test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_false,
    },
  ]

  cases.forEach(({
                   options,
                   testFunc,
                 }) => {

    const optionCases = permuteCase(options)

    optionCases.forEach(([
                           globalOptions,
                           defaultOptions,
                           directOptions,
                         ]: [Options | undefined, Options | undefined, Options | undefined]) => {

      const undefinedOptions = {
        autoMountAndUnMount: undefined,
        autoClearUnused: undefined,
      }

      const {
        autoMountAndUnMount: globalAutomountAndUnmount,
        autoClearUnused: globalAutoClearUnused,
      } = globalOptions ?? undefinedOptions

      const {
        autoMountAndUnMount: defaultAutomountAndUnmount,
        autoClearUnused: defaultAutoClearUnused,
      } = defaultOptions ?? undefinedOptions

      const {
        autoMountAndUnMount: directAutomountAndUnmount,
        autoClearUnused: directAutoClearUnused,
      } = directOptions ?? undefinedOptions


      const {
        autoMountAndUnMount: expectedAutomountAndUnmount,
        autoClearUnused: expectedAutoClearUnused,
      } = options ?? undefinedOptions


      let testName = 'options override case: '
      testName += `global: autoMountAndUnMount=${JSON.stringify(globalAutomountAndUnmount)},autoClearUnused=${JSON.stringify(globalAutoClearUnused)}`
      testName += `default: autoMountAndUnMount=${JSON.stringify(defaultAutomountAndUnmount)},autoClearUnused=${JSON.stringify(defaultAutoClearUnused)}`
      testName += `override: autoMountAndUnMount=${JSON.stringify(directAutomountAndUnmount)},autoClearUnused=${JSON.stringify(directAutoClearUnused)}`
      testName += `expected: autoMountAndUnMount=${JSON.stringify(expectedAutomountAndUnmount)},autoClearUnused=${JSON.stringify(expectedAutoClearUnused)}`

      it(testName, async () => {

        onTestFailed(() => {
          console.log({
            globalOptions,
            defaultOptions,
            directOptions,
            expectedResultOptions: options,
          })
        })

        if (globalOptions) {
          defineCacheStore.setGlobalDefaultOptions(globalOptions)
        }
        let useTestCache
        if (defaultOptions) {
          useTestCache = defineCacheStore((id) => {
            return {}
          }, defaultOptions)
        } else {
          useTestCache = defineCacheStore((id) => {
            return {}
          })
        }

        let component

        if (directOptions) {
          component = makeComponentWithCacheOptions(useTestCache, directOptions)
        } else {
          component = makeComponentWithCache(useTestCache)
        }

        const wrapper = mount(component)
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
      const cache = useTestCache(options)
      cache.get(ID)
      return {
        cache,
      }
    },
    template: `something`,
  }
}


function test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_true(cache: GenericCacheStore) {
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([ID])

  cache.mount()
  expect(cache.getUseCount()).toBe(1)
  cache.unMount()
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([])
}

function test_autoMountAndUnMount_is_false_AND_autoClearUnused_is_false(cache: GenericCacheStore) {
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([ID])

  cache.mount()
  expect(cache.getUseCount()).toBe(1)
  cache.unMount()
  expect(cache.getUseCount()).toBe(0)
  expect(cache.ids()).toEqual([ID])
}

function test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_false(cache: GenericCacheStore) {
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

function test_autoMountAndUnMount_is_true_AND_autoClearUnused_is_true(cache: GenericCacheStore) {
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

function permuteCase(options: RequiredOptions) {
  const p1 = permutation()
  const p2 = permutation()
  const p3 = permutation()

  const cases: any[] = []
  p1.forEach((c1) => {
    p2.forEach((c2) => {
      p3.forEach((c3) => {

        const {
          autoMountAndUnMount,
          autoClearUnused,
        } = Object.assign({}, c1, c2, c3)

        if (autoMountAndUnMount === options.autoMountAndUnMount &&
          autoClearUnused === options.autoClearUnused) {
          cases.push([c1, c2, c3])
        }
      })
    })
  })
  return cases
}

function permutation() {

  const values = [
    true,
    false,
  ]

  const result: (Options | undefined)[] = []
  values.forEach((value1) => {
    result.push({
      autoMountAndUnMount: value1,
    })
    result.push({
      autoClearUnused: value1,
    })

    values.forEach((value2) => {
      result.push({
        autoMountAndUnMount: value1,
        autoClearUnused: value2,
      })

    })
  })

  result.push(undefined)

  return result
}