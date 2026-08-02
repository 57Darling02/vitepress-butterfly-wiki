/* Obsidian plugin: VitePress Butterfly Publisher */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// (disabled):crypto
var require_crypto = __commonJS({
  "(disabled):crypto"() {
  }
});

// node_modules/.pnpm/tweetnacl@1.0.3/node_modules/tweetnacl/nacl-fast.js
var require_nacl_fast = __commonJS({
  "node_modules/.pnpm/tweetnacl@1.0.3/node_modules/tweetnacl/nacl-fast.js"(exports, module2) {
    (function(nacl2) {
      "use strict";
      var gf = function(init) {
        var i, r = new Float64Array(16);
        if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
        return r;
      };
      var randombytes = function() {
        throw new Error("no PRNG");
      };
      var _0 = new Uint8Array(16);
      var _9 = new Uint8Array(32);
      _9[0] = 9;
      var gf0 = gf(), gf1 = gf([1]), _121665 = gf([56129, 1]), D = gf([30883, 4953, 19914, 30187, 55467, 16705, 2637, 112, 59544, 30585, 16505, 36039, 65139, 11119, 27886, 20995]), D2 = gf([61785, 9906, 39828, 60374, 45398, 33411, 5274, 224, 53552, 61171, 33010, 6542, 64743, 22239, 55772, 9222]), X = gf([54554, 36645, 11616, 51542, 42930, 38181, 51040, 26924, 56412, 64982, 57905, 49316, 21502, 52590, 14035, 8553]), Y = gf([26200, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214]), I = gf([41136, 18958, 6951, 50414, 58488, 44335, 6150, 12099, 55207, 15867, 153, 11085, 57099, 20417, 9344, 11139]);
      function ts64(x, i, h, l) {
        x[i] = h >> 24 & 255;
        x[i + 1] = h >> 16 & 255;
        x[i + 2] = h >> 8 & 255;
        x[i + 3] = h & 255;
        x[i + 4] = l >> 24 & 255;
        x[i + 5] = l >> 16 & 255;
        x[i + 6] = l >> 8 & 255;
        x[i + 7] = l & 255;
      }
      function vn(x, xi, y, yi, n) {
        var i, d = 0;
        for (i = 0; i < n; i++) d |= x[xi + i] ^ y[yi + i];
        return (1 & d - 1 >>> 8) - 1;
      }
      function crypto_verify_16(x, xi, y, yi) {
        return vn(x, xi, y, yi, 16);
      }
      function crypto_verify_32(x, xi, y, yi) {
        return vn(x, xi, y, yi, 32);
      }
      function core_salsa20(o, p, k, c) {
        var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for (var i = 0; i < 20; i += 2) {
          u = x0 + x12 | 0;
          x4 ^= u << 7 | u >>> 32 - 7;
          u = x4 + x0 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x4 | 0;
          x12 ^= u << 13 | u >>> 32 - 13;
          u = x12 + x8 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x1 | 0;
          x9 ^= u << 7 | u >>> 32 - 7;
          u = x9 + x5 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x9 | 0;
          x1 ^= u << 13 | u >>> 32 - 13;
          u = x1 + x13 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x6 | 0;
          x14 ^= u << 7 | u >>> 32 - 7;
          u = x14 + x10 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x14 | 0;
          x6 ^= u << 13 | u >>> 32 - 13;
          u = x6 + x2 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x11 | 0;
          x3 ^= u << 7 | u >>> 32 - 7;
          u = x3 + x15 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x3 | 0;
          x11 ^= u << 13 | u >>> 32 - 13;
          u = x11 + x7 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
          u = x0 + x3 | 0;
          x1 ^= u << 7 | u >>> 32 - 7;
          u = x1 + x0 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x1 | 0;
          x3 ^= u << 13 | u >>> 32 - 13;
          u = x3 + x2 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x4 | 0;
          x6 ^= u << 7 | u >>> 32 - 7;
          u = x6 + x5 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x6 | 0;
          x4 ^= u << 13 | u >>> 32 - 13;
          u = x4 + x7 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x9 | 0;
          x11 ^= u << 7 | u >>> 32 - 7;
          u = x11 + x10 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x11 | 0;
          x9 ^= u << 13 | u >>> 32 - 13;
          u = x9 + x8 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x14 | 0;
          x12 ^= u << 7 | u >>> 32 - 7;
          u = x12 + x15 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x12 | 0;
          x14 ^= u << 13 | u >>> 32 - 13;
          u = x14 + x13 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
        }
        x0 = x0 + j0 | 0;
        x1 = x1 + j1 | 0;
        x2 = x2 + j2 | 0;
        x3 = x3 + j3 | 0;
        x4 = x4 + j4 | 0;
        x5 = x5 + j5 | 0;
        x6 = x6 + j6 | 0;
        x7 = x7 + j7 | 0;
        x8 = x8 + j8 | 0;
        x9 = x9 + j9 | 0;
        x10 = x10 + j10 | 0;
        x11 = x11 + j11 | 0;
        x12 = x12 + j12 | 0;
        x13 = x13 + j13 | 0;
        x14 = x14 + j14 | 0;
        x15 = x15 + j15 | 0;
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x1 >>> 0 & 255;
        o[5] = x1 >>> 8 & 255;
        o[6] = x1 >>> 16 & 255;
        o[7] = x1 >>> 24 & 255;
        o[8] = x2 >>> 0 & 255;
        o[9] = x2 >>> 8 & 255;
        o[10] = x2 >>> 16 & 255;
        o[11] = x2 >>> 24 & 255;
        o[12] = x3 >>> 0 & 255;
        o[13] = x3 >>> 8 & 255;
        o[14] = x3 >>> 16 & 255;
        o[15] = x3 >>> 24 & 255;
        o[16] = x4 >>> 0 & 255;
        o[17] = x4 >>> 8 & 255;
        o[18] = x4 >>> 16 & 255;
        o[19] = x4 >>> 24 & 255;
        o[20] = x5 >>> 0 & 255;
        o[21] = x5 >>> 8 & 255;
        o[22] = x5 >>> 16 & 255;
        o[23] = x5 >>> 24 & 255;
        o[24] = x6 >>> 0 & 255;
        o[25] = x6 >>> 8 & 255;
        o[26] = x6 >>> 16 & 255;
        o[27] = x6 >>> 24 & 255;
        o[28] = x7 >>> 0 & 255;
        o[29] = x7 >>> 8 & 255;
        o[30] = x7 >>> 16 & 255;
        o[31] = x7 >>> 24 & 255;
        o[32] = x8 >>> 0 & 255;
        o[33] = x8 >>> 8 & 255;
        o[34] = x8 >>> 16 & 255;
        o[35] = x8 >>> 24 & 255;
        o[36] = x9 >>> 0 & 255;
        o[37] = x9 >>> 8 & 255;
        o[38] = x9 >>> 16 & 255;
        o[39] = x9 >>> 24 & 255;
        o[40] = x10 >>> 0 & 255;
        o[41] = x10 >>> 8 & 255;
        o[42] = x10 >>> 16 & 255;
        o[43] = x10 >>> 24 & 255;
        o[44] = x11 >>> 0 & 255;
        o[45] = x11 >>> 8 & 255;
        o[46] = x11 >>> 16 & 255;
        o[47] = x11 >>> 24 & 255;
        o[48] = x12 >>> 0 & 255;
        o[49] = x12 >>> 8 & 255;
        o[50] = x12 >>> 16 & 255;
        o[51] = x12 >>> 24 & 255;
        o[52] = x13 >>> 0 & 255;
        o[53] = x13 >>> 8 & 255;
        o[54] = x13 >>> 16 & 255;
        o[55] = x13 >>> 24 & 255;
        o[56] = x14 >>> 0 & 255;
        o[57] = x14 >>> 8 & 255;
        o[58] = x14 >>> 16 & 255;
        o[59] = x14 >>> 24 & 255;
        o[60] = x15 >>> 0 & 255;
        o[61] = x15 >>> 8 & 255;
        o[62] = x15 >>> 16 & 255;
        o[63] = x15 >>> 24 & 255;
      }
      function core_hsalsa20(o, p, k, c) {
        var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for (var i = 0; i < 20; i += 2) {
          u = x0 + x12 | 0;
          x4 ^= u << 7 | u >>> 32 - 7;
          u = x4 + x0 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x4 | 0;
          x12 ^= u << 13 | u >>> 32 - 13;
          u = x12 + x8 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x1 | 0;
          x9 ^= u << 7 | u >>> 32 - 7;
          u = x9 + x5 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x9 | 0;
          x1 ^= u << 13 | u >>> 32 - 13;
          u = x1 + x13 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x6 | 0;
          x14 ^= u << 7 | u >>> 32 - 7;
          u = x14 + x10 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x14 | 0;
          x6 ^= u << 13 | u >>> 32 - 13;
          u = x6 + x2 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x11 | 0;
          x3 ^= u << 7 | u >>> 32 - 7;
          u = x3 + x15 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x3 | 0;
          x11 ^= u << 13 | u >>> 32 - 13;
          u = x11 + x7 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
          u = x0 + x3 | 0;
          x1 ^= u << 7 | u >>> 32 - 7;
          u = x1 + x0 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x1 | 0;
          x3 ^= u << 13 | u >>> 32 - 13;
          u = x3 + x2 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x4 | 0;
          x6 ^= u << 7 | u >>> 32 - 7;
          u = x6 + x5 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x6 | 0;
          x4 ^= u << 13 | u >>> 32 - 13;
          u = x4 + x7 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x9 | 0;
          x11 ^= u << 7 | u >>> 32 - 7;
          u = x11 + x10 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x11 | 0;
          x9 ^= u << 13 | u >>> 32 - 13;
          u = x9 + x8 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x14 | 0;
          x12 ^= u << 7 | u >>> 32 - 7;
          u = x12 + x15 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x12 | 0;
          x14 ^= u << 13 | u >>> 32 - 13;
          u = x14 + x13 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
        }
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x5 >>> 0 & 255;
        o[5] = x5 >>> 8 & 255;
        o[6] = x5 >>> 16 & 255;
        o[7] = x5 >>> 24 & 255;
        o[8] = x10 >>> 0 & 255;
        o[9] = x10 >>> 8 & 255;
        o[10] = x10 >>> 16 & 255;
        o[11] = x10 >>> 24 & 255;
        o[12] = x15 >>> 0 & 255;
        o[13] = x15 >>> 8 & 255;
        o[14] = x15 >>> 16 & 255;
        o[15] = x15 >>> 24 & 255;
        o[16] = x6 >>> 0 & 255;
        o[17] = x6 >>> 8 & 255;
        o[18] = x6 >>> 16 & 255;
        o[19] = x6 >>> 24 & 255;
        o[20] = x7 >>> 0 & 255;
        o[21] = x7 >>> 8 & 255;
        o[22] = x7 >>> 16 & 255;
        o[23] = x7 >>> 24 & 255;
        o[24] = x8 >>> 0 & 255;
        o[25] = x8 >>> 8 & 255;
        o[26] = x8 >>> 16 & 255;
        o[27] = x8 >>> 24 & 255;
        o[28] = x9 >>> 0 & 255;
        o[29] = x9 >>> 8 & 255;
        o[30] = x9 >>> 16 & 255;
        o[31] = x9 >>> 24 & 255;
      }
      function crypto_core_salsa20(out, inp, k, c) {
        core_salsa20(out, inp, k, c);
      }
      function crypto_core_hsalsa20(out, inp, k, c) {
        core_hsalsa20(out, inp, k, c);
      }
      var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
      function crypto_stream_salsa20_xor(c, cpos, m, mpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for (i = 0; i < 16; i++) z[i] = 0;
        for (i = 0; i < 8; i++) z[i] = n[i];
        while (b >= 64) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < 64; i++) c[cpos + i] = m[mpos + i] ^ x[i];
          u = 1;
          for (i = 8; i < 16; i++) {
            u = u + (z[i] & 255) | 0;
            z[i] = u & 255;
            u >>>= 8;
          }
          b -= 64;
          cpos += 64;
          mpos += 64;
        }
        if (b > 0) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < b; i++) c[cpos + i] = m[mpos + i] ^ x[i];
        }
        return 0;
      }
      function crypto_stream_salsa20(c, cpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for (i = 0; i < 16; i++) z[i] = 0;
        for (i = 0; i < 8; i++) z[i] = n[i];
        while (b >= 64) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < 64; i++) c[cpos + i] = x[i];
          u = 1;
          for (i = 8; i < 16; i++) {
            u = u + (z[i] & 255) | 0;
            z[i] = u & 255;
            u >>>= 8;
          }
          b -= 64;
          cpos += 64;
        }
        if (b > 0) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < b; i++) c[cpos + i] = x[i];
        }
        return 0;
      }
      function crypto_stream(c, cpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
        return crypto_stream_salsa20(c, cpos, d, sn, s);
      }
      function crypto_stream_xor(c, cpos, m, mpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
        return crypto_stream_salsa20_xor(c, cpos, m, mpos, d, sn, s);
      }
      var poly1305 = function(key) {
        this.buffer = new Uint8Array(16);
        this.r = new Uint16Array(10);
        this.h = new Uint16Array(10);
        this.pad = new Uint16Array(8);
        this.leftover = 0;
        this.fin = 0;
        var t0, t1, t2, t3, t4, t5, t6, t7;
        t0 = key[0] & 255 | (key[1] & 255) << 8;
        this.r[0] = t0 & 8191;
        t1 = key[2] & 255 | (key[3] & 255) << 8;
        this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
        t2 = key[4] & 255 | (key[5] & 255) << 8;
        this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
        t3 = key[6] & 255 | (key[7] & 255) << 8;
        this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
        t4 = key[8] & 255 | (key[9] & 255) << 8;
        this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
        this.r[5] = t4 >>> 1 & 8190;
        t5 = key[10] & 255 | (key[11] & 255) << 8;
        this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
        t6 = key[12] & 255 | (key[13] & 255) << 8;
        this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
        t7 = key[14] & 255 | (key[15] & 255) << 8;
        this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
        this.r[9] = t7 >>> 5 & 127;
        this.pad[0] = key[16] & 255 | (key[17] & 255) << 8;
        this.pad[1] = key[18] & 255 | (key[19] & 255) << 8;
        this.pad[2] = key[20] & 255 | (key[21] & 255) << 8;
        this.pad[3] = key[22] & 255 | (key[23] & 255) << 8;
        this.pad[4] = key[24] & 255 | (key[25] & 255) << 8;
        this.pad[5] = key[26] & 255 | (key[27] & 255) << 8;
        this.pad[6] = key[28] & 255 | (key[29] & 255) << 8;
        this.pad[7] = key[30] & 255 | (key[31] & 255) << 8;
      };
      poly1305.prototype.blocks = function(m, mpos, bytes) {
        var hibit = this.fin ? 0 : 1 << 11;
        var t0, t1, t2, t3, t4, t5, t6, t7, c;
        var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
        var h0 = this.h[0], h1 = this.h[1], h2 = this.h[2], h3 = this.h[3], h4 = this.h[4], h5 = this.h[5], h6 = this.h[6], h7 = this.h[7], h8 = this.h[8], h9 = this.h[9];
        var r0 = this.r[0], r1 = this.r[1], r2 = this.r[2], r3 = this.r[3], r4 = this.r[4], r5 = this.r[5], r6 = this.r[6], r7 = this.r[7], r8 = this.r[8], r9 = this.r[9];
        while (bytes >= 16) {
          t0 = m[mpos + 0] & 255 | (m[mpos + 1] & 255) << 8;
          h0 += t0 & 8191;
          t1 = m[mpos + 2] & 255 | (m[mpos + 3] & 255) << 8;
          h1 += (t0 >>> 13 | t1 << 3) & 8191;
          t2 = m[mpos + 4] & 255 | (m[mpos + 5] & 255) << 8;
          h2 += (t1 >>> 10 | t2 << 6) & 8191;
          t3 = m[mpos + 6] & 255 | (m[mpos + 7] & 255) << 8;
          h3 += (t2 >>> 7 | t3 << 9) & 8191;
          t4 = m[mpos + 8] & 255 | (m[mpos + 9] & 255) << 8;
          h4 += (t3 >>> 4 | t4 << 12) & 8191;
          h5 += t4 >>> 1 & 8191;
          t5 = m[mpos + 10] & 255 | (m[mpos + 11] & 255) << 8;
          h6 += (t4 >>> 14 | t5 << 2) & 8191;
          t6 = m[mpos + 12] & 255 | (m[mpos + 13] & 255) << 8;
          h7 += (t5 >>> 11 | t6 << 5) & 8191;
          t7 = m[mpos + 14] & 255 | (m[mpos + 15] & 255) << 8;
          h8 += (t6 >>> 8 | t7 << 8) & 8191;
          h9 += t7 >>> 5 | hibit;
          c = 0;
          d0 = c;
          d0 += h0 * r0;
          d0 += h1 * (5 * r9);
          d0 += h2 * (5 * r8);
          d0 += h3 * (5 * r7);
          d0 += h4 * (5 * r6);
          c = d0 >>> 13;
          d0 &= 8191;
          d0 += h5 * (5 * r5);
          d0 += h6 * (5 * r4);
          d0 += h7 * (5 * r3);
          d0 += h8 * (5 * r2);
          d0 += h9 * (5 * r1);
          c += d0 >>> 13;
          d0 &= 8191;
          d1 = c;
          d1 += h0 * r1;
          d1 += h1 * r0;
          d1 += h2 * (5 * r9);
          d1 += h3 * (5 * r8);
          d1 += h4 * (5 * r7);
          c = d1 >>> 13;
          d1 &= 8191;
          d1 += h5 * (5 * r6);
          d1 += h6 * (5 * r5);
          d1 += h7 * (5 * r4);
          d1 += h8 * (5 * r3);
          d1 += h9 * (5 * r2);
          c += d1 >>> 13;
          d1 &= 8191;
          d2 = c;
          d2 += h0 * r2;
          d2 += h1 * r1;
          d2 += h2 * r0;
          d2 += h3 * (5 * r9);
          d2 += h4 * (5 * r8);
          c = d2 >>> 13;
          d2 &= 8191;
          d2 += h5 * (5 * r7);
          d2 += h6 * (5 * r6);
          d2 += h7 * (5 * r5);
          d2 += h8 * (5 * r4);
          d2 += h9 * (5 * r3);
          c += d2 >>> 13;
          d2 &= 8191;
          d3 = c;
          d3 += h0 * r3;
          d3 += h1 * r2;
          d3 += h2 * r1;
          d3 += h3 * r0;
          d3 += h4 * (5 * r9);
          c = d3 >>> 13;
          d3 &= 8191;
          d3 += h5 * (5 * r8);
          d3 += h6 * (5 * r7);
          d3 += h7 * (5 * r6);
          d3 += h8 * (5 * r5);
          d3 += h9 * (5 * r4);
          c += d3 >>> 13;
          d3 &= 8191;
          d4 = c;
          d4 += h0 * r4;
          d4 += h1 * r3;
          d4 += h2 * r2;
          d4 += h3 * r1;
          d4 += h4 * r0;
          c = d4 >>> 13;
          d4 &= 8191;
          d4 += h5 * (5 * r9);
          d4 += h6 * (5 * r8);
          d4 += h7 * (5 * r7);
          d4 += h8 * (5 * r6);
          d4 += h9 * (5 * r5);
          c += d4 >>> 13;
          d4 &= 8191;
          d5 = c;
          d5 += h0 * r5;
          d5 += h1 * r4;
          d5 += h2 * r3;
          d5 += h3 * r2;
          d5 += h4 * r1;
          c = d5 >>> 13;
          d5 &= 8191;
          d5 += h5 * r0;
          d5 += h6 * (5 * r9);
          d5 += h7 * (5 * r8);
          d5 += h8 * (5 * r7);
          d5 += h9 * (5 * r6);
          c += d5 >>> 13;
          d5 &= 8191;
          d6 = c;
          d6 += h0 * r6;
          d6 += h1 * r5;
          d6 += h2 * r4;
          d6 += h3 * r3;
          d6 += h4 * r2;
          c = d6 >>> 13;
          d6 &= 8191;
          d6 += h5 * r1;
          d6 += h6 * r0;
          d6 += h7 * (5 * r9);
          d6 += h8 * (5 * r8);
          d6 += h9 * (5 * r7);
          c += d6 >>> 13;
          d6 &= 8191;
          d7 = c;
          d7 += h0 * r7;
          d7 += h1 * r6;
          d7 += h2 * r5;
          d7 += h3 * r4;
          d7 += h4 * r3;
          c = d7 >>> 13;
          d7 &= 8191;
          d7 += h5 * r2;
          d7 += h6 * r1;
          d7 += h7 * r0;
          d7 += h8 * (5 * r9);
          d7 += h9 * (5 * r8);
          c += d7 >>> 13;
          d7 &= 8191;
          d8 = c;
          d8 += h0 * r8;
          d8 += h1 * r7;
          d8 += h2 * r6;
          d8 += h3 * r5;
          d8 += h4 * r4;
          c = d8 >>> 13;
          d8 &= 8191;
          d8 += h5 * r3;
          d8 += h6 * r2;
          d8 += h7 * r1;
          d8 += h8 * r0;
          d8 += h9 * (5 * r9);
          c += d8 >>> 13;
          d8 &= 8191;
          d9 = c;
          d9 += h0 * r9;
          d9 += h1 * r8;
          d9 += h2 * r7;
          d9 += h3 * r6;
          d9 += h4 * r5;
          c = d9 >>> 13;
          d9 &= 8191;
          d9 += h5 * r4;
          d9 += h6 * r3;
          d9 += h7 * r2;
          d9 += h8 * r1;
          d9 += h9 * r0;
          c += d9 >>> 13;
          d9 &= 8191;
          c = (c << 2) + c | 0;
          c = c + d0 | 0;
          d0 = c & 8191;
          c = c >>> 13;
          d1 += c;
          h0 = d0;
          h1 = d1;
          h2 = d2;
          h3 = d3;
          h4 = d4;
          h5 = d5;
          h6 = d6;
          h7 = d7;
          h8 = d8;
          h9 = d9;
          mpos += 16;
          bytes -= 16;
        }
        this.h[0] = h0;
        this.h[1] = h1;
        this.h[2] = h2;
        this.h[3] = h3;
        this.h[4] = h4;
        this.h[5] = h5;
        this.h[6] = h6;
        this.h[7] = h7;
        this.h[8] = h8;
        this.h[9] = h9;
      };
      poly1305.prototype.finish = function(mac, macpos) {
        var g = new Uint16Array(10);
        var c, mask, f, i;
        if (this.leftover) {
          i = this.leftover;
          this.buffer[i++] = 1;
          for (; i < 16; i++) this.buffer[i] = 0;
          this.fin = 1;
          this.blocks(this.buffer, 0, 16);
        }
        c = this.h[1] >>> 13;
        this.h[1] &= 8191;
        for (i = 2; i < 10; i++) {
          this.h[i] += c;
          c = this.h[i] >>> 13;
          this.h[i] &= 8191;
        }
        this.h[0] += c * 5;
        c = this.h[0] >>> 13;
        this.h[0] &= 8191;
        this.h[1] += c;
        c = this.h[1] >>> 13;
        this.h[1] &= 8191;
        this.h[2] += c;
        g[0] = this.h[0] + 5;
        c = g[0] >>> 13;
        g[0] &= 8191;
        for (i = 1; i < 10; i++) {
          g[i] = this.h[i] + c;
          c = g[i] >>> 13;
          g[i] &= 8191;
        }
        g[9] -= 1 << 13;
        mask = (c ^ 1) - 1;
        for (i = 0; i < 10; i++) g[i] &= mask;
        mask = ~mask;
        for (i = 0; i < 10; i++) this.h[i] = this.h[i] & mask | g[i];
        this.h[0] = (this.h[0] | this.h[1] << 13) & 65535;
        this.h[1] = (this.h[1] >>> 3 | this.h[2] << 10) & 65535;
        this.h[2] = (this.h[2] >>> 6 | this.h[3] << 7) & 65535;
        this.h[3] = (this.h[3] >>> 9 | this.h[4] << 4) & 65535;
        this.h[4] = (this.h[4] >>> 12 | this.h[5] << 1 | this.h[6] << 14) & 65535;
        this.h[5] = (this.h[6] >>> 2 | this.h[7] << 11) & 65535;
        this.h[6] = (this.h[7] >>> 5 | this.h[8] << 8) & 65535;
        this.h[7] = (this.h[8] >>> 8 | this.h[9] << 5) & 65535;
        f = this.h[0] + this.pad[0];
        this.h[0] = f & 65535;
        for (i = 1; i < 8; i++) {
          f = (this.h[i] + this.pad[i] | 0) + (f >>> 16) | 0;
          this.h[i] = f & 65535;
        }
        mac[macpos + 0] = this.h[0] >>> 0 & 255;
        mac[macpos + 1] = this.h[0] >>> 8 & 255;
        mac[macpos + 2] = this.h[1] >>> 0 & 255;
        mac[macpos + 3] = this.h[1] >>> 8 & 255;
        mac[macpos + 4] = this.h[2] >>> 0 & 255;
        mac[macpos + 5] = this.h[2] >>> 8 & 255;
        mac[macpos + 6] = this.h[3] >>> 0 & 255;
        mac[macpos + 7] = this.h[3] >>> 8 & 255;
        mac[macpos + 8] = this.h[4] >>> 0 & 255;
        mac[macpos + 9] = this.h[4] >>> 8 & 255;
        mac[macpos + 10] = this.h[5] >>> 0 & 255;
        mac[macpos + 11] = this.h[5] >>> 8 & 255;
        mac[macpos + 12] = this.h[6] >>> 0 & 255;
        mac[macpos + 13] = this.h[6] >>> 8 & 255;
        mac[macpos + 14] = this.h[7] >>> 0 & 255;
        mac[macpos + 15] = this.h[7] >>> 8 & 255;
      };
      poly1305.prototype.update = function(m, mpos, bytes) {
        var i, want;
        if (this.leftover) {
          want = 16 - this.leftover;
          if (want > bytes)
            want = bytes;
          for (i = 0; i < want; i++)
            this.buffer[this.leftover + i] = m[mpos + i];
          bytes -= want;
          mpos += want;
          this.leftover += want;
          if (this.leftover < 16)
            return;
          this.blocks(this.buffer, 0, 16);
          this.leftover = 0;
        }
        if (bytes >= 16) {
          want = bytes - bytes % 16;
          this.blocks(m, mpos, want);
          mpos += want;
          bytes -= want;
        }
        if (bytes) {
          for (i = 0; i < bytes; i++)
            this.buffer[this.leftover + i] = m[mpos + i];
          this.leftover += bytes;
        }
      };
      function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
        var s = new poly1305(k);
        s.update(m, mpos, n);
        s.finish(out, outpos);
        return 0;
      }
      function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
        var x = new Uint8Array(16);
        crypto_onetimeauth(x, 0, m, mpos, n, k);
        return crypto_verify_16(h, hpos, x, 0);
      }
      function crypto_secretbox(c, m, d, n, k) {
        var i;
        if (d < 32) return -1;
        crypto_stream_xor(c, 0, m, 0, d, n, k);
        crypto_onetimeauth(c, 16, c, 32, d - 32, c);
        for (i = 0; i < 16; i++) c[i] = 0;
        return 0;
      }
      function crypto_secretbox_open(m, c, d, n, k) {
        var i;
        var x = new Uint8Array(32);
        if (d < 32) return -1;
        crypto_stream(x, 0, 32, n, k);
        if (crypto_onetimeauth_verify(c, 16, c, 32, d - 32, x) !== 0) return -1;
        crypto_stream_xor(m, 0, c, 0, d, n, k);
        for (i = 0; i < 32; i++) m[i] = 0;
        return 0;
      }
      function set25519(r, a) {
        var i;
        for (i = 0; i < 16; i++) r[i] = a[i] | 0;
      }
      function car25519(o) {
        var i, v, c = 1;
        for (i = 0; i < 16; i++) {
          v = o[i] + c + 65535;
          c = Math.floor(v / 65536);
          o[i] = v - c * 65536;
        }
        o[0] += c - 1 + 37 * (c - 1);
      }
      function sel25519(p, q, b) {
        var t, c = ~(b - 1);
        for (var i = 0; i < 16; i++) {
          t = c & (p[i] ^ q[i]);
          p[i] ^= t;
          q[i] ^= t;
        }
      }
      function pack25519(o, n) {
        var i, j, b;
        var m = gf(), t = gf();
        for (i = 0; i < 16; i++) t[i] = n[i];
        car25519(t);
        car25519(t);
        car25519(t);
        for (j = 0; j < 2; j++) {
          m[0] = t[0] - 65517;
          for (i = 1; i < 15; i++) {
            m[i] = t[i] - 65535 - (m[i - 1] >> 16 & 1);
            m[i - 1] &= 65535;
          }
          m[15] = t[15] - 32767 - (m[14] >> 16 & 1);
          b = m[15] >> 16 & 1;
          m[14] &= 65535;
          sel25519(t, m, 1 - b);
        }
        for (i = 0; i < 16; i++) {
          o[2 * i] = t[i] & 255;
          o[2 * i + 1] = t[i] >> 8;
        }
      }
      function neq25519(a, b) {
        var c = new Uint8Array(32), d = new Uint8Array(32);
        pack25519(c, a);
        pack25519(d, b);
        return crypto_verify_32(c, 0, d, 0);
      }
      function par25519(a) {
        var d = new Uint8Array(32);
        pack25519(d, a);
        return d[0] & 1;
      }
      function unpack25519(o, n) {
        var i;
        for (i = 0; i < 16; i++) o[i] = n[2 * i] + (n[2 * i + 1] << 8);
        o[15] &= 32767;
      }
      function A(o, a, b) {
        for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
      }
      function Z(o, a, b) {
        for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
      }
      function M(o, a, b) {
        var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
        v = a[0];
        t0 += v * b0;
        t1 += v * b1;
        t2 += v * b2;
        t3 += v * b3;
        t4 += v * b4;
        t5 += v * b5;
        t6 += v * b6;
        t7 += v * b7;
        t8 += v * b8;
        t9 += v * b9;
        t10 += v * b10;
        t11 += v * b11;
        t12 += v * b12;
        t13 += v * b13;
        t14 += v * b14;
        t15 += v * b15;
        v = a[1];
        t1 += v * b0;
        t2 += v * b1;
        t3 += v * b2;
        t4 += v * b3;
        t5 += v * b4;
        t6 += v * b5;
        t7 += v * b6;
        t8 += v * b7;
        t9 += v * b8;
        t10 += v * b9;
        t11 += v * b10;
        t12 += v * b11;
        t13 += v * b12;
        t14 += v * b13;
        t15 += v * b14;
        t16 += v * b15;
        v = a[2];
        t2 += v * b0;
        t3 += v * b1;
        t4 += v * b2;
        t5 += v * b3;
        t6 += v * b4;
        t7 += v * b5;
        t8 += v * b6;
        t9 += v * b7;
        t10 += v * b8;
        t11 += v * b9;
        t12 += v * b10;
        t13 += v * b11;
        t14 += v * b12;
        t15 += v * b13;
        t16 += v * b14;
        t17 += v * b15;
        v = a[3];
        t3 += v * b0;
        t4 += v * b1;
        t5 += v * b2;
        t6 += v * b3;
        t7 += v * b4;
        t8 += v * b5;
        t9 += v * b6;
        t10 += v * b7;
        t11 += v * b8;
        t12 += v * b9;
        t13 += v * b10;
        t14 += v * b11;
        t15 += v * b12;
        t16 += v * b13;
        t17 += v * b14;
        t18 += v * b15;
        v = a[4];
        t4 += v * b0;
        t5 += v * b1;
        t6 += v * b2;
        t7 += v * b3;
        t8 += v * b4;
        t9 += v * b5;
        t10 += v * b6;
        t11 += v * b7;
        t12 += v * b8;
        t13 += v * b9;
        t14 += v * b10;
        t15 += v * b11;
        t16 += v * b12;
        t17 += v * b13;
        t18 += v * b14;
        t19 += v * b15;
        v = a[5];
        t5 += v * b0;
        t6 += v * b1;
        t7 += v * b2;
        t8 += v * b3;
        t9 += v * b4;
        t10 += v * b5;
        t11 += v * b6;
        t12 += v * b7;
        t13 += v * b8;
        t14 += v * b9;
        t15 += v * b10;
        t16 += v * b11;
        t17 += v * b12;
        t18 += v * b13;
        t19 += v * b14;
        t20 += v * b15;
        v = a[6];
        t6 += v * b0;
        t7 += v * b1;
        t8 += v * b2;
        t9 += v * b3;
        t10 += v * b4;
        t11 += v * b5;
        t12 += v * b6;
        t13 += v * b7;
        t14 += v * b8;
        t15 += v * b9;
        t16 += v * b10;
        t17 += v * b11;
        t18 += v * b12;
        t19 += v * b13;
        t20 += v * b14;
        t21 += v * b15;
        v = a[7];
        t7 += v * b0;
        t8 += v * b1;
        t9 += v * b2;
        t10 += v * b3;
        t11 += v * b4;
        t12 += v * b5;
        t13 += v * b6;
        t14 += v * b7;
        t15 += v * b8;
        t16 += v * b9;
        t17 += v * b10;
        t18 += v * b11;
        t19 += v * b12;
        t20 += v * b13;
        t21 += v * b14;
        t22 += v * b15;
        v = a[8];
        t8 += v * b0;
        t9 += v * b1;
        t10 += v * b2;
        t11 += v * b3;
        t12 += v * b4;
        t13 += v * b5;
        t14 += v * b6;
        t15 += v * b7;
        t16 += v * b8;
        t17 += v * b9;
        t18 += v * b10;
        t19 += v * b11;
        t20 += v * b12;
        t21 += v * b13;
        t22 += v * b14;
        t23 += v * b15;
        v = a[9];
        t9 += v * b0;
        t10 += v * b1;
        t11 += v * b2;
        t12 += v * b3;
        t13 += v * b4;
        t14 += v * b5;
        t15 += v * b6;
        t16 += v * b7;
        t17 += v * b8;
        t18 += v * b9;
        t19 += v * b10;
        t20 += v * b11;
        t21 += v * b12;
        t22 += v * b13;
        t23 += v * b14;
        t24 += v * b15;
        v = a[10];
        t10 += v * b0;
        t11 += v * b1;
        t12 += v * b2;
        t13 += v * b3;
        t14 += v * b4;
        t15 += v * b5;
        t16 += v * b6;
        t17 += v * b7;
        t18 += v * b8;
        t19 += v * b9;
        t20 += v * b10;
        t21 += v * b11;
        t22 += v * b12;
        t23 += v * b13;
        t24 += v * b14;
        t25 += v * b15;
        v = a[11];
        t11 += v * b0;
        t12 += v * b1;
        t13 += v * b2;
        t14 += v * b3;
        t15 += v * b4;
        t16 += v * b5;
        t17 += v * b6;
        t18 += v * b7;
        t19 += v * b8;
        t20 += v * b9;
        t21 += v * b10;
        t22 += v * b11;
        t23 += v * b12;
        t24 += v * b13;
        t25 += v * b14;
        t26 += v * b15;
        v = a[12];
        t12 += v * b0;
        t13 += v * b1;
        t14 += v * b2;
        t15 += v * b3;
        t16 += v * b4;
        t17 += v * b5;
        t18 += v * b6;
        t19 += v * b7;
        t20 += v * b8;
        t21 += v * b9;
        t22 += v * b10;
        t23 += v * b11;
        t24 += v * b12;
        t25 += v * b13;
        t26 += v * b14;
        t27 += v * b15;
        v = a[13];
        t13 += v * b0;
        t14 += v * b1;
        t15 += v * b2;
        t16 += v * b3;
        t17 += v * b4;
        t18 += v * b5;
        t19 += v * b6;
        t20 += v * b7;
        t21 += v * b8;
        t22 += v * b9;
        t23 += v * b10;
        t24 += v * b11;
        t25 += v * b12;
        t26 += v * b13;
        t27 += v * b14;
        t28 += v * b15;
        v = a[14];
        t14 += v * b0;
        t15 += v * b1;
        t16 += v * b2;
        t17 += v * b3;
        t18 += v * b4;
        t19 += v * b5;
        t20 += v * b6;
        t21 += v * b7;
        t22 += v * b8;
        t23 += v * b9;
        t24 += v * b10;
        t25 += v * b11;
        t26 += v * b12;
        t27 += v * b13;
        t28 += v * b14;
        t29 += v * b15;
        v = a[15];
        t15 += v * b0;
        t16 += v * b1;
        t17 += v * b2;
        t18 += v * b3;
        t19 += v * b4;
        t20 += v * b5;
        t21 += v * b6;
        t22 += v * b7;
        t23 += v * b8;
        t24 += v * b9;
        t25 += v * b10;
        t26 += v * b11;
        t27 += v * b12;
        t28 += v * b13;
        t29 += v * b14;
        t30 += v * b15;
        t0 += 38 * t16;
        t1 += 38 * t17;
        t2 += 38 * t18;
        t3 += 38 * t19;
        t4 += 38 * t20;
        t5 += 38 * t21;
        t6 += 38 * t22;
        t7 += 38 * t23;
        t8 += 38 * t24;
        t9 += 38 * t25;
        t10 += 38 * t26;
        t11 += 38 * t27;
        t12 += 38 * t28;
        t13 += 38 * t29;
        t14 += 38 * t30;
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        o[0] = t0;
        o[1] = t1;
        o[2] = t2;
        o[3] = t3;
        o[4] = t4;
        o[5] = t5;
        o[6] = t6;
        o[7] = t7;
        o[8] = t8;
        o[9] = t9;
        o[10] = t10;
        o[11] = t11;
        o[12] = t12;
        o[13] = t13;
        o[14] = t14;
        o[15] = t15;
      }
      function S(o, a) {
        M(o, a, a);
      }
      function inv25519(o, i) {
        var c = gf();
        var a;
        for (a = 0; a < 16; a++) c[a] = i[a];
        for (a = 253; a >= 0; a--) {
          S(c, c);
          if (a !== 2 && a !== 4) M(c, c, i);
        }
        for (a = 0; a < 16; a++) o[a] = c[a];
      }
      function pow2523(o, i) {
        var c = gf();
        var a;
        for (a = 0; a < 16; a++) c[a] = i[a];
        for (a = 250; a >= 0; a--) {
          S(c, c);
          if (a !== 1) M(c, c, i);
        }
        for (a = 0; a < 16; a++) o[a] = c[a];
      }
      function crypto_scalarmult(q, n, p) {
        var z = new Uint8Array(32);
        var x = new Float64Array(80), r, i;
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf();
        for (i = 0; i < 31; i++) z[i] = n[i];
        z[31] = n[31] & 127 | 64;
        z[0] &= 248;
        unpack25519(x, p);
        for (i = 0; i < 16; i++) {
          b[i] = x[i];
          d[i] = a[i] = c[i] = 0;
        }
        a[0] = d[0] = 1;
        for (i = 254; i >= 0; --i) {
          r = z[i >>> 3] >>> (i & 7) & 1;
          sel25519(a, b, r);
          sel25519(c, d, r);
          A(e, a, c);
          Z(a, a, c);
          A(c, b, d);
          Z(b, b, d);
          S(d, e);
          S(f, a);
          M(a, c, a);
          M(c, b, e);
          A(e, a, c);
          Z(a, a, c);
          S(b, a);
          Z(c, d, f);
          M(a, c, _121665);
          A(a, a, d);
          M(c, c, a);
          M(a, d, f);
          M(d, b, x);
          S(b, e);
          sel25519(a, b, r);
          sel25519(c, d, r);
        }
        for (i = 0; i < 16; i++) {
          x[i + 16] = a[i];
          x[i + 32] = c[i];
          x[i + 48] = b[i];
          x[i + 64] = d[i];
        }
        var x32 = x.subarray(32);
        var x16 = x.subarray(16);
        inv25519(x32, x32);
        M(x16, x16, x32);
        pack25519(q, x16);
        return 0;
      }
      function crypto_scalarmult_base(q, n) {
        return crypto_scalarmult(q, n, _9);
      }
      function crypto_box_keypair(y, x) {
        randombytes(x, 32);
        return crypto_scalarmult_base(y, x);
      }
      function crypto_box_beforenm(k, y, x) {
        var s = new Uint8Array(32);
        crypto_scalarmult(s, x, y);
        return crypto_core_hsalsa20(k, _0, s, sigma);
      }
      var crypto_box_afternm = crypto_secretbox;
      var crypto_box_open_afternm = crypto_secretbox_open;
      function crypto_box(c, m, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_afternm(c, m, d, n, k);
      }
      function crypto_box_open(m, c, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_open_afternm(m, c, d, n, k);
      }
      var K = [
        1116352408,
        3609767458,
        1899447441,
        602891725,
        3049323471,
        3964484399,
        3921009573,
        2173295548,
        961987163,
        4081628472,
        1508970993,
        3053834265,
        2453635748,
        2937671579,
        2870763221,
        3664609560,
        3624381080,
        2734883394,
        310598401,
        1164996542,
        607225278,
        1323610764,
        1426881987,
        3590304994,
        1925078388,
        4068182383,
        2162078206,
        991336113,
        2614888103,
        633803317,
        3248222580,
        3479774868,
        3835390401,
        2666613458,
        4022224774,
        944711139,
        264347078,
        2341262773,
        604807628,
        2007800933,
        770255983,
        1495990901,
        1249150122,
        1856431235,
        1555081692,
        3175218132,
        1996064986,
        2198950837,
        2554220882,
        3999719339,
        2821834349,
        766784016,
        2952996808,
        2566594879,
        3210313671,
        3203337956,
        3336571891,
        1034457026,
        3584528711,
        2466948901,
        113926993,
        3758326383,
        338241895,
        168717936,
        666307205,
        1188179964,
        773529912,
        1546045734,
        1294757372,
        1522805485,
        1396182291,
        2643833823,
        1695183700,
        2343527390,
        1986661051,
        1014477480,
        2177026350,
        1206759142,
        2456956037,
        344077627,
        2730485921,
        1290863460,
        2820302411,
        3158454273,
        3259730800,
        3505952657,
        3345764771,
        106217008,
        3516065817,
        3606008344,
        3600352804,
        1432725776,
        4094571909,
        1467031594,
        275423344,
        851169720,
        430227734,
        3100823752,
        506948616,
        1363258195,
        659060556,
        3750685593,
        883997877,
        3785050280,
        958139571,
        3318307427,
        1322822218,
        3812723403,
        1537002063,
        2003034995,
        1747873779,
        3602036899,
        1955562222,
        1575990012,
        2024104815,
        1125592928,
        2227730452,
        2716904306,
        2361852424,
        442776044,
        2428436474,
        593698344,
        2756734187,
        3733110249,
        3204031479,
        2999351573,
        3329325298,
        3815920427,
        3391569614,
        3928383900,
        3515267271,
        566280711,
        3940187606,
        3454069534,
        4118630271,
        4000239992,
        116418474,
        1914138554,
        174292421,
        2731055270,
        289380356,
        3203993006,
        460393269,
        320620315,
        685471733,
        587496836,
        852142971,
        1086792851,
        1017036298,
        365543100,
        1126000580,
        2618297676,
        1288033470,
        3409855158,
        1501505948,
        4234509866,
        1607167915,
        987167468,
        1816402316,
        1246189591
      ];
      function crypto_hashblocks_hl(hh, hl, m, n) {
        var wh = new Int32Array(16), wl = new Int32Array(16), bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i, j, h, l, a, b, c, d;
        var ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
        var pos = 0;
        while (n >= 128) {
          for (i = 0; i < 16; i++) {
            j = 8 * i + pos;
            wh[i] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
            wl[i] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
          }
          for (i = 0; i < 80; i++) {
            bh0 = ah0;
            bh1 = ah1;
            bh2 = ah2;
            bh3 = ah3;
            bh4 = ah4;
            bh5 = ah5;
            bh6 = ah6;
            bh7 = ah7;
            bl0 = al0;
            bl1 = al1;
            bl2 = al2;
            bl3 = al3;
            bl4 = al4;
            bl5 = al5;
            bl6 = al6;
            bl7 = al7;
            h = ah7;
            l = al7;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = (ah4 >>> 14 | al4 << 32 - 14) ^ (ah4 >>> 18 | al4 << 32 - 18) ^ (al4 >>> 41 - 32 | ah4 << 32 - (41 - 32));
            l = (al4 >>> 14 | ah4 << 32 - 14) ^ (al4 >>> 18 | ah4 << 32 - 18) ^ (ah4 >>> 41 - 32 | al4 << 32 - (41 - 32));
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = ah4 & ah5 ^ ~ah4 & ah6;
            l = al4 & al5 ^ ~al4 & al6;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = K[i * 2];
            l = K[i * 2 + 1];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = wh[i % 16];
            l = wl[i % 16];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            th = c & 65535 | d << 16;
            tl = a & 65535 | b << 16;
            h = th;
            l = tl;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = (ah0 >>> 28 | al0 << 32 - 28) ^ (al0 >>> 34 - 32 | ah0 << 32 - (34 - 32)) ^ (al0 >>> 39 - 32 | ah0 << 32 - (39 - 32));
            l = (al0 >>> 28 | ah0 << 32 - 28) ^ (ah0 >>> 34 - 32 | al0 << 32 - (34 - 32)) ^ (ah0 >>> 39 - 32 | al0 << 32 - (39 - 32));
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
            l = al0 & al1 ^ al0 & al2 ^ al1 & al2;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            bh7 = c & 65535 | d << 16;
            bl7 = a & 65535 | b << 16;
            h = bh3;
            l = bl3;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = th;
            l = tl;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            bh3 = c & 65535 | d << 16;
            bl3 = a & 65535 | b << 16;
            ah1 = bh0;
            ah2 = bh1;
            ah3 = bh2;
            ah4 = bh3;
            ah5 = bh4;
            ah6 = bh5;
            ah7 = bh6;
            ah0 = bh7;
            al1 = bl0;
            al2 = bl1;
            al3 = bl2;
            al4 = bl3;
            al5 = bl4;
            al6 = bl5;
            al7 = bl6;
            al0 = bl7;
            if (i % 16 === 15) {
              for (j = 0; j < 16; j++) {
                h = wh[j];
                l = wl[j];
                a = l & 65535;
                b = l >>> 16;
                c = h & 65535;
                d = h >>> 16;
                h = wh[(j + 9) % 16];
                l = wl[(j + 9) % 16];
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                th = wh[(j + 1) % 16];
                tl = wl[(j + 1) % 16];
                h = (th >>> 1 | tl << 32 - 1) ^ (th >>> 8 | tl << 32 - 8) ^ th >>> 7;
                l = (tl >>> 1 | th << 32 - 1) ^ (tl >>> 8 | th << 32 - 8) ^ (tl >>> 7 | th << 32 - 7);
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                th = wh[(j + 14) % 16];
                tl = wl[(j + 14) % 16];
                h = (th >>> 19 | tl << 32 - 19) ^ (tl >>> 61 - 32 | th << 32 - (61 - 32)) ^ th >>> 6;
                l = (tl >>> 19 | th << 32 - 19) ^ (th >>> 61 - 32 | tl << 32 - (61 - 32)) ^ (tl >>> 6 | th << 32 - 6);
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                wh[j] = c & 65535 | d << 16;
                wl[j] = a & 65535 | b << 16;
              }
            }
          }
          h = ah0;
          l = al0;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[0];
          l = hl[0];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[0] = ah0 = c & 65535 | d << 16;
          hl[0] = al0 = a & 65535 | b << 16;
          h = ah1;
          l = al1;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[1];
          l = hl[1];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[1] = ah1 = c & 65535 | d << 16;
          hl[1] = al1 = a & 65535 | b << 16;
          h = ah2;
          l = al2;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[2];
          l = hl[2];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[2] = ah2 = c & 65535 | d << 16;
          hl[2] = al2 = a & 65535 | b << 16;
          h = ah3;
          l = al3;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[3];
          l = hl[3];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[3] = ah3 = c & 65535 | d << 16;
          hl[3] = al3 = a & 65535 | b << 16;
          h = ah4;
          l = al4;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[4];
          l = hl[4];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[4] = ah4 = c & 65535 | d << 16;
          hl[4] = al4 = a & 65535 | b << 16;
          h = ah5;
          l = al5;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[5];
          l = hl[5];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[5] = ah5 = c & 65535 | d << 16;
          hl[5] = al5 = a & 65535 | b << 16;
          h = ah6;
          l = al6;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[6];
          l = hl[6];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[6] = ah6 = c & 65535 | d << 16;
          hl[6] = al6 = a & 65535 | b << 16;
          h = ah7;
          l = al7;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[7];
          l = hl[7];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[7] = ah7 = c & 65535 | d << 16;
          hl[7] = al7 = a & 65535 | b << 16;
          pos += 128;
          n -= 128;
        }
        return n;
      }
      function crypto_hash(out, m, n) {
        var hh = new Int32Array(8), hl = new Int32Array(8), x = new Uint8Array(256), i, b = n;
        hh[0] = 1779033703;
        hh[1] = 3144134277;
        hh[2] = 1013904242;
        hh[3] = 2773480762;
        hh[4] = 1359893119;
        hh[5] = 2600822924;
        hh[6] = 528734635;
        hh[7] = 1541459225;
        hl[0] = 4089235720;
        hl[1] = 2227873595;
        hl[2] = 4271175723;
        hl[3] = 1595750129;
        hl[4] = 2917565137;
        hl[5] = 725511199;
        hl[6] = 4215389547;
        hl[7] = 327033209;
        crypto_hashblocks_hl(hh, hl, m, n);
        n %= 128;
        for (i = 0; i < n; i++) x[i] = m[b - n + i];
        x[n] = 128;
        n = 256 - 128 * (n < 112 ? 1 : 0);
        x[n - 9] = 0;
        ts64(x, n - 8, b / 536870912 | 0, b << 3);
        crypto_hashblocks_hl(hh, hl, x, n);
        for (i = 0; i < 8; i++) ts64(out, 8 * i, hh[i], hl[i]);
        return 0;
      }
      function add2(p, q) {
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf();
        Z(a, p[1], p[0]);
        Z(t, q[1], q[0]);
        M(a, a, t);
        A(b, p[0], p[1]);
        A(t, q[0], q[1]);
        M(b, b, t);
        M(c, p[3], q[3]);
        M(c, c, D2);
        M(d, p[2], q[2]);
        A(d, d, d);
        Z(e, b, a);
        Z(f, d, c);
        A(g, d, c);
        A(h, b, a);
        M(p[0], e, f);
        M(p[1], h, g);
        M(p[2], g, f);
        M(p[3], e, h);
      }
      function cswap(p, q, b) {
        var i;
        for (i = 0; i < 4; i++) {
          sel25519(p[i], q[i], b);
        }
      }
      function pack(r, p) {
        var tx = gf(), ty = gf(), zi = gf();
        inv25519(zi, p[2]);
        M(tx, p[0], zi);
        M(ty, p[1], zi);
        pack25519(r, ty);
        r[31] ^= par25519(tx) << 7;
      }
      function scalarmult(p, q, s) {
        var b, i;
        set25519(p[0], gf0);
        set25519(p[1], gf1);
        set25519(p[2], gf1);
        set25519(p[3], gf0);
        for (i = 255; i >= 0; --i) {
          b = s[i / 8 | 0] >> (i & 7) & 1;
          cswap(p, q, b);
          add2(q, p);
          add2(p, p);
          cswap(p, q, b);
        }
      }
      function scalarbase(p, s) {
        var q = [gf(), gf(), gf(), gf()];
        set25519(q[0], X);
        set25519(q[1], Y);
        set25519(q[2], gf1);
        M(q[3], X, Y);
        scalarmult(p, q, s);
      }
      function crypto_sign_keypair(pk, sk, seeded) {
        var d = new Uint8Array(64);
        var p = [gf(), gf(), gf(), gf()];
        var i;
        if (!seeded) randombytes(sk, 32);
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        scalarbase(p, d);
        pack(pk, p);
        for (i = 0; i < 32; i++) sk[i + 32] = pk[i];
        return 0;
      }
      var L = new Float64Array([237, 211, 245, 92, 26, 99, 18, 88, 214, 156, 247, 162, 222, 249, 222, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16]);
      function modL(r, x) {
        var carry, i, j, k;
        for (i = 63; i >= 32; --i) {
          carry = 0;
          for (j = i - 32, k = i - 12; j < k; ++j) {
            x[j] += carry - 16 * x[i] * L[j - (i - 32)];
            carry = Math.floor((x[j] + 128) / 256);
            x[j] -= carry * 256;
          }
          x[j] += carry;
          x[i] = 0;
        }
        carry = 0;
        for (j = 0; j < 32; j++) {
          x[j] += carry - (x[31] >> 4) * L[j];
          carry = x[j] >> 8;
          x[j] &= 255;
        }
        for (j = 0; j < 32; j++) x[j] -= carry * L[j];
        for (i = 0; i < 32; i++) {
          x[i + 1] += x[i] >> 8;
          r[i] = x[i] & 255;
        }
      }
      function reduce(r) {
        var x = new Float64Array(64), i;
        for (i = 0; i < 64; i++) x[i] = r[i];
        for (i = 0; i < 64; i++) r[i] = 0;
        modL(r, x);
      }
      function crypto_sign(sm, m, n, sk) {
        var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
        var i, j, x = new Float64Array(64);
        var p = [gf(), gf(), gf(), gf()];
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        var smlen = n + 64;
        for (i = 0; i < n; i++) sm[64 + i] = m[i];
        for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];
        crypto_hash(r, sm.subarray(32), n + 32);
        reduce(r);
        scalarbase(p, r);
        pack(sm, p);
        for (i = 32; i < 64; i++) sm[i] = sk[i];
        crypto_hash(h, sm, n + 64);
        reduce(h);
        for (i = 0; i < 64; i++) x[i] = 0;
        for (i = 0; i < 32; i++) x[i] = r[i];
        for (i = 0; i < 32; i++) {
          for (j = 0; j < 32; j++) {
            x[i + j] += h[i] * d[j];
          }
        }
        modL(sm.subarray(32), x);
        return smlen;
      }
      function unpackneg(r, p) {
        var t = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
        set25519(r[2], gf1);
        unpack25519(r[1], p);
        S(num, r[1]);
        M(den, num, D);
        Z(num, num, r[2]);
        A(den, r[2], den);
        S(den2, den);
        S(den4, den2);
        M(den6, den4, den2);
        M(t, den6, num);
        M(t, t, den);
        pow2523(t, t);
        M(t, t, num);
        M(t, t, den);
        M(t, t, den);
        M(r[0], t, den);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num)) M(r[0], r[0], I);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num)) return -1;
        if (par25519(r[0]) === p[31] >> 7) Z(r[0], gf0, r[0]);
        M(r[3], r[0], r[1]);
        return 0;
      }
      function crypto_sign_open(m, sm, n, pk) {
        var i;
        var t = new Uint8Array(32), h = new Uint8Array(64);
        var p = [gf(), gf(), gf(), gf()], q = [gf(), gf(), gf(), gf()];
        if (n < 64) return -1;
        if (unpackneg(q, pk)) return -1;
        for (i = 0; i < n; i++) m[i] = sm[i];
        for (i = 0; i < 32; i++) m[i + 32] = pk[i];
        crypto_hash(h, m, n);
        reduce(h);
        scalarmult(p, q, h);
        scalarbase(q, sm.subarray(32));
        add2(p, q);
        pack(t, p);
        n -= 64;
        if (crypto_verify_32(sm, 0, t, 0)) {
          for (i = 0; i < n; i++) m[i] = 0;
          return -1;
        }
        for (i = 0; i < n; i++) m[i] = sm[i + 64];
        return n;
      }
      var crypto_secretbox_KEYBYTES = 32, crypto_secretbox_NONCEBYTES = 24, crypto_secretbox_ZEROBYTES = 32, crypto_secretbox_BOXZEROBYTES = 16, crypto_scalarmult_BYTES = 32, crypto_scalarmult_SCALARBYTES = 32, crypto_box_PUBLICKEYBYTES = 32, crypto_box_SECRETKEYBYTES = 32, crypto_box_BEFORENMBYTES = 32, crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES, crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES, crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES, crypto_sign_BYTES = 64, crypto_sign_PUBLICKEYBYTES = 32, crypto_sign_SECRETKEYBYTES = 64, crypto_sign_SEEDBYTES = 32, crypto_hash_BYTES = 64;
      nacl2.lowlevel = {
        crypto_core_hsalsa20,
        crypto_stream_xor,
        crypto_stream,
        crypto_stream_salsa20_xor,
        crypto_stream_salsa20,
        crypto_onetimeauth,
        crypto_onetimeauth_verify,
        crypto_verify_16,
        crypto_verify_32,
        crypto_secretbox,
        crypto_secretbox_open,
        crypto_scalarmult,
        crypto_scalarmult_base,
        crypto_box_beforenm,
        crypto_box_afternm,
        crypto_box,
        crypto_box_open,
        crypto_box_keypair,
        crypto_hash,
        crypto_sign,
        crypto_sign_keypair,
        crypto_sign_open,
        crypto_secretbox_KEYBYTES,
        crypto_secretbox_NONCEBYTES,
        crypto_secretbox_ZEROBYTES,
        crypto_secretbox_BOXZEROBYTES,
        crypto_scalarmult_BYTES,
        crypto_scalarmult_SCALARBYTES,
        crypto_box_PUBLICKEYBYTES,
        crypto_box_SECRETKEYBYTES,
        crypto_box_BEFORENMBYTES,
        crypto_box_NONCEBYTES,
        crypto_box_ZEROBYTES,
        crypto_box_BOXZEROBYTES,
        crypto_sign_BYTES,
        crypto_sign_PUBLICKEYBYTES,
        crypto_sign_SECRETKEYBYTES,
        crypto_sign_SEEDBYTES,
        crypto_hash_BYTES,
        gf,
        D,
        L,
        pack25519,
        unpack25519,
        M,
        A,
        S,
        Z,
        pow2523,
        add: add2,
        set25519,
        modL,
        scalarmult,
        scalarbase
      };
      function checkLengths(k, n) {
        if (k.length !== crypto_secretbox_KEYBYTES) throw new Error("bad key size");
        if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error("bad nonce size");
      }
      function checkBoxLengths(pk, sk) {
        if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error("bad public key size");
        if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error("bad secret key size");
      }
      function checkArrayTypes() {
        for (var i = 0; i < arguments.length; i++) {
          if (!(arguments[i] instanceof Uint8Array))
            throw new TypeError("unexpected type, use Uint8Array");
        }
      }
      function cleanup(arr) {
        for (var i = 0; i < arr.length; i++) arr[i] = 0;
      }
      nacl2.randomBytes = function(n) {
        var b = new Uint8Array(n);
        randombytes(b, n);
        return b;
      };
      nacl2.secretbox = function(msg, nonce, key) {
        checkArrayTypes(msg, nonce, key);
        checkLengths(key, nonce);
        var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
        var c = new Uint8Array(m.length);
        for (var i = 0; i < msg.length; i++) m[i + crypto_secretbox_ZEROBYTES] = msg[i];
        crypto_secretbox(c, m, m.length, nonce, key);
        return c.subarray(crypto_secretbox_BOXZEROBYTES);
      };
      nacl2.secretbox.open = function(box, nonce, key) {
        checkArrayTypes(box, nonce, key);
        checkLengths(key, nonce);
        var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
        var m = new Uint8Array(c.length);
        for (var i = 0; i < box.length; i++) c[i + crypto_secretbox_BOXZEROBYTES] = box[i];
        if (c.length < 32) return null;
        if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
        return m.subarray(crypto_secretbox_ZEROBYTES);
      };
      nacl2.secretbox.keyLength = crypto_secretbox_KEYBYTES;
      nacl2.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
      nacl2.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;
      nacl2.scalarMult = function(n, p) {
        checkArrayTypes(n, p);
        if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
        if (p.length !== crypto_scalarmult_BYTES) throw new Error("bad p size");
        var q = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult(q, n, p);
        return q;
      };
      nacl2.scalarMult.base = function(n) {
        checkArrayTypes(n);
        if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
        var q = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult_base(q, n);
        return q;
      };
      nacl2.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
      nacl2.scalarMult.groupElementLength = crypto_scalarmult_BYTES;
      nacl2.box = function(msg, nonce, publicKey, secretKey) {
        var k = nacl2.box.before(publicKey, secretKey);
        return nacl2.secretbox(msg, nonce, k);
      };
      nacl2.box.before = function(publicKey, secretKey) {
        checkArrayTypes(publicKey, secretKey);
        checkBoxLengths(publicKey, secretKey);
        var k = new Uint8Array(crypto_box_BEFORENMBYTES);
        crypto_box_beforenm(k, publicKey, secretKey);
        return k;
      };
      nacl2.box.after = nacl2.secretbox;
      nacl2.box.open = function(msg, nonce, publicKey, secretKey) {
        var k = nacl2.box.before(publicKey, secretKey);
        return nacl2.secretbox.open(msg, nonce, k);
      };
      nacl2.box.open.after = nacl2.secretbox.open;
      nacl2.box.keyPair = function() {
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
        crypto_box_keypair(pk, sk);
        return { publicKey: pk, secretKey: sk };
      };
      nacl2.box.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_box_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        crypto_scalarmult_base(pk, secretKey);
        return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
      };
      nacl2.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
      nacl2.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
      nacl2.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
      nacl2.box.nonceLength = crypto_box_NONCEBYTES;
      nacl2.box.overheadLength = nacl2.secretbox.overheadLength;
      nacl2.sign = function(msg, secretKey) {
        checkArrayTypes(msg, secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
        crypto_sign(signedMsg, msg, msg.length, secretKey);
        return signedMsg;
      };
      nacl2.sign.open = function(signedMsg, publicKey) {
        checkArrayTypes(signedMsg, publicKey);
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
          throw new Error("bad public key size");
        var tmp = new Uint8Array(signedMsg.length);
        var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
        if (mlen < 0) return null;
        var m = new Uint8Array(mlen);
        for (var i = 0; i < m.length; i++) m[i] = tmp[i];
        return m;
      };
      nacl2.sign.detached = function(msg, secretKey) {
        var signedMsg = nacl2.sign(msg, secretKey);
        var sig = new Uint8Array(crypto_sign_BYTES);
        for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
        return sig;
      };
      nacl2.sign.detached.verify = function(msg, sig, publicKey) {
        checkArrayTypes(msg, sig, publicKey);
        if (sig.length !== crypto_sign_BYTES)
          throw new Error("bad signature size");
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
          throw new Error("bad public key size");
        var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
        var m = new Uint8Array(crypto_sign_BYTES + msg.length);
        var i;
        for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
        for (i = 0; i < msg.length; i++) sm[i + crypto_sign_BYTES] = msg[i];
        return crypto_sign_open(m, sm, sm.length, publicKey) >= 0;
      };
      nacl2.sign.keyPair = function() {
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        crypto_sign_keypair(pk, sk);
        return { publicKey: pk, secretKey: sk };
      };
      nacl2.sign.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32 + i];
        return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
      };
      nacl2.sign.keyPair.fromSeed = function(seed) {
        checkArrayTypes(seed);
        if (seed.length !== crypto_sign_SEEDBYTES)
          throw new Error("bad seed size");
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        for (var i = 0; i < 32; i++) sk[i] = seed[i];
        crypto_sign_keypair(pk, sk, true);
        return { publicKey: pk, secretKey: sk };
      };
      nacl2.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
      nacl2.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
      nacl2.sign.seedLength = crypto_sign_SEEDBYTES;
      nacl2.sign.signatureLength = crypto_sign_BYTES;
      nacl2.hash = function(msg) {
        checkArrayTypes(msg);
        var h = new Uint8Array(crypto_hash_BYTES);
        crypto_hash(h, msg, msg.length);
        return h;
      };
      nacl2.hash.hashLength = crypto_hash_BYTES;
      nacl2.verify = function(x, y) {
        checkArrayTypes(x, y);
        if (x.length === 0 || y.length === 0) return false;
        if (x.length !== y.length) return false;
        return vn(x, 0, y, 0, x.length) === 0 ? true : false;
      };
      nacl2.setPRNG = function(fn) {
        randombytes = fn;
      };
      (function() {
        var crypto = typeof self !== "undefined" ? self.crypto || self.msCrypto : null;
        if (crypto && crypto.getRandomValues) {
          var QUOTA = 65536;
          nacl2.setPRNG(function(x, n) {
            var i, v = new Uint8Array(n);
            for (i = 0; i < n; i += QUOTA) {
              crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
            }
            for (i = 0; i < n; i++) x[i] = v[i];
            cleanup(v);
          });
        } else if (typeof require !== "undefined") {
          crypto = require_crypto();
          if (crypto && crypto.randomBytes) {
            nacl2.setPRNG(function(x, n) {
              var i, v = crypto.randomBytes(n);
              for (i = 0; i < n; i++) x[i] = v[i];
              cleanup(v);
            });
          }
        }
      })();
    })(typeof module2 !== "undefined" && module2.exports ? module2.exports : self.nacl = self.nacl || {});
  }
});

