import ReactiveProxy from './reactive-proxy';
import { isObservable } from './observability';

import { Membrane, MembraneOptions, MembraneCallback } from '../types';

export default class WeakMapMembrane implements Membrane {
    private readonly reactiveProxy: ReactiveProxy;
    private readonly getProxyfiedValue: <T>(target: T) => T;
    private objectToReactiveProxy: WeakMap<any, any> = new WeakMap();
    private reactiveProxyToObject: WeakMap<any, any> = new WeakMap();

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

        const getProxyfiedValue = (this.getProxyfiedValue = (object: any) => {
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

    getProxy<T extends object>(obj: T): T {
        // If the object is already a reactive proxy return it.
        if (this.reactiveProxyToObject.has(obj)) {
            return obj;
        }

        return this.getProxyfiedValue(obj);
    }

    getReadOnlyProxy<T extends object>(obj: T): T {
        return this.getProxyfiedValue(obj);
    }

    unwrapProxy<T extends any>(obj: T): T {
        const unwrappedObj  = this.reactiveProxyToObject.get(obj);
        return unwrappedObj !== undefined ? unwrappedObj : obj;
    }
}
