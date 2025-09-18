require("@testing-library/jest-dom")

const { TextEncoder, TextDecoder } = require("util")
if (!global.TextEncoder) global.TextEncoder = TextEncoder
if (!global.TextDecoder) global.TextDecoder = TextDecoder

let undici = {}
try {
  undici = require("undici")
} catch (err) {
  // ignore
}
const { fetch, Headers, Request, Response, FormData } = undici

if (fetch && !global.fetch) global.fetch = fetch
if (Headers && !global.Headers) global.Headers = Headers
if (Request && !global.Request) global.Request = Request
if (Response && !global.Response) global.Response = Response
if (FormData && !global.FormData) global.FormData = FormData

if (typeof global.structuredClone !== "function") {
  global.structuredClone = (input) => JSON.parse(JSON.stringify(input))
}

if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = () => {}
}
if (!global.URL.revokeObjectURL) {
  global.URL.revokeObjectURL = () => {}
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
