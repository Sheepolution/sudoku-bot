import { Utils } from '../Utils/Utils';

export default class CacheManager {
    private static cache: any = {};

    public static CreateTimeoutInterval() {
        setInterval(() => {
            CacheManager.OnInterval();
        }, Utils.GetMinutesInMiliSeconds(1));
    }

    public static OnInterval() {
        for (const className in this.cache) {
            for (const methodName in this.cache[className]) {
                const cacheList = this.cache[className][methodName];
                for (let i = 0; i < cacheList.length; i++) {
                    const cache = cacheList[i];
                    if (cache.timeout > -1) {
                        cache.timeout -= 1;
                        if (cache.timeout <= 0) {
                            cacheList.splice(i, 1);
                        }
                    }
                }
            }
        }
    }

    public static Empty() {
        this.cache = {};
    }

    public static async Get<T>(classType: { new(): any, Make(model: any): T | null | Promise<T | null> }, method: Function, args?: Array<any>, timeout?: number, noCache?: boolean): Promise<T | null> {
        return <T | null>(await this.GetOrCache<T>(classType, method, args, timeout, noCache))[0];
    }

    public static async GetMany<T>(classType: { new(): any, Make(model: any): T | null | Promise<T | null> }, method: Function, args?: Array<any>, timeout?: number, noCache?: boolean): Promise<Array<T>> {
        return <Array<T>>await this.GetOrCache<T>(classType, method, args, timeout, noCache);
    }

    public static Set<T>(value: T, classType: { new(): any, Make(model: any): T | null | Promise<T | null> }, method: Function, args?: Array<any>, timeout: number = -1) {
        if (!this.IsCached(classType, method)) {
            return this.GetOrCache<T>(classType, method, args, timeout);
        }

        const methodCache = this.GetMethodCache(classType, method);

        let objectCache = args == null ? methodCache[0] : methodCache.find(c => c.args.equals(args));
        if (objectCache != null) {
            objectCache.value = [value];
            objectCache.timeout = timeout;
        } else {
            objectCache = { value: [value], args: args, timeout: timeout };
            methodCache.push(objectCache);
        }

        return value;
    }

    public static Add<T>(value: T, classType: { new(): any, Make(model: any): T | null | Promise<T | null> }, method: Function, args?: Array<any>, timeout: number = -1) {
        if (!this.IsCached(classType, method)) {
            return this.GetOrCache<T>(classType, method, args, timeout);
        }

        const methodCache = this.GetMethodCache(classType, method);

        let objectCache = args == null ? methodCache[0] : methodCache.find(c => c.args.equals(args));
        if (objectCache != null) {
            objectCache.value.push(value);
        } else {
            objectCache = { value: [value], args: args, timeout: timeout };
            methodCache.push(objectCache);
        }

        return value;
    }

    public static Clear<T>(classType: { new(): any, Make(model: any): T | null | Promise<T | null> }, method: Function, args?: Array<any>) {
        const methodCache = this.GetMethodCache(classType, method);

        if (args == null) {
            methodCache.splice(0, methodCache.length);
            return;
        }

        const objectCacheIndex = methodCache.findIndex(c => c.args.equals(args));

        if (objectCacheIndex == -1) {
            return;
        }

        methodCache.splice(objectCacheIndex, 1);
    }

    private static async GetOrCache<T>(classType: { new(): any, Make(model: any): T | null | Promise<T | null> }, method: Function, args?: Array<any>, timeout: number = -1, noCache?: boolean): Promise<Array<T | null>> {
        let methodCache;
        let objectCache;

        if (!noCache) {
            methodCache = this.GetMethodCache(classType, method);

            objectCache = args == null ? methodCache[0] : methodCache.find(c => c.args.equals(args));

            if (objectCache != null) {
                objectCache.timeout = timeout;
                return objectCache.value;
            }
        }

        const model = await method(...(args || []));

        if (Array.isArray(model)) {
            const models = model;
            const values = [];

            for (const model of models) {
                const value = await classType.Make(model);
                values.push(value);
            }

            if (!noCache) {
                objectCache = { value: values, args: args, timeout: timeout };
                methodCache.push(objectCache);
            }

            return values;
        } else {
            const value = [model == null ? null : await classType.Make(model)];

            if (!noCache) {
                objectCache = { value: value, args: args, timeout: timeout };
                methodCache.push(objectCache);
            }

            return value;
        }
    }

    private static GetMethodCache(classType: { new(): any }, method: Function) {
        const className = classType.name;
        let classCache = this.cache[className];

        if (classCache == null) {
            classCache = {};
            this.cache[className] = classCache;
        }

        const methodString = method.toString();
        let methodCache: Array<any> = classCache[methodString];

        if (methodCache == null) {
            methodCache = new Array<any>();
            classCache[methodString] = methodCache;
        }

        return methodCache;
    }

    private static IsCached(classType: { new(): any }, method: Function) {
        const className = classType.name;
        const classCache = this.cache[className];
        if (classCache == null) {
            return false;
        }

        const methodString = method.toString();
        const methodCache: Array<any> = classCache[methodString];

        if (methodCache == null || methodCache.length == 0) {
            return false;
        }

        return true;
    }
}