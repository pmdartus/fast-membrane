/**
 * Symbol used to retrieve the associated Reactive Proxy to any object.
 */
const OBJECT_TO_REACTIVE_PROXY = Symbol('object_to_reactive-proxy');
/**
 * Symbol used to retrieve the original Object from a Reactive Proxy.
 *
 * Note: using a private communication channel via a Symbol, allows to avoid having maintain another
 * WeakMap from Reactive Proxy to Object. It has the nice side effect to be memory efficient.
 */
const REACTIVE_PROXY_TO_OBJECT = Symbol('reactive-proxy_to_object');

class ReactiveProxy {
    constructor({ getProxyfiedValue, valueMutated, valueObserved, }) {
        this.valueMutated = null;
        this.valueObserved = null;
        this.getProxyfiedValue = getProxyfiedValue;
        this.valueMutated = valueMutated;
        this.valueObserved = valueObserved;
    }
    get(target, propertyKey) {
        // Return the target value if property the accessed property is the private unwrapped
        // symbol.
        if (propertyKey === REACTIVE_PROXY_TO_OBJECT) {
            return target;
        }
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
    // Check if the passed object is an existing ReactiveProxy. If it's the case then
    // don't do anything, and return the existing object.
    if (object[REACTIVE_PROXY_TO_OBJECT] !== undefined) {
        return false;
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

class SymbolMembrane {
    constructor(options) {
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
            // Extract the ReactiveProxy out of the passed object
            let proxyfiedValue = object[OBJECT_TO_REACTIVE_PROXY];
            // Let's create a new Reactive Proxy is the object doesn't one associated with.
            if (proxyfiedValue === undefined) {
                proxyfiedValue = new Proxy(object, this.reactiveProxy);
                object[OBJECT_TO_REACTIVE_PROXY] = proxyfiedValue;
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
        return this.getProxyfiedValue(obj);
    }
    getReadOnlyProxy(obj) {
        return this.getProxyfiedValue(obj);
    }
    unwrapProxy(obj) {
        debugger;
        const unwrappedObj = obj[REACTIVE_PROXY_TO_OBJECT];
        return unwrappedObj !== undefined ? unwrappedObj : obj;
    }
}

export default SymbolMembrane;
