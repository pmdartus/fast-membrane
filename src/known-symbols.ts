/**
 * Symbol used to retrieve the associated Reactive Proxy to any object.
 */
export const OBJECT_TO_REACTIVE_PROXY = Symbol('object_to_reactive-proxy');

/**
 * Symbol used to retrieve the original Object from a Reactive Proxy.
 * 
 * Note: using a private communication channel via a Symbol, allows to avoid having maintain another
 * WeakMap from Reactive Proxy to Object. It has the nice side effect to be memory efficient.
 */
export const REACTIVE_PROXY_TO_OBJECT = Symbol('reactive-proxy_to_object');