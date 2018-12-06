/**
 * Unit testing utils
 */
import {
  setAppStore
} from './utils';

/**
 * Bootstrap unit testing
 */
export function bootstrap(callback) {
  // setAppStore('store', store);
  setAppStore('data', {});
  callback();
};