// node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function anumber(n, title = "") {
  if (typeof n !== "number") {
    const prefix = title && `"${title}" `;
    throw new TypeError(`${prefix}expected number, got ${typeof n}`);
  }
  if (!Number.isSafeInteger(n) || n < 0) {
    const prefix = title && `"${title}" `;
    throw new RangeError(`${prefix}expected integer >= 0, got ${n}`);
  }
}
function abytes(value, length, title = "") {
  const bytes = isBytes(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    const message = prefix + "expected Uint8Array" + ofLen + ", got " + got;
    if (!bytes)
      throw new TypeError(message);
    throw new RangeError(message);
  }
  return value;
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new RangeError('"digestInto() output" expected to be of length >=' + min);
  }
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.canXOF = tmp.canXOF;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
var isLE, swap8IfBE, swap32IfBE;
var init_utils = __esm({
  "node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes/utils.js"() {
    isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    swap8IfBE = isLE ? (n) => n : (n) => byteSwap(n) >>> 0;
    swap32IfBE = isLE ? (u) => u : byteSwap32;
  }
});

// node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes/_blake.js
var BSIGMA;
var init_blake = __esm({
  "node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes/_blake.js"() {
    BSIGMA = /* @__PURE__ */ Uint8Array.from([
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      14,
      10,
      4,
      8,
      9,
      15,
      13,
      6,
      1,
      12,
      0,
      2,
      11,
      7,
      5,
      3,
      11,
      8,
      12,
      0,
      5,
      2,
      15,
      13,
      10,
      14,
      3,
      6,
      7,
      1,
      9,
      4,
      7,
      9,
      3,
      1,
      13,
      12,
      11,
      14,
      2,
      6,
      5,
      10,
      4,
      0,
      15,
      8,
      9,
      0,
      5,
      7,
      2,
      4,
      10,
      15,
      14,
      1,
      11,
      12,
      6,
      8,
      3,
      13,
      2,
      12,
      6,
      10,
      0,
      11,
      8,
      3,
      4,
      13,
      7,
      5,
      15,
      14,
      1,
      9,
      12,
      5,
      1,
      15,
      14,
      13,
      4,
      10,
      0,
      7,
      6,
      3,
      9,
      2,
      8,
      11,
      13,
      11,
      7,
      14,
      12,
      1,
      3,
      9,
      5,
      0,
      15,
      4,
      8,
      6,
      2,
      10,
      6,
      15,
      14,
      9,
      11,
      3,
      0,
      8,
      12,
      2,
      13,
      7,
      1,
      4,
      10,
      5,
      10,
      2,
      8,
      4,
      7,
      6,
      1,
      5,
      15,
      11,
      9,
      14,
      3,
      12,
      13,
      0,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      14,
      10,
      4,
      8,
      9,
      15,
      13,
      6,
      1,
      12,
      0,
      2,
      11,
      7,
      5,
      3,
      // Blake1, unused in others
      11,
      8,
      12,
      0,
      5,
      2,
      15,
      13,
      10,
      14,
      3,
      6,
      7,
      1,
      9,
      4,
      7,
      9,
      3,
      1,
      13,
      12,
      11,
      14,
      2,
      6,
      5,
      10,
      4,
      0,
      15,
      8,
      9,
      0,
      5,
      7,
      2,
      4,
      10,
      15,
      14,
      1,
      11,
      12,
      6,
      8,
      3,
      13,
      2,
      12,
      6,
      10,
      0,
      11,
      8,
      3,
      4,
      13,
      7,
      5,
      15,
      14,
      1,
      9
    ]);
  }
});

