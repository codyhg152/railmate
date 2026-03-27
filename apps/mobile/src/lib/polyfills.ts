/**
 * WeakRef polyfill for React Native (Hermes doesn't support WeakRef)
 * This file must be imported BEFORE any other imports that use WeakRef
 */

if (typeof WeakRef === 'undefined') {
  class WeakRefPolyfill<T extends object> {
    private target: T | undefined;
    
    constructor(target: T) {
      if (target === null || target === undefined) {
        throw new TypeError('WeakRef: target must be an object');
      }
      if (typeof target !== 'object' && typeof target !== 'function') {
        throw new TypeError('WeakRef: target must be an object');
      }
      this.target = target;
    }
    
    deref(): T | undefined {
      return this.target;
    }
  }
  
  // @ts-ignore
  global.WeakRef = WeakRefPolyfill;
  // @ts-ignore
  globalThis.WeakRef = WeakRefPolyfill;
}

// Also polyfill FinalizationRegistry if needed
if (typeof FinalizationRegistry === 'undefined') {
  class FinalizationRegistryPolyfill<T> {
    private callbacks: Map<object, (value: T) => void> = new Map();
    
    constructor(callback?: (value: T) => void) {
      // Callback is stored but never called in this polyfill
      // since we can't detect when objects are garbage collected
    }
    
    register(target: object, heldValue: T): void {
      // Store the callback for potential future use
      // In a real implementation, this would be called when target is GC'd
    }
    
    unregister(target: object): void {
      this.callbacks.delete(target);
    }
  }
  
  // @ts-ignore
  global.FinalizationRegistry = FinalizationRegistryPolyfill;
  // @ts-ignore
  globalThis.FinalizationRegistry = FinalizationRegistryPolyfill;
}
