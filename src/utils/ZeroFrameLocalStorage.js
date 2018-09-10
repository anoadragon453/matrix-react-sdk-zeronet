// Wrapper functions for ZeroFrame API structured in the same way as window.localStorage
import ZeroFrame from './ZeroFrame.js';

class ZeroFrameLocalStorage {
	constructor() {
        this.ls = this.getStorage();
    }

    async getStorage() {
        return await ZeroFrame.cmdp("wrapperGetLocalStorage", {});
    }

    getItem(key) {
        return this.ls[key];
    }

    setItem(key, item) {
        this.ls[key] = item;
        ZeroFrame.cmd("wrapperSetLocalStorage", [this.ls], null);
    }

    removeItem(key) {
        delete this.ls[key];
        ZeroFrame.cmd("wrapperSetLocalStorage", [this.ls], null);
    }

    clear() {
        ZeroFrame.cmd("wrapperSetLocalStorage", [{}], null);
    }
}

module.exports = {ZeroFrameLocalStorage};
