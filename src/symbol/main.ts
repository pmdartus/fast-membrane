import ReactiveProxy from './reactive-proxy';
import { isObservable } from './observability';
import {
    OBJECT_TO_REACTIVE_PROXY,
    REACTIVE_PROXY_TO_OBJECT,
} from './known-symbols';

import { Membrane, MembraneOptions, MembraneCallback } from '../types';

export default class SymbolMembrane implements Membrane {
    private readonly reactiveProxy: ReactiveProxy;
    private readonly getProxyfiedValue: <T>(target: T) => T;

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

    getProxy<T extends object>(obj: T): T {
        return this.getProxyfiedValue(obj);
    }

    getReadOnlyProxy<T extends object>(obj: T): T {
        return this.getProxyfiedValue(obj);
    }

    unwrapProxy<T extends any>(obj: T): T {
        debugger;
        const unwrappedObj  = obj[REACTIVE_PROXY_TO_OBJECT];
        return unwrappedObj !== undefined ? unwrappedObj : obj;
    }
}
