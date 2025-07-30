export type RequiredOptions = {
  autoMountAndUnMount: boolean;
  autoClearUnused: boolean;
}

export type Options = {
  autoMountAndUnMount?: boolean;
  autoClearUnused?: boolean;
}

export function makeOptionsHelper(globalDefaultOptions: RequiredOptions) {
  const globalOptions = {
    ...globalDefaultOptions,
  }

  const initialState = {
    ...globalDefaultOptions,
  }
  const set = (options: Options): void => {
    Object.assign(globalOptions, options)
  }
  const get = (): RequiredOptions => globalOptions
  const reset = (): void => set(initialState)

  return {
    set,
    get,
    reset,
    merge: (storeDefaultOptions?: Options, options?: Options) => {
      return {
        ...globalOptions,
        ...storeDefaultOptions,
        ...options,
      }
    },
  }
}