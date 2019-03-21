'use strict';

class ReactiveProxy {
    constructor({ getProxyfiedValue, valueMutated, valueObserved, }) {
        this.valueMutated = null;
        this.valueObserved = null;
        this.getProxyfiedValue = getProxyfiedValue;
        this.valueMutated = valueMutated;
        this.valueObserved = valueObserved;
    }
    get(target, propertyKey) {
        if (this.valueObserved !== null) {
            this.valueObserved(target, propertyKey);
        }
        // Note: Accessing a property descriptor on the target is really expensive compared to a
        // standard get (2x slower).
        if (process.env.NODE_ENV !== 'production') {
            // One of the Proxy invariant is that the get trap should return the property value on
            // non-writable and non-configurable properties.
            const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
            const isPropertyObservable = descriptor !== undefined &&
                descriptor.writable === false &&
                descriptor.configurable === false;
            if (isPropertyObservable) {
                throw new TypeError(`Invalid access to non-configurable and non-writable property.`);
            }
        }
        const value = target[propertyKey];
        return this.getProxyfiedValue(value);
    }
    getOwnPropertyDescriptor(target, propertyKey) {
        if (this.valueObserved !== null) {
            this.valueObserved(target, propertyKey);
        }
        const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        if (descriptor === undefined) {
            return undefined;
        }
        const { value } = descriptor;
        if (value !== undefined) {
            descriptor.value = this.getProxyfiedValue(value);
        }
        else {
            const { get } = descriptor;
            if (get !== undefined) {
                descriptor.get = () => {
                    return this.getProxyfiedValue(get.call(target));
                };
            }
        }
        return descriptor;
    }
    set(target, propertyKey, value) {
        target[propertyKey] = value;
        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }
        // Return true to indicate that the assignment was successful.
        return true;
    }
    deleteProperty(target, propertyKey) {
        delete target[propertyKey];
        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }
        // Return true to indicate that the deletion was successful.
        return true;
    }
    has(target, propertyKey) {
        const ret = propertyKey in target;
        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }
        return ret;
    }
    defineProperty(target, propertyKey, descriptor) {
        const ret = Object.defineProperty(target, propertyKey, descriptor);
        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }
        return ret;
    }
    setPrototypeOf() {
        // Mutating the prototype of ReactiveProxy is not allowed since it can lead to unpredictable
        // behavior.
        return false;
    }
    preventExtensions() {
        // Invoking Object.seal, Object.preventExtension, Object.freeze on a reactive object should
        // be prevented to avoid trying to observe an object that is not considered observable.
        return false;
    }
}

const { isArray } = Array;
const { getPrototypeOf, isFrozen, prototype: ObjectPrototype } = Object;
/**
 * Returns true if the object is observable by the reactive membrane, otherwise return false.
 */
function isObservable(object) {
    // Intentionally checking for null.
    if (object === null) {
        return false;
    }
    // Treat all non-object types, including undefined, as non-observable values.
    if (typeof object !== 'object') {
        return false;
    }
    // Early exit if the object is an Array.
    if (isArray(object) === true) {
        return true;
    }
    const proto = getPrototypeOf(object);
    const isPlainObject = proto === null ||
        proto === ObjectPrototype ||
        getPrototypeOf(proto) === null;
    if (isPlainObject === false) {
        return false;
    }
    // Frozen objects are not observable, because they can't be mutated by nature.
    return isFrozen(object) === false;
}

class WeakMapMembrane {
    constructor(options) {
        this.objectToReactiveProxy = new WeakMap();
        this.reactiveProxyToObject = new WeakMap();
        let valueMutated = null;
        let valueObserved = null;
        if (options !== undefined) {
            if (options.valueMutated !== undefined) {
                valueMutated = options.valueMutated;
            }
            if (options.valueObserved !== undefined) {
                valueObserved = options.valueObserved;
            }
        }
        const getProxyfiedValue = (this.getProxyfiedValue = (object) => {
            // There is no need to wrap the object if it is not observable.
            if (!isObservable(object)) {
                return object;
            }
            // Get the associated Reactive Proxy for the object.
            let proxyfiedValue = this.objectToReactiveProxy.get(object);
            // Let's create a new Reactive Proxy is the object doesn't one associated with.
            if (proxyfiedValue === undefined) {
                proxyfiedValue = new Proxy(object, this.reactiveProxy);
                this.objectToReactiveProxy.set(object, proxyfiedValue);
                this.reactiveProxyToObject.set(proxyfiedValue, object);
            }
            return proxyfiedValue;
        });
        this.reactiveProxy = new ReactiveProxy({
            valueMutated,
            valueObserved,
            getProxyfiedValue,
        });
    }
    getProxy(obj) {
        // If the object is already a reactive proxy return it.
        if (this.reactiveProxyToObject.has(obj)) {
            return obj;
        }
        return this.getProxyfiedValue(obj);
    }
    getReadOnlyProxy(obj) {
        return this.getProxyfiedValue(obj);
    }
    unwrapProxy(obj) {
        const unwrappedObj = this.reactiveProxyToObject.get(obj);
        return unwrappedObj !== undefined ? unwrappedObj : obj;
    }
}

module.exports = WeakMapMembrane;
