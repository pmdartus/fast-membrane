type MembraneCallback = (target: object, propertyKey: PropertyKey) => void;

interface MembraneOptions {
    valueMutated?: MembraneCallback;
    valueObserved?: MembraneCallback;
}

/**
 * Private symbol used to retrieve the original value from ReactiveProxy.
 *
 * Note: using a private communication channel via a Symbol, allows to avoid having maintain another
 * WeakMap from ReactiveProxy to Object. It has the nice side effect to allocate less
 * memory and makes GC faster.
 */
const UNWRAP_SYMBOL = Symbol('unwrap');

/**
 * Returns true if the object is observable by the reactive membrane, otherwise return false.
 */
function isObservable(object: any): boolean {
    // Intentionally checking for null.
    if (object === null) {
        return false;
    }

    // Treat all non-object types, including undefined, as non-observable values.
    if (typeof object !== 'object') {
        return false;
    }

    // Early exit if the object is an Array.
    if (Array.isArray(object) === true) {
        return true;
    }

    const proto = Object.getPrototypeOf(object);
    const isPlainObject =
        proto === null ||
        proto === Object.prototype ||
        Object.getPrototypeOf(proto) === null;
    if (isPlainObject === false) {
        return false;
    }

    // Frozen objects are not observable, because they can't be mutated by nature.
    return Object.isFrozen(object) === false;
}

// Note: Direct object manipulation is always faster and usage of Reflect APIs.
class ReactiveProxy implements ProxyHandler<any> {
    private getProxyfiedValue: (target: object) => object;
    private valueMutated: null | MembraneCallback = null;
    private valueObserved: null | MembraneCallback = null;

    constructor({
        getProxyfiedValue,
        valueMutated,
        valueObserved,
    }: {
        getProxyfiedValue: (target: object) => object;
        valueMutated: null | MembraneCallback;
        valueObserved: null | MembraneCallback;
    }) {
        this.getProxyfiedValue = getProxyfiedValue;
        this.valueMutated = valueMutated;
        this.valueObserved = valueObserved;
    }

    get(target: any, propertyKey: PropertyKey, receiver: any) {
        // Return the target value if property the accessed property is the private unwrapped
        // symbol.
        if (propertyKey === UNWRAP_SYMBOL) {
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
            const descriptor = Object.getOwnPropertyDescriptor(
                target,
                propertyKey,
            );
            const isPropertyObservable =
                descriptor !== undefined &&
                descriptor.writable === false &&
                descriptor.configurable === false;

            if (isPropertyObservable) {
                throw new TypeError(
                    `Invalid access to non-configurable and non-writable property.`,
                );
            }
        }

        const value = target[propertyKey];
        return this.getProxyfiedValue(value);
    }
    getOwnPropertyDescriptor(target: any, propertyKey: PropertyKey) {
        if (this.valueObserved !== null) {
            this.valueObserved(target, propertyKey);
        }

        const descriptor = Object.getOwnPropertyDescriptor(
            target,
            propertyKey,
        );
        if (descriptor === undefined) {
            return undefined;
        }

        const { value } = descriptor;
        if (value !== undefined) {
            descriptor.value = this.getProxyfiedValue(value);
        } else {
            const { get } = descriptor;
            if (get !== undefined) {
                descriptor.get = () => {
                    return this.getProxyfiedValue(get.call(target));
                };
            }
        }

        return descriptor;
    }

    set(target: any, propertyKey: PropertyKey, value: any) {
        target[propertyKey] = value;

        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }

        // Return true to indicate that the assignment was successful.
        return true;
    }
    deleteProperty(target: any, propertyKey: PropertyKey) {
        delete target[propertyKey];

        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }

        // Return true to indicate that the deletion was successful.
        return true;
    }
    has(target: any, propertyKey: PropertyKey) {
        const ret = propertyKey in target;

        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }

        return ret;
    }
    defineProperty(
        target: any,
        propertyKey: PropertyKey,
        descriptor: PropertyDescriptor,
    ) {
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

export default class Membrane {
    private reactiveProxy: ReactiveProxy;
    private objectGraph: WeakMap<object, object> = new WeakMap();
    private getProxyfiedValue: (target: object) => object;

    constructor(options?: MembraneOptions) {
        let valueMutated: null | MembraneCallback = null;
        let valueObserved: null | MembraneCallback = null;

        if (options !== undefined) {
            if (options.valueMutated !== undefined) {
                valueMutated = options.valueMutated;
            }

            if (options.valueObserved !== undefined) {
                valueObserved = options.valueObserved;
            }
        }

        const getProxyfiedValue = (this.getProxyfiedValue = (obj: any) => {
            // There is no need to wrap the object if it is not observable.
            if (!isObservable(obj)) {
                return obj;
            }

            // Check if the passed object is an existing ReactiveProxy. If it's the case then
            // don't do anything, and return the existing object.
            // TODO: Should it be part of the "isObservable" function?
            if (obj[UNWRAP_SYMBOL] !== undefined) {
                return obj;
            }

            // Check if the object is already in the graph of known objects.
            let proxyfiedValue = this.objectGraph.get(obj);

            // If it's not the case wrap it, and add it to the graph.
            if (proxyfiedValue === undefined) {
                proxyfiedValue = new Proxy(obj, this.reactiveProxy);
                this.objectGraph.set(obj, proxyfiedValue as any);
            }

            return proxyfiedValue;
        });

        this.reactiveProxy = new ReactiveProxy({
            valueMutated,
            valueObserved,
            getProxyfiedValue,
        });
    }

    getProxy(obj: object): object {
        return this.getProxyfiedValue(obj);
    }

    getReadOnlyProxy(obj: object): object {
        return this.getProxyfiedValue(obj);
    }

    unwrapProxy(reactiveProxy: any): object | undefined {
        return reactiveProxy[UNWRAP_SYMBOL];
    }
}
