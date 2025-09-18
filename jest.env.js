const { TextEncoder, TextDecoder } = require("util")
if (!global.TextEncoder) global.TextEncoder = TextEncoder
if (!global.TextDecoder) global.TextDecoder = TextDecoder

let undici = {}
try {
  undici = require("undici")
} catch (err) {
  // ignore in CI without undici
}
const { fetch, Headers, Request, Response, FormData } = undici

if (fetch && !global.fetch) global.fetch = fetch
if (Headers && !global.Headers) global.Headers = Headers
if (Request && !global.Request) global.Request = Request
if (Response && !global.Response) global.Response = Response
if (FormData && !global.FormData) global.FormData = FormData

if (!global.URL) global.URL = { createObjectURL: () => {}, revokeObjectURL: () => {} }
else {
  if (!global.URL.createObjectURL) global.URL.createObjectURL = () => {}
  if (!global.URL.revokeObjectURL) global.URL.revokeObjectURL = () => {}
}
