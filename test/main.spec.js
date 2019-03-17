const { default: Membrane } = require('../src/main');

function testNotObservable(type, object) {
    it(`should not try to observe ${type}`, () => {
        const membrane = new Membrane();
        expect(membrane.getProxy(object)).toBe(object);
    });
}

function testIsObservable(type, object) {
    it(`should observe ${type}`, () => {
        const membrane = new Membrane();
        expect(membrane.getProxy(object)).not.toBe(object);
    });
}

describe('Observability', () => {
    // Primitives
    testNotObservable('undefined', undefined);
    testNotObservable('null', null);
    testNotObservable('boolean', true);
    testNotObservable('number', 1);
    testNotObservable('string', 'test');

    // Known objects
    testNotObservable('symbol', Symbol('test'));
    testNotObservable('function', function() {});
    testNotObservable('date', new Date());
    testNotObservable('map', new Map());
    testNotObservable('set', new Set());

    // Complex objects
    testNotObservable('non standard object', Object.create({}));
    testNotObservable('frozen objects', Object.freeze({}));
    testNotObservable('non extensible objects', Object.preventExtensions({}));
    testNotObservable('sealed objects', Object.seal({}));

    testIsObservable('plain objects', {});
    testIsObservable('objects with no prototype', Object.create(null));
});

function testComplexDescriptorAccess(propertyType, propertyDescriptor) {
    it(`should not throw when accessing a property ${propertyType}`, () => {
        const membrane = new Membrane();

        const original = {};
        const target = {};
        Object.defineProperty(original, 'target', {
            value: target,
            ...propertyDescriptor,
        });

        const proxified = membrane.getProxy(original);
        expect(() => {
            proxified.target;
        }).not.toThrow();
    });
}

describe('Complex properties access', () => {
    testComplexDescriptorAccess('non-writable', {
        writable: false,
        configurable: true,
    });

    testComplexDescriptorAccess('non-configurable', {
        writable: true,
        configurable: false,
    });

    testComplexDescriptorAccess('non-configurable and non-writable', {
        writable: false,
        configurable: false,
    });
});

describe('getProxy', () => {
    it('should wrap the original object into a proxy', () => {
        const membrane = new Membrane();

        const original = {};
        const proxified = membrane.getProxy(original);

        expect(original).not.toBe(proxified);
    });

    it('should return the same proxy if already part of the object graph', () => {
        const membrane = new Membrane();

        const original = {};
        const proxified1 = membrane.getProxy(original);
        const proxified2 = membrane.getProxy(original);

        expect(proxified1).toBe(proxified2);
    });

    it('should not rewrap an existing ReactiveProxy', () => {
        const membrane = new Membrane();

        const original = {};
        const proxified1 = membrane.getProxy(original);
        const proxified2 = membrane.getProxy(proxified1);

        expect(proxified1).toBe(proxified2);
    });

    it('should handle circular object reference', () => {
        const membrane = new Membrane();

        const a = { name: 'a' };
        const b = { name: 'b' };
        a.ref = b;
        b.ref = a;

        const proxifiedA = membrane.getProxy(a);
        const proxifiedB = proxifiedA.ref;

        expect(proxifiedB.ref).toBe(proxifiedA);
        expect(proxifiedB.ref.ref).toBe(proxifiedB);
    });
});

describe('valueObserved', () => {
    it('it should notify when accessed object properties', () => {
        let valueObserved = jest.fn();
        const membrane = new Membrane({
            valueObserved,
        });

        const original = {
            x: 1,
            y: 2,
        };
        const proxified = membrane.getProxy(original);

        proxified.x;
        proxified.y;

        expect(valueObserved).toHaveBeenCalledTimes(2);
        expect(valueObserved).toHaveBeenCalledWith(original, 'x');
        expect(valueObserved).toHaveBeenCalledWith(original, 'y');
    });

    it('it should notify when accessed nested object properties', () => {
        let valueObserved = jest.fn();
        const membrane = new Membrane({
            valueObserved,
        });

        const inner = {
            z: 2,
        };
        const outer = {
            x: 1,
            y: inner,
        };
        const proxified = membrane.getProxy(outer);

        proxified.x;
        proxified.y.z;

        expect(valueObserved).toHaveBeenCalledTimes(3);
        expect(valueObserved).toHaveBeenCalledWith(outer, 'x');
        expect(valueObserved).toHaveBeenCalledWith(outer, 'y');
        expect(valueObserved).toHaveBeenCalledWith(inner, 'z');
    });
});

describe('unwrapProxy', () => {
    it('returns the original value passed to getProxy', () => {
        const membrane = new Membrane();

        const original = {};
        const proxified = membrane.getProxy(original);

        expect(membrane.unwrapProxy(proxified)).toBe(original);
    });

    it('returns the original value from a nested object', () => {
        const membrane = new Membrane();

        const inner = {};
        const outer = { inner };
        const proxified = membrane.getProxy(outer);

        expect(membrane.unwrapProxy(proxified.inner)).toBe(inner);
    });
});
