type MembraneCallback = (target: object, propertyKey: PropertyKey) => void;

interface MembraneOptions {
    valueMutated?: MembraneCallback;
    valueObserved?: MembraneCallback;
}

function isObservable(target: any): boolean {
    // intentionally checking for null
    if (target === null) {
        return false;
    }

    // treat all non-object types, including undefined, as non-observable values
    if (typeof target !== 'object') {
        return false;
    }

    if (Array.isArray(target)) {
        return true;
    }

    const proto = Object.getPrototypeOf(target);
    return (
        proto === null ||
        proto === Object.prototype ||
        Object.getPrototypeOf(proto) === null
    );
}

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
        if (this.valueObserved !== null) {
            this.valueObserved(target, propertyKey);
        }

        const value = Reflect.get(target, propertyKey, receiver);
        return this.getProxyfiedValue(value);
    }

    set(
        target: object,
        propertyKey: PropertyKey,
        value: any,
        receiver: any,
    ) {
        const ret = Reflect.set(target, propertyKey, value, receiver);

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
        // Don't have the right to change reactive object prototype
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

        const getProxyfiedValue = this.getProxyfiedValue = (target: object) => {
            // There is no need to wrap the object if it is not observable
            if (!isObservable(target)) {
                return target;
            }
    
            // Check if the object is already in the graph of known objects
            let proxiedValue = this.objectGraph.get(target);
    
            // If it's not the case wrap it, and add it to the graph
            if (proxiedValue === undefined) {
                proxiedValue = new Proxy(target, this.reactiveProxy);
                this.objectGraph.set(target, proxiedValue);
            }
    
            return proxiedValue;
        };

        this.reactiveProxy = new ReactiveProxy({
            valueMutated,
            valueObserved,
            getProxyfiedValue
        });
    }

    getProxy(obj: any): any {
        return this.getProxyfiedValue(obj);
    }
}
