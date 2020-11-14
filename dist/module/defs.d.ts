export declare type Opcode = number;
export declare type Data = {
    [key in string]?: any;
};
export declare type Type = string;
export declare type Sequence = number;
export declare type Rule = 'enforce_equal_versions' | 'store_messages' | 'sends_user_object';
export interface IClientConfig {
    autoConnect?: boolean;
}
export interface IClientAuthenticationConfig {
    shouldSync?: boolean;
}
export interface IClientConnectionConfig {
    c_heartbeat_interval?: number;
    c_reconnect_interval?: number;
    c_authentication_timeout?: number;
    rules?: Rule[];
}
export interface ReceivedMessage {
    op: Opcode;
    d: Data;
    t?: Type;
    s?: Sequence;
}
export interface Message {
    opcode: Opcode;
    data: Data;
    type?: Type;
    sequence?: Sequence;
}
export interface Messages {
    sent: ReceivedMessage[];
    received: ReceivedMessage[];
}
export interface ConnectionOptions {
    isInitialConnection: boolean;
    isInitialSessionConnection: boolean;
    isAutomaticReconnection: boolean;
}
export interface DisconnectionOptions {
    willAttemptReconnect: boolean;
}
