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
    const isPlainObject = (
        proto === null ||
        proto === Object.prototype ||
        Object.getPrototypeOf(proto) === null
    );
    if (isPlainObject === false) {
        return false;
    }

    // Frozen objects are not observable, because they can't be mutated by nature.
    return Object.isFrozen(object) === false;
}

// TODO: Verify if Reflect is faster than direct properties access.
class ReactiveProxy implements ProxyHandler<object> {
    private getProxyfiedValue: (target: object) => object;
    private valueMutated: null | MembraneCallback = null;
    private valueObserved: null | MembraneCallback = null;

    constructor({
        getProxyfiedValue,
        valueMutated,
        valueObserved,
    }: {
        getProxyfiedValue: (target: object) => object
        valueMutated: null | MembraneCallback
        valueObserved: null | MembraneCallback
    }) {
        this.getProxyfiedValue = getProxyfiedValue;
        this.valueMutated = valueMutated;
        this.valueObserved = valueObserved;
    }

    get(target: object, propertyKey: PropertyKey, receiver: any) {
        // Return the target value if property the accessed property is the private unwrapped 
        // symbol. 
        if (propertyKey === UNWRAP_SYMBOL) {
            return target;
        }

        if (this.valueObserved !== null) {
            this.valueObserved(target, propertyKey);
        }

        // TODO: Evaluate if the get trap can be optimized by using the descriptor directly instead
        // of using the value and descriptor to return the value.
        const value = Reflect.get(target, propertyKey, receiver);
        const descriptor = Reflect.getOwnPropertyDescriptor(target, propertyKey);

        // One of the Proxy invariant is that the get trap should return the property value on 
        // non-writable and non-configurable properties. Returning the original value make 
        // sense 
        if (descriptor && descriptor.writable === false && descriptor.configurable === false) {
            return value;
        } else {
            return this.getProxyfiedValue(value);
        }
    }
    getOwnPropertyDescriptor(target: object, propertyKey: PropertyKey) {
        if (this.valueObserved !== null) {
            this.valueObserved(target, propertyKey);
        }

        const descriptor = Reflect.getOwnPropertyDescriptor(target, propertyKey);
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
                }
            }
        }

        return descriptor;
    }

    set(
        target: object,
        propertyKey: PropertyKey,
        value: any,
    ) {
        // Don't pass the receiver otherwise otherwise it will invoke the ReactiveProxy 
        // defineProperty hooks, and will invoke twice the value mutated
        const ret = Reflect.set(target, propertyKey, value);

        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }

        return ret;
    }
    deleteProperty(target: object, propertyKey: PropertyKey) {
        const ret = Reflect.deleteProperty(target, propertyKey);

        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }

        return ret;
    }
    has(target: object, propertyKey: PropertyKey) {
        const ret = Reflect.has(target, propertyKey);

        if (this.valueMutated !== null) {
            this.valueMutated(target, propertyKey);
        }

        return ret;
    }
    defineProperty(
        target: object,
        propertyKey: PropertyKey,
        descriptor: PropertyDescriptor,
    ) {
        const ret = Reflect.defineProperty(
            target,
            propertyKey,
            descriptor,
        );

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
};

export default class Membrane {
    private reactiveProxy: ReactiveProxy;
    private objectGraph: WeakMap<object, object> = new WeakMap();
    private getProxyfiedValue: (target: object) => object;

    constructor(options?: MembraneOptions) {
        let valueMutated: null | MembraneCallback  = null;
        let valueObserved: null | MembraneCallback = null;

        if (options !== undefined) {
            if (options.valueMutated !== undefined) {
                valueMutated = options.valueMutated;
            }

            if (options.valueObserved !== undefined) {
                valueObserved = options.valueObserved;
            }
        }

        const getProxyfiedValue = this.getProxyfiedValue = (obj: any) => {
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
        };

        this.reactiveProxy = new ReactiveProxy({
            valueMutated,
            valueObserved,
            getProxyfiedValue
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