// node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes/_u64.js
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var U32_MASK64, _32n, rotrSH, rotrSL, rotrBH, rotrBL, rotr32H, rotr32L, add3L, add3H;
var init_u64 = __esm({
  "node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes/_u64.js"() {
    U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    _32n = /* @__PURE__ */ BigInt(32);
    rotrSH = (h, l, s) => h >>> s | l << 32 - s;
    rotrSL = (h, l, s) => h << 32 - s | l >>> s;
    rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
    rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
    rotr32H = (_h, l) => l;
    rotr32L = (h, _l) => h;
    add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
    add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
  }
});

// node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes/blake2.js
function G1b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function G2b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function checkBlake2Opts(outputLen, opts = {}, keyLen, saltLen, persLen) {
  anumber(keyLen);
  if (outputLen <= 0 || outputLen > keyLen)
    throw new Error("outputLen bigger than keyLen");
  const { key, salt, personalization } = opts;
  if (key !== void 0 && (key.length < 1 || key.length > keyLen))
    throw new Error('"key" expected to be undefined or of length=1..' + keyLen);
  if (salt !== void 0)
    abytes(salt, saltLen, "salt");
  if (personalization !== void 0)
    abytes(personalization, persLen, "personalization");
}
var B2B_IV, BBUF, _BLAKE2, _BLAKE2b, blake2b;
var init_blake2 = __esm({
  "node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes/blake2.js"() {
    init_blake();
    init_u64();
    init_utils();
    B2B_IV = /* @__PURE__ */ Uint32Array.from([
      4089235720,
      1779033703,
      2227873595,
      3144134277,
      4271175723,
      1013904242,
      1595750129,
      2773480762,
      2917565137,
      1359893119,
      725511199,
      2600822924,
      4215389547,
      528734635,
      327033209,
      1541459225
    ]);
    BBUF = /* @__PURE__ */ new Uint32Array(32);
    _BLAKE2 = class {
      constructor(blockLen, outputLen) {
        __publicField(this, "buffer");
        __publicField(this, "buffer32");
        __publicField(this, "finished", false);
        __publicField(this, "destroyed", false);
        __publicField(this, "length", 0);
        __publicField(this, "pos", 0);
        __publicField(this, "blockLen");
        __publicField(this, "outputLen");
        __publicField(this, "canXOF", false);
        anumber(blockLen);
        anumber(outputLen);
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.buffer = new Uint8Array(blockLen);
        this.buffer32 = u32(this.buffer);
      }
      update(data) {
        aexists(this);
        abytes(data);
        const { blockLen, buffer, buffer32 } = this;
        const len = data.length;
        const offset = data.byteOffset;
        const buf = data.buffer;
        for (let pos = 0; pos < len; ) {
          if (this.pos === blockLen) {
            swap32IfBE(buffer32);
            this.compress(buffer32, 0, false);
            swap32IfBE(buffer32);
            this.pos = 0;
          }
          const take = Math.min(blockLen - this.pos, len - pos);
          const dataOffset = offset + pos;
          if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
            const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
            swap32IfBE(data32);
            for (let pos32 = 0; pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
              this.length += blockLen;
              this.compress(data32, pos32, false);
            }
            swap32IfBE(data32);
            continue;
          }
          buffer.set(data.subarray(pos, pos + take), this.pos);
          this.pos += take;
          this.length += take;
          pos += take;
        }
        return this;
      }
      digestInto(out) {
        aexists(this);
        aoutput(out, this);
        const { pos, buffer32 } = this;
        this.finished = true;
        clean(this.buffer.subarray(pos));
        swap32IfBE(buffer32);
        this.compress(buffer32, 0, true);
        swap32IfBE(buffer32);
        if (out.byteOffset & 3)
          throw new RangeError('"digestInto() output" expected 4-byte aligned byteOffset, got ' + out.byteOffset);
        const state = this.get();
        const out32 = u32(out);
        const full = Math.floor(this.outputLen / 4);
        for (let i = 0; i < full; i++)
          out32[i] = swap8IfBE(state[i]);
        const tail = this.outputLen % 4;
        if (!tail)
          return;
        const off = full * 4;
        const word = state[full];
        for (let i = 0; i < tail; i++)
          out[off + i] = word >>> 8 * i;
      }
      digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
      }
      _cloneInto(to) {
        const { buffer, length, finished, destroyed, outputLen, pos } = this;
        to ||= new this.constructor({ dkLen: outputLen });
        to.set(...this.get());
        to.buffer.set(buffer);
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        to.outputLen = outputLen;
        return to;
      }
      clone() {
        return this._cloneInto();
      }
    };
    _BLAKE2b = class extends _BLAKE2 {
      constructor(opts = {}) {
        const olen = opts.dkLen === void 0 ? 64 : opts.dkLen;
        super(128, olen);
        // Same IV words as SHA-512 / BLAKE2b, encoded as LE u32 low/high halves.
        __publicField(this, "v0l", B2B_IV[0] | 0);
        __publicField(this, "v0h", B2B_IV[1] | 0);
        __publicField(this, "v1l", B2B_IV[2] | 0);
        __publicField(this, "v1h", B2B_IV[3] | 0);
        __publicField(this, "v2l", B2B_IV[4] | 0);
        __publicField(this, "v2h", B2B_IV[5] | 0);
        __publicField(this, "v3l", B2B_IV[6] | 0);
        __publicField(this, "v3h", B2B_IV[7] | 0);
        __publicField(this, "v4l", B2B_IV[8] | 0);
        __publicField(this, "v4h", B2B_IV[9] | 0);
        __publicField(this, "v5l", B2B_IV[10] | 0);
        __publicField(this, "v5h", B2B_IV[11] | 0);
        __publicField(this, "v6l", B2B_IV[12] | 0);
        __publicField(this, "v6h", B2B_IV[13] | 0);
        __publicField(this, "v7l", B2B_IV[14] | 0);
        __publicField(this, "v7h", B2B_IV[15] | 0);
        checkBlake2Opts(olen, opts, 64, 16, 16);
        let { key, personalization, salt } = opts;
        let keyLength = 0;
        if (key !== void 0) {
          abytes(key, void 0, "key");
          keyLength = key.length;
        }
        this.v0l ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
        if (salt !== void 0) {
          abytes(salt, void 0, "salt");
          const slt = u32(salt);
          this.v4l ^= swap8IfBE(slt[0]);
          this.v4h ^= swap8IfBE(slt[1]);
          this.v5l ^= swap8IfBE(slt[2]);
          this.v5h ^= swap8IfBE(slt[3]);
        }
        if (personalization !== void 0) {
          abytes(personalization, void 0, "personalization");
          const pers = u32(personalization);
          this.v6l ^= swap8IfBE(pers[0]);
          this.v6h ^= swap8IfBE(pers[1]);
          this.v7l ^= swap8IfBE(pers[2]);
          this.v7h ^= swap8IfBE(pers[3]);
        }
        if (key !== void 0) {
          const tmp = new Uint8Array(this.blockLen);
          tmp.set(key);
          this.update(tmp);
        }
      }
      // prettier-ignore
      get() {
        let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
        return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
      }
      // prettier-ignore
      set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
        this.v0l = v0l | 0;
        this.v0h = v0h | 0;
        this.v1l = v1l | 0;
        this.v1h = v1h | 0;
        this.v2l = v2l | 0;
        this.v2h = v2h | 0;
        this.v3l = v3l | 0;
        this.v3h = v3h | 0;
        this.v4l = v4l | 0;
        this.v4h = v4h | 0;
        this.v5l = v5l | 0;
        this.v5h = v5h | 0;
        this.v6l = v6l | 0;
        this.v6h = v6h | 0;
        this.v7l = v7l | 0;
        this.v7h = v7h | 0;
      }
      compress(msg, offset, isLast) {
        this.get().forEach((v, i) => BBUF[i] = v);
        BBUF.set(B2B_IV, 16);
        let { h, l } = fromBig(BigInt(this.length));
        BBUF[24] = B2B_IV[8] ^ l;
        BBUF[25] = B2B_IV[9] ^ h;
        if (isLast) {
          BBUF[28] = ~BBUF[28];
          BBUF[29] = ~BBUF[29];
        }
        let j = 0;
        const s = BSIGMA;
        for (let i = 0; i < 12; i++) {
          G1b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
          G2b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
          G1b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
          G2b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
          G1b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
          G2b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
          G1b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
          G2b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
          G1b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
          G2b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
          G1b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
          G2b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
          G1b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
          G2b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
          G1b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
          G2b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
        }
        this.v0l ^= BBUF[0] ^ BBUF[16];
        this.v0h ^= BBUF[1] ^ BBUF[17];
        this.v1l ^= BBUF[2] ^ BBUF[18];
        this.v1h ^= BBUF[3] ^ BBUF[19];
        this.v2l ^= BBUF[4] ^ BBUF[20];
        this.v2h ^= BBUF[5] ^ BBUF[21];
        this.v3l ^= BBUF[6] ^ BBUF[22];
        this.v3h ^= BBUF[7] ^ BBUF[23];
        this.v4l ^= BBUF[8] ^ BBUF[24];
        this.v4h ^= BBUF[9] ^ BBUF[25];
        this.v5l ^= BBUF[10] ^ BBUF[26];
        this.v5h ^= BBUF[11] ^ BBUF[27];
        this.v6l ^= BBUF[12] ^ BBUF[28];
        this.v6h ^= BBUF[13] ^ BBUF[29];
        this.v7l ^= BBUF[14] ^ BBUF[30];
        this.v7h ^= BBUF[15] ^ BBUF[31];
        clean(BBUF);
      }
      destroy() {
        this.destroyed = true;
        clean(this.buffer32);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      }
    };
    blake2b = /* @__PURE__ */ createHasher((opts) => new _BLAKE2b(opts));
  }
});

