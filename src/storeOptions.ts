export type RequiredOptions = {
  autoMountAndUnMount: boolean;
  autoClearUnused: boolean;
}

export type Options = {
  autoMountAndUnMount?: boolean;
  autoClearUnused?: boolean;
}

export function makeOptionsHelper(globalDefaultOptions: RequiredOptions) {
  const initialState = {
    ...globalDefaultOptions,
  }
  const set = (options: Options): void => {
    Object.assign(globalDefaultOptions, options)
  }
  const get = (): RequiredOptions => globalDefaultOptions
  const reset = (): void => set(initialState)

  return {
    set,
    get,
    reset,
    merge: (storeDefaultOptions ?: Options, options ?: Options) => {
      return {
        ...globalDefaultOptions,
        ...storeDefaultOptions,
        ...options,
      }
    },
  }
}