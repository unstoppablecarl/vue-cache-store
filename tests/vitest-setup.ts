import { afterEach, beforeEach } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineCacheStore, defineRecordStore } from '../src'

enableAutoUnmount(afterEach)

beforeEach(() => {
  defineRecordStore.resetGlobalDefaultOptions()
  defineCacheStore.resetGlobalDefaultOptions()
})

afterEach(() => {
  defineRecordStore.resetGlobalDefaultOptions()
  defineCacheStore.resetGlobalDefaultOptions()
})