// src/utils/secret.ts
var secret_exports = {};
__export(secret_exports, {
  encryptGitHubSecret: () => encryptGitHubSecret
});
async function encryptGitHubSecret(value, publicKey) {
  if (!value) {
    throw new Error("A GitHub Actions secret cannot be empty.");
  }
  const recipient = base64ToBytes(publicKey);
  const ephemeral = import_tweetnacl.default.box.keyPair();
  const material = new Uint8Array(64);
  material.set(ephemeral.publicKey);
  material.set(recipient, 32);
  const nonce = blake2b(material, { dkLen: 24 });
  const message = new TextEncoder().encode(value);
  const ciphertext = import_tweetnacl.default.box(message, nonce, recipient, ephemeral.secretKey);
  const sealed = new Uint8Array(ephemeral.publicKey.length + ciphertext.length);
  sealed.set(ephemeral.publicKey);
  sealed.set(ciphertext, ephemeral.publicKey.length);
  return bytesToBase64(sealed);
}
function base64ToBytes(input) {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
function bytesToBase64(content) {
  const bytes = content instanceof Uint8Array ? content : new Uint8Array(content);
  let binary = "";
  const chunkSize = 32768;
  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}
var import_tweetnacl;
var init_secret = __esm({
  "src/utils/secret.ts"() {
    "use strict";
    import_tweetnacl = __toESM(require_nacl_fast());
    init_blake2();
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => VitePressButterflyPublisher
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  pat: "",
  repoName: "",
  blogRepoName: "",
  themeRepo: "57Darling02/VitePress_butterfly",
  configurePages: true,
  publishedPaths: []
};
var PublisherSettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin, getSettings, saveSettings, actions) {
    super(app, plugin);
    this.getSettings = getSettings;
    this.saveSettings = saveSettings;
    this.actions = actions;
    this.actionButtons = [];
    this.isActionRunning = false;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    this.actionButtons = [];
    containerEl.createEl("h2", { text: "VitePress Butterfly \u53D1\u5E03" });
    containerEl.createEl("p", {
      text: "\u672C\u63D2\u4EF6\u8D1F\u8D23\u521D\u59CB\u5316\u4E0E\u90E8\u7F72\uFF1A\u521B\u5EFA\u4ED3\u5E93\u3001\u63A8\u9001\u672C\u5730\u5185\u5BB9\u3001\u914D\u7F6E secrets\u3001\u90E8\u7F72\u4E3B\u9898\u3002\u65E5\u5E38\u7684\u53D1\u5E03\u4E0E\u62C9\u53D6\u8BF7\u4F7F\u7528\u5185\u7F6E\u7684 obsidian-git \u63D2\u4EF6\uFF08\u684C\u9762\u7AEF\u4E0E\u79FB\u52A8\u7AEF\u5747\u53EF\uFF09\u3002"
    });
    const settings = this.getSettings();
    const patSetting = new import_obsidian.Setting(containerEl).setName("GitHub PAT").setDesc("\u9700\u8981 repo + workflow \u6743\u9650\uFF0C\u4EC5\u4FDD\u5B58\u5728\u672C\u673A\u3002");
    const patStatus = this.createStatus(patSetting.descEl);
    patSetting.addText((text) => {
      text.inputEl.type = "password";
      text.inputEl.autocomplete = "off";
      text.inputEl.spellcheck = false;
      this.bindText(text, "pat", settings.pat, (value) => value.trim());
    }).addExtraButton((button) => {
      this.addCheckButton(
        button,
        patStatus,
        "\u68C0\u6D4B\u8FDE\u901A\u6027",
        "\u6B63\u5728\u8FDE\u63A5 GitHub\u2026",
        () => this.actions.onCheckPat(),
        (login) => this.setStatus(patStatus, "ok", `\u2713 \u5DF2\u8FDE\u63A5 @${login}`),
        "\u8FDE\u63A5\u5931\u8D25"
      );
    });
    const contentSetting = new import_obsidian.Setting(containerEl).setName("\u535A\u5BA2\u6587\u7AE0\u4ED3\u5E93").setDesc("\u5F53\u524D Vault \u5BF9\u5E94\u7684\u6587\u7AE0\u4ED3\u5E93\uFF1B\u7559\u7A7A\u81EA\u52A8\u8BC6\u522B\uFF08Git \u514B\u9686\u76EE\u5F55\u6216 Vault \u540D\u79F0\uFF09\u3002");
    const contentStatus = this.createStatus(contentSetting.descEl);
    contentSetting.addText((text) => {
      text.setPlaceholder("\u81EA\u52A8\u8BC6\u522B");
      this.bindText(text, "repoName", settings.repoName, (value) => value.trim());
    }).addExtraButton((button) => {
      this.addCheckButton(
        button,
        contentStatus,
        "\u68C0\u6D4B\u4ED3\u5E93",
        "\u6B63\u5728\u68C0\u6D4B\u6587\u7AE0\u4ED3\u5E93\u2026",
        () => this.actions.onCheckContentRepo(),
        (result) => this.setStatus(
          contentStatus,
          result.ready ? "ok" : "error",
          result.ready ? `\u2713 \u5DF2\u5C31\u7EEA\uFF1A\u672C\u5730\u5185\u5BB9\u5C06\u63A8\u9001\u5230 ${result.repository?.owner}/${result.repository?.name}` : "\u2717 \u672A\u89E3\u6790\u51FA\u4ED3\u5E93\u540D\uFF1A\u8BF7\u5728\u4E0A\u65B9\u586B\u5199\u6587\u7AE0\u4ED3\u5E93\u540D"
        ),
        "\u6587\u7AE0\u4ED3\u5E93\u68C0\u6D4B\u5931\u8D25"
      );
    });
    const blogSetting = new import_obsidian.Setting(containerEl).setName("\u535A\u5BA2\u6837\u5F0F\u4ED3\u5E93").setDesc("Setup \u521B\u5EFA\u7684\u516C\u5F00\u535A\u5BA2\u4ED3\u5E93\uFF1B\u7559\u7A7A\u9ED8\u8BA4 \u4F60\u7684\u7528\u6237\u540D.github.io\u3002");
    const blogStatus = this.createStatus(blogSetting.descEl);
    blogSetting.addText((text) => {
      text.setPlaceholder("yourname.github.io");
      this.bindText(text, "blogRepoName", settings.blogRepoName, (value) => value.trim());
    }).addExtraButton((button) => {
      this.addCheckButton(
        button,
        blogStatus,
        "\u68C0\u6D4B\u4ED3\u5E93",
        "\u6B63\u5728\u68C0\u6D4B\u6837\u5F0F\u4ED3\u5E93\u2026",
        () => this.actions.onCheckBlogRepo(),
        (result) => this.setStatus(
          blogStatus,
          "ok",
          `\u2713 \u5DF2\u5C31\u7EEA\uFF1A${result.repository?.name}\uFF08\u4E0D\u5B58\u5728\u5C06\u81EA\u52A8\u521B\u5EFA\uFF0C\u5DF2\u5B58\u5728\u5C06\u8986\u76D6\u4E3A\u6700\u65B0\u4E3B\u9898\uFF09`
        ),
        "\u6837\u5F0F\u4ED3\u5E93\u68C0\u6D4B\u5931\u8D25"
      );
    });
    const readySetting = new import_obsidian.Setting(containerEl).setName("\u5C31\u7EEA\u68C0\u6D4B").setDesc("\u4E24\u4E2A\u4ED3\u5E93\u5747\u89E3\u6790\u51FA\u540D\u5B57\u540E\uFF0C\u5373\u53EF\u6267\u884C\u300C\u90E8\u7F72\u4E3B\u9898\u300D\u3002");
    const readyStatus = this.createStatus(readySetting.descEl);
    readySetting.addExtraButton((button) => {
      this.addCheckButton(
        button,
        readyStatus,
        "\u68C0\u6D4B\u5C31\u7EEA\u72B6\u6001",
        "\u6B63\u5728\u68C0\u67E5\u90E8\u7F72\u914D\u7F6E\u2026",
        () => this.actions.onCheckReady(),
        () => this.setStatus(
          readyStatus,
          "ok",
          "\u2713 \u53CC\u4ED3\u5E93\u5DF2\u5C31\u7EEA\uFF0C\u70B9\u51FB\u300C\u90E8\u7F72\u4E3B\u9898\u300D\u5B8C\u6210\u521D\u59CB\u5316\u4E0E\u9996\u6B21\u90E8\u7F72"
        ),
        "\u5C31\u7EEA\u68C0\u6D4B\u5931\u8D25"
      );
    });
    new import_obsidian.Setting(containerEl).setName("\u4E3B\u9898\u4ED3\u5E93").setDesc("\u535A\u5BA2\u4ED3\u5E93\u6BCF\u6B21\u6784\u5EFA\u65F6\u5F3A\u5236\u540C\u6B65\u7684\u4E3B\u9898\u6E90\u4ED3\u5E93\uFF0C\u4E00\u822C\u65E0\u9700\u4FEE\u6539\u3002").addText((text) => {
      text.setPlaceholder("57Darling02/VitePress_butterfly");
      this.bindText(text, "themeRepo", settings.themeRepo, (value) => value.trim());
    });
    new import_obsidian.Setting(containerEl).setName("\u542F\u7528 GitHub Pages").setDesc("Setup \u65F6\u5C1D\u8BD5\u628A\u535A\u5BA2\u4ED3\u5E93\u7684 Pages \u914D\u7F6E\u4E3A GitHub Actions \u6784\u5EFA\u3002").addToggle((toggle) => {
      toggle.setValue(settings.configurePages);
      toggle.onChange((value) => {
        void this.saveSettings({ configurePages: value }).catch((error) => {
          new import_obsidian.Notice(this.errorMessage(error, "\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25"));
        });
      });
    });
    containerEl.createEl("h3", { text: "\u64CD\u4F5C" });
    this.addAction(containerEl, "\u90E8\u7F72\u4E3B\u9898", "\u5C06\u672C\u5730\u5185\u5BB9\u63A8\u9001\u5230\u6587\u7AE0\u4ED3\u5E93\uFF08\u8986\u76D6\u4E91\u7AEF\uFF09\uFF0C\u914D\u7F6E\u535A\u5BA2\u4ED3\u5E93 secrets \u4E0E Pages\uFF0C\u5E76\u89E6\u53D1\u9996\u6B21\u6784\u5EFA\u3002", "\u90E8\u7F72\u4E2D...", this.actions.onSetup);
    this.addAction(containerEl, "\u89E6\u53D1\u90E8\u7F72", "\u76F4\u63A5\u901A\u77E5\u535A\u5BA2\u4ED3\u5E93\u91CD\u65B0\u6784\u5EFA\u90E8\u7F72\uFF08\u53D1\u5E03\u8BF7\u7528 obsidian-git \u7684 Push\uFF09\u3002", "\u89E6\u53D1\u4E2D...", this.actions.onTrigger);
  }
  createStatus(containerEl) {
    const span = containerEl.createSpan({ cls: "vitepress-butterfly-check-status" });
    span.textContent = "\u672A\u68C0\u6D4B";
    span.setAttribute("aria-live", "polite");
    return span;
  }
  setStatus(el, kind, message) {
    el.textContent = message;
    el.removeClass("vpb-loading", "vpb-ok", "vpb-warn", "vpb-error");
    el.addClass(
      kind === "loading" ? "vpb-loading" : kind === "ok" ? "vpb-ok" : kind === "warn" ? "vpb-warn" : "vpb-error"
    );
  }
  addCheckButton(button, statusEl, tooltip, pendingMessage, run, onSuccess, failureLabel) {
    button.setIcon("search").setTooltip(tooltip);
    button.onClick(() => {
      void this.runCheck(
        button,
        statusEl,
        tooltip,
        pendingMessage,
        run,
        onSuccess,
        failureLabel
      );
    });
  }
  async runCheck(button, statusEl, tooltip, pendingMessage, run, onSuccess, failureLabel) {
    if (button.extraSettingsEl.classList.contains("vpb-check-running")) {
      return;
    }
    button.setDisabled(true).setIcon("loader-2").setTooltip(pendingMessage);
    button.extraSettingsEl.classList.add("vpb-check-running");
    button.extraSettingsEl.setAttribute("aria-busy", "true");
    this.setStatus(statusEl, "loading", pendingMessage);
    await yieldToUi();
    try {
      onSuccess(await run());
    } catch (error) {
      const detail = this.errorMessage(error, failureLabel);
      this.setStatus(
        statusEl,
        "error",
        detail === failureLabel ? `\u2717 ${failureLabel}` : `\u2717 ${failureLabel}\uFF1A${detail}`
      );
    } finally {
      button.setDisabled(false).setIcon("search").setTooltip(tooltip);
      button.extraSettingsEl.classList.remove("vpb-check-running");
      button.extraSettingsEl.removeAttribute("aria-busy");
    }
  }
  bindText(text, key, value, normalize) {
    text.setValue(value);
    text.onChange((nextValue) => {
      void this.saveSettings({ [key]: normalize(nextValue) }).catch((error) => {
        new import_obsidian.Notice(this.errorMessage(error, "\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25"));
      });
    });
  }
  addAction(containerEl, name, description, pendingLabel, action, isCta = false) {
    new import_obsidian.Setting(containerEl).setName(name).setDesc(description).addButton((button) => {
      button.setButtonText(name);
      if (isCta) {
        button.setCta();
      }
      this.actionButtons.push(button);
      button.onClick(() => this.runAction(button, name, pendingLabel, action));
    });
  }
  async runAction(button, label, pendingLabel, action) {
    if (this.isActionRunning) {
      return;
    }
    this.isActionRunning = true;
    this.actionButtons.forEach((item) => item.setDisabled(true));
    button.setButtonText(pendingLabel);
    await yieldToUi();
    try {
      await action();
    } catch (error) {
      new import_obsidian.Notice(this.errorMessage(error, `${label}\u5931\u8D25`));
    } finally {
      this.isActionRunning = false;
      this.actionButtons.forEach((item) => item.setDisabled(false));
      button.setButtonText(label);
    }
  }
  errorMessage(error, fallback) {
    return error instanceof Error && error.message ? error.message : fallback;
  }
};
function yieldToUi() {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    window.requestAnimationFrame(finish);
    window.setTimeout(finish, 50);
  });
}

