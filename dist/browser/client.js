var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/*export default*/ var MesaClient = /** @class */ (function () {
    function MesaClient(url, config) {
        var _this = this;
        this.authenticated = false;
        this.queue = [];
        this.rules = [];
        // Connection Options
        this.isInitialConnection = true; // First connection (not counting force disconnections)
        this.isInitialSessionConnection = true; // First session connection connection (counting force disconnections)
        this.isAutomaticReconnection = false;
        // Disconnection Options
        this.didForcefullyDisconnect = false;
        this.authenticate = function (data, config) { return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                config = this.parseAuthenticationConfig(config);
                this.authenticationResolve = resolve;
                this.send(2, __assign(__assign({}, data), config));
                return [2 /*return*/];
            });
        }); }); };
        this.url = url;
        this.config = this.parseConfig(config);
        if (this.config.autoConnect)
            this.connect();
    }
    MesaClient.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.reconnectionIntervalId)
                clearInterval(_this.reconnectionIntervalId);
            if (_this.ws && _this.ws.readyState === _this.ws.OPEN)
                return reject(new Error('This client is already connected to a pre-existing Mesa server. Call disconnect() to disconnect before attempting to reconnect again'));
            _this.ws = new WebSocket(_this.url);
            _this.didForcefullyDisconnect = false;
            var resolveConnection = function () {
                _this.ws.removeEventListener('open', resolveConnection);
                resolve();
            };
            _this.ws.addEventListener('open', resolveConnection);
            var rejectError = function (error) {
                _this.ws.removeEventListener('error', rejectError);
                reject(error);
            };
            _this.ws.addEventListener('error', rejectError);
            _this.ws.onopen = function () { return _this.registerOpen(); };
            _this.ws.onmessage = function (data) { return _this.registerMessage(data); };
            _this.ws.onclose = function (_a) {
                var code = _a.code, reason = _a.reason;
                return _this.registerClose(code, reason);
            };
            _this.ws.onerror = function (error) { return _this.registerError(error); };
        });
    };
    MesaClient.prototype.send = function (opcode, data, type) {
        var message = { op: opcode, d: data, t: type };
        this.sendRaw(message);
    };
    MesaClient.prototype.sendRaw = function (message) {
        if (typeof this.ws === 'undefined')
            return; // Add better alert system here
        if (this.ws.readyState !== this.ws.OPEN)
            return this.queue.push(message);
        if (this.rules.indexOf('store_messages') > -1)
            this.messages.sent.push(message);
        this.ws.send(JSON.stringify(message));
    };
    MesaClient.prototype.disconnect = function (code, data) {
        this.ws.close(code, data);
        this.didForcefullyDisconnect = true;
        if (this.reconnectionIntervalId)
            clearInterval(this.reconnectionIntervalId);
    };
    MesaClient.prototype.parseConfig = function (config) {
        if (!config)
            config = {};
        if (typeof config.autoConnect === 'undefined')
            config.autoConnect = true;
        return config;
    };
    MesaClient.prototype.parseAuthenticationConfig = function (config) {
        if (!config)
            config = {};
        if (typeof config.shouldSync === 'undefined')
            config.shouldSync = true;
        return config;
    };
    MesaClient.prototype.connectAndSupressWarnings = function () {
        this.connect()
            .then(function () { })
            .catch(function () { });
    };
    MesaClient.prototype.registerOpen = function () {
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
    };
    MesaClient.prototype.registerMessage = function (_a) {
        var _data = _a.data;
        var json;
        try {
            json = JSON.parse(_data.toString());
        }
        catch (error) {
            return console.error(error);
        }
        var opcode = json.op, data = json.d, type = json.t, sequence = json.s;
        switch (opcode) {
            case 1:
                return this.send(11, {});
            case 10:
                var _b = data, c_heartbeat_interval = _b.c_heartbeat_interval, c_reconnect_interval = _b.c_reconnect_interval, c_authentication_timeout = _b.c_authentication_timeout, rules = _b.rules;
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
        var message = { opcode: opcode, data: data, type: type };
        if (sequence)
            message.sequence = sequence;
        if (this.onMessage)
            this.onMessage(message);
        if (this.rules.indexOf('store_messages') > -1)
            this.messages.recieved.push(json);
    };
    MesaClient.prototype.registerClose = function (code, reason) {
        var _this = this;
        if (this.onDisconnected)
            this.onDisconnected(code, reason, { willAttemptReconnect: (!!this.reconnectionIntervalTime && !this.didForcefullyDisconnect) });
        if (this.didForcefullyDisconnect)
            this.isInitialSessionConnection = true;
        if (this.reconnectionIntervalTime && !this.didForcefullyDisconnect) {
            if (this.reconnectionIntervalId)
                clearInterval(this.reconnectionIntervalId);
            this.ws = null;
            this.isAutomaticReconnection = true;
            this.reconnectionIntervalId = setInterval(function () { return _this.connectAndSupressWarnings(); }, this.reconnectionIntervalTime);
        }
    };
    MesaClient.prototype.registerError = function (error) {
        if (!this.onError)
            return;
        this.onError(new Error(error.type));
    };
    return MesaClient;
}());
