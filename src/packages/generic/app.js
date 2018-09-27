/**
 * App component
 */
import {
  Vuex,
  VueRouter,
  mapState
} from './deps/env';
import {
  init as initRouter
} from './deps/sitmap';
import {
  init as initStore
} from './deps/store';
import hook from './deps/hook';
import {
  setAppStore
} from './deps/utils';
import {
  merge
} from 'lodash';
import PageTransition from './page-transition';
import debugInit from './deps/debug';
import errorCode from './deps/error-code';

export default (options) => {
  const {
    initailStore = {}, // 初始化store configs
    initailSitmap = [], // 初始化sitmap
    initailErrorCode = {} // 初始化errorCode
  } = options
  return function (resolve) {
    create();
    /**
     * 骨架预设值
     */
    async function create() {
      // 初始化debug
      debugInit();
      // 初始化store
      const store = new Vuex.Store(initStore(initailStore));
      // 设置全局引用
      setAppStore('store', store);
      const presetData = {
        ...(window.__data__ || {}),
        errorCode: { // Mix presets
          ...errorCode,
          ...initailErrorCode
        }
      };
      setAppStore('data', presetData);
      const {
        appData,
        routerOptions = {}
      } = await hook.exe('prepare@app', { // prepare可能会用到store引用
        store
      });
      // 设置全局引用
      setAppStore('data', {
        ...presetData, // reset again
        ...appData
      });
      // 设置vuex state存储
      store.commit('appDataChange', appData);
      // 初始化router
      const sitmap = await initRouter(initailSitmap);
      const router = new VueRouter(merge({
        routes: sitmap.routes
      }, routerOptions));
      // 设置全局引用
      setAppStore('router', router);

      // app hook
      const appOptions = await hook.exe('create@app', {
        store,
        router,
        sitmap,
        appData
      });
      // 创建app应用
      resolve(merge({
        name: 'App',
        template: `<div id="app" :class="domClass">
          <div class="app-body">
            <!-- activity component view -->
            <page-transition :name="pageTransitionName">
              <keep-alive :include="cachePages">
                <component :is="activePage">
                  <!-- inactive components will be cached! -->
                </component>
              </keep-alive>
            </page-transition>
            <!-- frame component view -->
            <router-view></router-view>
          </div>
        </div>`,
        router,
        store,
        computed: {
          ...mapState({
            activePage: state => state.activePage,
            pageTransitionName: state => state.pageTransitionName,
            domClass(state) {
              return {
                'app': true,
                'app-only-page': state.onlyPage,
                [`${store.state.activePageName}__scope`]: true
              };
            },
            cachePages(state) {
              const cachePages = state.cachePages;
              if (!cachePages.length) {
                return '_'; // 占位，否则include为空默认缓存全部，WTF
              }
              return cachePages.join(',');
              // return new RegExp('(?!' + cachePages.map(pageName => '.*' + pageName).join('|') + ')^.*$');
            }
          })
        },
        components: {
          PageTransition
        }
      }, appOptions || {}));
    }
  }
};
