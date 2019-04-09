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

class ReactiveProxy$1 {
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

const { isArray: isArray$1 } = Array;
const { getPrototypeOf: getPrototypeOf$1, isFrozen: isFrozen$1, prototype: ObjectPrototype$1 } = Object;
/**
 * Returns true if the object is observable by the reactive membrane, otherwise return false.
 */
function isObservable$1(object) {
    // Intentionally checking for null.
    if (object === null) {
        return false;
    }
    // Treat all non-object types, including undefined, as non-observable values.
    if (typeof object !== 'object') {
        return false;
    }
    // Early exit if the object is an Array.
    if (isArray$1(object) === true) {
        return true;
    }
    const proto = getPrototypeOf$1(object);
    const isPlainObject = proto === null ||
        proto === ObjectPrototype$1 ||
        getPrototypeOf$1(proto) === null;
    if (isPlainObject === false) {
        return false;
    }
    // Frozen objects are not observable, because they can't be mutated by nature.
    return isFrozen$1(object) === false;
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
            if (!isObservable$1(object)) {
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
        this.reactiveProxy = new ReactiveProxy$1({
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

function run(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        sum += entry.id;
        sum += entry.label;
        sum += entry.className;
    }
    return sum;
}

const SimpleProxyHandler = {
    get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
    },
};

const COUNT = 1000;

const symbolMembrane = new SymbolMembrane();
const weakmapMembrane = new WeakMapMembrane();

const data = [];
const simpleProxyData = new Proxy([], SimpleProxyHandler);

for (let i = 0; i < COUNT; i++) {
    const entry = [];
    const simpleProxyEntry = [];

    for (let i = 0; i < 1000; i++) {
        const item = {
            id: i,
            label: `label${i}`,
            className: `className${i}`,
        };

        entry.push(item);
        simpleProxyEntry.push(new Proxy(item, SimpleProxyHandler));
    }

    data.push(entry);
    simpleProxyData.push(simpleProxyData);
}

const TESTS = [
    function testPlainObject() {
      for (let i = 0; i < COUNT; ++i) {
        run(data[i]);
      }
    },
    function testSimpleProxy() {
      for (let i = 0; i < COUNT; i++) {
        run(simpleProxyData[i]);
      }
    },
    function testSymbolMembrane() {
      for (let i = 0; i < COUNT; i++) {
        const p = symbolMembrane.getProxy(data[i]);
        run(p);
      }
    },
    function testWeakmapMembrane() {
      for (let i = 0; i < COUNT; i++) {
        const p = weakmapMembrane.getProxy(data[i]);
        run(p);
      }
    }
];

// Warmup.
for (let i = 0; i < 3; ++i) {
  console.log(`Warm up run ${i+1}/3...`);
  TESTS.forEach(fn => fn());
}

// Measure
console.log('Running tests...');
TESTS.forEach(fn => {
  console.time(fn.name);
  fn();
  console.timeEnd(fn.name);
});
