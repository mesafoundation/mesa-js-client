export declare type Opcode = number;
export declare type Data = {
    [key in string]?: any;
};
export declare type Type = string;
export declare type Rule = 'enforce_equal_versions' | 'store_messages' | 'sends_user_object';
export interface IClientConfig {
    autoConnect?: boolean;
}
export interface IClientConnectionConfig {
    c_heartbeat_interval?: number;
    c_reconnect_interval?: number;
    c_authentication_timeout?: number;
    rules?: Rule[];
}
export interface RecievedMessage {
    op: Opcode;
    d: Data;
    t?: Type;
}
export interface Message {
    opcode: Opcode;
    data: Data;
    type?: Type;
}
export interface Messages {
    sent: RecievedMessage[];
    recieved: RecievedMessage[];
}
export interface DisconnectionOptions {
    willAttemptReconnect: boolean;
}