// src/services/blog.ts
var import_obsidian2 = require("obsidian");

// src/services/github.ts
var API_URL = "https://api.github.com";
var API_VERSION = "2022-11-28";
var REQUEST_TIMEOUT_MS = 15e3;
var WORKFLOW_MATCH_TOLERANCE_MS = 5e3;
var GitHubApiError = class extends Error {
  constructor(message, status, url) {
    super(message);
    this.status = status;
    this.url = url;
    this.name = "GitHubApiError";
  }
};
var GitHubRequestTimeoutError = class extends Error {
  constructor(timeoutMs, url) {
    super(`\u8FDE\u63A5 GitHub \u8D85\u65F6\uFF08${Math.round(timeoutMs / 1e3)} \u79D2\uFF09\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u4EE3\u7406\u540E\u91CD\u8BD5\u3002`);
    this.timeoutMs = timeoutMs;
    this.url = url;
    this.name = "GitHubRequestTimeoutError";
  }
};
var WorkflowRunTimeoutError = class extends Error {
  constructor(workflow, timeoutMs, lastRun) {
    super(`\u7B49\u5F85\u5DE5\u4F5C\u6D41 ${workflow} \u8D85\u65F6\uFF08${Math.round(timeoutMs / 1e3)} \u79D2\uFF09\u3002`);
    this.workflow = workflow;
    this.timeoutMs = timeoutMs;
    this.lastRun = lastRun;
    this.name = "WorkflowRunTimeoutError";
  }
};
var GitHubClient = class {
  constructor(token) {
    this.token = token.trim();
    if (!this.token) {
      throw new Error("A GitHub personal access token is required.");
    }
  }
  getAuthenticatedUser() {
    this.authenticatedUser ??= this.loadAuthenticatedUser();
    return this.authenticatedUser;
  }
  async loadAuthenticatedUser() {
    const user = await this.request("/user");
    return {
      login: user.login,
      avatarUrl: user.avatar_url,
      htmlUrl: user.html_url
    };
  }
  async getRepository(repository) {
    const result = await this.request(this.repositoryPath(repository));
    return this.toRepository(result);
  }
  /** Lists the authenticated user's repositories, most recently updated first. */
  async listUserRepos() {
    const result = await this.request("/user/repos", {
      query: { per_page: 100, sort: "updated" }
    });
    return result.map((repo) => ({
      owner: repo.owner.login,
      name: repo.name
    }));
  }
  /**
   * Creates an empty repository (with a README so a default branch exists)
   * under the authenticated user. No template and no fork relationship.
   */
  async createRepository(options) {
    const result = await this.request("/user/repos", {
      method: "POST",
      body: {
        name: options.name,
        private: options.private,
        auto_init: true
      }
    });
    return this.toRepository(result);
  }
  /** Reads a file via the Contents API; returns `null` when it does not exist. */
  async getFileContent(repository, path) {
    try {
      return await this.request(
        `${this.repositoryPath(repository)}/contents/${encodeURIComponent(path)}`
      );
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }
  /** Creates or overwrites a file on the repository's default branch. */
  async putFile(repository, path, content, message) {
    const existing = await this.getFileContent(repository, path);
    const body = {
      message,
      content: base64Encode(new TextEncoder().encode(content))
    };
    if (existing) {
      body.sha = existing.sha;
    }
    await this.request(
      `${this.repositoryPath(repository)}/contents/${encodeURIComponent(path)}`,
      { method: "PUT", body }
    );
  }
  async createBlob(repository, data) {
    return this.request(
      `${this.repositoryPath(repository)}/git/blobs`,
      {
        method: "POST",
        body: { content: base64Encode(data), encoding: "base64" }
      }
    );
  }
  async createTree(repository, entries) {
    return this.request(
      `${this.repositoryPath(repository)}/git/trees`,
      {
        method: "POST",
        body: { tree: entries }
      }
    );
  }
  async createCommit(repository, options) {
    return this.request(
      `${this.repositoryPath(repository)}/git/commits`,
      {
        method: "POST",
        body: {
          message: options.message,
          tree: options.tree,
          parents: options.parents ?? [],
          author: options.author
        }
      }
    );
  }
  /** Moves (or creates, with force) the branch ref to a commit. */
  async updateRef(repository, branch, sha) {
    await this.request(
      `${this.repositoryPath(repository)}/git/refs/heads/${encodeURIComponent(branch)}`,
      { method: "PATCH", body: { sha, force: true } }
    );
  }
  /**
   * Overwrites the default branch with the given files: builds blobs/trees,
   * creates a root commit and force-moves the branch ref. This is the API
   * equivalent of a force push and works identically on desktop and mobile.
   */
  async pushFiles(repository, branch, files, options) {
    const buildTree = async (dir) => {
      const entries = [];
      const children = /* @__PURE__ */ new Map();
      for (const [path, data] of files) {
        if (!path.startsWith(dir)) {
          continue;
        }
        const rest = dir ? path.slice(dir.length) : path;
        const slash = rest.indexOf("/");
        if (slash === -1) {
          entries.push({
            path: rest,
            mode: "100644",
            type: "blob",
            sha: (await this.createBlob(repository, data)).sha
          });
        } else {
          const name = rest.slice(0, slash);
          if (!children.has(name)) {
            children.set(name, dir + name + "/");
          }
        }
      }
      for (const [name, childDir] of children) {
        entries.push({
          path: name,
          mode: "040000",
          type: "tree",
          sha: await buildTree(childDir)
        });
      }
      return (await this.createTree(repository, entries)).sha;
    };
    const treeSha = await buildTree("");
    const commit = await this.createCommit(repository, {
      message: options.message,
      tree: treeSha,
      author: {
        name: options.authorName,
        email: options.authorEmail,
        date: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    await this.updateRef(repository, branch, commit.sha);
  }
  async listSecrets(repository) {
    const result = await this.request(
      `${this.repositoryPath(repository)}/actions/secrets`
    );
    return result.secrets.map((secret) => secret.name);
  }
  async getActionsSecretPublicKey(repository) {
    const result = await this.request(
      `${this.repositoryPath(repository)}/actions/secrets/public-key`
    );
    return {
      keyId: result.key_id,
      key: result.key
    };
  }
  async setActionsSecret(repository, name, value) {
    const key = await this.getActionsSecretPublicKey(repository);
    const { encryptGitHubSecret: encryptGitHubSecret2 } = await Promise.resolve().then(() => (init_secret(), secret_exports));
    const encryptedValue = await encryptGitHubSecret2(value, key.key);
    await this.request(
      `${this.repositoryPath(repository)}/actions/secrets/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        body: {
          encrypted_value: encryptedValue,
          key_id: key.keyId
        }
      }
    );
  }
  async deleteActionsSecret(repository, name) {
    await this.request(
      `${this.repositoryPath(repository)}/actions/secrets/${encodeURIComponent(name)}`,
      { method: "DELETE" }
    );
  }
  /** Enables GitHub Actions on a repository (works for plain repos and forks). */
  async enableActions(repository) {
    await this.request(
      `${this.repositoryPath(repository)}/actions/permissions`,
      {
        method: "PUT",
        body: {
          enabled: true,
          allowed_actions: "all"
        }
      }
    );
  }
  /**
   * Points the repository's GitHub Pages at Actions-built artifacts.
   * Idempotent: creates the Pages site when missing, updates it otherwise.
   */
  async configurePages(repository) {
    const path = `${this.repositoryPath(repository)}/pages`;
    try {
      await this.request(path);
      await this.request(path, {
        method: "PUT",
        body: { build_type: "workflow" }
      });
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        await this.request(path, {
          method: "POST",
          body: { build_type: "workflow" }
        });
        return;
      }
      throw error;
    }
  }
  /** Dispatches a repository_dispatch event (used to trigger rebuilds). */
  async dispatchRepositoryEvent(repository, eventType) {
    await this.request(`${this.repositoryPath(repository)}/dispatches`, {
      method: "POST",
      body: { event_type: eventType }
    });
  }
  async dispatchWorkflow(repository, workflow, ref = "main", inputs = {}) {
    await this.request(
      `${this.repositoryPath(repository)}/actions/workflows/${encodeURIComponent(String(workflow))}/dispatches`,
      {
        method: "POST",
        body: {
          ref,
          inputs: stringifyInputs(inputs)
        }
      }
    );
    return { dispatchedAt: /* @__PURE__ */ new Date() };
  }
  async getWorkflowRun(repository, runId) {
    const result = await this.request(
      `${this.repositoryPath(repository)}/actions/runs/${runId}`
    );
    return toWorkflowRun(result);
  }
  async listWorkflowRuns(repository, workflow, options = {}) {
    const result = await this.request(
      `${this.repositoryPath(repository)}/actions/workflows/${encodeURIComponent(String(workflow))}/runs`,
      {
        query: {
          branch: options.branch,
          event: options.event,
          status: options.status,
          per_page: options.perPage ?? 20
        }
      }
    );
    return result.workflow_runs.map(toWorkflowRun);
  }
  async waitForWorkflowRun(repository, workflow, options = {}) {
    const timeoutMs = options.timeoutMs ?? 3e5;
    const intervalMs = options.intervalMs ?? 2500;
    const startedAfter = options.startedAfter?.getTime() ?? Date.now();
    const deadline = Date.now() + timeoutMs;
    let lastRun;
    while (Date.now() < deadline) {
      throwIfAborted(options.signal);
      const runs = await this.listWorkflowRuns(repository, workflow, {
        branch: options.branch,
        event: options.event ?? "workflow_dispatch",
        status: options.status,
        perPage: options.perPage
      });
      const run = runs.find((candidate) => isNewEnough(candidate, startedAfter));
      if (run) {
        lastRun = run;
        if (run.status === "completed") {
          return run;
        }
      }
      await wait(Math.min(intervalMs, Math.max(0, deadline - Date.now())));
    }
    throw new WorkflowRunTimeoutError(workflow, timeoutMs, lastRun);
  }
  repositoryPath(repository) {
    if (!repository.owner || !repository.name) {
      throw new Error("A GitHub repository requires both an owner and a name.");
    }
    return `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  }
  async request(path, options = {}) {
    const url = this.url(path, options.query);
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": API_VERSION
        },
        body: options.body === void 0 ? void 0 : JSON.stringify(options.body),
        signal: controller.signal
      });
      const text = await response.text();
      if (!response.ok) {
        throw new GitHubApiError(
          apiMessage(text, response.status),
          response.status,
          url
        );
      }
      if (response.status === 204 || text.length === 0) {
        return void 0;
      }
      try {
        return JSON.parse(text);
      } catch {
        throw new GitHubApiError("GitHub \u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u54CD\u5E94\u3002", response.status, url);
      }
    } catch (error) {
      if (error instanceof GitHubApiError) {
        throw error;
      }
      if (timedOut || isAbortError(error)) {
        throw new GitHubRequestTimeoutError(REQUEST_TIMEOUT_MS, url);
      }
      const networkError = new Error("\u65E0\u6CD5\u8FDE\u63A5 GitHub\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u3001\u4EE3\u7406\u6216 DNS \u8BBE\u7F6E\u540E\u91CD\u8BD5\u3002");
      networkError.cause = error;
      throw networkError;
    } finally {
      window.clearTimeout(timeout);
    }
  }
  url(path, query) {
    const url = new URL(path, API_URL);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== void 0) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
  toRepository(result) {
    return {
      id: result.id,
      name: result.name,
      fullName: result.full_name,
      private: result.private,
      defaultBranch: result.default_branch,
      htmlUrl: result.html_url
    };
  }
};
function stringifyInputs(inputs) {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, value]) => [name, String(value)])
  );
}
function toWorkflowRun(result) {
  return {
    id: result.id,
    name: result.name,
    status: result.status,
    conclusion: result.conclusion,
    event: result.event,
    headBranch: result.head_branch,
    htmlUrl: result.html_url,
    createdAt: result.created_at,
    updatedAt: result.updated_at
  };
}
function isNewEnough(run, startedAfter) {
  const createdAt = Date.parse(run.createdAt);
  return Number.isNaN(createdAt) || createdAt >= startedAfter - WORKFLOW_MATCH_TOLERANCE_MS;
}
function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new Error("Workflow polling was cancelled.");
  }
}
function wait(durationMs) {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}
function base64Encode(bytes) {
  let binary = "";
  const chunkSize = 32768;
  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}
