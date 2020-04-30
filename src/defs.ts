export type Opcode = number
export type Data = {
	[key in string]?: any
}
export type Type = string

// Connect
export type Rule = 'enforce_equal_versions' | 'store_messages' | 'sends_user_object'

export interface IClientConfig {
	autoConnect?: boolean
}

export interface IClientConnectionConfig {
	c_heartbeat_interval?: number
	c_reconnect_interval?: number
	c_authentication_timeout?: number

	rules?: Rule[]
}

// Messages
export interface Message {
	op: Opcode
	d: Data
	t?: Type
}

export interface Messages {
	sent: Message[]
	recieved: Message[]
}
