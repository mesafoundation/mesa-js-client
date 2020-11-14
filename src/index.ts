import type WebSocket from 'ws'

import {
  Message,
  Messages,

  IClientConfig,
  IClientConnectionConfig,
  IClientAuthenticationConfig,

  ReceivedMessage, Rule,

  Opcode,
  Data,
  Type,

  ConnectionOptions,
  DisconnectionOptions
} from './defs'

/*export default*/ class MesaClient {
  public url: string
  public ws: WebSocket

  public authenticated: boolean = false

  public messages: Messages
  private config: IClientConfig

  private queue: ReceivedMessage[] = []

  private rules: Rule[] = []

  private heartbeatIntervalTime: number
  private authenticationTimeout: number

  private reconnectionIntervalId: NodeJS.Timeout
  private reconnectionIntervalTime: number

  private authenticationResolve: (value?: unknown) => void

  onConnected: (options: ConnectionOptions) => void
  onMessage: (message: Message) => void
  onDisconnected: (code: number, reason: string, options: DisconnectionOptions) => void
  onError: (error: Error) => void

  // Connection Options
  private isInitialConnection: boolean = true // First connection (not counting force disconnections)
  private isInitialSessionConnection: boolean = true // First session connection connection (counting force disconnections)

  private isAutomaticReconnection: boolean = false

  // Disconnection Options
  private didForcefullyDisconnect: boolean = false

  constructor(url: string, config?: IClientConfig) {
    this.url = url
    this.config = this.parseConfig(config)

    if (this.config.autoConnect)
      this.connect()
  }

  public connect() {
    return new Promise((resolve, reject) => {
      if (this.reconnectionIntervalId)
        clearInterval(this.reconnectionIntervalId)

      if (this.ws && this.ws.readyState === this.ws.OPEN)
        return reject(new Error('This client is already connected to a pre-existing Mesa server. Call disconnect() to disconnect before attempting to reconnect again'))

      // @ts-ignore
      this.ws = new WebSocket(this.url)

      this.didForcefullyDisconnect = false

      const resolveConnection = () => {
        this.ws.removeEventListener('open', resolveConnection)
        resolve()
      }

      this.ws.addEventListener('open', resolveConnection)

      const rejectError = error => {
        this.ws.removeEventListener('error', rejectError)
        reject(error)
      }

      this.ws.addEventListener('error', rejectError)

      this.ws.onopen = () => this.registerOpen()
      this.ws.onmessage = data => this.registerMessage(data)
      this.ws.onclose = ({ code, reason }) => this.registerClose(code, reason)
      this.ws.onerror = error => this.registerError(error)
    })
  }

  public send(opcode: Opcode, data: Data, type?: Type) {
    const message: ReceivedMessage = { op: opcode, d: data, t: type }

    this.sendRaw(message)
  }

  private sendRaw(message: ReceivedMessage) {
    if (typeof this.ws === 'undefined')
      return // Add better alert system here

    if (this.ws.readyState !== this.ws.OPEN)
      return this.queue.push(message)

    if (this.rules.indexOf('store_messages') > -1)
      this.messages.sent.push(message)

    this.ws.send(JSON.stringify(message))
  }

  public authenticate = (data: object, config?: IClientAuthenticationConfig) => new Promise(async (resolve, reject) => {
    config = this.parseAuthenticationConfig(config)

    this.authenticationResolve = resolve
    this.send(2, {...data, ...config})
  })

  public disconnect(code?: number, data?: string) {
    this.ws.close(code, data)

    this.didForcefullyDisconnect = true

    if(this.reconnectionIntervalId)
      clearInterval(this.reconnectionIntervalId)
  }

  private parseConfig(config?: IClientConfig) {
    return {
      autoConnect: true,
      ...config
    }
  }

  private parseAuthenticationConfig(config?: IClientAuthenticationConfig) {
    return {
      shouldSync: true,
      ...config
    }
  }

  private connectAndSupressWarnings() {
    this.connect()
      .then(() => {})
      .catch(() => {})
  }

  private registerOpen() {
    if (this.onConnected)
      this.onConnected({
        isInitialConnection: this.isInitialConnection,
        isInitialSessionConnection: this.isInitialSessionConnection,

        isAutomaticReconnection: this.isAutomaticReconnection
      })

    this.isInitialConnection = false
    this.isInitialSessionConnection = false
    this.isAutomaticReconnection = false

    if (this.queue.length > 0) {
      this.queue.forEach(this.sendRaw)
      this.queue = []
    }
  }

  private registerMessage({ data: _data }: WebSocket.MessageEvent) {
    let json: ReceivedMessage

    try {
      json = JSON.parse(_data.toString())
    } catch (error) {
      return console.error(error)
    }

    const { op: opcode, d: data, t: type, s: sequence } = json

    switch (opcode) {
      case 1:
        return this.send(11, {})
      case 10:
        const {
          c_heartbeat_interval,
          c_reconnect_interval,
          c_authentication_timeout,
          rules
        } = data as IClientConnectionConfig

        if (c_heartbeat_interval)
          this.heartbeatIntervalTime = c_heartbeat_interval

        if (c_reconnect_interval)
          this.reconnectionIntervalTime = c_reconnect_interval

        if (c_authentication_timeout)
          this.authenticationTimeout = c_authentication_timeout

        if (rules.indexOf('enforce_equal_versions') > -1)
          this.send(0, { v: '1.5.3' }, 'CLIENT_VERSION')

        if (rules.indexOf('store_messages') > -1)
          this.messages = { sent: [], received: [] }

        this.rules = rules

        return
      case 22:
        this.authenticated = true

        if (this.rules.indexOf('sends_user_object') > -1 && this.authenticationResolve)
          this.authenticationResolve(data)
        else
          this.authenticationResolve()

        return
    }

    const message  = { opcode, data, type } as Message
    if(sequence)
      message.sequence = sequence

    if (this.onMessage)
      this.onMessage(message)

    if (this.rules.indexOf('store_messages') > -1)
      this.messages.received.push(json)
  }

  private registerClose(code?: number, reason?: string) {
    if (this.onDisconnected)
      this.onDisconnected(code, reason, { willAttemptReconnect: (!!this.reconnectionIntervalTime && !this.didForcefullyDisconnect) })

    if (this.didForcefullyDisconnect)
      this.isInitialSessionConnection = true

    if (this.reconnectionIntervalTime && !this.didForcefullyDisconnect) {
      if (this.reconnectionIntervalId)
        clearInterval(this.reconnectionIntervalId)

      this.ws = null
      this.isAutomaticReconnection = true
      this.reconnectionIntervalId = setInterval(() => this.connectAndSupressWarnings(), this.reconnectionIntervalTime) as any
    }
  }

  private registerError(error: WebSocket.ErrorEvent) {
    if (!this.onError) return

    this.onError(new Error(error.type))
  }
}
