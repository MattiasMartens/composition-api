import { UnknownObject } from './types/basic';
import { hasSymbol, hasOwn, isPlainObject, assert } from './utils';
import { isWrapper } from './helper';
import { setCurrentVue, currentVue } from './runtimeContext';
import { VueConstructor } from 'vue';

/**
 * Helper that recursively merges two data objects together.
 */
function mergeData(to: UnknownObject, from?: UnknownObject): Object {
  if (!from) return to;
  let key: any;
  let toVal: any;
  let fromVal: any;

  const keys = hasSymbol ? Reflect.ownKeys(from) : Object.keys(from);

  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    // in case the object is already observed...
    if (key === '__ob__') continue;
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      to[key] = fromVal;
    } else if (
      toVal !== fromVal &&
      (isPlainObject(toVal) && !isWrapper(toVal)) &&
      (isPlainObject(fromVal) && !isWrapper(toVal))
    ) {
      mergeData(toVal, fromVal);
    }
  }
  return to;
}

export function install(Vue: VueConstructor, _install: (Vue: VueConstructor) => void) {
  if (currentVue && currentVue === Vue) {
    if (process.env.NODE_ENV !== 'production') {
      assert(false, 'already installed. Vue.use(plugin) should be called only once');
    }
    return;
  }

  Vue.config.optionMergeStrategies.setup = function(parent: Function, child: Function) {
    return function mergedSetupFn(this: VueConstructor, props: any) {
      return mergeData(
        typeof child === 'function' ? child.call(this, props) || {} : {},
        typeof parent === 'function' ? parent.call(this, props) || {} : {}
      );
    };
  };

  setCurrentVue(Vue);
  _install(Vue);
}