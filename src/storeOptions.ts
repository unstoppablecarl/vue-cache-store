export type RequiredOptions = {
  autoMountAndUnMount: boolean;
  autoClearUnused: boolean;
}

export type Options = {
  autoMountAndUnMount?: boolean;
  autoClearUnused?: boolean;
}

export function makeOptionsHelper(globalDefaultOptions: RequiredOptions) {

  const set = (options: Options) => Object.assign(globalDefaultOptions, options)
  const get = () => globalDefaultOptions

  return {
    set,
    get,
    attach(obj: any) {
      obj.setGlobalDefaultOptions = set
      obj.getGlobalDefaultOptions = get
    },
    merge(storeDefaultOptions?: Options, options?: Options) {
      return {
        ...globalDefaultOptions,
        ...storeDefaultOptions,
        ...options,
      }
    },
  }
}