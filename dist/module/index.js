"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MesaClient {
    constructor(url, config) {
        this.authenticated = false;
        this.queue = [];
        this.rules = [];
        this.authenticate = (data) => new Promise(async (resolve, reject) => {
            this.authenticationResolve = resolve;
            this.send(2, data);
        });
        this.url = url;
        this.config = this.parseConfig(config);
        if (this.config.autoConnect)
            this.connect();
    }
    connect() {
        return new Promise((resolve, reject) => {
            if (this.reconnectionIntervalId)
                clearInterval(this.reconnectionIntervalId);
            if (this.ws && this.ws.readyState === this.ws.OPEN)
                throw new Error('This client is already connected to a pre-existing Mesa server. Call disconnect() to disconnect before attempting to reconnect again');
            this.ws = new WebSocket(this.url);
            const resolveConnection = () => {
                this.ws.removeEventListener('open', resolveConnection);
                resolve();
            };
            this.ws.addEventListener('open', resolveConnection);
            const rejectError = error => {
                this.ws.removeEventListener('error', rejectError);
                reject(error);
            };
            this.ws.addEventListener('error', rejectError);
            this.ws.onopen = () => this.registerOpen();
            this.ws.onmessage = data => this.registerMessage(data);
            this.ws.onclose = ({ code, reason }) => this.registerClose(code, reason);
            this.ws.onerror = error => this.registerError(error);
        });
    }
    send(opcode, data, type) {
        const message = { op: opcode, d: data, t: type };
        this.sendRaw(message);
    }
    sendRaw(message) {
        if (this.ws.readyState !== this.ws.OPEN)
            return this.queue.push(message);
        if (this.rules.indexOf('store_messages') > -1)
            this.messages.sent.push(message);
        this.ws.send(JSON.stringify(message));
    }
    disconnect(code, data) {
        this.ws.close(code, data);
    }
    parseConfig(config) {
        if (!config)
            config = {};
        if (typeof config.autoConnect === 'undefined')
            config.autoConnect = true;
        return config;
    }
    connectAndSupressWarnings() {
        this.connect()
            .then(() => { })
            .catch(() => { });
    }
    registerOpen() {
        if (this.onConnected)
            this.onConnected();
        if (this.queue.length > 0) {
            this.queue.forEach(this.sendRaw);
            this.queue = [];
        }
    }
    registerMessage({ data: _data }) {
        let json;
        try {
            json = JSON.parse(_data.toString());
        }
        catch (error) {
            return console.error(error);
        }
        const { op: opcode, d: data, t: type } = json;
        switch (opcode) {
            case 1:
                return this.send(11, {});
            case 10:
                const { c_heartbeat_interval, c_reconnect_interval, c_authentication_timeout, rules } = data;
                if (c_heartbeat_interval)
                    this.heartbeatIntervalTime = c_heartbeat_interval;
                if (c_reconnect_interval)
                    this.reconnectionIntervalTime = c_reconnect_interval;
                if (c_authentication_timeout)
                    this.authenticationTimeout = c_authentication_timeout;
                if (rules.indexOf('enforce_equal_versions') > -1)
                    this.send(0, { v: '1.2.10"' }, 'CLIENT_VERSION');
                if (rules.indexOf('store_messages') > -1)
                    this.messages = { sent: [], recieved: [] };
                this.rules = rules;
                return;
            case 22:
                this.authenticated = true;
                if (this.rules.indexOf('sends_user_object') > -1 && this.authenticationResolve)
                    this.authenticationResolve(data);
                return;
        }
        if (this.onMessage)
            this.onMessage(json);
        if (this.rules.indexOf('store_messages') > -1)
            this.messages.recieved.push(json);
    }
    registerClose(code, reason) {
        if (this.onDisconnected)
            this.onDisconnected(code, reason);
        if (this.reconnectionIntervalTime) {
            if (this.reconnectionIntervalId)
                clearInterval(this.reconnectionIntervalId);
            this.ws = null;
            this.reconnectionIntervalId = setInterval(() => this.connectAndSupressWarnings(), this.reconnectionIntervalTime);
        }
    }
    registerError(error) {
        if (!this.onError)
            return;
        this.onError(new Error(error.type));
    }
}
exports.default = MesaClient;