function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}
function apiMessage(body, status) {
  if (status === 401) {
    return "PAT \u65E0\u6548\u3001\u5DF2\u8FC7\u671F\u6216\u6743\u9650\u4E0D\u8DB3\u3002";
  }
  if (status === 403) {
    return "GitHub \u62D2\u7EDD\u8BBF\u95EE\uFF0C\u8BF7\u68C0\u67E5 PAT \u6743\u9650\u6216 API \u9650\u989D\u3002";
  }
  if (status === 404) {
    return "GitHub \u8D44\u6E90\u4E0D\u5B58\u5728\u6216\u5F53\u524D PAT \u65E0\u6743\u8BBF\u95EE\u3002";
  }
  if (status === 422) {
    return "\u4ED3\u5E93\u540D\u5DF2\u88AB\u5360\u7528\u6216\u8BF7\u6C42\u65E0\u6CD5\u5904\u7406\uFF0C\u8BF7\u66F4\u6362\u540D\u79F0\u540E\u91CD\u8BD5\u3002";
  }
  try {
    const payload = JSON.parse(body);
    if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") {
      return `GitHub \u8BF7\u6C42\u5931\u8D25\uFF1A${payload.message}`;
    }
  } catch {
  }
  return `GitHub \u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${status}\uFF09\u3002`;
}

