/**
 * Reference angular Service mechanism
 * Singleton process whole app scope
 * 前期只当成state container使用
 * @author 13
 */
import {
  camelCase
} from 'lodash';

var ServiceState = {};
var stateStore = new Map();
const SERVICE_KEY_PREFIX = 'service';

ServiceState.install = function (Vue) {
  Vue.mixin({
    beforeCreate: function () {
      /**
       * 获取service state options
       */
      const getServiceStateOptions = () => {
        const $options = this.$options;
        let serviceState = null;
        if (Array.isArray($options.serviceState)) {
          serviceState = $options.serviceState.reduce((pv, cv, ci) => {
            const key = cv.name ? camelCase(cv.name) : SERVICE_KEY_PREFIX + ci
            return {
              ...pv,
              [key]: cv
            };
          }, {});
        } else {
          serviceState = $options.serviceState;
        }
        return serviceState;
      };
      const serviceStateOptions = getServiceStateOptions();
      // 生成state(Vue instance)，name作为引用字段bind到组件本身，同时生成$$serviceStateRefs记录所有绑定的key值
      if (serviceStateOptions) {
        this.$$serviceStateRefs = Object.keys(serviceStateOptions).map((key) => {
          const Ctor = serviceStateOptions[key];
          const state = stateStore.get(Ctor) || new Vue(Ctor);
          // 重新指回
          stateStore.set(Ctor, state);
          // 暴露给this引用
          this[key] = state;
          return key;
        });
      }
    },
    beforeDestroy: function () {
      const serviceStateRefs = this.$$serviceStateRefs;
      if (serviceStateRefs) {
        serviceStateRefs.forEach((key) => {
          delete this[key]; // Release reference
        });
        this.$$serviceStateRefs = null;
      }
    }
  });
};
/**
 * Create or retrieve state
 * @param {Constructor|cfg} Ctor - Vue component constructor or configuration
 */
function serviceState(Ctor) {
  const state = stateStore.get(Ctor) || new Vue(Ctor);
  // 重新指回
  stateStore.set(Ctor, state);
  return state;
}
/**
 * Remove service state
 * @param {Constructor|cfg} Ctor - Vue component constructor or configuration
 */
function removeServiceState(Ctor) {
  return stateStore.delete(Ctor);
}
export default ServiceState;
export {
  serviceState,
  removeServiceState
};
