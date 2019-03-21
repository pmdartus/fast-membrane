
const { isArray } = Array;
const { getPrototypeOf, isFrozen, prototype: ObjectPrototype } = Object;

/**
 * Returns true if the object is observable by the reactive membrane, otherwise return false.
 */
export function isObservable(object: any): boolean {
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
    const isPlainObject =
        proto === null ||
        proto === ObjectPrototype ||
        getPrototypeOf(proto) === null;

    if (isPlainObject === false) {
        return false;
    }

    // Frozen objects are not observable, because they can't be mutated by nature.
    return isFrozen(object) === false;
}