// src/services/blog.ts
var DEFAULT_THEME_REPO = "57Darling02/VitePress_butterfly";
var BLOG_DEPLOY_WORKFLOW = `name: Deploy Site

on:
  push:
    branches: [main]
  workflow_dispatch:
  repository_dispatch:
    types: [contents-updated]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: site-deploy
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Sync theme source
        env:
          THEME_REPO: \${{ secrets.THEME_REPO }}
        run: |
          set -euo pipefail
          THEME_REPO="\${THEME_REPO:-57Darling02/VitePress_butterfly}"
          cp .github/workflows/deploy.yml /tmp/vpb-deploy.yml
          git remote add upstream "https://github.com/$THEME_REPO.git"
          git fetch --depth=1 upstream main
          git reset --hard upstream/main
          mkdir -p .github/workflows
          cp /tmp/vpb-deploy.yml .github/workflows/deploy.yml

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build with VitePress
        env:
          WIKI_URL: \${{ secrets.WIKI_URL }}
          PAT: \${{ secrets.PAT }}
        run: pnpm docs:build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

  deploy-pages:
    name: Deploy GitHub Pages
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;
var BlogService = class {
  constructor(deps) {
    this.deps = deps;
  }
  // ------------------------------------------------------------------
  // Step checks: each is independent and only verifies its own concern.
  // ------------------------------------------------------------------
  /** 1. PAT connectivity only. Returns the authenticated login. */
  async checkPat() {
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    return user.login;
  }
  /**
   * 2. Content repository: resolve the target name (manual, local Git
   *    remote, or Vault name). Existence does not matter — deploying will
   *    create it and overwrite it with the local content.
   */
  async checkContentRepo() {
    const client = this.client();
    const { repository } = await this.detectContentRepository(client);
    return { repository, ready: repository !== null };
  }
  /**
   * 3. Blog repository: resolve the name only. Existence and content do not
   *    matter — deploying creates it when missing, and every build overwrites
   *    it with the latest theme.
   */
  async checkBlogRepo() {
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const repository = {
      owner: user.login,
      name: this.resolveBlogRepoName(this.deps.getSettings().blogRepoName, user.login)
    };
    return { repository, ready: true };
  }
  /** 4. Readiness: both repositories must be resolvable before deploying. */
  async checkReady() {
    await this.checkContentRepo();
    await this.checkBlogRepo();
  }
  // ------------------------------------------------------------------
  // Actions.
  // ------------------------------------------------------------------
  /**
   * Deploys the theme:
   *
   * 1. ensure the content repository exists (private, empty) and overwrite
   *    its default branch with the local vault content (API force push);
   * 2. ensure the blog repository exists (public, empty) — an existing one
   *    is reused as-is, its content is irrelevant;
   * 3. enable Actions, write all secrets and configure Pages;
   * 4. install the thin deploy workflow on the blog repository — this push
   *    itself triggers the first build, which force-syncs the theme;
   * 5. turn the local vault into a full Git working copy (obsidian-git).
   *
   * Rerunning is safe: everything is idempotent, and the local content
   * always wins on the content repository.
   */
  async setup() {
    const { pat, blogRepoName, themeRepo, configurePages } = this.requireSettings("\u90E8\u7F72\u4E3B\u9898");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const content = await this.detectContentRepository(client);
    if (!content.repository) {
      throw new Error("\u672A\u89E3\u6790\u51FA\u6587\u7AE0\u4ED3\u5E93\u540D\uFF1A\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199\u6587\u7AE0\u4ED3\u5E93\u540D\uFF0C\u6216\u4ECE Git \u514B\u9686\u6253\u5F00\u672C\u76EE\u5F55\u3002");
    }
    if (!await this.repositoryExists(client, content.repository)) {
      content.repository = await this.createContentRepository(
        client,
        user.login,
        content.repository.name
      );
    }
    const contentBranch = (await client.getRepository(content.repository)).defaultBranch;
    const files = await this.collectVaultFiles();
    new import_obsidian2.Notice(`\u6B63\u5728\u63A8\u9001\u672C\u5730\u5185\u5BB9\u5230 ${content.repository.owner}/${content.repository.name} ...`);
    await client.pushFiles(content.repository, contentBranch, files, {
      message: "Deploy theme: sync local vault content",
      authorName: user.login,
      authorEmail: `${user.login}@users.noreply.github.com`
    });
    const blog = {
      owner: user.login,
      name: this.resolveBlogRepoName(blogRepoName, user.login)
    };
    if (!await this.repositoryExists(client, blog)) {
      new import_obsidian2.Notice(`\u535A\u5BA2\u4ED3\u5E93\u4E0D\u5B58\u5728\uFF0C\u6B63\u5728\u521B\u5EFA ${blog.name} ...`);
      await client.createRepository({ name: blog.name, private: false });
    }
    await client.enableActions(blog);
    await client.setActionsSecret(blog, "WIKI_URL", `https://github.com/${content.repository.owner}/${content.repository.name}.git`);
    await client.setActionsSecret(blog, "PAT", pat);
    await client.setActionsSecret(blog, "THEME_REPO", themeRepo.trim() || DEFAULT_THEME_REPO);
    await client.setActionsSecret(content.repository, "BLOG_REPO", `${blog.owner}/${blog.name}`);
    await client.setActionsSecret(content.repository, "PAT", pat);
    if (configurePages) {
      await client.configurePages(blog);
    }
    await client.putFile(blog, ".github/workflows/deploy.yml", BLOG_DEPLOY_WORKFLOW, "Deploy theme: install deploy workflow");
    await this.ensureLocalGit(content.repository, contentBranch, pat);
    new import_obsidian2.Notice(`\u90E8\u7F72\u5B8C\u6210\uFF01\u535A\u5BA2\u4ED3\u5E93\uFF1A${blog.name}\uFF0C\u9996\u6B21\u6784\u5EFA\u5DF2\u89E6\u53D1\u3002`);
  }
  /** Directly asks the blog repository to rebuild. */
  async triggerDeploy() {
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const blog = {
      owner: user.login,
      name: this.resolveBlogRepoName(this.deps.getSettings().blogRepoName, user.login)
    };
    try {
      await client.dispatchRepositoryEvent(blog, "contents-updated");
    } catch (error) {
      if (isNotFound(error)) {
        throw new Error("\u535A\u5BA2\u4ED3\u5E93\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u300C\u90E8\u7F72\u4E3B\u9898\u300D\u3002");
      }
      throw error;
    }
    new import_obsidian2.Notice("\u5DF2\u89E6\u53D1\u535A\u5BA2\u4ED3\u5E93\u91CD\u5EFA\u3002");
  }
  /**
   * Ensures the local vault is a complete Git working copy pointing at the
   * content repository, so obsidian-git can Commit / Push / Pull directly.
   */
  async ensureLocalGit(repository, branch, pat) {
    const existingConfig = await this.deps.app.vault.adapter.read(".git/config").catch(() => null);
    if (existingConfig) {
      const existingRepository = parseGitHubRemote(existingConfig);
      if (existingRepository && !sameRepository(existingRepository, repository)) {
        throw new Error(
          `\u5F53\u524D Vault \u5DF2\u8FDE\u63A5 ${existingRepository.owner}/${existingRepository.name}\uFF0C\u4E0D\u4F1A\u8986\u76D6\u4E3A ${repository.owner}/${repository.name}\u3002`
        );
      }
    }
    const { plugin, manager } = await this.getObsidianGit(repository, pat);
    const remote = "origin";
    await manager.init();
    await manager.setRemote(remote, authenticatedGitHubUrl(repository, pat));
    await manager.fetch(remote);
    if (import_obsidian2.Platform.isDesktopApp) {
      if (!manager.git) {
        throw new Error("\u5F53\u524D obsidian-git \u684C\u9762\u7AEF\u63A5\u53E3\u4E0D\u517C\u5BB9\uFF0C\u8BF7\u66F4\u65B0\u6A21\u677F\u540E\u91CD\u8BD5\u3002");
      }
      await manager.git.checkout(["-f", "-B", branch, `${remote}/${branch}`]);
    } else {
      await manager.checkout(branch, remote);
    }
    await manager.setConfig(`branch.${branch}.remote`, remote);
    await manager.setConfig(`branch.${branch}.merge`, `refs/heads/${branch}`);
    plugin.unloadPlugin?.();
    await plugin.init({ fromReload: true });
  }
  async getObsidianGit(repository, pat) {
    const registry = this.deps.app.plugins;
    const plugin = registry?.getPlugin("obsidian-git");
    if (!plugin) {
      throw new Error("\u672A\u68C0\u6D4B\u5230\u5DF2\u542F\u7528\u7684 obsidian-git\uFF0C\u8BF7\u5148\u542F\u7528\u5B83\u518D\u91CD\u8BD5\u3002");
    }
    if (!plugin.localStorage) {
      throw new Error("obsidian-git \u5C1A\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u91CD\u542F Obsidian \u540E\u91CD\u8BD5\u3002");
    }
    plugin.localStorage.setUsername(repository.owner);
    plugin.localStorage.setPassword(pat);
    if (!plugin.gitManager) {
      await plugin.init({ fromReload: true });
    }
    const manager = plugin.gitManager;
    if (!manager) {
      throw new Error("\u65E0\u6CD5\u521D\u59CB\u5316 obsidian-git\uFF0C\u8BF7\u786E\u8BA4\u5185\u7F6E\u63D2\u4EF6\u7248\u672C\u5B8C\u6574\u3002");
    }
    return { plugin, manager };
  }
  /**
   * Collects the vault files to push, honoring the vault's `.gitignore`
   * (so plugin data containing the PAT never leaves the device).
   */
  async collectVaultFiles() {
    const rawRules = await this.deps.app.vault.adapter.read(".gitignore").catch(() => null);
    const rules = parseGitignore(rawRules ?? "");
    const files = /* @__PURE__ */ new Map();
    for (const file of this.deps.app.vault.getFiles()) {
      if (file.path.startsWith(".git/") || isIgnored(file.path, rules)) {
        continue;
      }
      const data = await this.deps.app.vault.adapter.readBinary(file.path);
      files.set(file.path, new Uint8Array(data));
    }
    return files;
  }
  client() {
    const { pat } = this.requireSettings("\u64CD\u4F5C");
    return new GitHubClient(pat);
  }
  requireSettings(action) {
    const settings = this.deps.getSettings();
    if (!settings.pat.trim()) {
      throw new Error(`\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 GitHub PAT \u518D${action}\u3002`);
    }
    return settings;
  }
  resolveBlogRepoName(value, login) {
    return value.trim() || `${login}.github.io`;
  }
  /** Creates the private content repository (empty; content is pushed next). */
  async createContentRepository(client, owner, name) {
    const safeName = sanitizeRepoName(name);
    new import_obsidian2.Notice(`\u672A\u8BC6\u522B\u5230\u6587\u7AE0\u4ED3\u5E93\uFF0C\u6B63\u5728\u521B\u5EFA ${safeName} ...`);
    const created = await client.createRepository({ name: safeName, private: true });
    const repository = { owner, name: created.name };
    await this.deps.saveSettings({ repoName: created.name });
    new import_obsidian2.Notice(`\u6587\u7AE0\u4ED3\u5E93\u5DF2\u521B\u5EFA\uFF1A${owner}/${created.name}`);
    return repository;
  }
  /**
   * Resolves the content repository target:
   * 1. the manually entered repository name;
   * 2. the `origin` remote from `.git/config`, when it points at the current
   *    user's own account (desktop clones);
   * 3. a repository whose name matches the Vault folder (zip downloads).
   * Returns the resolved repository (or `null`) plus the preferred name to
   * create when deploying.
   */
  async detectContentRepository(client) {
    const manual = this.deps.getSettings().repoName.trim();
    if (manual) {
      const user = await client.getAuthenticatedUser();
      return { repository: { owner: user.login, name: manual }, preferredName: manual };
    }
    const config = await this.deps.app.vault.adapter.read(".git/config").catch(() => null);
    if (config) {
      const remote = parseGitHubRemote(config);
      if (remote) {
        const user = await client.getAuthenticatedUser();
        if (remote.owner.toLowerCase() === user.login.toLowerCase()) {
          return { repository: remote, preferredName: remote.name };
        }
        return { repository: null, preferredName: remote.name };
      }
    }
    const vaultName = this.deps.app.vault.getName();
    if (vaultName) {
      const user = await client.getAuthenticatedUser();
      return {
        repository: { owner: user.login, name: vaultName },
        preferredName: vaultName
      };
    }
    return { repository: null, preferredName: "my-blog" };
  }
  async repositoryExists(client, repository) {
    try {
      await client.getRepository(repository);
      return true;
    } catch (error) {
      if (isNotFound(error)) {
        return false;
      }
      throw error;
    }
  }
};
function parseGitignore(content) {
  const rules = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
      continue;
    }
    const pattern = trimmed.replace(/\/$/, "");
    rules.push({ regex: gitignoreRegex(pattern) });
  }
  return rules;
}
function gitignoreRegex(pattern) {
  const body = pattern.replace(/^\//, "");
  const hasSlash = body.includes("/");
  const escaped = body.split("/").map((segment) => segment.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")).join("/");
  if (hasSlash) {
    return new RegExp(`^${escaped}(/.*)?$`);
  }
  return new RegExp(`(^|/)${escaped}(/.*)?$`);
}
function isIgnored(path, rules) {
  return rules.some((rule) => rule.regex.test(path));
}
function isNotFound(error) {
  return error instanceof GitHubApiError && error.status === 404;
}
function parseGitHubRemote(config) {
  const match = config.match(
    /url\s*=\s*(?:https?:\/\/(?:[^@\s/]+@)?|git:\/\/|git@)(?:www\.)?github\.com[:/]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\s*$/m
  );
  return match ? { owner: match[1], name: match[2] } : null;
}
function sameRepository(left, right) {
  return left.owner.toLowerCase() === right.owner.toLowerCase() && left.name.toLowerCase() === right.name.toLowerCase();
}
function authenticatedGitHubUrl(repository, pat) {
  const owner = encodeURIComponent(repository.owner);
  const token = encodeURIComponent(pat);
  return `https://${owner}:${token}@github.com/${repository.owner}/${repository.name}.git`;
}
function sanitizeRepoName(name) {
  const cleaned = name.trim().replace(/[^A-Za-z0-9._-]/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "my-blog";
}

// src/ui/NewArticleModal.ts
var import_obsidian3 = require("obsidian");
var NewArticleModal = class extends import_obsidian3.Modal {
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
    this.title = "";
    this.directory = "";
    this.isSubmitting = false;
  }
  onOpen() {
    this.title = "";
    this.directory = "";
    this.isSubmitting = false;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "\u65B0\u5EFA\u6587\u7AE0" });
    const formEl = contentEl.createEl("form");
    formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.submit();
    });
    let titleInput;
    new import_obsidian3.Setting(formEl).setName("\u6807\u9898").setDesc("\u6587\u7AE0\u6587\u4EF6\u540D\u5C06\u7531\u6807\u9898\u751F\u6210\u3002").addText((text) => {
      text.setPlaceholder("\u8F93\u5165\u6587\u7AE0\u6807\u9898");
      text.onChange((value) => {
        this.title = value;
      });
      titleInput = text.inputEl;
    });
    new import_obsidian3.Setting(formEl).setName("\u76EE\u5F55").setDesc("\u7559\u7A7A\u5219\u521B\u5EFA\u5728 Vault \u6839\u76EE\u5F55\u3002").addText((text) => {
      text.setPlaceholder("\u4F8B\u5982 tutorial");
      text.onChange((value) => {
        this.directory = value;
      });
    });
    const actionsEl = formEl.createDiv({ cls: "modal-button-container" });
    const cancelButton = actionsEl.createEl("button", { text: "\u53D6\u6D88", type: "button" });
    cancelButton.addEventListener("click", () => this.close());
    actionsEl.createEl("button", {
      text: "\u521B\u5EFA\u6587\u7AE0",
      cls: "mod-cta",
      type: "submit"
    });
    window.setTimeout(() => titleInput?.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
  }
  async submit() {
    if (this.isSubmitting) {
      return;
    }
    const title = this.title.trim();
    if (!title) {
      new import_obsidian3.Notice("\u8BF7\u8F93\u5165\u6587\u7AE0\u6807\u9898");
      return;
    }
    this.isSubmitting = true;
    try {
      const directory = this.directory.trim();
      await this.onSubmit({ title, ...directory ? { directory } : {} });
      this.close();
    } catch (error) {
      new import_obsidian3.Notice(error instanceof Error && error.message ? error.message : "\u521B\u5EFA\u6587\u7AE0\u5931\u8D25");
    } finally {
      this.isSubmitting = false;
    }
  }
};

