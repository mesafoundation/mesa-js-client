# mesa-js-client
A simple JavaScript client for connecting to Mesa servers.

**Important**: `mesa-js-client` is only recommended for use in non-Node.js environments. Please use the `Client` implementation in [@cryb/mesa](https://github.com/crybapp/mesa) if you're attempting to connect to a mesa server from a Node.js environment

## Installation
### Module
This module library is available on the [NPM registry](https://www.npmjs.com/package/mesa-js-client). To install, run:
```bash
npm i mesa-js-client --save
```
If you're using [Yarn](https://yarnpkg.com), run:

```bash
yarn add mesa-js-client
```

### Browser
To install the browser library, copy `dist/browser/client.js` and refer to it in your `.html` file like so:
```html
<script src="client.js"></script>
```

`mesa-js-server` is also offered via the [jsdelivr CDN](https://www.jsdelivr.com):
```html
<script src="https://cdn.jsdelivr.net/npm/mesa-js-client@latest/dist/browser/client.js"></script>
```

## Usage
The client API is more or less identical to the `Client` implementation in `@cryb/mesa`, with a few caveats:

* `mesa-js-client` does not use `EventEmitter` in order to inform the application of events. Instead, we use callbacks in the form of:
	* `onConnected: () => void`
	* `onMessage: (message: Message) => void`
	* `onDisconnected: (code: number, reason: string) => void`
	* `onError: (error: Error) => void`

### Example
#### Module
```js
import MesaClient from 'mesa-js-client/dist/module'
// Bug fix for /dist/module hack coming soon

const client = new MesaClient('ws://localhost:4000')

client.onConnect = () => {
	console.log('Connected to Mesa server')
}

client.onMessage = (opcode, data, type) => {
	console.log('Recieved', op, d, t)
}

client.onDisconnect = (code, reason) => {
	console.log('Disconnected', code, reason)
}

client.onDisconnect = error => {
	console.log('Error', error)
}

client.connect()
```

#### Browser
```js
<script src="js/mesa-js-client.js"></script>
<script>
	const client = new MesaClient("ws://localhost:4000")

	client.onConnected = function() {
		console.log("Connected to Mesa server")
	}

	client.onMessage = function(opcode, data, type) {
		console.log("Recieved", op, d, t)
	}

	client.onDisconnected = function(code, reason) {
		console.log("Disconnected", code, reason)
	}

	client.onError = function(error) {
		console.log("Error", error)
	}

	client.connect()
</script>
```

## Questions / Issues
If you have an issues with `mesa-js-client`, please either open a GitHub issue or contact a maintainer
