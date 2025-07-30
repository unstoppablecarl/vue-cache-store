import { describe, expect, it } from 'vitest'
import { makeOptionsHelper } from '../src/storeOptions'

describe('makeOptionsHelper()', async () => {
  it('set and reset defaults', async () => {

    const initialState = {
      autoMountAndUnMount: true,
      autoClearUnused: true,
    }
    const helper = makeOptionsHelper(initialState)
    expect(helper.get()).toEqual(initialState)

    const newState = {
      autoMountAndUnMount: false,
      autoClearUnused: false,
    }
    helper.set(newState)
    expect(helper.get()).toEqual(newState)

    helper.reset()
    expect(helper.get()).toEqual(initialState)
  })

  it('initializing', async () => {
    const initialState = {
      autoMountAndUnMount: true,
      autoClearUnused: true,
    }
    const helper = makeOptionsHelper(initialState)
    helper.reset()
    expect(helper.get()).toEqual(initialState)
  })
})