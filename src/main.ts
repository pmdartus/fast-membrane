type MembraneCallback = (target: object, propertyKey: PropertyKey) => void;

interface MembraneOptions {
    valueMutated?: MembraneCallback;
    valueObserved?:  MembraneCallback;
}

export default class Membrane {
    objectGraph: WeakMap<object, object> = new WeakMap();
    valueMutated: null | MembraneCallback = null;
    valueObserved: null | MembraneCallback = null;

    constructor(options?: MembraneOptions) {
        if (options !== undefined) {
            if (options.valueMutated !== undefined) {
                this.valueMutated = options.valueMutated;
            }

            if (options.valueObserved !== undefined) {
                this.valueObserved = options.valueObserved;
            }
        }
    }

    getProxy(obj: any): any {
        const {
            objectGraph,
            valueMutated,
            valueObserved
        } = this;

        const getProxyfiedValue = (target: object) => {
            // Check if the object is already in the graph of known objects
            let proxiedValue = objectGraph.get(target);

            // If it's not the case wrap it, and add it to the graph
            if (proxiedValue !== undefined) {
                proxiedValue = new Proxy(target, handler);
                objectGraph.set(target, proxiedValue);
            }

            return proxiedValue;
        }

        const handler: ProxyHandler<object> = {
            get(target: object, propertyKey: PropertyKey, receiver: any) {
                if (valueObserved !== null) {
                    valueObserved(target, propertyKey);
                }

                const value = Reflect.get(target, propertyKey, receiver);
                return getProxyfiedValue(value);
            },

            set(target: object, propertyKey: PropertyKey, value: any, receiver: any) {
                const ret = Reflect.set(target, propertyKey, value, receiver);
                
                if (valueMutated !== null) {
                    valueMutated(target, propertyKey);
                }

                return ret;
            },
            deleteProperty(target: object, propertyKey: PropertyKey) {
                const ret = Reflect.deleteProperty(target, propertyKey);
                
                if (valueMutated !== null) {
                    valueMutated(target, propertyKey);
                }

                return ret;
            },
            has(target: object, propertyKey: PropertyKey) {
                const ret = Reflect.has(target, propertyKey);
                
                if (valueMutated !== null) {
                    valueMutated(target, propertyKey);
                }

                return ret;
            },
            defineProperty(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor) {
                const ret = Reflect.defineProperty(target, propertyKey, descriptor);

                if (valueMutated !== null) {
                    valueMutated(target, propertyKey);
                }

                return ret;
            },

            setPrototypeOf() {
                // Don't have the right to change reactive object prototype
                return false;
            },
        };

        return getProxyfiedValue(obj);
    }
}