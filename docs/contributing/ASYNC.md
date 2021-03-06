# Async programming

There are NPM libraries for such stuff but none written with the requirements of TypeScript in mind.
* DRY: A contract should only be defined once and any edits to that should result in compile errors in all places that need to change.
* Understanding Code: Doing a *find reference* on a contract should show both callers and implementation.

## Basic principle
Consider a function that takes a JavaScript object `Query` and returns a *promise* to a JavaScript object `Response`. If we have such an function (`QRFunction<Query,Response>`) it is trivial to take *the same code* (as long as its runtime dependencies allow it) and:
* mutate it on the *calling side* to simply pass the Query it over a JSON layer (e.g. a socket connection OR Inter Process Communication `ipc` for node workers) and wait for a response, creating a Promise in the meantime to pass back, and resolve this promise when the JSON layer comes back with the *actual* response.
* use it as is on the *called side*, but just register with the JSON layer as a responder for the query (detected by `name`).

## Contract
On thing to note is the *as long as its runtime dependencies allow it* gotcha. This is not always true, so we just create a *pseudo* object and call it `contract`. The calling side needs to do nothing with this object (except mutate it as documented), but the *called side* needs to provide a concrete implementation.
*  We just let TypeScript verify the overall implementation on the *called side* by a line like `var _checkTypes: typeof contract.worker = Worker;`).
* Additionally individual function implementations use the contract too (e.g. `export var fileListUpdated: typeof contract.master.fileListUpdated = (q) => {`) and let TypeScript do the necessary type inference (`Query`) and validation `Promise<Qesponse>`.

## Two way
The contract can be two way by *just having two contracts*. E.g. for a socket : `client -> server` and `server -> client`. Having a contracts seperated from implementations also means that we don't have to deal with cyclic dependencies when writing the implementations.

## Libraries
To take the contract + implementation and work the magic we have two libraries, `socketLib` and `simpleWorker`, that work over sockets and IPC respectively.

## More than just Promises
Basically anything that is *async* in its contract can be used under the same principle. Our `socketLib` allows us to convert *events* raised from the server become *events* that are emitted (`cast`) to all the clients. Great for stuff like an up to date error list, file changes etc.

## Example

Checkout the [`socket` folder](https://github.com/TypeScriptBuilder/tsb/tree/e34bbf9cb6227f3cd150737fef5a47f212e2ad7a/src/socket) which contains the socket contract + server + client :rose:
