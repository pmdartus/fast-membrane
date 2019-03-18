import { REACTIVE_PROXY_TO_OBJECT } from './known-symbols';
import { MembraneCallback } from './types';

export default class ReactiveProxy implements ProxyHandler<any> {
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

        const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
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