// src/main.ts
var VitePressButterflyPublisher = class extends import_obsidian4.Plugin {
  async onload() {
    await this.loadSettings();
    this.blog = new BlogService({
      app: this.app,
      getSettings: () => this.settings,
      saveSettings: async (changes) => {
        this.settings = { ...this.settings, ...changes };
        await this.saveData(this.settings);
      }
    });
    this.addSettingTab(
      new PublisherSettingsTab(this.app, this, () => this.settings, (changes) => this.updateSettings(changes), {
        onCheckPat: () => this.blog.checkPat(),
        onCheckContentRepo: () => this.blog.checkContentRepo(),
        onCheckBlogRepo: () => this.blog.checkBlogRepo(),
        onCheckReady: () => this.blog.checkReady(),
        onSetup: () => this.blog.setup(),
        onTrigger: () => this.blog.triggerDeploy()
      })
    );
    this.addCommand({
      id: "setup-blog",
      name: "\u90E8\u7F72\u4E3B\u9898\uFF08\u63A8\u9001\u672C\u5730\u5185\u5BB9\u5E76\u89E6\u53D1\u6784\u5EFA\uFF09",
      callback: () => this.runWithFeedback("\u90E8\u7F72\u4E3B\u9898", () => this.blog.setup())
    });
    this.addCommand({
      id: "trigger-deploy",
      name: "\u89E6\u53D1\u535A\u5BA2\u91CD\u5EFA",
      callback: () => this.runWithFeedback("\u89E6\u53D1\u90E8\u7F72", () => this.blog.triggerDeploy())
    });
    this.addCommand({
      id: "new-article",
      name: "\u65B0\u5EFA\u535A\u5BA2\u6587\u7AE0",
      callback: () => {
        new NewArticleModal(this.app, async (input) => {
          await this.createArticle(input.title, input.directory ?? "");
        }).open();
      }
    });
  }
  onunload() {
  }
  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
  }
  async updateSettings(changes) {
    this.settings = { ...this.settings, ...changes };
    await this.saveData(this.settings);
  }
  async createArticle(title, directory) {
    const safeName = title.trim().replace(/[\\/:*?"<>|#^\[\]]/g, "-").replace(/\s+/g, "-");
    if (!safeName) {
      throw new Error("\u65E0\u6CD5\u4ECE\u6807\u9898\u751F\u6210\u6587\u4EF6\u540D\u3002");
    }
    const folder = directory.trim().replace(/^\/+|\/+$/g, "");
    const path = folder ? `${folder}/${safeName}.md` : `${safeName}.md`;
    if (this.app.vault.getFileByPath(path)) {
      throw new Error(`\u6587\u4EF6\u5DF2\u5B58\u5728\uFF1A${path}`);
    }
    const frontmatter = [
      "---",
      `title: ${title.trim()}`,
      `date: ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`,
      "layout: doc",
      "---",
      "",
      `# ${title.trim()}`,
      ""
    ].join("\n");
    if (folder) {
      await this.app.vault.createFolder(folder).catch(() => void 0);
    }
    const file = await this.app.vault.create(path, frontmatter);
    this.app.workspace.getLeaf(false).openFile(file);
  }
  async runWithFeedback(name, action) {
    try {
      await action();
    } catch (error) {
      new import_obsidian4.Notice(`${name}\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
    }
  }
};
