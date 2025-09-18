const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill streams before importing undici
const { ReadableStream } = require("stream/web");
global.ReadableStream = ReadableStream;

// Polyfill setImmediate
const { setImmediate } = require("timers");
global.setImmediate = setImmediate;

// Directly import from undici. If this fails, Jest will fail.
const undici = require("undici");
global.fetch = undici.fetch;
global.Request = undici.Request;
global.Response = undici.Response;
global.Headers = undici.Headers;
global.FormData = undici.FormData;

if (typeof global.structuredClone !== "function") {
  global.structuredClone = (input) => JSON.parse(JSON.stringify(input));
}

// The original file had a check for global.URL, let's be safe
if (!global.URL) {
    global.URL = {};
}
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = () => {};
}
if (!global.URL.revokeObjectURL) {
  global.URL.revokeObjectURL = () => {};
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}