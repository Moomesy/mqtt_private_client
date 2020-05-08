declare class MyStorage {
    storage: Storage;
    prefix: string;
    constructor(_storage: Storage, _prefix: string);
    _key(key: string): string;
    get(key: string): any;
    set(key: string, data: any, expire?: number): void;
    delete(key: string): void;
    /**
     * 性能不佳，谨慎使用
     */
    length(): string;
    /**
     * 性能不佳，谨慎使用
     */
    clear(): void;
}
export { MyStorage };
