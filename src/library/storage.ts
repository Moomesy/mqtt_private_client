"use strict";
interface Item {
    data: any,
    expire: number
}

function storageAvailable(storage: Storage) {
    try {
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
}


class MyStorage {
    storage: Storage = localStorage
    prefix: string = ""

    constructor(_storage: Storage, _prefix: string) {
        if (!storageAvailable(_storage)) {
            throw new Error("Storage不可用")
        }
        this.storage = _storage;
        this.prefix = _prefix
    }

    _key(key: string) {
        return `${this.prefix}/${key}`;
    }

    get(key: string): any {
        const item = this.storage.getItem(this._key(key));
        if (!item) {
            return null;
        }
        const parsedItem: Item = JSON.parse(item);
        const now = new Date().getTime();
        if (parsedItem.expire > 0 && now >= parsedItem.expire) {
            return null;
        }
        return parsedItem.data;
    }

    set(key: string, data: any, expire: number = 0) {
        expire = parseInt(expire.toFixed(0));
        if (expire < 0) {
            expire = 0;
        }
        this.storage.setItem(this._key(key), JSON.stringify({
            data,
            expire
        }))
    }

    delete(key: string) {
        this.storage.removeItem(this._key(key))
    }

    /**
     * 性能不佳，谨慎使用
     */
    length() {
        return Object.keys(this.storage).reduce((prev: any, curr: any) => {
            const a = typeof prev === 'string' ? (prev.startsWith(this.prefix) ? 1 : 0) : prev;
            const b = curr.startsWith(this.prefix) ? 1 : 0
            return a + b
        })
    }

    /**
     * 性能不佳，谨慎使用
     */
    clear() {
        Object.keys(this.storage).forEach((key: string) => {
            if (key.startsWith(this.prefix)) {
                this.storage.removeItem(key);
            }
        })
    }
}

export {
    MyStorage
};