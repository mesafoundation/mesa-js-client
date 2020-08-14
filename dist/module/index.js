"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MesaClient {
    constructor(url, config) {
        this.authenticated = false;
        this.queue = [];
        this.rules = [];
        // Connection Options
        this.isInitialConnection = true; // First connection (not counting force disconnections)
        this.isInitialSessionConnection = true; // First session connection connection (counting force disconnections)
        this.isAutomaticReconnection = false;
        // Disconnection Options
        this.didForcefullyDisconnect = false;
        this.authenticate = (data, config) => new Promise(async (resolve, reject) => {
            config = this.parseAuthenticationConfig(config);
            this.authenticationResolve = resolve;
            this.send(2, Object.assign(Object.assign({}, data), config));
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
                return reject(new Error('This client is already connected to a pre-existing Mesa server. Call disconnect() to disconnect before attempting to reconnect again'));
            this.ws = new WebSocket(this.url);
            this.didForcefullyDisconnect = false;
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
        if (typeof this.ws === 'undefined')
            return; // Add better alert system here
        if (this.ws.readyState !== this.ws.OPEN)
            return this.queue.push(message);
        if (this.rules.indexOf('store_messages') > -1)
            this.messages.sent.push(message);
        this.ws.send(JSON.stringify(message));
    }
    disconnect(code, data) {
        this.ws.close(code, data);
        this.didForcefullyDisconnect = true;
        if (this.reconnectionIntervalId)
            clearInterval(this.reconnectionIntervalId);
    }
    parseConfig(config) {
        if (!config)
            config = {};
        if (typeof config.autoConnect === 'undefined')
            config.autoConnect = true;
        return config;
    }
    parseAuthenticationConfig(config) {
        if (!config)
            config = {};
        if (typeof config.shouldSync === 'undefined')
            config.shouldSync = true;
        return config;
    }
    connectAndSupressWarnings() {
        this.connect()
            .then(() => { })
            .catch(() => { });
    }
    registerOpen() {
        if (this.onConnected)
            this.onConnected({
                isInitialConnection: this.isInitialConnection,
                isInitialSessionConnection: this.isInitialSessionConnection,
                isAutomaticReconnection: this.isAutomaticReconnection
            });
        if (this.isInitialConnection)
            this.isInitialConnection = false;
        if (this.isInitialSessionConnection)
            this.isInitialSessionConnection = false;
        if (this.isAutomaticReconnection)
            this.isAutomaticReconnection = false;
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
        const { op: opcode, d: data, t: type, s: sequence } = json;
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
                    this.send(0, { v: '1.4.3' }, 'CLIENT_VERSION');
                if (rules.indexOf('store_messages') > -1)
                    this.messages = { sent: [], recieved: [] };
                this.rules = rules;
                return;
            case 22:
                this.authenticated = true;
                if (this.rules.indexOf('sends_user_object') > -1 && this.authenticationResolve)
                    this.authenticationResolve(data);
                else
                    this.authenticationResolve();
                return;
        }
        const message = { opcode, data, type };
        if (sequence)
            message.sequence = sequence;
        if (this.onMessage)
            this.onMessage(message);
        if (this.rules.indexOf('store_messages') > -1)
            this.messages.recieved.push(json);
    }
    registerClose(code, reason) {
        if (this.onDisconnected)
            this.onDisconnected(code, reason, { willAttemptReconnect: (!!this.reconnectionIntervalTime && !this.didForcefullyDisconnect) });
        if (this.didForcefullyDisconnect)
            this.isInitialSessionConnection = true;
        if (this.reconnectionIntervalTime && !this.didForcefullyDisconnect) {
            if (this.reconnectionIntervalId)
                clearInterval(this.reconnectionIntervalId);
            this.ws = null;
            this.isAutomaticReconnection = true;
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
