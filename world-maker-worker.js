// src/shared/contracts/wire.js
function requireContract(condition, message) {
  if (!condition) throw new TypeError(message);
}
var RESOURCE_INVENTORY_WIRE_V1 = Object.freeze({ version: "horde-resource-inventory-wire-v1", maximumEntries: 512, ordinaryArrayMaximum: 256 });
var GROUP_INDEX_WIRE_V1 = Object.freeze({ version: "horde-group-index-wire-v1", maximumKeys: 512, parentRecordMaximum: 256 });
var ENTITY_INDEX_WIRE_V2 = Object.freeze({ version: "entity-index-wire-capacity-v3-hordes", maximumKeys: 8192, parentRecordMaximum: 256 });
function walkWire(value, mode) {
  const seen = /* @__PURE__ */ new WeakSet();
  let nodes = 0;
  function visit(current, depth) {
    requireContract(++nodes <= 2097152 && depth <= 24, "Wire size/depth limit");
    if (current === null || typeof current === "boolean") return current;
    if (typeof current === "string") {
      requireContract(current.length <= 4096 && !/[\u0000]/u.test(current), "Invalid wire string");
      for (let i = 0; i < current.length; i++) {
        const unit3 = current.charCodeAt(i);
        if (unit3 >= 55296 && unit3 <= 56319) {
          const next = current.charCodeAt(++i);
          requireContract(next >= 56320 && next <= 57343, "Unpaired wire surrogate");
        } else requireContract(unit3 < 56320 || unit3 > 57343, "Unpaired wire surrogate");
      }
      return current;
    }
    if (typeof current === "number") {
      requireContract(Number.isFinite(current), "Non-finite wire number");
      return current;
    }
    requireContract(typeof current === "object", "Wire must contain data only");
    requireContract(!seen.has(current), "Cyclic or aliased wire object");
    seen.add(current);
    const array = Array.isArray(current);
    const proto = Object.getPrototypeOf(current);
    requireContract(
      array ? proto === Array.prototype : proto === Object.prototype || proto === null,
      "Only plain records/arrays are wire values"
    );
    const keys = Reflect.ownKeys(current);
    requireContract(keys.every((key2) => typeof key2 === "string"), "Symbol wire key");
    if (array) {
      const length = Object.getOwnPropertyDescriptor(current, "length").value, cloned2 = mode ? [] : null;
      requireContract((length <= 256 || length <= 512 && keys.filter((k) => k !== "length").every((k) => {
        const d = Object.getOwnPropertyDescriptor(current, k);
        if (!d || !("value" in d)) return false;
        const r = d.value;
        if (!r || typeof r !== "object" || Array.isArray(r)) return false;
        const v = (k2) => {
          const d3 = Object.getOwnPropertyDescriptor(r, k2);
          return d3 && "value" in d3 ? d3.value : void 0;
        };
        return typeof v("groupId") === "string" && ["chest", "breakable"].includes(v("kind")) && Number.isSafeInteger(v("ordinal")) && typeof v("spaceInstanceId") === "string";
      })) && keys.length === length + 1, "Sparse/extended/oversize array");
      for (let i = 0; i < length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(current, String(i));
        requireContract(descriptor && "value" in descriptor && descriptor.enumerable, "Array accessor or hole");
        const child = visit(descriptor.value, depth + 1);
        if (mode) cloned2.push(child);
      }
      return mode === 2 ? Object.freeze(cloned2) : cloned2;
    } else {
      requireContract(keys.length <= 256 || keys.length <= ENTITY_INDEX_WIRE_V2.maximumKeys && keys.every((key2) => /^ent:[a-f0-9]{32}$/.test(key2)) || keys.length <= GROUP_INDEX_WIRE_V1.maximumKeys && keys.every((key2) => /^(ordinary|site|group|encounter):[a-zA-Z0-9:_-]+$/.test(key2)), "Oversize record");
      const cloned2 = mode ? /* @__PURE__ */ Object.create(null) : null;
      if (mode) for (const key2 of [...keys].sort()) cloned2[key2] = null;
      for (const key2 of keys) {
        requireContract(key2.length > 0 && key2.length <= 128 && !["__proto__", "prototype", "constructor"].includes(key2), "Unsafe record key");
        const descriptor = Object.getOwnPropertyDescriptor(current, key2);
        requireContract(descriptor && "value" in descriptor && descriptor.enumerable, "Accessor or hidden wire field");
        const child = visit(descriptor.value, depth + 1);
        if (mode) cloned2[key2] = child;
      }
      return mode === 2 ? Object.freeze(cloned2) : cloned2;
    }
  }
  const cloned = visit(value, 0);
  return mode ? cloned : value;
}
function freezeWire(value) {
  return walkWire(value, 2);
}

// src/shared/content/roadside_encounters_v1.js
var ROADSIDE_POLICY = freezeWire({ "version": "world-roadside-encounters-v2", "parentCombatHash": "a6bd45764908d58d1e1dff8e55e811a0d10876ee0b24ea4b15aa28ea6c94fc59", "parentAccessHash": "48fd65d60a26a6403b36111e0d3622e366c26f6a07709e9d34ff013a013fcdeb", "packChancePercent": 85, "ordinaryPack": [6, 12], "maximumPacksPerChunk": 1, "protectedReservationChunks": "all original settlement/site/faction/future/origin chunks; unchanged", "wildernessSafetyCollarTiles": 8, "previousCollar": "one whole chunk in every direction (32x26 tiles), including unused neighboring ground", "spawnSafetyRadiusTiles": 32, "ferrySafetyRadiusTiles": 32, "eventCapacity": "all reserved event cells plus two-tile shoulder excluded", "routeSafety": "no member on marked road/trail/bridge or its one-tile shoulder", "actorSafety": "existing 384px activation no-spawn radius unchanged", "simulation": "existing 60Hz, 192 active actors, retention, XP, loot, stats and dungeon rosters unchanged", "selection": "domain-separated global chunk hash, maximum 24 center attempts, max 81 member probes per attempt, same-landmass clearance", "scope": "reusable sampler; opted-in Alpha review only; fresh disposable namespace" });

// src/shared/content/alderwood_access_v1.js
var ACCESS_VERSION = "alderwood-first-journey-v1";
var ACCESS_HASH = "48fd65d60a26a6403b36111e0d3622e366c26f6a07709e9d34ff013a013fcdeb";
var FIRST_CAVE_SELECTION = freezeWire({ "id": "repeatable-slot:cave:woodland:small:109", "familyId": "site-family:cave", "tier": "small", "band": 1, "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "anchor": { "x": 54, "y": 133, "key": "54,133" }, "footprint": [{ "x": 108, "y": 267 }], "approach": [{ "x": 109, "y": 267 }], "biome": "woodland", "added": true, "old": false });

// src/shared/content/world_reshape_sites_v1.js
var RESHAPE_SITES = Object.freeze({
  "repeatable-slot:cave:frostland:large:01": ["frostland", 3],
  "repeatable-slot:cave:grassland:small:01": ["woodland", 3],
  "repeatable-slot:cave:tropical:deep:01": ["frostland", 5],
  "repeatable-slot:cave:upland:large:01": ["grassland", 2],
  "repeatable-slot:cave:upland:standard:01": ["frostland", 5],
  "repeatable-slot:cave:volcanic:deep:01": ["desert", 3],
  "repeatable-slot:cave:wetland:small:01": ["grassland", 5],
  "repeatable-slot:cave:wetland:standard:01": ["wetland", 5],
  "repeatable-slot:cave:woodland:standard:01": ["woodland", 3],
  "repeatable-slot:crypt:frostland:deep:01": ["desert", 3],
  "repeatable-slot:crypt:grassland:small:01": ["woodland", 1],
  "repeatable-slot:crypt:upland:standard:01": ["upland", 2],
  "repeatable-slot:crypt:wetland:standard:01": ["volcanic", 4],
  "repeatable-slot:fort:grassland:small:01": ["upland", 4],
  "repeatable-slot:fort:tropical:large:01": ["tropical", 3],
  "repeatable-slot:fort:upland:standard:01": ["frostland", 5],
  "repeatable-slot:fort:wetland:small:01": ["volcanic", 4],
  "repeatable-slot:fort:woodland:standard:01": ["woodland", 3],
  "repeatable-slot:ruin:desert:standard:01": ["wetland", 3],
  "repeatable-slot:ruin:frostland:standard:01": ["volcanic", 4],
  "repeatable-slot:ruin:tropical:small:01": ["frostland", 5],
  "repeatable-slot:ruin:upland:standard:01": ["grassland", 3],
  "repeatable-slot:ruin:wetland:small:01": ["upland", 4],
  "repeatable-slot:ruin:woodland:small:01": ["woodland", 2],
  "repeatable-slot:ruin:frostland:deep:01": ["frostland", 3],
  "repeatable-slot:crypt:frostland:large:01": ["frostland", 3],
  "repeatable-slot:cave:grassland:small:031": ["woodland", 1],
  "repeatable-slot:fort:upland:standard:032": ["frostland", 4],
  "repeatable-slot:ruin:wetland:standard:033": ["wetland", 4],
  "repeatable-slot:cave:woodland:small:034": ["frostland", 3],
  "repeatable-slot:cave:volcanic:small:035": ["tropical", 4],
  "repeatable-slot:cave:desert:small:036": ["desert", 2],
  "repeatable-slot:ruin:tropical:standard:037": ["tropical", 3],
  "repeatable-slot:crypt:frostland:small:038": ["desert", 2],
  "repeatable-slot:fort:grassland:standard:040": ["grassland", 5],
  "repeatable-slot:cave:desert:small:041": ["wetland", 3],
  "repeatable-slot:cave:wetland:small:042": ["volcanic", 4],
  "repeatable-slot:cave:volcanic:small:043": ["tropical", 4],
  "repeatable-slot:fort:frostland:standard:044": ["upland", 4],
  "repeatable-slot:cave:woodland:small:045": ["grassland", 2],
  "repeatable-slot:cave:desert:small:046": ["wetland", 2],
  "repeatable-slot:crypt:tropical:small:047": ["frostland", 5],
  "repeatable-slot:fort:grassland:standard:048": ["upland", 2],
  "repeatable-slot:ruin:upland:standard:049": ["upland", 1],
  "repeatable-slot:cave:frostland:small:050": ["upland", 4],
  "repeatable-slot:cave:tropical:small:051": ["wetland", 5],
  "repeatable-slot:ruin:volcanic:standard:052": ["tropical", 3],
  "repeatable-slot:fort:grassland:standard:053": ["upland", 3],
  "repeatable-slot:ruin:woodland:standard:054": ["woodland", 3],
  "repeatable-slot:cave:woodland:small:055": ["frostland", 4],
  "repeatable-slot:ruin:woodland:standard:058": ["grassland", 2],
  "repeatable-slot:crypt:frostland:small:059": ["desert", 3],
  "repeatable-slot:cave:grassland:small:060": ["upland", 4],
  "repeatable-slot:fort:volcanic:standard:061": ["grassland", 3],
  "repeatable-slot:cave:wetland:small:063": ["wetland", 4],
  "repeatable-slot:fort:grassland:standard:064": ["upland", 3],
  "repeatable-slot:fort:frostland:standard:065": ["volcanic", 4],
  "repeatable-slot:ruin:upland:standard:066": ["woodland", 1],
  "repeatable-slot:ruin:wetland:standard:067": ["grassland", 4],
  "repeatable-slot:fort:upland:standard:070": ["grassland", 2],
  "repeatable-slot:ruin:tropical:standard:071": ["frostland", 4],
  "repeatable-slot:fort:volcanic:standard:072": ["desert", 4],
  "repeatable-slot:ruin:grassland:standard:073": ["woodland", 3],
  "repeatable-slot:crypt:wetland:small:074": ["wetland", 5],
  "repeatable-slot:ruin:grassland:standard:075": ["grassland", 1],
  "repeatable-slot:ruin:woodland:standard:076": ["woodland", 1],
  "repeatable-slot:cave:desert:small:077": ["upland", 2],
  "repeatable-slot:ruin:desert:standard:078": ["tropical", 4],
  "repeatable-slot:ruin:tropical:standard:079": ["frostland", 4],
  "repeatable-slot:cave:frostland:small:080": ["frostland", 3],
  "repeatable-slot:ruin:tropical:standard:081": ["woodland", 1],
  "repeatable-slot:ruin:upland:standard:082": ["grassland", 2],
  "repeatable-slot:cave:woodland:small:083": ["frostland", 5],
  "repeatable-slot:ruin:wetland:standard:084": ["grassland", 2],
  "repeatable-slot:cave:volcanic:small:085": ["desert", 5],
  "repeatable-slot:ruin:wetland:standard:086": ["grassland", 2],
  "repeatable-slot:ruin:tropical:standard:087": ["frostland", 4],
  "repeatable-slot:ruin:upland:standard:088": ["wetland", 3],
  "repeatable-slot:crypt:wetland:small:090": ["volcanic", 4],
  "repeatable-slot:ruin:volcanic:standard:091": ["desert", 3],
  "repeatable-slot:cave:frostland:small:092": ["wetland", 3],
  "repeatable-slot:ruin:desert:standard:093": ["upland", 2],
  "repeatable-slot:crypt:tropical:small:094": ["wetland", 5],
  "repeatable-slot:fort:grassland:standard:095": ["woodland", 2],
  "repeatable-slot:cave:frostland:small:097": ["frostland", 4],
  "repeatable-slot:cave:desert:small:098": ["upland", 2],
  "repeatable-slot:cave:upland:small:099": ["upland", 4],
  "repeatable-slot:crypt:wetland:small:100": ["grassland", 5],
  "repeatable-slot:cave:upland:small:101": ["grassland", 2]
});
var RESHAPE_TIERS = Object.freeze({ "repeatable-slot:ruin:wetland:standard:067": "large" });

// src/shared/content/world_reshape_v1.js
var RESHAPE_VERSION = "world-reshape-v2";
var RESHAPE_HASH = "ac15d856c2dbbe38203480172b32aae7d19ccdd61cef10eee16aade24a0900d2";

// src/shared/generation/portable_math_v1.js
var view = new DataView(new ArrayBuffer(8));
function split(x) {
  view.setFloat64(0, x);
  let hi = view.getUint32(0), k = 0;
  if (hi < 1048576) {
    x *= 18014398509481984;
    view.setFloat64(0, x);
    hi = view.getUint32(0);
    k = -54;
  }
  k += (hi >>> 20) - 1023;
  view.setUint32(0, hi & 1048575 | 1072693248);
  let m = view.getFloat64(0);
  if (m > Math.SQRT2) {
    m /= 2;
    k++;
  }
  return [m, k];
}
function two(k) {
  view.setUint32(0, k + 1023 << 20 >>> 0);
  view.setUint32(4, 0);
  return view.getFloat64(0);
}
var LN2_HI = 0.6931471803691238;
var LN2_LO = 19082149292705877e-26;
function logm(m) {
  const f = m - 1, s = f / (2 + f), z = s * s, w = z * z, t1 = w * (0.3999999999940942 + w * (0.22222198432149784 + w * 0.15313837699209373)), t2 = z * (0.6666666666666735 + w * (0.2857142874366239 + w * (0.1818357216161805 + w * 0.14798198605116586))), hf = 0.5 * f * f;
  return [f, hf, s * (hf + t1 + t2)];
}
function log(x) {
  if (!(x > 0)) return x === 0 ? -Infinity : NaN;
  if (x === Infinity) return x;
  const [m, k] = split(x), [f, hf, r] = logm(m);
  return k * LN2_HI - (hf - (r + k * LN2_LO) - f);
}
function log2(x) {
  if (!(x > 0)) return x === 0 ? -Infinity : NaN;
  if (x === Infinity) return x;
  const [m, k] = split(x), [f, hf, r] = logm(m);
  return k + (f - hf + r) / Math.LN2;
}
function exp(x) {
  if (x !== x) return x;
  if (x > 709.78) return Infinity;
  if (x < -745.13) return 0;
  const k = Math.floor(x * 1.4426950408889634 + 0.5), hi = x - k * LN2_HI, lo = k * LN2_LO, r = hi - lo, t = r * r, c = r - t * (0.16666666666666602 + t * (-0.0027777777777015593 + t * (6613756321437934e-20 + t * (-16533902205465252e-22 + t * 41381367970572385e-24)))), y = 1 - (lo - r * c / (2 - c) - hi);
  return k > 1023 ? y * two(1023) * two(k - 1023) : k < -1022 ? y * two(-1022) * two(k + 1022) : y * two(k);
}
function pow(x, y) {
  if (y === 0) return 1;
  if (x === 1) return 1;
  if (y === 1) return x;
  if (x !== x || y !== y) return NaN;
  if (Number.isInteger(y) && Math.abs(y) <= 64) {
    let n = Math.abs(y), b = x, v = 1;
    while (n) {
      if (n & 1) v *= b;
      n >>= 1;
      if (n) b *= b;
    }
    return y < 0 ? 1 / v : v;
  }
  if (x === 0) return y > 0 ? 0 : Infinity;
  if (x < 0) {
    if (!Number.isInteger(y)) return NaN;
    const v = exp(y * log(-x));
    return y % 2 ? -v : v;
  }
  return exp(y * log(x));
}
var ks = (x) => {
  const z = x * x;
  return x + z * x * (-0.16666666666666632 + z * (0.00833333333332249 + z * (-1984126982985795e-19 + z * (27557313707070068e-22 + z * (-25050760253406863e-24 + z * 158969099521155e-24)))));
};
var kc = (x) => {
  const z = x * x;
  return 1 - (0.5 * z - z * z * (0.0416666666666666 + z * (-0.001388888888887411 + z * (2480158728947673e-20 + z * (-27557314351390663e-23 + z * (2087572321298175e-24 + z * -11359647557788195e-27))))));
};
function quarter(x) {
  const n = Math.round(x * 0.6366197723675814);
  return [x - n * 1.5707963267341256 - n * 6077100506506192e-26, (n % 4 + 4) % 4];
}
function sin(x) {
  if (!Number.isFinite(x)) return NaN;
  const [r, q] = quarter(x);
  return q === 0 ? ks(r) : q === 1 ? kc(r) : q === 2 ? -ks(r) : -kc(r);
}
function cos(x) {
  if (!Number.isFinite(x)) return NaN;
  const [r, q] = quarter(x);
  return q === 0 ? kc(r) : q === 1 ? -ks(r) : q === 2 ? -kc(r) : ks(r);
}
var ATAN_HI = [0.4636476090008061, 0.7853981633974483, 0.982793723247329, 1.5707963267948966];
var ATAN_LO = [22698777452961687e-33, 3061616997868383e-32, 13903311031230998e-33, 6123233995736766e-32];
function atan(x) {
  if (x !== x) return x;
  const sign = x < 0 ? -1 : 1;
  let a = Math.abs(x), id;
  if (a >= 7378697629483821e4) return sign * ATAN_HI[3];
  if (a < 0.4375) {
    if (a < 1862645149230957e-24) return x;
    id = -1;
  } else if (a < 1.1875) {
    if (a < 0.6875) {
      id = 0;
      a = (2 * a - 1) / (2 + a);
    } else {
      id = 1;
      a = (a - 1) / (a + 1);
    }
  } else if (a < 2.4375) {
    id = 2;
    a = (a - 1.5) / (1 + 1.5 * a);
  } else {
    id = 3;
    a = -1 / a;
  }
  const z = a * a, w = z * z, s1 = z * (0.3333333333333293 + w * (0.14285714272503466 + w * (0.09090887133436507 + w * (0.06661073137387531 + w * (0.049768779946159324 + w * 0.016285820115365782))))), s2 = w * (-0.19999999999876483 + w * (-0.11111110405462356 + w * (-0.0769187620504483 + w * (-0.058335701337905735 + w * -0.036531572744216916))));
  return id < 0 ? sign * (a - a * (s1 + s2)) : sign * (ATAN_HI[id] - (a * (s1 + s2) - ATAN_LO[id] - a));
}
function atan2(y, x) {
  if (x !== x || y !== y) return NaN;
  const down = y < 0 || Object.is(y, -0);
  if (x === 0) return y > 0 ? Math.PI / 2 : y < 0 ? -Math.PI / 2 : Object.is(x, -0) ? down ? -Math.PI : Math.PI : y;
  const t = atan(y / x);
  return x > 0 ? t : down ? t - Math.PI : t + Math.PI;
}
var hypot = (x, y) => Math.sqrt(x * x + y * y);
var PM = Object.freeze({ hypot, sin, cos, atan2, exp, log, log2, pow });

// src/shared/generation/world_reshape_v1.js
function createSoftBiomeSampler(p, macro) {
  const width = p.domain.width, height = p.domain.height, edge = new Uint8Array(width * height), guard = new Uint8Array(width * 2 * height * 2);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const c = macro(x, y);
    if (!c) continue;
    for (let dy = -1; dy <= 1 && !edge[y * width + x]; dy++) for (let dx = -1; dx <= 1; dx++) {
      const n = macro(x + dx, y + dy);
      if (n && n[1] === c[1] && n[2] !== c[2]) {
        edge[y * width + x] = 1;
        break;
      }
    }
  }
  const protect = (cx2, cy2, margin) => {
    for (let dy = -margin; dy <= margin; dy++) for (let dx = -margin; dx <= margin; dx++) {
      const x = cx2 + dx, y = cy2 + dy;
      if (x >= 0 && y >= 0 && x < width * 2 && y < height * 2) guard[y * width * 2 + x] = 1;
    }
  };
  for (const s of p.sites) for (const c of [...s.footprint, ...s.approach]) protect(c.x, c.y, 1);
  for (const s of p.settlements) for (const c of s.core) protect(c.x, c.y, 0);
  const lattice = (x, y, k) => {
    let n = Math.imul(x, 668265261) ^ Math.imul(y, 374761393) ^ Math.imul(k, 2654435761);
    n = Math.imul(n ^ n >>> 15, 2246822507);
    n = Math.imul(n ^ n >>> 13, 3266489909);
    return ((n ^ n >>> 16) >>> 0) / 4294967296;
  };
  const value = (x, y, s, k) => {
    const fx = x / s, fy = y / s, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), a = lattice(ix, iy, k), b = lattice(ix + 1, iy, k), c = lattice(ix, iy + 1, k), d = lattice(ix + 1, iy + 1, k);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const warp = (x, y, k) => (value(x, y, 40, k) * 0.7 + value(x, y, 12, k + 7) * 0.3) * 2 - 1;
  const weight = new Float64Array(16);
  return (x, y, mx, my, c) => {
    if (!edge[my * width + mx] || guard[Math.floor(y / 26) * width * 2 + Math.floor(x / 32)]) return c[2];
    const u = (x + 18 * warp(x, y, 1)) / 64 - 0.5, v = (y + 15 * warp(x, y, 2)) / 52 - 0.5, cu = Math.round(u), cv = Math.round(v);
    weight.fill(0);
    for (let j = cv - 1; j <= cv + 1; j++) for (let i = cu - 1; i <= cu + 1; i++) {
      const n = macro(i, j);
      if (n && n[1] === c[1]) {
        const d22 = (u - i) * (u - i) + (v - j) * (v - j);
        weight[n[2]] += PM.exp(-d22 * 2.2);
      }
    }
    let best = c[2];
    for (let b = 1; b < weight.length; b++) if (weight[b] > weight[best]) best = b;
    return best;
  };
}

// src/shared/content/alpha_hydrology_v1.js
var HYDROLOGY_VERSION = "alpha-hydrology-plan-v2";

// src/shared/generation/alpha_hydrology_v1.js
function validateHydrologyPlanV1(plan) {
  requireContract(plan?.version === HYDROLOGY_VERSION && ["terrain-conditioned-drainage-and-basins-v2", "terrain-drainage-lake-outlets-v3"].includes(plan.policy), "Unknown hydrology successor");
  requireContract(Number.isSafeInteger(plan.widthTiles) && plan.widthTiles > 0 && plan.widthTiles <= 16384 && Number.isSafeInteger(plan.heightTiles) && plan.heightTiles > 0 && plan.heightTiles <= 16384, "Hydrology bounds");
  requireContract(plan.macroOwnershipChanged === false && plan.progressionChanged === false && Array.isArray(plan.failures) && plan.failures.length === 0, "Unresolved hydrology plan");
  requireContract(Array.isArray(plan.pages) && plan.pages.length <= 4096 && Array.isArray(plan.basins) && plan.basins.length <= 128 && Array.isArray(plan.network) && plan.network.length <= 2048, "Hydrology budgets");
  const seen = /* @__PURE__ */ new Set();
  for (const p of plan.pages) {
    requireContract(/^\d+,\d+$/.test(p.key) && !seen.has(p.key) && Array.isArray(p.runs) && p.runs.length <= 832, "Hydrology page identity");
    seen.add(p.key);
    const [cx2, cy2] = p.key.split(",").map(Number);
    requireContract(cx2 * 32 < plan.widthTiles && cy2 * 26 < plan.heightTiles, "Hydrology page bounds");
    let end = 0;
    for (const r of p.runs) {
      requireContract(r.length === 3 && r.every(Number.isSafeInteger) && r[0] >= end && r[1] > 0 && r[0] + r[1] <= 832 && [1, 2].includes(r[2]), "Hydrology page run");
      end = r[0] + r[1];
    }
  }
  return plan;
}
function createHydrologyGeometryV1(plan, parent) {
  validateHydrologyPlanV1(plan);
  const encoded = new Map(plan.pages.map((p) => [p.key, p.runs])), cache = /* @__PURE__ */ new Map();
  let decodes = 0, lastCx = NaN, lastCy = NaN, lastPage = null;
  function page(cx2, cy2) {
    if (cx2 === lastCx && cy2 === lastCy) return lastPage;
    const key2 = cx2 + "," + cy2, runs = encoded.get(key2);
    let data = null;
    if (runs) {
      data = cache.get(key2);
      if (!data) {
        data = new Uint8Array(832);
        for (const [start, length, kind2] of runs) data.fill(kind2, start, start + length);
        if (cache.size >= 256) cache.delete(cache.keys().next().value);
        cache.set(key2, data);
        decodes++;
      }
    }
    lastCx = cx2;
    lastCy = cy2;
    lastPage = data;
    return data;
  }
  function kind(x, y) {
    if (x < 0 || y < 0 || x >= plan.widthTiles || y >= plan.heightTiles) return 0;
    return page(Math.floor(x / 32), Math.floor(y / 26))?.[y % 26 * 32 + x % 32] ?? 0;
  }
  function inland(x, y) {
    const value = kind(x, y);
    let bank = false;
    if (!value) {
      for (let dy = -2; dy <= 2 && !bank; dy++) for (let dx = -2; dx <= 2; dx++) if (kind(x + dx, y + dy)) {
        bank = true;
        break;
      }
    }
    return { water: value !== 0, kind: value === 2 ? "lake" : "river", bank };
  }
  function maskForCell(mx, my) {
    if (![0, 1].some((dy) => [0, 1].some((dx) => encoded.has(mx * 2 + dx + "," + (my * 2 + dy))))) return null;
    const mask = new Uint8Array(3328);
    for (let y = 0; y < 52; y++) for (let x = 0; x < 64; x++) mask[y * 64 + x] = kind(mx * 64 + x, my * 52 + y) ? 1 : 0;
    return mask;
  }
  return Object.freeze({ ...parent, version: HYDROLOGY_VERSION, inland, maskForCell, hydrologyBasins: plan.basins, hydrologyNetwork: plan.network, hydrologyStats: () => ({ encodedPages: encoded.size, decodedPages: cache.size, decodedPageLimit: 256, decodedBytes: cache.size * 832, decodes }) });
}

// src/shared/content/woodland_forest_pilot_v1.js
var WOODLAND_FOREST_VERSION = "woodland-forest-composition-v1";
var WOODLAND_FOREST_POLICY = freezeWire({ version: WOODLAND_FOREST_VERSION, scope: { left: 2920, top: 6840, right: 3780, bottom: 7340 }, biome: "w", cellTiles: 4, neighborRadius: 1, treeTrunkCells: 1, routeShoulderTiles: 1, waterShoulderTiles: 1, eventShoulderTiles: 2, notes: "Review-only Alpha local obstacle successor. Macro geography, reservations and content remain unchanged." });

// src/shared/content/starter_village_v1.js
var STARTER_VERSION = "alderwood-campaign-start-v1";
var STARTER_VILLAGE_ID = "settlement-slot:village-outpost:01";
var STARTER_VILLAGE_NAME = "Alderwood";
var STARTER_VILLAGE_ORIGIN = freezeWire({ x: 3648, y: 6916 });
var STARTER_ARRIVAL_TILES = freezeWire([{ x: 3682, y: 6946 }, { x: 3683, y: 6946 }, { x: 3682, y: 6947 }, { x: 3683, y: 6947 }]);
var STARTER_POLICY = freezeWire({ version: STARTER_VERSION, parentRuntime: "143462d57e186816", assetId: "alpha", settlementId: STARTER_VILLAGE_ID, name: STARTER_VILLAGE_NAME, role: "starting-village", biomeId: "biome:woodland", band: 1, template: "village", origin: STARTER_VILLAGE_ORIGIN, dimensions: [64, 52], arrivalTiles: STARTER_ARRIVAL_TILES, start: "fresh-campaign-genesis-and-normal-respawn-only", reopen: "restore-the-actual-saved-position-and-residency", approach: "existing-west-socket-113,266", services: "ordinary-band-1-personal-stock-and-existing-paid-recovery", geographyChanged: false, progressionChanged: false, existingReservationsChanged: false });
var STARTER_NPCS = freezeWire([
  { id: "civilian:alpha:alderwood:merchant", name: "Alderwood Merchant", role: "general", roleLabel: "General merchant", settlementId: STARTER_VILLAGE_ID, buildingId: "village:roof:002", band: 1, tile: { x: 3665, y: 6934 }, space: "exterior", color: "#58766d" },
  { id: "civilian:alpha:alderwood:smith", name: "Alderwood Smith", role: "smith", roleLabel: "Equipment merchant", settlementId: STARTER_VILLAGE_ID, buildingId: "village:roof:003", band: 1, tile: { x: 3700, y: 6931 }, space: "exterior", color: "#8d6c49" },
  { id: "civilian:alpha:alderwood:innkeeper", name: "Alderwood Innkeeper", role: "innkeeper", roleLabel: "Innkeeper \xB7 veranda rest", settlementId: STARTER_VILLAGE_ID, buildingId: "village:roof:002", band: 1, tile: { x: 3667, y: 6934 }, space: "exterior", color: "#81657a" }
]);

// src/shared/content/wilderness_v2.js
var WILDERNESS_VERSION = "wilderness-distribution-v2-native";
var WILDERNESS_HASH = "ed2f7fcafeac4305b6658242d232d8d79dade9ecb6b43ea74125fc1318cc282f";
var WILDERNESS_SITE_SELECTIONS = freezeWire([{ "id": "repeatable-slot:cave:grassland:small:031", "anchor": { "key": "65,134", "x": 65, "y": 134 }, "familyId": "site-family:cave", "tier": "small", "band": 2, "footprint": [{ "x": 131, "y": 269 }], "approach": [{ "x": 132, "y": 269 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "grassland", "added": true, "old": false }, { "id": "repeatable-slot:fort:upland:standard:032", "anchor": { "key": "71,10", "x": 71, "y": 10 }, "familyId": "site-family:fort", "tier": "standard", "band": 4, "footprint": [{ "x": 143, "y": 21 }, { "x": 144, "y": 21 }, { "x": 143, "y": 22 }, { "x": 144, "y": 22 }, { "x": 143, "y": 23 }, { "x": 144, "y": 23 }], "approach": [{ "x": 145, "y": 22 }, { "x": 146, "y": 22 }], "landmassId": "landmass:medium-island:d14l1a:04:961b5a82", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:wetland:standard:033", "anchor": { "key": "34,34", "x": 34, "y": 34 }, "familyId": "site-family:ruin", "tier": "standard", "band": 3, "footprint": [{ "x": 69, "y": 69 }, { "x": 70, "y": 69 }, { "x": 69, "y": 70 }, { "x": 70, "y": 70 }], "approach": [{ "x": 71, "y": 69 }, { "x": 72, "y": 69 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "wetland", "added": true, "old": false }, { "id": "repeatable-slot:cave:woodland:small:034", "anchor": { "key": "116,61", "x": 116, "y": 61 }, "familyId": "site-family:cave", "tier": "small", "band": 4, "footprint": [{ "x": 233, "y": 123 }], "approach": [{ "x": 234, "y": 123 }], "landmassId": "landmass:major-island:d14l1a:03:578d626c", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:cave:volcanic:small:035", "anchor": { "key": "80,38", "x": 80, "y": 38 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 161, "y": 77 }], "approach": [{ "x": 162, "y": 77 }], "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "biome": "volcanic", "added": true, "old": false }, { "id": "repeatable-slot:cave:desert:small:036", "anchor": { "key": "71,99", "x": 71, "y": 99 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 143, "y": 199 }], "approach": [{ "x": 144, "y": 199 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "desert", "added": true, "old": false }, { "id": "repeatable-slot:ruin:tropical:standard:037", "anchor": { "key": "117,110", "x": 117, "y": 110 }, "familyId": "site-family:ruin", "tier": "standard", "band": 5, "footprint": [{ "x": 234, "y": 221 }, { "x": 235, "y": 221 }, { "x": 234, "y": 222 }, { "x": 235, "y": 222 }], "approach": [{ "x": 236, "y": 221 }, { "x": 237, "y": 221 }], "landmassId": "landmass:medium-island:d14l1a:03:c2624ecc", "biome": "tropical", "added": true, "old": false }, { "id": "repeatable-slot:crypt:frostland:small:038", "anchor": { "key": "61,99", "x": 61, "y": 99 }, "familyId": "site-family:crypt", "tier": "small", "band": 3, "footprint": [{ "x": 123, "y": 199 }], "approach": [{ "x": 124, "y": 199 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "frostland", "added": true, "old": false }, { "id": "repeatable-slot:cave:upland:small:039", "anchor": { "key": "55,111", "x": 55, "y": 111 }, "familyId": "site-family:cave", "tier": "small", "band": 2, "footprint": [{ "x": 111, "y": 223 }], "approach": [{ "x": 112, "y": 223 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:fort:grassland:standard:040", "anchor": { "key": "37,47", "x": 37, "y": 47 }, "familyId": "site-family:fort", "tier": "standard", "band": 4, "footprint": [{ "x": 75, "y": 95 }, { "x": 76, "y": 95 }, { "x": 75, "y": 96 }, { "x": 76, "y": 96 }, { "x": 75, "y": 97 }, { "x": 76, "y": 97 }], "approach": [{ "x": 77, "y": 96 }, { "x": 78, "y": 96 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "grassland", "added": true, "old": false }, { "id": "repeatable-slot:cave:desert:small:041", "anchor": { "key": "45,85", "x": 45, "y": 85 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 91, "y": 171 }], "approach": [{ "x": 92, "y": 171 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "desert", "added": true, "old": false }, { "id": "repeatable-slot:cave:wetland:small:042", "anchor": { "key": "39,71", "x": 39, "y": 71 }, "familyId": "site-family:cave", "tier": "small", "band": 4, "footprint": [{ "x": 79, "y": 143 }], "approach": [{ "x": 80, "y": 143 }], "landmassId": "landmass:medium-island:d14l1a:01:83c7b775", "biome": "wetland", "added": true, "old": false }, { "id": "repeatable-slot:cave:volcanic:small:043", "anchor": { "key": "86,33", "x": 86, "y": 33 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 173, "y": 67 }], "approach": [{ "x": 174, "y": 67 }], "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "biome": "volcanic", "added": true, "old": false }, { "id": "repeatable-slot:fort:frostland:standard:044", "anchor": { "key": "111,90", "x": 111, "y": 90 }, "familyId": "site-family:fort", "tier": "standard", "band": 3, "footprint": [{ "x": 223, "y": 181 }, { "x": 224, "y": 181 }, { "x": 223, "y": 182 }, { "x": 224, "y": 182 }, { "x": 223, "y": 183 }, { "x": 224, "y": 183 }], "approach": [{ "x": 225, "y": 182 }, { "x": 226, "y": 182 }], "landmassId": "landmass:major-island:d14l1a:03:578d626c", "biome": "frostland", "added": true, "old": false }, { "id": "repeatable-slot:cave:woodland:small:045", "anchor": { "key": "45,108", "x": 45, "y": 108 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 90, "y": 217 }], "approach": [{ "x": 91, "y": 217 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:cave:desert:small:046", "anchor": { "key": "54,98", "x": 54, "y": 98 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 109, "y": 197 }], "approach": [{ "x": 110, "y": 197 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "desert", "added": true, "old": false }, { "id": "repeatable-slot:crypt:tropical:small:047", "anchor": { "key": "51,29", "x": 51, "y": 29 }, "familyId": "site-family:crypt", "tier": "small", "band": 3, "footprint": [{ "x": 103, "y": 59 }], "approach": [{ "x": 104, "y": 59 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "tropical", "added": true, "old": false }, { "id": "repeatable-slot:fort:grassland:standard:048", "anchor": { "key": "81,114", "x": 81, "y": 114 }, "familyId": "site-family:fort", "tier": "standard", "band": 3, "footprint": [{ "x": 163, "y": 229 }, { "x": 164, "y": 229 }, { "x": 163, "y": 230 }, { "x": 164, "y": 230 }, { "x": 163, "y": 231 }, { "x": 164, "y": 231 }], "approach": [{ "x": 165, "y": 230 }, { "x": 166, "y": 230 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "grassland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:upland:standard:049", "anchor": { "key": "55,119", "x": 55, "y": 119 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 111, "y": 239 }, { "x": 112, "y": 239 }, { "x": 111, "y": 240 }, { "x": 112, "y": 240 }], "approach": [{ "x": 113, "y": 239 }, { "x": 114, "y": 239 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:cave:frostland:small:050", "anchor": { "key": "117,86", "x": 117, "y": 86 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 235, "y": 173 }], "approach": [{ "x": 236, "y": 173 }], "landmassId": "landmass:major-island:d14l1a:03:578d626c", "biome": "frostland", "added": true, "old": false }, { "id": "repeatable-slot:cave:tropical:small:051", "anchor": { "key": "51,39", "x": 51, "y": 39 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 103, "y": 79 }], "approach": [{ "x": 104, "y": 79 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "tropical", "added": true, "old": false }, { "id": "repeatable-slot:ruin:volcanic:standard:052", "anchor": { "key": "78,46", "x": 78, "y": 46 }, "familyId": "site-family:ruin", "tier": "standard", "band": 3, "footprint": [{ "x": 157, "y": 93 }, { "x": 158, "y": 93 }, { "x": 157, "y": 94 }, { "x": 158, "y": 94 }], "approach": [{ "x": 159, "y": 93 }, { "x": 160, "y": 93 }], "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "biome": "volcanic", "added": true, "old": false }, { "id": "repeatable-slot:fort:grassland:standard:053", "anchor": { "key": "85,108", "x": 85, "y": 108 }, "familyId": "site-family:fort", "tier": "standard", "band": 3, "footprint": [{ "x": 171, "y": 217 }, { "x": 172, "y": 217 }, { "x": 171, "y": 218 }, { "x": 172, "y": 218 }, { "x": 171, "y": 219 }, { "x": 172, "y": 219 }], "approach": [{ "x": 173, "y": 218 }, { "x": 174, "y": 218 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "grassland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:woodland:standard:054", "anchor": { "key": "25,119", "x": 25, "y": 119 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 51, "y": 239 }, { "x": 52, "y": 239 }, { "x": 51, "y": 240 }, { "x": 52, "y": 240 }], "approach": [{ "x": 53, "y": 239 }, { "x": 54, "y": 239 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:cave:woodland:small:055", "anchor": { "key": "66,4", "x": 66, "y": 4 }, "familyId": "site-family:cave", "tier": "small", "band": 4, "footprint": [{ "x": 132, "y": 9 }], "approach": [{ "x": 133, "y": 9 }], "landmassId": "landmass:medium-island:d14l1a:04:961b5a82", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:desert:standard:056", "anchor": { "key": "116,32", "x": 116, "y": 32 }, "familyId": "site-family:ruin", "tier": "standard", "band": 4, "footprint": [{ "x": 233, "y": 65 }, { "x": 234, "y": 65 }, { "x": 233, "y": 66 }, { "x": 234, "y": 66 }], "approach": [{ "x": 235, "y": 65 }, { "x": 236, "y": 65 }], "landmassId": "landmass:medium-island:d14l1a:02:799115ea", "biome": "desert", "added": true, "old": false }, { "id": "repeatable-slot:ruin:upland:standard:057", "anchor": { "key": "96,35", "x": 96, "y": 35 }, "familyId": "site-family:ruin", "tier": "standard", "band": 4, "footprint": [{ "x": 193, "y": 71 }, { "x": 194, "y": 71 }, { "x": 193, "y": 72 }, { "x": 194, "y": 72 }], "approach": [{ "x": 195, "y": 71 }, { "x": 196, "y": 71 }], "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:woodland:standard:058", "anchor": { "key": "39,110", "x": 39, "y": 110 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 79, "y": 221 }, { "x": 80, "y": 221 }, { "x": 79, "y": 222 }, { "x": 80, "y": 222 }], "approach": [{ "x": 81, "y": 221 }, { "x": 82, "y": 221 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:crypt:frostland:small:059", "anchor": { "key": "63,85", "x": 63, "y": 85 }, "familyId": "site-family:crypt", "tier": "small", "band": 3, "footprint": [{ "x": 127, "y": 171 }], "approach": [{ "x": 128, "y": 171 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "frostland", "added": true, "old": false }, { "id": "repeatable-slot:cave:grassland:small:060", "anchor": { "key": "94,43", "x": 94, "y": 43 }, "familyId": "site-family:cave", "tier": "small", "band": 4, "footprint": [{ "x": 189, "y": 87 }], "approach": [{ "x": 190, "y": 87 }], "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "biome": "grassland", "added": true, "old": false }, { "id": "repeatable-slot:fort:volcanic:standard:061", "anchor": { "key": "32,99", "x": 32, "y": 99 }, "familyId": "site-family:fort", "tier": "standard", "band": 2, "footprint": [{ "x": 64, "y": 198 }, { "x": 65, "y": 198 }, { "x": 64, "y": 199 }, { "x": 65, "y": 199 }, { "x": 64, "y": 200 }, { "x": 65, "y": 200 }], "approach": [{ "x": 66, "y": 199 }, { "x": 67, "y": 199 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "volcanic", "added": true, "old": false }, { "id": "repeatable-slot:crypt:frostland:small:062", "anchor": { "key": "110,80", "x": 110, "y": 80 }, "familyId": "site-family:crypt", "tier": "small", "band": 4, "footprint": [{ "x": 221, "y": 161 }], "approach": [{ "x": 222, "y": 161 }], "landmassId": "landmass:major-island:d14l1a:03:578d626c", "biome": "frostland", "added": true, "old": false }, { "id": "repeatable-slot:cave:wetland:small:063", "anchor": { "key": "38,29", "x": 38, "y": 29 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 76, "y": 59 }], "approach": [{ "x": 77, "y": 59 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "wetland", "added": true, "old": false }, { "id": "repeatable-slot:fort:grassland:standard:064", "anchor": { "key": "91,105", "x": 91, "y": 105 }, "familyId": "site-family:fort", "tier": "standard", "band": 3, "footprint": [{ "x": 183, "y": 211 }, { "x": 184, "y": 211 }, { "x": 183, "y": 212 }, { "x": 184, "y": 212 }, { "x": 183, "y": 213 }, { "x": 184, "y": 213 }], "approach": [{ "x": 185, "y": 212 }, { "x": 186, "y": 212 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "grassland", "added": true, "old": false }, { "id": "repeatable-slot:fort:frostland:standard:065", "anchor": { "key": "28,80", "x": 28, "y": 80 }, "familyId": "site-family:fort", "tier": "standard", "band": 4, "footprint": [{ "x": 56, "y": 161 }, { "x": 57, "y": 161 }, { "x": 56, "y": 162 }, { "x": 57, "y": 162 }, { "x": 56, "y": 163 }, { "x": 57, "y": 163 }], "approach": [{ "x": 58, "y": 162 }, { "x": 59, "y": 162 }], "landmassId": "landmass:medium-island:d14l1a:01:83c7b775", "biome": "frostland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:upland:standard:066", "anchor": { "key": "59,130", "x": 59, "y": 130 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 119, "y": 260 }, { "x": 120, "y": 260 }, { "x": 119, "y": 261 }, { "x": 120, "y": 261 }], "approach": [{ "x": 121, "y": 260 }, { "x": 122, "y": 260 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:wetland:standard:067", "anchor": { "key": "32,46", "x": 32, "y": 46 }, "familyId": "site-family:ruin", "tier": "standard", "band": 4, "footprint": [{ "x": 65, "y": 93 }, { "x": 66, "y": 93 }, { "x": 65, "y": 94 }, { "x": 66, "y": 94 }], "approach": [{ "x": 67, "y": 93 }, { "x": 68, "y": 93 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "wetland", "added": true, "old": false }, { "id": "repeatable-slot:cave:volcanic:small:068", "anchor": { "key": "124,41", "x": 124, "y": 41 }, "familyId": "site-family:cave", "tier": "small", "band": 4, "footprint": [{ "x": 249, "y": 83 }], "approach": [{ "x": 250, "y": 83 }], "landmassId": "landmass:medium-island:d14l1a:02:799115ea", "biome": "volcanic", "added": true, "old": false }, { "id": "repeatable-slot:cave:desert:small:069", "anchor": { "key": "78,102", "x": 78, "y": 102 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 156, "y": 205 }], "approach": [{ "x": 157, "y": 205 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "desert", "added": true, "old": false }, { "id": "repeatable-slot:fort:upland:standard:070", "anchor": { "key": "51,105", "x": 51, "y": 105 }, "familyId": "site-family:fort", "tier": "standard", "band": 3, "footprint": [{ "x": 103, "y": 211 }, { "x": 104, "y": 211 }, { "x": 103, "y": 212 }, { "x": 104, "y": 212 }, { "x": 103, "y": 213 }, { "x": 104, "y": 213 }], "approach": [{ "x": 105, "y": 212 }, { "x": 106, "y": 212 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:tropical:standard:071", "anchor": { "key": "119,50", "x": 119, "y": 50 }, "familyId": "site-family:ruin", "tier": "standard", "band": 4, "footprint": [{ "x": 239, "y": 101 }, { "x": 240, "y": 101 }, { "x": 239, "y": 102 }, { "x": 240, "y": 102 }], "approach": [{ "x": 241, "y": 101 }, { "x": 242, "y": 101 }], "landmassId": "landmass:major-island:d14l1a:03:578d626c", "biome": "tropical", "added": true, "old": false }, { "id": "repeatable-slot:fort:volcanic:standard:072", "anchor": { "key": "80,65", "x": 80, "y": 65 }, "familyId": "site-family:fort", "tier": "standard", "band": 4, "footprint": [{ "x": 161, "y": 131 }, { "x": 162, "y": 131 }, { "x": 161, "y": 132 }, { "x": 162, "y": 132 }, { "x": 161, "y": 133 }, { "x": 162, "y": 133 }], "approach": [{ "x": 163, "y": 132 }, { "x": 164, "y": 132 }], "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "biome": "volcanic", "added": true, "old": false }, { "id": "repeatable-slot:ruin:grassland:standard:073", "anchor": { "key": "108,112", "x": 108, "y": 112 }, "familyId": "site-family:ruin", "tier": "standard", "band": 5, "footprint": [{ "x": 217, "y": 225 }, { "x": 218, "y": 225 }, { "x": 217, "y": 226 }, { "x": 218, "y": 226 }], "approach": [{ "x": 219, "y": 225 }, { "x": 220, "y": 225 }], "landmassId": "landmass:medium-island:d14l1a:03:c2624ecc", "biome": "grassland", "added": true, "old": false }, { "id": "repeatable-slot:crypt:wetland:small:074", "anchor": { "key": "46,42", "x": 46, "y": 42 }, "familyId": "site-family:crypt", "tier": "small", "band": 3, "footprint": [{ "x": 93, "y": 85 }], "approach": [{ "x": 94, "y": 85 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "wetland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:grassland:standard:075", "anchor": { "key": "71,135", "x": 71, "y": 135 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 143, "y": 271 }, { "x": 144, "y": 271 }, { "x": 143, "y": 272 }, { "x": 144, "y": 272 }], "approach": [{ "x": 145, "y": 271 }, { "x": 146, "y": 271 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "grassland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:woodland:standard:076", "anchor": { "key": "65,140", "x": 65, "y": 140 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 130, "y": 281 }, { "x": 131, "y": 281 }, { "x": 130, "y": 282 }, { "x": 131, "y": 282 }], "approach": [{ "x": 132, "y": 281 }, { "x": 133, "y": 281 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:cave:desert:small:077", "anchor": { "key": "67,103", "x": 67, "y": 103 }, "familyId": "site-family:cave", "tier": "small", "band": 2, "footprint": [{ "x": 135, "y": 207 }], "approach": [{ "x": 136, "y": 207 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "desert", "added": true, "old": false }, { "id": "repeatable-slot:ruin:desert:standard:078", "anchor": { "key": "76,31", "x": 76, "y": 31 }, "familyId": "site-family:ruin", "tier": "standard", "band": 3, "footprint": [{ "x": 153, "y": 63 }, { "x": 154, "y": 63 }, { "x": 153, "y": 64 }, { "x": 154, "y": 64 }], "approach": [{ "x": 155, "y": 63 }, { "x": 156, "y": 63 }], "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "biome": "desert", "added": true, "old": false }, { "id": "repeatable-slot:ruin:tropical:standard:079", "anchor": { "key": "40,36", "x": 40, "y": 36 }, "familyId": "site-family:ruin", "tier": "standard", "band": 3, "footprint": [{ "x": 80, "y": 73 }, { "x": 81, "y": 73 }, { "x": 80, "y": 74 }, { "x": 81, "y": 74 }], "approach": [{ "x": 82, "y": 73 }, { "x": 83, "y": 73 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "tropical", "added": true, "old": false }, { "id": "repeatable-slot:cave:frostland:small:080", "anchor": { "key": "121,71", "x": 121, "y": 71 }, "familyId": "site-family:cave", "tier": "small", "band": 4, "footprint": [{ "x": 242, "y": 143 }], "approach": [{ "x": 243, "y": 143 }], "landmassId": "landmass:major-island:d14l1a:03:578d626c", "biome": "frostland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:tropical:standard:081", "anchor": { "key": "42,127", "x": 42, "y": 127 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 85, "y": 255 }, { "x": 86, "y": 255 }, { "x": 85, "y": 256 }, { "x": 86, "y": 256 }], "approach": [{ "x": 87, "y": 255 }, { "x": 88, "y": 255 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "tropical", "added": true, "old": false }, { "id": "repeatable-slot:ruin:upland:standard:082", "anchor": { "key": "50,112", "x": 50, "y": 112 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 101, "y": 225 }, { "x": 102, "y": 225 }, { "x": 101, "y": 226 }, { "x": 102, "y": 226 }], "approach": [{ "x": 103, "y": 225 }, { "x": 104, "y": 225 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:cave:woodland:small:083", "anchor": { "key": "57,10", "x": 57, "y": 10 }, "familyId": "site-family:cave", "tier": "small", "band": 4, "footprint": [{ "x": 115, "y": 21 }], "approach": [{ "x": 116, "y": 21 }], "landmassId": "landmass:medium-island:d14l1a:04:961b5a82", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:wetland:standard:084", "anchor": { "key": "65,152", "x": 65, "y": 152 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 131, "y": 305 }, { "x": 132, "y": 305 }, { "x": 131, "y": 306 }, { "x": 132, "y": 306 }], "approach": [{ "x": 133, "y": 305 }, { "x": 134, "y": 305 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "wetland", "added": true, "old": false }, { "id": "repeatable-slot:cave:volcanic:small:085", "anchor": { "key": "110,41", "x": 110, "y": 41 }, "familyId": "site-family:cave", "tier": "small", "band": 4, "footprint": [{ "x": 221, "y": 83 }], "approach": [{ "x": 222, "y": 83 }], "landmassId": "landmass:medium-island:d14l1a:02:799115ea", "biome": "volcanic", "added": true, "old": false }, { "id": "repeatable-slot:ruin:wetland:standard:086", "anchor": { "key": "71,152", "x": 71, "y": 152 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 143, "y": 305 }, { "x": 144, "y": 305 }, { "x": 143, "y": 306 }, { "x": 144, "y": 306 }], "approach": [{ "x": 145, "y": 305 }, { "x": 146, "y": 305 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "wetland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:tropical:standard:087", "anchor": { "key": "125,61", "x": 125, "y": 61 }, "familyId": "site-family:ruin", "tier": "standard", "band": 4, "footprint": [{ "x": 251, "y": 123 }, { "x": 252, "y": 123 }, { "x": 251, "y": 124 }, { "x": 252, "y": 124 }], "approach": [{ "x": 253, "y": 123 }, { "x": 254, "y": 123 }], "landmassId": "landmass:major-island:d14l1a:03:578d626c", "biome": "tropical", "added": true, "old": false }, { "id": "repeatable-slot:ruin:upland:standard:088", "anchor": { "key": "48,92", "x": 48, "y": 92 }, "familyId": "site-family:ruin", "tier": "standard", "band": 3, "footprint": [{ "x": 96, "y": 185 }, { "x": 97, "y": 185 }, { "x": 96, "y": 186 }, { "x": 97, "y": 186 }], "approach": [{ "x": 98, "y": 185 }, { "x": 99, "y": 185 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:cave:woodland:small:089", "anchor": { "key": "46,139", "x": 46, "y": 139 }, "familyId": "site-family:cave", "tier": "small", "band": 1, "footprint": [{ "x": 93, "y": 279 }], "approach": [{ "x": 94, "y": 279 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:crypt:wetland:small:090", "anchor": { "key": "22,70", "x": 22, "y": 70 }, "familyId": "site-family:crypt", "tier": "small", "band": 4, "footprint": [{ "x": 45, "y": 141 }], "approach": [{ "x": 46, "y": 141 }], "landmassId": "landmass:medium-island:d14l1a:01:83c7b775", "biome": "wetland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:volcanic:standard:091", "anchor": { "key": "74,61", "x": 74, "y": 61 }, "familyId": "site-family:ruin", "tier": "standard", "band": 4, "footprint": [{ "x": 149, "y": 123 }, { "x": 150, "y": 123 }, { "x": 149, "y": 124 }, { "x": 150, "y": 124 }], "approach": [{ "x": 151, "y": 123 }, { "x": 152, "y": 123 }], "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "biome": "volcanic", "added": true, "old": false }, { "id": "repeatable-slot:cave:frostland:small:092", "anchor": { "key": "61,78", "x": 61, "y": 78 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 123, "y": 157 }], "approach": [{ "x": 124, "y": 157 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "frostland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:desert:standard:093", "anchor": { "key": "62,108", "x": 62, "y": 108 }, "familyId": "site-family:ruin", "tier": "standard", "band": 3, "footprint": [{ "x": 125, "y": 216 }, { "x": 126, "y": 216 }, { "x": 125, "y": 217 }, { "x": 126, "y": 217 }], "approach": [{ "x": 127, "y": 216 }, { "x": 128, "y": 216 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "desert", "added": true, "old": false }, { "id": "repeatable-slot:crypt:tropical:small:094", "anchor": { "key": "72,40", "x": 72, "y": 40 }, "familyId": "site-family:crypt", "tier": "small", "band": 3, "footprint": [{ "x": 145, "y": 81 }], "approach": [{ "x": 146, "y": 81 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "tropical", "added": true, "old": false }, { "id": "repeatable-slot:fort:grassland:standard:095", "anchor": { "key": "75,124", "x": 75, "y": 124 }, "familyId": "site-family:fort", "tier": "standard", "band": 3, "footprint": [{ "x": 151, "y": 248 }, { "x": 152, "y": 248 }, { "x": 151, "y": 249 }, { "x": 152, "y": 249 }, { "x": 151, "y": 250 }, { "x": 152, "y": 250 }], "approach": [{ "x": 153, "y": 249 }, { "x": 154, "y": 249 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "grassland", "added": true, "old": false }, { "id": "repeatable-slot:crypt:woodland:small:096", "anchor": { "key": "31,124", "x": 31, "y": 124 }, "familyId": "site-family:crypt", "tier": "small", "band": 2, "footprint": [{ "x": 63, "y": 249 }], "approach": [{ "x": 64, "y": 249 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:cave:frostland:small:097", "anchor": { "key": "118,95", "x": 118, "y": 95 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 237, "y": 190 }], "approach": [{ "x": 238, "y": 190 }], "landmassId": "landmass:major-island:d14l1a:03:578d626c", "biome": "frostland", "added": true, "old": false }, { "id": "repeatable-slot:cave:desert:small:098", "anchor": { "key": "55,104", "x": 55, "y": 104 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 111, "y": 209 }], "approach": [{ "x": 112, "y": 209 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "desert", "added": true, "old": false }, { "id": "repeatable-slot:cave:upland:small:099", "anchor": { "key": "89,37", "x": 89, "y": 37 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 178, "y": 75 }], "approach": [{ "x": 179, "y": 75 }], "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:crypt:wetland:small:100", "anchor": { "key": "45,55", "x": 45, "y": 55 }, "familyId": "site-family:crypt", "tier": "small", "band": 4, "footprint": [{ "x": 91, "y": 111 }], "approach": [{ "x": 92, "y": 111 }], "landmassId": "landmass:major-island:d14l1a:01:296d6010", "biome": "wetland", "added": true, "old": false }, { "id": "repeatable-slot:cave:upland:small:101", "anchor": { "key": "48,108", "x": 48, "y": 108 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 97, "y": 217 }], "approach": [{ "x": 98, "y": 217 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "upland", "added": true, "old": false }, { "id": "repeatable-slot:ruin:woodland:standard:102", "anchor": { "key": "30,117", "x": 30, "y": 117 }, "familyId": "site-family:ruin", "tier": "standard", "band": 2, "footprint": [{ "x": 61, "y": 234 }, { "x": 62, "y": 234 }, { "x": 61, "y": 235 }, { "x": 62, "y": 235 }], "approach": [{ "x": 63, "y": 234 }, { "x": 64, "y": 234 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "woodland", "added": true, "old": false }, { "id": "repeatable-slot:cave:desert:small:103", "anchor": { "key": "76,89", "x": 76, "y": 89 }, "familyId": "site-family:cave", "tier": "small", "band": 3, "footprint": [{ "x": 153, "y": 179 }], "approach": [{ "x": 154, "y": 179 }], "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "biome": "desert", "added": true, "old": false }]);

// src/shared/content/ferry_plan_v1.js
var FERRY_NETWORK = freezeWire({ "version": "planned-ferry-v1", "parentRuntime": "db4f2670ae0f3170", "parentAssetHash": "476acfb7307b20243b081588dd885a64dff6f20e90227020011cde946fe7293a", "parentPopulationHash": "e2f7df0763c70e35143d4f032257b28fa9aefd0bc9326c0d140f150575406d2e", "landings": [{ "id": "ferry:alpha:00", "name": "Mainland Harbor", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "classId": "primary-mainland", "biomeId": "biome:grassland", "band": 3, "tile": { "x": 5242, "y": 6138 }, "water": { "x": 5248, "y": 6138 }, "facing": { "x": 1, "y": 0 }, "arrivals": [{ "x": 5242, "y": 6138 }, { "x": 5242, "y": 6136 }, { "x": 5244, "y": 6138 }, { "x": 5242, "y": 6140 }], "approach": [{ "x": 5242, "y": 6138 }, { "x": 5167, "y": 6138 }], "routeJoin": { "x": 5167, "y": 6138 }, "approachTiles": 76, "sourceSlotId": "settlement-slot:village-outpost:06:marine:01", "sourceSettlementId": "settlement-slot:village-outpost:06", "capacityNote": "Accepted ocean-facing settlement marine approach", "search": { "candidates": 1722, "attempts": 1, "nodes": 7199 } }, { "id": "ferry:alpha:01", "name": "Great Island 1 Landing", "landmassId": "landmass:major-island:d14l1a:01:296d6010", "classId": "major-island", "biomeId": "biome:wetland", "band": 4, "tile": { "x": 1938, "y": 1722 }, "water": { "x": 1938, "y": 1715 }, "facing": { "x": 0, "y": -1 }, "arrivals": [{ "x": 1938, "y": 1722 }, { "x": 1938, "y": 1720 }, { "x": 1940, "y": 1722 }, { "x": 1938, "y": 1724 }], "approach": [{ "x": 1938, "y": 1722 }, { "x": 1938, "y": 1729 }], "routeJoin": { "x": 1938, "y": 1729 }, "approachTiles": 8, "sourceSlotId": "settlement-slot:capital-great-hold:02:marine:01", "sourceSettlementId": "settlement-slot:capital-great-hold:02", "capacityNote": "Accepted ocean-facing settlement marine approach", "search": { "candidates": 747, "attempts": 1, "nodes": 102 } }, { "id": "ferry:alpha:02", "name": "Great Island 2 Landing", "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "classId": "major-island", "biomeId": "biome:volcanic", "band": 4, "tile": { "x": 5102, "y": 2758 }, "water": { "x": 5110, "y": 2758 }, "facing": { "x": 1, "y": 0 }, "arrivals": [{ "x": 5102, "y": 2758 }, { "x": 5102, "y": 2756 }, { "x": 5104, "y": 2758 }, { "x": 5102, "y": 2760 }], "approach": [{ "x": 5102, "y": 2758 }, { "x": 5071, "y": 2758 }], "routeJoin": { "x": 5071, "y": 2758 }, "approachTiles": 32, "sourceSlotId": null, "sourceSettlementId": null, "capacityNote": "Dedicated coastal site landing; no faction, future island or other protected chunk consumed", "search": { "candidates": 500, "attempts": 1, "nodes": 1438 } }, { "id": "ferry:alpha:03", "name": "Great Island 3 Landing", "landmassId": "landmass:major-island:d14l1a:03:578d626c", "classId": "major-island", "biomeId": "biome:woodland", "band": 4, "tile": { "x": 7238, "y": 3534 }, "water": { "x": 7231, "y": 3534 }, "facing": { "x": -1, "y": 0 }, "arrivals": [{ "x": 7238, "y": 3534 }, { "x": 7238, "y": 3532 }, { "x": 7240, "y": 3534 }, { "x": 7238, "y": 3536 }], "approach": [{ "x": 7238, "y": 3534 }, { "x": 7262, "y": 3534 }, { "x": 7262, "y": 3563 }, { "x": 7279, "y": 3563 }], "routeJoin": { "x": 7279, "y": 3563 }, "approachTiles": 71, "sourceSlotId": "settlement-slot:city:04:marine:01", "sourceSettlementId": "settlement-slot:city:04", "capacityNote": "Accepted ocean-facing settlement marine approach", "search": { "candidates": 698, "attempts": 1, "nodes": 5922 } }, { "id": "ferry:alpha:04", "name": "Island 1 Landing", "landmassId": "landmass:medium-island:d14l1a:01:83c7b775", "classId": "medium-island", "biomeId": "biome:wetland", "band": 4, "tile": { "x": 2434, "y": 3654 }, "water": { "x": 2434, "y": 3649 }, "facing": { "x": 0, "y": -1 }, "arrivals": [{ "x": 2434, "y": 3654 }, { "x": 2434, "y": 3652 }, { "x": 2436, "y": 3654 }, { "x": 2434, "y": 3656 }], "approach": [{ "x": 2434, "y": 3654 }, { "x": 2434, "y": 3653 }], "routeJoin": { "x": 2434, "y": 3653 }, "approachTiles": 2, "sourceSlotId": null, "sourceSettlementId": null, "capacityNote": "Dedicated coastal site landing; no faction, future island or other protected chunk consumed", "search": { "candidates": 679, "attempts": 1, "nodes": 2 } }, { "id": "ferry:alpha:05", "name": "Island 2 Landing", "landmassId": "landmass:medium-island:d14l1a:02:799115ea", "classId": "medium-island", "biomeId": "biome:desert", "band": 4, "tile": { "x": 7982, "y": 1746 }, "water": { "x": 7989, "y": 1746 }, "facing": { "x": 1, "y": 0 }, "arrivals": [{ "x": 7982, "y": 1746 }, { "x": 7982, "y": 1744 }, { "x": 7984, "y": 1746 }, { "x": 7982, "y": 1748 }], "approach": [{ "x": 7982, "y": 1746 }, { "x": 7975, "y": 1746 }], "routeJoin": { "x": 7975, "y": 1746 }, "approachTiles": 8, "sourceSlotId": null, "sourceSettlementId": null, "capacityNote": "Dedicated coastal site landing; no faction, future island or other protected chunk consumed", "search": { "candidates": 218, "attempts": 1, "nodes": 109 } }, { "id": "ferry:alpha:06", "name": "Island 3 Landing", "landmassId": "landmass:medium-island:d14l1a:03:c2624ecc", "classId": "medium-island", "biomeId": "biome:tropical", "band": 5, "tile": { "x": 7986, "y": 5710 }, "water": { "x": 7995, "y": 5710 }, "facing": { "x": 1, "y": 0 }, "arrivals": [{ "x": 7986, "y": 5710 }, { "x": 7986, "y": 5708 }, { "x": 7988, "y": 5710 }, { "x": 7986, "y": 5712 }], "approach": [{ "x": 7986, "y": 5710 }, { "x": 7986, "y": 5718 }, { "x": 7934, "y": 5718 }, { "x": 7934, "y": 5811 }], "routeJoin": { "x": 7934, "y": 5811 }, "approachTiles": 154, "sourceSlotId": null, "sourceSettlementId": null, "capacityNote": "Dedicated coastal site landing; no faction, future island or other protected chunk consumed", "search": { "candidates": 19, "attempts": 1, "nodes": 17771 } }, { "id": "ferry:alpha:07", "name": "Island 4 Landing", "landmassId": "landmass:medium-island:d14l1a:04:961b5a82", "classId": "medium-island", "biomeId": "biome:woodland", "band": 4, "tile": { "x": 4474, "y": 274 }, "water": { "x": 4480, "y": 274 }, "facing": { "x": 1, "y": 0 }, "arrivals": [{ "x": 4474, "y": 274 }, { "x": 4474, "y": 272 }, { "x": 4476, "y": 274 }, { "x": 4474, "y": 276 }], "approach": [{ "x": 4474, "y": 274 }, { "x": 4474, "y": 273 }, { "x": 4463, "y": 273 }], "routeJoin": { "x": 4463, "y": 273 }, "approachTiles": 13, "sourceSlotId": "settlement-slot:village-outpost:05:marine:01", "sourceSettlementId": "settlement-slot:village-outpost:05", "capacityNote": "Accepted ocean-facing settlement marine approach", "search": { "candidates": 779, "attempts": 1, "nodes": 232 } }], "connections": [{ "id": "ferry-route:ferry:alpha:01", "from": "ferry:alpha:00", "to": "ferry:alpha:01", "bidirectional": true }, { "id": "ferry-route:ferry:alpha:02", "from": "ferry:alpha:00", "to": "ferry:alpha:02", "bidirectional": true }, { "id": "ferry-route:ferry:alpha:03", "from": "ferry:alpha:00", "to": "ferry:alpha:03", "bidirectional": true }, { "id": "ferry-route:ferry:alpha:04", "from": "ferry:alpha:00", "to": "ferry:alpha:04", "bidirectional": true }, { "id": "ferry-route:ferry:alpha:05", "from": "ferry:alpha:00", "to": "ferry:alpha:05", "bidirectional": true }, { "id": "ferry-route:ferry:alpha:06", "from": "ferry:alpha:00", "to": "ferry:alpha:06", "bidirectional": true }, { "id": "ferry-route:ferry:alpha:07", "from": "ferry:alpha:00", "to": "ferry:alpha:07", "bidirectional": true }], "coverage": [{ "reservationId": "repeatable-slot:cave:woodland:small:01", "siteId": "site:d14106e89211e6856de651f731d9c01d", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:cave:desert:standard:01", "siteId": "site:7eee18f257e1dd8e286abc31ffc936d1", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:cave:upland:large:01", "siteId": "site:4e17e793c0cd89c98a40d4e56b2793ac", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:cave:tropical:deep:01", "siteId": "site:d9c7701d9b9395e73e2f93278fdbf268", "landmassId": "landmass:major-island:d14l1a:01:296d6010" }, { "reservationId": "repeatable-slot:cave:desert:small:01", "siteId": "site:187f55bf314156b61be3dba5aed40d01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:cave:frostland:large:01", "siteId": "site:51e63e304f4ee8c65d9f27d2ea4ea6e3", "landmassId": "landmass:major-island:d14l1a:03:578d626c" }, { "reservationId": "repeatable-slot:cave:grassland:small:01", "siteId": "site:b18cb1ff3b9b9dc5fe0f1ec018363ee8", "landmassId": "landmass:medium-island:d14l1a:03:c2624ecc" }, { "reservationId": "repeatable-slot:cave:upland:standard:01", "siteId": "site:7121db385eb3eafd1d0de2f63b962b79", "landmassId": "landmass:medium-island:d14l1a:04:961b5a82" }, { "reservationId": "repeatable-slot:cave:volcanic:deep:01", "siteId": "site:d3c8467a6debcc243695dc42118afa16", "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c" }, { "reservationId": "repeatable-slot:cave:wetland:small:01", "siteId": "site:7f2ef8e9733c98c8e4bbf16c74e83c11", "landmassId": "landmass:major-island:d14l1a:01:296d6010" }, { "reservationId": "repeatable-slot:cave:wetland:standard:01", "siteId": "site:0a0d547d361f87391d8452e6f8396309", "landmassId": "landmass:major-island:d14l1a:01:296d6010" }, { "reservationId": "repeatable-slot:cave:woodland:standard:01", "siteId": "site:70f485b1862ac199814be0b2530e986a", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:fort:grassland:small:01", "siteId": "site:ffe8b1fc8cecccfdb3fb9d44dd6a9aea", "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c" }, { "reservationId": "repeatable-slot:fort:woodland:standard:01", "siteId": "site:11bfa3b7b65142fb1b16282ce202a296", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:fort:tropical:large:01", "siteId": "site:dba6c6435b9bca6d810e5bb462e98f80", "landmassId": "landmass:medium-island:d14l1a:03:c2624ecc" }, { "reservationId": "repeatable-slot:fort:desert:standard:01", "siteId": "site:f4f18e33059ebae951c5efda7927adcd", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:fort:upland:deep:01", "siteId": "site:008569b825d37f670bef85494852022f", "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c" }, { "reservationId": "repeatable-slot:fort:upland:standard:01", "siteId": "site:02a269ea8794bf78db4404a2a38a323d", "landmassId": "landmass:medium-island:d14l1a:04:961b5a82" }, { "reservationId": "repeatable-slot:fort:wetland:small:01", "siteId": "site:0904c59ac05bc284028fc18b3029f7f3", "landmassId": "landmass:medium-island:d14l1a:01:83c7b775" }, { "reservationId": "repeatable-slot:ruin:woodland:small:01", "siteId": "site:4f56d59338391bf09150f20f6fc0a87b", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:ruin:upland:standard:01", "siteId": "site:e0f695606062eb7a85ce00dd45b05b8a", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:ruin:volcanic:large:01", "siteId": "site:4771323d4642197a072f5637cb1e7376", "landmassId": "landmass:medium-island:d14l1a:02:799115ea" }, { "reservationId": "repeatable-slot:ruin:desert:standard:01", "siteId": "site:697285318a41d7cf65e88e0182d8c8cd", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:ruin:frostland:deep:01", "siteId": "site:0b4deace0faad9ece59d8e720f79da22", "landmassId": "landmass:major-island:d14l1a:03:578d626c" }, { "reservationId": "repeatable-slot:ruin:frostland:standard:01", "siteId": "site:d08fd18faf311f7ffa05cfa8bde9aa11", "landmassId": "landmass:medium-island:d14l1a:01:83c7b775" }, { "reservationId": "repeatable-slot:ruin:grassland:small:01", "siteId": "site:df07be841312306cd9aa2d6b4280f159", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:ruin:tropical:small:01", "siteId": "site:1cefe829831df323286a2462e554e4f3", "landmassId": "landmass:major-island:d14l1a:01:296d6010" }, { "reservationId": "repeatable-slot:ruin:wetland:small:01", "siteId": "site:3efb34e4196ff2a0ef998fc7a70d3e06", "landmassId": "landmass:major-island:d14l1a:03:578d626c" }, { "reservationId": "repeatable-slot:crypt:grassland:small:01", "siteId": "site:800b36cde9b897db64bfa945cd595725", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:crypt:upland:standard:01", "siteId": "site:9de05c09fb01ec39abd41f273ac80306", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:crypt:frostland:deep:01", "siteId": "site:6ec0a8b8de3eb59c3633478d2879932f", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }, { "reservationId": "repeatable-slot:crypt:desert:small:01", "siteId": "site:4cfe6569f91776f28741686d64ac7125", "landmassId": "landmass:medium-island:d14l1a:02:799115ea" }, { "reservationId": "repeatable-slot:crypt:frostland:large:01", "siteId": "site:de6f521d5903c22f45195c330e85e6c3", "landmassId": "landmass:major-island:d14l1a:03:578d626c" }, { "reservationId": "repeatable-slot:crypt:wetland:standard:01", "siteId": "site:dd829cb154fad69e6c4bd1caac3a79fb", "landmassId": "landmass:medium-island:d14l1a:01:83c7b775" }, { "reservationId": "repeatable-slot:crypt:woodland:small:01", "siteId": "site:7fe72ebc439393ca1acd958facfe038f", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca" }] });

// src/shared/content/world_roles_v1.js
var WORLD_ROLES_VERSION = "world-roles-v1";
var WORLD_BOSS_ROLES = Object.freeze(["corrosive_abomination", "void_overseer", "chronos_arbitrator", "nexus_overseer", "gilded_vault_keeper", "marcus", "hooktail", "cinderhart", "barrow_king", "sun_pharaoh", "aegis_goliath", "brimstone_colossus"]);
var WORLD_STARTER_ROLES = Object.freeze(["starter-cave", "starter-elite-fort", "advanced-ruin"]);
var WORLD_FACTION_ROLES = Object.freeze(["martial", "stealth", "magic"]);
var CLASSIC_WORLD_ROLES = freezeWire({
  version: WORLD_ROLES_VERSION,
  bosses: { corrosive_abomination: "repeatable-slot:ruin:wetland:standard:033", void_overseer: "repeatable-slot:ruin:frostland:deep:01", chronos_arbitrator: "repeatable-slot:ruin:upland:standard:049", nexus_overseer: "repeatable-slot:ruin:tropical:standard:037", gilded_vault_keeper: "repeatable-slot:crypt:upland:standard:01", marcus: "repeatable-slot:fort:grassland:standard:040", hooktail: "repeatable-slot:ruin:desert:standard:056", cinderhart: "repeatable-slot:ruin:woodland:standard:054", barrow_king: "repeatable-slot:ruin:wetland:standard:067", sun_pharaoh: "repeatable-slot:crypt:frostland:deep:01", aegis_goliath: "repeatable-slot:fort:upland:deep:01", brimstone_colossus: "repeatable-slot:ruin:volcanic:large:01" },
  starterSites: { "starter-cave": "repeatable-slot:cave:woodland:small:089", "starter-elite-fort": "repeatable-slot:fort:woodland:standard:01", "advanced-ruin": "repeatable-slot:ruin:woodland:standard:054" },
  firstCave: "repeatable-slot:cave:woodland:small:109",
  eliteSites: null,
  factionHalls: { martial: "settlement-slot:city:02", stealth: "settlement-slot:city:03", magic: "settlement-slot:city:01" }
});
var settlements = null;
var revision = 0;
var BUILT_SITE_FAMILIES = Object.freeze(["site-family:cave", "site-family:fort", "site-family:ruin", "site-family:crypt"]);
var settlementV1 = (id) => settlements?.get(id) ?? null;
var worldRevisionV1 = () => revision;

// src/shared/content/recovered_boss_catalog_v1.js
var RECOVERED_BOSSES = Object.freeze({
  corrosive_abomination: Object.freeze({
    id: "corrosive_abomination",
    label: "CORROSIVE ABOMINATION",
    site: "repeatable-slot:ruin:wetland:standard:033",
    family: "ruin",
    biome: "wetland",
    color: "#91e56b",
    secondary: "#436f3f",
    adds: 6,
    attacks: Object.freeze({ corrosive_slam: 75, spore_storm: 85, acid_spill: 45 })
  }),
  void_overseer: Object.freeze({
    id: "void_overseer",
    label: "VOID OVERSEER",
    site: "repeatable-slot:ruin:frostland:deep:01",
    family: "ruin",
    biome: "frostland",
    color: "#fa78d5",
    secondary: "#38234a",
    adds: 0,
    attacks: Object.freeze({ eye_lance: 75, singularity: 360 })
  }),
  chronos_arbitrator: Object.freeze({
    id: "chronos_arbitrator",
    label: "CHRONOS ARBITRATOR",
    site: "repeatable-slot:ruin:upland:standard:049",
    family: "ruin",
    biome: "upland",
    color: "#e8c874",
    secondary: "#536c8a",
    adds: 0,
    attacks: Object.freeze({ chronos_slam: 75, time_field: 60, chronos_rewind: 240 })
  }),
  nexus_overseer: Object.freeze({
    id: "nexus_overseer",
    label: "NEXUS OVERSEER",
    site: "repeatable-slot:ruin:tropical:standard:037",
    family: "ruin",
    biome: "tropical",
    color: "#5cecf5",
    secondary: "#a078ff",
    adds: 2,
    attacks: Object.freeze({ prism_collapse: 110, control_glitch: 60, prism_slam: 75 })
  }),
  gilded_vault_keeper: Object.freeze({
    id: "gilded_vault_keeper",
    label: "GILDED VAULT KEEPER",
    site: "repeatable-slot:crypt:upland:standard:01",
    family: "crypt",
    biome: "upland",
    color: "#ffd16a",
    secondary: "#aa3155",
    adds: 0,
    attacks: Object.freeze({ vault_crush: 75, gold_fall: 75, taxation: 240 })
  }),
  marcus: Object.freeze({
    id: "marcus",
    label: "GOLDSPUR THE OUTLAW",
    site: "repeatable-slot:fort:grassland:standard:040",
    family: "fort",
    biome: "grassland",
    color: "#ffb968",
    secondary: "#bd4d39",
    adds: 0,
    attacks: Object.freeze({ coin_barrage: 65, gold_rush: 55, gilded_lasso: 55, inversion: 80, molten_shield: 240 })
  }),
  hooktail: Object.freeze({
    id: "hooktail",
    label: "ASHFANG",
    site: "repeatable-slot:ruin:desert:standard:056",
    family: "ruin",
    biome: "desert",
    color: "#ef5b57",
    secondary: "#63283a",
    adds: 0,
    attacks: Object.freeze({ scarlet_fire: 90, hooked_tail: 70, arena_collapse: 100 })
  }),
  cinderhart: Object.freeze({
    id: "cinderhart",
    label: "CINDERHART",
    site: "repeatable-slot:ruin:woodland:standard:054",
    family: "ruin",
    biome: "woodland",
    color: "#ff983e",
    secondary: "#432b25",
    adds: 5,
    attacks: Object.freeze({ warren_call: 60, fire_charge: 54 })
  })
});
var RECOVERED_BOSS_IDS = Object.freeze(Object.keys(RECOVERED_BOSSES));

// src/shared/content/corrosive_shedding_v4.js
var CORROSIVE_SHEDDING_V4 = Object.freeze({ version: 4, stepPercent: 8, maxLive: 6, maxDamageSheds: 12, maxLiveSlag: 2, slagEveryChunks: 3, flightTicks: 18, coalescenceTicks: 12 });

// src/shared/content/biome_bosses_v1.js
var BIOME_BOSSES_V1 = Object.freeze({
  barrow_king: Object.freeze({
    id: "barrow_king",
    label: "BARROW KING",
    site: "repeatable-slot:ruin:wetland:standard:067",
    family: "ruin",
    biome: "grassland",
    color: "#9be37a",
    secondary: "#5a2f6e",
    adds: 4,
    summonKind: "wight",
    attacks: Object.freeze({ grave_cleave: 70, crown_flame: 80, barrow_call: 60 })
  }),
  sun_pharaoh: Object.freeze({
    id: "sun_pharaoh",
    label: "SUN PHARAOH",
    site: "repeatable-slot:crypt:frostland:deep:01",
    family: "crypt",
    biome: "desert",
    color: "#ffcf4a",
    secondary: "#2f5fa8",
    adds: 4,
    summonKind: "scarab",
    attacks: Object.freeze({ solar_beam: 75, sunfall: 90, scarab_swarm: 60 })
  })
});
var BIOME_BOSS_IDS_V1 = Object.freeze(Object.keys(BIOME_BOSSES_V1));
var BIOME_BOSS_DAMAGE_V1 = Object.freeze({ grave_cleave: 19, crown_flame: 15, solar_beam: 17, sunfall: 15 });
var BIOME_BOSS_REACH_V1 = Object.freeze({ grave_cleave: 78, crown_flame: 70, solar_beam: 280, solarBeamHalfWidth: 24, sunfall: 40 });
var BIOME_BOSS_POOLS_V1 = Object.freeze({ ghostfire: Object.freeze([44, 300]), sunfire: Object.freeze([30, 240]) });

// src/shared/content/recovered_boss_catalog_v4.js
var RECOVERED_BOSSES2 = Object.freeze({ ...RECOVERED_BOSSES, corrosive_abomination: Object.freeze({ ...RECOVERED_BOSSES.corrosive_abomination, adds: CORROSIVE_SHEDDING_V4.maxDamageSheds, sheddingPolicy: 4 }), ...BIOME_BOSSES_V1 });

// src/shared/content/world_profile_d9.js
var D9_PROFILE = freezeWire({
  version: "world-geography-d9-v1",
  coordinateVersion: "world-address-d9-v1",
  progressionPolicy: "effective-level-depth-d9-v1",
  chunkWidth: 1024,
  chunkHeight: 832,
  tileSize: 32,
  regionChunks: 8,
  coordinateDigits: 256,
  biomes: ["woodland", "rocky-uplands", "marsh"],
  floorBands: [[1, 5], [6, 10], [11, 20], [21, 40], [41, 80]],
  lowFloorPercent: 20,
  anomalyPercent: 10,
  originCollarChunks: 1,
  renewalVacancyTicks: 18e3,
  prepareRadius: 768,
  leaveRadius: 960,
  projectionRadius: 900,
  placementSafetyRadius: 384,
  placementCandidates: 64,
  residentRadiusChunks: 2,
  preloadRadiusChunks: 3,
  softActors: 24,
  hardActors: 48,
  minimapWidth: 128,
  minimapHeight: 96,
  mapTileBudget: 128,
  siteSocketVersion: "site-socket-d9-v1",
  siteSocketSlots: 1,
  siteSocketChanceDenominator: 8
});

// src/shared/contracts/local_world_frames_d9.js
var FRAME_CHUNKS = 64;
var STRIDE = FRAME_CHUNKS * 2 * D9_PROFILE.chunkWidth;

// src/shared/content/boss_hosting_v1.js
var BOSS_HOSTING_VERSION = "site-boss-hosting-v1";
var BOSS_HOSTING_POLICY = freezeWire({ version: BOSS_HOSTING_VERSION, parentRuntime: "c36909555b042989", parentGeneration: "core-families-multiroom-v1", playerCount: 4, playerHull: 9, bossHull: 34, roomSelection: "explicit-final-reward", preserveGeometry: true, preserveRosterIdentities: true, preserveAttacks: true, partyStagingSeparation: 64, partyArrivalVersion: "site-party-arrival-v1", missingBoss: "structured-hard-failure", supportHullUpperBound: 20, scope: "constructed-arena-capacity-not-network-or-balance-approval" });

// src/shared/generation/forest_stands_v2.js
var FOREST_STANDS_VERSION = "forest-stands-v2";
var FOREST_STANDS_PREFIX = FOREST_STANDS_VERSION + ":";
var FOREST_STAND_PROFILES = Object.freeze({
  w: { glade: 0.36, forest: 0.5, core: 0.8, treeOpen: 0.34, treeForest: 0.92, lone: 0.05, massCore: 0.9, massForest: 0.06, cover: "fern", coverAt: 0.66, water: 0, height: 0 },
  t: { glade: 0.2, forest: 0.32, core: 0.62, treeOpen: 0.5, treeForest: 0.96, lone: 0.08, massCore: 0.95, massForest: 0.3, cover: "fern", coverAt: 0.56, water: 0.06, height: 0, grove: "bamboo" },
  m: { glade: 0.4, forest: 0.56, core: 0.84, treeOpen: 0.3, treeForest: 0.86, lone: 0.06, massCore: 0.8, massForest: 0.05, cover: "reed", coverAt: 0.48, water: 0.42, height: 0 },
  a: { scale: 0.5, glade: 0.68, forest: 0.79, core: 0.95, treeOpen: 0.22, treeForest: 0.9, lone: 0.035, massCore: 0.7, massForest: 0, cover: "grass", coverAt: 0.58, water: 0.2, height: 0, hedges: true },
  r: { glade: 0.44, forest: 0.56, core: 0.86, treeOpen: 0.28, treeForest: 0.88, lone: 0.03, massCore: 0.6, massForest: 0, cover: "heather", coverAt: 0.54, water: 0.08, height: 0.55, outcrop: 0.7 },
  s: { glade: 0.44, forest: 0.56, core: 0.88, treeOpen: 0.26, treeForest: 0.9, lone: 0.03, massCore: 0.5, massForest: 0, cover: null, coverAt: 1, water: 0, height: 0.5, outcrop: 0.74 },
  d: { glade: 0.64, forest: 2, core: 2, treeOpen: 0.2, treeForest: 0, lone: 0.018, massCore: 0, massForest: 0, cover: null, coverAt: 1, water: 0.9, height: 0, outcrop: 0.7, oasis: true },
  l: { glade: 0.56, forest: 2, core: 2, treeOpen: 0.38, treeForest: 0, lone: 0.02, massCore: 0, massForest: 0, cover: null, coverAt: 1, water: 0, height: 0, outcrop: 0.62 }
});
var STAND_ZONE = Object.freeze({ GLADE: 0, OPEN: 1, FOREST: 2, CORE: 3 });
var ROCK_MASSES = Object.freeze(["outcrop", "mesa", "lava-rock"]);

// src/shared/contracts/integer_domain.js
var INTEGER_MAX_DIGITS = 65536;

// src/shared/contracts/combat_amount.js
var DIGITS = INTEGER_MAX_DIGITS * 2 + 32;

// src/shared/content/world_combat_v1.js
var WORLD_COMBAT_VERSION = "world-combat-hordes-progression-v1";
var WORLD_COMBAT_POLICY = freezeWire({ version: WORLD_COMBAT_VERSION, parentRuntime: "3da5e7e40452aa32", reviewRevision: 3, parentCombatRuntime: "f474d024b06426c4", bandLevels: [1, 6, 11, 21, 41], primary: { reachClearHullGapPixels: 32, forwardDotMinimum: 0.1, cleaveTargetsByCombo: [4, 6, 8], cadence: "existing 22/24/40 tick combo, movement multipliers unchanged" }, forge: { firstAttuneGold: 30, firstAttuneSouls: 2, flatAttackPerWeaponAttune: 2, flatArmorHpPerAttune: 8, enchantSlotLevel: 3, pricing: "World progression successor; Dungeon mechanics and UI retained" }, ordinaryPack: [6, 12], floorPacks: { small: 3, standard: 3, large: 4, deep: 4 }, floorPackSize: [6, 8], maximumFloorMembers: 40, activeActors: 192, retainedSiteActors: 4096, retainedSiteGroups: 128, worldActors: 192, renewalVacancyTicks: 18e3, gearChancePercent: 10, soulChancePercent: 35, equipmentLevel: "encounter level equals item power; regional minimum and participant escalation preserved", ordinaryStats: "HP=(30+6*(L-1)+(L-1)^2/8)*familyHP/45*rank; damage=(3+2*(L-1))*familyDamage/6*rank", xp: "per recipient: reward level min(locked encounter level,hero level+2); base1+integerSqrt(reward level); rankC100/B140/A200/S300hundredths, elitex3 or bossx15atC, ceil rank reward; multiply4/(4+max(abs(enemy level-hero level)-2,0)^2),floor and allow0; mastery applies afterward", levelGap: { graceLevels: 2, outgoing: "4/(4+max(enemy level-hero level-2,0)^2)", incoming: "min(4,(4+max(enemy level-hero level-2,0)^2)/4)", policy: "Deterministic per-recipient frozen enemy level and current hero level; every delivered damage packet once, after attack/crit and before wards, barrier or defense; no random misses" }, engagement: { threat: "actor-relative threat with frozen encounter level retained", initialAcquireLineOfSight: true, attackLineOfSight: true, interiorPursuitMemoryTicks: 600, disengageTicks: 120, returnHealing: false }, equipmentRequirement: "World combat generated itemPower <= hero level; higher-level finds remain owned, sellable and salvageable", rarity: { unit: "basis points", status: "provisional World tuning; natural drops unlock Legendary at21 and Mythic at41; existing Awaken path retained", below21: { ordinary: [7e3, 2400, 500, 100, 0, 0], completion: [0, 6500, 3e3, 500, 0, 0] }, from21: { ordinary: [7e3, 2400, 500, 95, 5, 0], completion: [0, 6500, 3e3, 450, 50, 0] }, from41: { ordinary: [7e3, 2400, 500, 90, 9, 1], completion: [0, 6500, 3e3, 400, 90, 10] } }, economy: "enemy gold 1+level/4; chest 20+4*level and guaranteed gear; elite gold x3 and guaranteed gear", safety: "all settlement/site/faction/future-island protected chunks plus one-chunk collar; ferry and spawn safety; prepare at 768px, no placement within 384px of any actor", respawn: "existing 18000 active tick vacant cleared encounter renewal, unresolved ownership gates retained", simulation: "60Hz unchanged; spatial activation, separation, LOS and interior navigation retained" });

// src/shared/content/settlement_life_alpha_v1.js
var LIFE_VILLAGE_ID = "settlement-slot:village-outpost:02";
var LIFE_VILLAGE_ORIGIN = freezeWire({ x: 4480, y: 7592 });
var LIFE_NPCS = freezeWire([
  { id: "civilian:alpha:town:mara", name: "Mara", role: "general", roleLabel: "General merchant", settlementId: "settlement-slot:town:05", buildingId: "town-open:roof:004", band: 3, tile: { x: 5912, y: 5750 }, space: "exterior", color: "#567867" },
  { id: "civilian:alpha:town:bren", name: "Bren", role: "smith", roleLabel: "Smith", settlementId: "settlement-slot:town:05", buildingId: "town-open:roof:006", band: 3, tile: { x: 5870, y: 5778 }, space: "exterior", color: "#82604b" },
  { id: "civilian:alpha:town:ada", name: "Ada", role: "innkeeper", roleLabel: "Innkeeper", settlementId: "settlement-slot:town:05", buildingId: "town-open:roof:008", band: 3, tile: { x: 9, y: 6 }, space: "tavern-ground", color: "#876657" },
  { id: "civilian:alpha:village:ila", name: "Ila", role: "general", roleLabel: "General merchant", settlementId: LIFE_VILLAGE_ID, buildingId: "village:roof:002", band: 2, tile: { x: 4497, y: 7610 }, space: "exterior", color: "#58766d" },
  { id: "civilian:alpha:village:oren", name: "Oren", role: "smith", roleLabel: "Smith", settlementId: LIFE_VILLAGE_ID, buildingId: "village:roof:003", band: 2, tile: { x: 4532, y: 7607 }, space: "exterior", color: "#8d6c49" },
  { id: "civilian:alpha:village:nell", name: "Nell", role: "innkeeper", roleLabel: "Innkeeper \xB7 tavern veranda", settlementId: LIFE_VILLAGE_ID, buildingId: "village:roof:002", band: 2, tile: { x: 4499, y: 7610 }, space: "exterior", color: "#81657a" }
]);

// src/shared/content/world_towns_v1.js
var TAVERN_TOWN_ID = "settlement-slot:town:05";
var TAVERN_TOWN_ORIGIN = freezeWire({ x: 5824, y: 5720 });
var CORNERS = { [STARTER_VILLAGE_ID]: STARTER_VILLAGE_ORIGIN, [LIFE_VILLAGE_ID]: LIFE_VILLAGE_ORIGIN, [TAVERN_TOWN_ID]: TAVERN_TOWN_ORIGIN };
var townOriginV1 = (id) => settlementV1(id)?.tileOrigin ?? CORNERS[id];
function townTileV1(id, t) {
  const c = CORNERS[id], o = townOriginV1(id);
  return o.x === c.x && o.y === c.y ? t : { x: t.x - c.x + o.x, y: t.y - c.y + o.y };
}
function perWorldV1(make) {
  let at = -1, value;
  return () => {
    if (at !== worldRevisionV1()) {
      value = make();
      at = worldRevisionV1();
    }
    return value;
  };
}
var moved = (list, place) => {
  const out = list.map(place);
  return out.every((v, i) => v === list[i]) ? list : freezeWire(out);
};
var townTilesV1 = (id, list) => moved(list, (t) => townTileV1(id, t));
var starterArrivalTilesV1 = perWorldV1(() => townTilesV1(STARTER_VILLAGE_ID, STARTER_ARRIVAL_TILES));

// src/shared/content/settlement_services_v2.js
var SERVICES_V2 = "settlement-services-candidate-v2";
var SERVICE_ASSIGNMENTS = freezeWire({ "civilian:alpha:town:bren": ["attune", "reforge", "awaken", "shatter", "materials"], "civilian:alpha:town:selene": ["enchant", "purge", "resonance", "shatter", "materials"] });
var SPECIALIST_NPC = freezeWire({ id: "civilian:alpha:town:selene", name: "Selene", role: "enchanter", roleLabel: "Enchanter", settlementId: "settlement-slot:town:05", buildingId: "town-open:roof:007", band: 3, tile: { x: 5910, y: 5754 }, space: "exterior", color: "#806b9e" });
var WORKSHOP_POLICY = freezeWire({ version: SERVICES_V2, serviceAssignments: SERVICE_ASSIGNMENTS, parent: "4af4d3519fb954a5161c799771d79e69ced9955044fb690fc78e6333a3fec8c4", stock: "unchanged personal band-derived ordinary gear; no wall-clock refresh", materials: { "Eridium Shard": "300", "Overlord's Sigil": "250", "Astral Essence": "500" }, reforge: "Dungeon execution formula: floor(150 * 1.045^((itemPower-1)*5) * 2^stars), 1 Sigil; one mutable affix", awaken: "2500*(stars+1) gold, stars+1 Eridium, 5*(stars+1) target-tier scrap; same family and base identity; scaled existing affixes and one additional eligible line", enchant: "2+ stars, slot level 50+, 1 Astral Essence, one random active stat +25%, stars-1 capacity", purge: "1000*itemPower*max(stars,1) gold; remove enchants only", resonance: "Dungeon gold curve, 25+25*stars Monster Souls; World-supported stat sets, two/three-piece bonuses", shatter: "World ordinary salvage; protected/Unique/Sigil destruction forbidden. Dungeon Spectral Codex has no World authority", priceDomain: { maximumItemPower: 1e3 }, limits: { modifiedItems: 64, operationsPerItem: 32, materialPurchasesPerKind: 1e6 }, setMultipliers: "Dungeon constants.js: cumulative two/three-piece thresholds; eleven active-combat sets; inactive idle lines excluded" });
var ORDINARY_SERVICE_NPCS = freezeWire([...LIFE_NPCS, ...STARTER_NPCS]);

// src/shared/content/settlement_life_v1.js
var SETTLEMENT_LIFE_VERSION = "settlement-life-candidate-v1";
var SETTLEMENT_LIFE_POLICY = freezeWire({
  version: SETTLEMENT_LIFE_VERSION,
  interactionRadius: 72,
  stockVersion: "ordinary-personal-stock-v1",
  pricingVersion: "ordinary-services-prices-v1",
  saleVersion: "ordinary-carried-sale-v1",
  supply: { id: "field-ration", label: "Field ration", price: "2", maximum: 10, recoveryPercent: 15 },
  rest: { price: "5", effect: "Recover all missing HP. No time passes; no dungeon reset or resurrection." },
  stockByRole: {
    general: [
      { id: "travel-boots", label: "Travel boots", family: "boots", definitionId: "sabatons", price: "12" },
      { id: "simple-ring", label: "Simple ring", family: "ring", definitionId: "copper-charm", price: "15" }
    ],
    smith: [
      { id: "ordinary-weapon", label: "Ordinary weapon", family: "weapon", definitionId: "iron-sword", price: "18" },
      { id: "ordinary-armor", label: "Ordinary chest armor", family: "chest", definitionId: "padded-armor", price: "16" }
    ]
  },
  stockLevelRule: "accepted-territory-minimum-level-1-6-11-21-41",
  gearPriceRule: "base-price-times-territory-band",
  bandSourceDepth: { 1: 1, 2: 20, 3: 40, 4: 80, 5: 160 },
  gearRarity: 0,
  sale: {
    baseGold: 1,
    perItemPower: 1,
    maximumRarity: 5,
    maximumValuationPower: 1e3,
    perRarityTier: 2,
    retainedReceiptBound: 128,
    retirement: "after-authoritative-site-reward-archival-keep-durable-SOLD-page",
    excludes: ["equipped", "starter", "provision", "locked", "protected", "unique", "artifact", "sigil", "unprovenanced"]
  },
  recovery: "existing-exact-HP-arithmetic",
  timeSkipping: false,
  sharedStock: false,
  transactionFence: "actor-inventory-revision-and-normal-command-sequence",
  maximumPurchaseRecords: 16,
  maximumRests: 1e6,
  maximumSupplyPurchases: 1e6
});

// src/shared/content/multiroom_policy_v1.js
var MULTIROOM_VERSION = "core-families-multiroom-v1";
var MULTIROOM_POLICY = freezeWire({ version: MULTIROOM_VERSION, parentRuntime: "c224c9e8b940ebab", floors: { small: 1, standard: 2, large: 3, deep: 4 }, rooms: { small: [4, 5], standard: [5, 6], large: [6, 7], deep: [7, 8] }, maximumAttempts: 48, minimumStairRouteTiles: 32, minimumStairRoomEdges: 3, corridorWidthTiles: 5, maximumFloorTiles: [80, 44], allowQuarterTurn: true, wholeFloorOccupancyRadius: 1500, maximumOrdinaryActorsPerFloor: 5, encounterCounts: { fort: 3, ruin: { small: 2, standard: 3, large: 4, deep: 5 }, crypt: { small: 3, standard: 4, large: 4, deep: 4 } }, preserveGearProvenanceRosterCounts: true, exteriorAndSiteIdentitiesUnchanged: true, stairSelection: "farthest-safe-room-by-walkable-route-with-optional-branch", generation: "seeded-connected-room-graph-family-grammar", oldSaveMigration: false });

// src/shared/content/seeded_world_v1.js
function presentSeededWorldV1(a) {
  return {
    ...a,
    assetId: "alpha",
    wildernessExtension: a.wildernessExtension && { ...a.wildernessExtension, version: WILDERNESS_VERSION, hash: WILDERNESS_HASH },
    firstJourney: a.firstJourney && { ...a.firstJourney, version: ACCESS_VERSION, hash: ACCESS_HASH },
    worldReshape: a.worldReshape && { ...a.worldReshape, version: RESHAPE_VERSION, hash: RESHAPE_HASH }
  };
}

// src/shared/content/alpha_site_population_v1.js
var ALPHA_POPULATION_VERSION = "planned-alpha-site-population-v1";
var ALPHA_POPULATION_HASH = "e2f7df0763c70e35143d4f032257b28fa9aefd0bc9326c0d140f150575406d2e";
var ALPHA_POPULATION_BASE_HASH = "476acfb7307b20243b081588dd885a64dff6f20e90227020011cde946fe7293a";
var ALPHA_POPULATION_SELECTIONS = freezeWire([{ "anchor": { "key": "35,116", "x": 35, "y": 116 }, "approach": [{ "x": 71, "y": 232 }], "band": 2, "familyId": "site-family:cave", "footprint": [{ "x": 70, "y": 232 }], "id": "repeatable-slot:cave:woodland:small:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "small", "biome": "woodland", "old": true, "added": false }, { "anchor": { "key": "77,95", "x": 77, "y": 95 }, "approach": [{ "x": 155, "y": 190 }], "band": 3, "familyId": "site-family:cave", "footprint": [{ "x": 154, "y": 190 }], "id": "repeatable-slot:cave:desert:standard:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "standard", "biome": "desert", "old": true, "added": false }, { "anchor": { "key": "32,110", "x": 32, "y": 110 }, "approach": [{ "x": 65, "y": 220 }], "band": 2, "familyId": "site-family:cave", "footprint": [{ "x": 64, "y": 220 }], "id": "repeatable-slot:cave:upland:large:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "large", "biome": "upland", "old": true, "added": false }, { "anchor": { "key": "58,36", "x": 58, "y": 36 }, "approach": [{ "x": 117, "y": 72 }], "band": 3, "familyId": "site-family:cave", "footprint": [{ "x": 116, "y": 72 }], "id": "repeatable-slot:cave:tropical:deep:01", "landmassId": "landmass:major-island:d14l1a:01:296d6010", "tier": "deep", "biome": "tropical", "old": true, "added": false }, { "anchor": { "key": "88,45", "x": 88, "y": 45 }, "approach": [{ "x": 177, "y": 89 }, { "x": 178, "y": 89 }], "band": 3, "familyId": "site-family:fort", "footprint": [{ "x": 175, "y": 89 }, { "x": 176, "y": 89 }, { "x": 175, "y": 90 }, { "x": 176, "y": 90 }], "id": "repeatable-slot:fort:grassland:small:01", "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "tier": "small", "biome": "grassland", "old": true, "added": false }, { "anchor": { "key": "21,128", "x": 21, "y": 128 }, "approach": [{ "x": 43, "y": 255 }, { "x": 44, "y": 255 }], "band": 1, "familyId": "site-family:fort", "footprint": [{ "x": 41, "y": 254 }, { "x": 42, "y": 254 }, { "x": 41, "y": 255 }, { "x": 42, "y": 255 }, { "x": 41, "y": 256 }, { "x": 42, "y": 256 }], "id": "repeatable-slot:fort:woodland:standard:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "standard", "biome": "woodland", "old": true, "added": false }, { "anchor": { "key": "125,110", "x": 125, "y": 110 }, "approach": [{ "x": 249, "y": 223 }, { "x": 249, "y": 224 }, { "x": 249, "y": 225 }], "band": 5, "familyId": "site-family:fort", "footprint": [{ "x": 248, "y": 220 }, { "x": 249, "y": 220 }, { "x": 250, "y": 220 }, { "x": 248, "y": 221 }, { "x": 249, "y": 221 }, { "x": 250, "y": 221 }, { "x": 248, "y": 222 }, { "x": 249, "y": 222 }, { "x": 250, "y": 222 }], "id": "repeatable-slot:fort:tropical:large:01", "landmassId": "landmass:medium-island:d14l1a:03:c2624ecc", "tier": "large", "biome": "tropical", "old": true, "added": false }, { "anchor": { "key": "39,132", "x": 39, "y": 132 }, "approach": [{ "x": 79, "y": 263 }], "band": 1, "familyId": "site-family:ruin", "footprint": [{ "x": 78, "y": 263 }, { "x": 78, "y": 264 }], "id": "repeatable-slot:ruin:woodland:small:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "small", "biome": "woodland", "old": true, "added": false }, { "anchor": { "key": "38,100", "x": 38, "y": 100 }, "approach": [{ "x": 77, "y": 199 }, { "x": 78, "y": 199 }], "band": 3, "familyId": "site-family:ruin", "footprint": [{ "x": 75, "y": 199 }, { "x": 76, "y": 199 }, { "x": 75, "y": 200 }, { "x": 76, "y": 200 }], "id": "repeatable-slot:ruin:upland:standard:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "standard", "biome": "upland", "old": true, "added": false }, { "anchor": { "key": "125,36", "x": 125, "y": 36 }, "approach": [{ "x": 251, "y": 71 }, { "x": 252, "y": 71 }], "band": 4, "familyId": "site-family:ruin", "footprint": [{ "x": 249, "y": 70 }, { "x": 250, "y": 70 }, { "x": 249, "y": 71 }, { "x": 250, "y": 71 }, { "x": 249, "y": 72 }, { "x": 250, "y": 72 }], "id": "repeatable-slot:ruin:volcanic:large:01", "landmassId": "landmass:medium-island:d14l1a:02:799115ea", "tier": "large", "biome": "volcanic", "old": true, "added": false }, { "anchor": { "key": "59,138", "x": 59, "y": 138 }, "approach": [{ "x": 119, "y": 276 }], "band": 2, "familyId": "site-family:crypt", "footprint": [{ "x": 118, "y": 276 }], "id": "repeatable-slot:crypt:grassland:small:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "small", "biome": "grassland", "old": true, "added": false }, { "anchor": { "key": "74,111", "x": 74, "y": 111 }, "approach": [{ "x": 149, "y": 222 }], "band": 3, "familyId": "site-family:crypt", "footprint": [{ "x": 148, "y": 222 }], "id": "repeatable-slot:crypt:upland:standard:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "standard", "biome": "upland", "old": true, "added": false }, { "anchor": { "key": "69,78", "x": 69, "y": 78 }, "approach": [{ "x": 138, "y": 157 }], "band": 3, "familyId": "site-family:crypt", "footprint": [{ "x": 138, "y": 156 }], "id": "repeatable-slot:crypt:frostland:deep:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "deep", "biome": "frostland", "old": true, "added": false }, { "anchor": { "key": "72,87", "x": 72, "y": 87 }, "approach": [{ "x": 145, "y": 174 }], "band": 3, "familyId": "site-family:cave", "footprint": [{ "x": 144, "y": 174 }], "id": "repeatable-slot:cave:desert:small:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "small", "biome": "desert", "old": false, "added": false }, { "anchor": { "key": "113,72", "x": 113, "y": 72 }, "approach": [{ "x": 227, "y": 144 }], "band": 4, "familyId": "site-family:cave", "footprint": [{ "x": 226, "y": 144 }], "id": "repeatable-slot:cave:frostland:large:01", "landmassId": "landmass:major-island:d14l1a:03:578d626c", "tier": "large", "biome": "frostland", "old": false, "added": false }, { "anchor": { "key": "112,120", "x": 112, "y": 120 }, "approach": [{ "x": 225, "y": 240 }], "band": 5, "familyId": "site-family:cave", "footprint": [{ "x": 224, "y": 240 }], "id": "repeatable-slot:cave:grassland:small:01", "landmassId": "landmass:medium-island:d14l1a:03:c2624ecc", "tier": "small", "biome": "grassland", "old": false, "added": false }, { "anchor": { "key": "63,12", "x": 63, "y": 12 }, "approach": [{ "x": 127, "y": 24 }], "band": 4, "familyId": "site-family:cave", "footprint": [{ "x": 126, "y": 24 }], "id": "repeatable-slot:cave:upland:standard:01", "landmassId": "landmass:medium-island:d14l1a:04:961b5a82", "tier": "standard", "biome": "upland", "old": false, "added": false }, { "anchor": { "key": "79,56", "x": 79, "y": 56 }, "approach": [{ "x": 159, "y": 112 }], "band": 4, "familyId": "site-family:cave", "footprint": [{ "x": 158, "y": 112 }], "id": "repeatable-slot:cave:volcanic:deep:01", "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "tier": "deep", "biome": "volcanic", "old": false, "added": false }, { "anchor": { "key": "35,55", "x": 35, "y": 55 }, "approach": [{ "x": 71, "y": 110 }], "band": 4, "familyId": "site-family:cave", "footprint": [{ "x": 70, "y": 110 }], "id": "repeatable-slot:cave:wetland:small:01", "landmassId": "landmass:major-island:d14l1a:01:296d6010", "tier": "small", "biome": "wetland", "old": false, "added": false }, { "anchor": { "key": "47,50", "x": 47, "y": 50 }, "approach": [{ "x": 95, "y": 100 }], "band": 4, "familyId": "site-family:cave", "footprint": [{ "x": 94, "y": 100 }], "id": "repeatable-slot:cave:wetland:standard:01", "landmassId": "landmass:major-island:d14l1a:01:296d6010", "tier": "standard", "biome": "wetland", "old": false, "added": false }, { "anchor": { "key": "19,122", "x": 19, "y": 122 }, "approach": [{ "x": 39, "y": 244 }], "band": 1, "familyId": "site-family:cave", "footprint": [{ "x": 38, "y": 244 }], "id": "repeatable-slot:cave:woodland:standard:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "standard", "biome": "woodland", "old": false, "added": false }, { "anchor": { "key": "112,33", "x": 112, "y": 33 }, "approach": [{ "x": 225, "y": 66 }], "band": 4, "familyId": "site-family:crypt", "footprint": [{ "x": 224, "y": 66 }], "id": "repeatable-slot:crypt:desert:small:01", "landmassId": "landmass:medium-island:d14l1a:02:799115ea", "tier": "small", "biome": "desert", "old": false, "added": false }, { "id": "repeatable-slot:crypt:frostland:large:01", "familyId": "site-family:crypt", "tier": "large", "landmassId": "landmass:major-island:d14l1a:03:578d626c", "band": 4, "anchor": { "key": "118,73", "x": 118, "y": 73 }, "footprint": [{ "x": 236, "y": 146 }], "approach": [{ "x": 237, "y": 146 }], "biome": "frostland", "old": false, "added": true }, { "anchor": { "key": "32,70", "x": 32, "y": 70 }, "approach": [{ "x": 65, "y": 140 }], "band": 4, "familyId": "site-family:crypt", "footprint": [{ "x": 64, "y": 140 }], "id": "repeatable-slot:crypt:wetland:standard:01", "landmassId": "landmass:medium-island:d14l1a:01:83c7b775", "tier": "standard", "biome": "wetland", "old": false, "added": false }, { "anchor": { "key": "39,122", "x": 39, "y": 122 }, "approach": [{ "x": 79, "y": 244 }], "band": 2, "familyId": "site-family:crypt", "footprint": [{ "x": 78, "y": 244 }], "id": "repeatable-slot:crypt:woodland:small:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "small", "biome": "woodland", "old": false, "added": false }, { "anchor": { "key": "68,91", "x": 68, "y": 91 }, "approach": [{ "x": 137, "y": 181 }, { "x": 138, "y": 181 }], "band": 3, "familyId": "site-family:fort", "footprint": [{ "x": 135, "y": 180 }, { "x": 136, "y": 180 }, { "x": 135, "y": 181 }, { "x": 136, "y": 181 }, { "x": 135, "y": 182 }, { "x": 136, "y": 182 }], "id": "repeatable-slot:fort:desert:standard:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "standard", "biome": "desert", "old": false, "added": false }, { "id": "repeatable-slot:fort:upland:deep:01", "familyId": "site-family:fort", "tier": "deep", "landmassId": "landmass:major-island:d14l1a:02:ffa5fe6c", "band": 4, "anchor": { "key": "95,34", "x": 95, "y": 34 }, "footprint": [{ "x": 190, "y": 68 }, { "x": 191, "y": 68 }, { "x": 192, "y": 68 }, { "x": 193, "y": 68 }, { "x": 190, "y": 69 }, { "x": 191, "y": 69 }, { "x": 192, "y": 69 }, { "x": 193, "y": 69 }, { "x": 190, "y": 70 }, { "x": 191, "y": 70 }, { "x": 192, "y": 70 }, { "x": 193, "y": 70 }], "approach": [{ "x": 194, "y": 69 }, { "x": 195, "y": 69 }, { "x": 196, "y": 69 }, { "x": 197, "y": 69 }], "biome": "upland", "old": false, "added": true }, { "anchor": { "key": "75,20", "x": 75, "y": 20 }, "approach": [{ "x": 149, "y": 41 }, { "x": 149, "y": 42 }], "band": 4, "familyId": "site-family:fort", "footprint": [{ "x": 149, "y": 38 }, { "x": 150, "y": 38 }, { "x": 149, "y": 39 }, { "x": 150, "y": 39 }, { "x": 149, "y": 40 }, { "x": 150, "y": 40 }], "id": "repeatable-slot:fort:upland:standard:01", "landmassId": "landmass:medium-island:d14l1a:04:961b5a82", "tier": "standard", "biome": "upland", "old": false, "added": false }, { "anchor": { "key": "44,76", "x": 44, "y": 76 }, "approach": [{ "x": 89, "y": 151 }, { "x": 90, "y": 151 }], "band": 4, "familyId": "site-family:fort", "footprint": [{ "x": 87, "y": 151 }, { "x": 88, "y": 151 }, { "x": 87, "y": 152 }, { "x": 88, "y": 152 }], "id": "repeatable-slot:fort:wetland:small:01", "landmassId": "landmass:medium-island:d14l1a:01:83c7b775", "tier": "small", "biome": "wetland", "old": false, "added": false }, { "anchor": { "key": "57,88", "x": 57, "y": 88 }, "approach": [{ "x": 115, "y": 175 }, { "x": 116, "y": 175 }], "band": 3, "familyId": "site-family:ruin", "footprint": [{ "x": 113, "y": 175 }, { "x": 114, "y": 175 }, { "x": 113, "y": 176 }, { "x": 114, "y": 176 }], "id": "repeatable-slot:ruin:desert:standard:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "standard", "biome": "desert", "old": false, "added": false }, { "id": "repeatable-slot:ruin:frostland:deep:01", "familyId": "site-family:ruin", "tier": "deep", "landmassId": "landmass:major-island:d14l1a:03:578d626c", "band": 4, "anchor": { "key": "112,77", "x": 112, "y": 77 }, "footprint": [{ "x": 224, "y": 154 }, { "x": 225, "y": 154 }, { "x": 226, "y": 154 }, { "x": 224, "y": 155 }, { "x": 225, "y": 155 }, { "x": 226, "y": 155 }, { "x": 224, "y": 156 }, { "x": 225, "y": 156 }, { "x": 226, "y": 156 }], "approach": [{ "x": 227, "y": 155 }, { "x": 228, "y": 155 }, { "x": 229, "y": 155 }], "biome": "frostland", "old": false, "added": true }, { "anchor": { "key": "28,73", "x": 28, "y": 73 }, "approach": [{ "x": 57, "y": 145 }, { "x": 58, "y": 145 }], "band": 4, "familyId": "site-family:ruin", "footprint": [{ "x": 55, "y": 145 }, { "x": 56, "y": 145 }, { "x": 55, "y": 146 }, { "x": 56, "y": 146 }], "id": "repeatable-slot:ruin:frostland:standard:01", "landmassId": "landmass:medium-island:d14l1a:01:83c7b775", "tier": "standard", "biome": "frostland", "old": false, "added": false }, { "anchor": { "key": "73,144", "x": 73, "y": 144 }, "approach": [{ "x": 147, "y": 287 }], "band": 2, "familyId": "site-family:ruin", "footprint": [{ "x": 146, "y": 287 }, { "x": 146, "y": 288 }], "id": "repeatable-slot:ruin:grassland:small:01", "landmassId": "landmass:primary-mainland:d14l1a:01:ccdbc2ca", "tier": "small", "biome": "grassland", "old": false, "added": false }, { "anchor": { "key": "44,31", "x": 44, "y": 31 }, "approach": [{ "x": 88, "y": 63 }], "band": 3, "familyId": "site-family:ruin", "footprint": [{ "x": 88, "y": 61 }, { "x": 88, "y": 62 }], "id": "repeatable-slot:ruin:tropical:small:01", "landmassId": "landmass:major-island:d14l1a:01:296d6010", "tier": "small", "biome": "tropical", "old": false, "added": false }, { "anchor": { "key": "102,89", "x": 102, "y": 89 }, "approach": [{ "x": 205, "y": 177 }], "band": 3, "familyId": "site-family:ruin", "footprint": [{ "x": 204, "y": 177 }, { "x": 204, "y": 178 }], "id": "repeatable-slot:ruin:wetland:small:01", "landmassId": "landmass:major-island:d14l1a:03:578d626c", "tier": "small", "biome": "wetland", "old": false, "added": false }]);

// src/shared/content/planned_crypt_policy_v1.js
var PLANNED_CRYPT_VERSION = "planned-small-crypt-candidate-v1";
var CRYPT_PACKAGE_ID = "procedural-crypt-family";
var CRYPT_POLICY = freezeWire({ version: PLANNED_CRYPT_VERSION, parentRuntime: "d038e94b8e38ea23", familyId: "site-family:crypt", implementedTiers: ["small"], deferredTiers: ["standard", "large", "deep"], floors: 1, interiorTiles: [26, 28], exteriorTiles: [12, 12], minimumEntranceChunks: 1, minimumApproachChunks: 1, encounter: "three-existing-ordinary-guards", reward: "ordinary-personal-completion-chest-v1", repeatable: true, legacyStonewatchUnchanged: true });
var CRYPT_CONTENT_HASH = "fd89aebc12ee8ee21fd55ae9c4133218a0206812a236707d17870b27a7574dae";
var CRYPT_PACKAGE = freezeWire({ packageId: CRYPT_PACKAGE_ID, packageVersion: PLANNED_CRYPT_VERSION, contentHash: CRYPT_CONTENT_HASH, siteClass: "dungeon", capabilities: ["interior"], biomes: ["grassland"], minimumLevel: 1, maximumLevel: null, repeatable: true, unique: false, reservedSiteId: null });
var CRYPT_CATALOG = freezeWire({ schemaVersion: "site-content-catalog-d9-v1", catalogVersion: PLANNED_CRYPT_VERSION, packages: [CRYPT_PACKAGE] });

// src/shared/content/planned_crypt_policy_v2.js
var PLANNED_CRYPT_V2 = "planned-crypt-family-candidate-v2";
var CRYPT_TIER_POLICY_V2 = freezeWire({
  standard: { floors: [{ role: "ancestral-nave", tiles: [32, 30] }, { role: "ossuary-galleries", tiles: [34, 30] }] },
  large: { floors: [{ role: "processional-hall", tiles: [38, 32] }, { role: "family-vaults", tiles: [36, 34] }, { role: "buried-sanctuary", tiles: [38, 32] }] },
  deep: { floors: [{ role: "memorial-crossing", tiles: [40, 34] }, { role: "catacomb-loops", tiles: [38, 36] }, { role: "sealed-archives", tiles: [40, 34] }, { role: "royal-tomb", tiles: [40, 36] }] }
});
var CRYPT_POLICY_V2 = freezeWire({ version: PLANNED_CRYPT_V2, parentRuntime: "b4582b6fa03b0988", parentVersion: PLANNED_CRYPT_VERSION, familyId: "site-family:crypt", tiers: CRYPT_TIER_POLICY_V2, exteriorTiles: [12, 12], minimumEntranceChunks: 1, minimumApproachChunks: 1, encounter: "four-existing-ordinary-guards-per-floor", reward: "ordinary-personal-completion-chest-v1", repeatable: true, legacyStonewatchUnchanged: true, smallVersionUnchanged: true });
var CRYPT_CONTENT_HASH_V2 = "72153add1755b454e8e11aac4be6aeff986cd97f4a4312d16b7cb29318718908";
var CRYPT_PACKAGE_V2 = freezeWire({ ...CRYPT_PACKAGE, packageVersion: PLANNED_CRYPT_V2, contentHash: CRYPT_CONTENT_HASH_V2, biomes: ["upland", "frostland"] });
var CRYPT_CATALOG_V2 = freezeWire({ schemaVersion: "site-content-catalog-d9-v1", catalogVersion: PLANNED_CRYPT_V2, packages: [CRYPT_PACKAGE_V2] });

// src/shared/content/planned_ruin_policy_v1.js
var PLANNED_RUIN_VERSION = "planned-ruin-family-candidate-v1";
var RUIN_FAMILY_PACKAGE_ID = "procedural-ruin-family";
var RUIN_TIER_POLICY = freezeWire({ small: { minimumExteriorChunks: 2, minimumApproachChunks: 1, exteriorTiles: [26, 44], floors: [{ role: "roofless-hall", tiles: [22, 30] }] }, standard: { minimumExteriorChunks: 4, minimumApproachChunks: 2, exteriorTiles: [56, 44], floors: [{ role: "broken-courtyard", tiles: [38, 30] }, { role: "buried-foundation", tiles: [30, 26] }] } });
var ALPHA_RUIN_RESERVATION_IDS = freezeWire(["repeatable-slot:ruin:woodland:small:01", "repeatable-slot:ruin:upland:standard:01"]);
var RUIN_ADAPTATION = freezeWire({ version: PLANNED_RUIN_VERSION, parentPackageId: "woodland-overgrown-ruin", parentVersion: "woodland-overgrown-ruin-d11.3.2-v1", parentContentHash: "fc5a1d75f2a96b1fef0eceac18adbeee2db1005028f81c8a4e029ac2464fde29", repeatable: true, unique: false, exteriorProfile: "open-landmark", interiorScaleIndependent: true, resetPolicy: "explicit-cleared-vacant-no-transition-bounded-d13c2", encounterPolicy: "existing-gargoyle-cursed-blade-v1", rewardPolicy: "ordinary-floor-chest-personal-clearance-v1", unimplementedTiers: ["large", "deep"], tiers: RUIN_TIER_POLICY });
var RUIN_FAMILY_CONTENT_HASH = "34679f7f989b54f63283563e62aed234ab5f6db98207757dfd35a979e08bef5c";
var RUIN_FAMILY_PACKAGE = freezeWire({ packageId: RUIN_FAMILY_PACKAGE_ID, packageVersion: PLANNED_RUIN_VERSION, contentHash: RUIN_FAMILY_CONTENT_HASH, siteClass: "dungeon", capabilities: ["interior"], biomes: ["woodland", "grassland", "wetland", "upland", "desert", "frostland", "tropical", "volcanic"], minimumLevel: 1, maximumLevel: null, repeatable: true, unique: false, reservedSiteId: null });
var PLANNED_RUIN_CATALOG = freezeWire({ schemaVersion: "site-content-catalog-d9-v1", catalogVersion: PLANNED_RUIN_VERSION, packages: [RUIN_FAMILY_PACKAGE] });

// src/shared/content/planned_ruin_policy_v2.js
var PLANNED_RUIN_V2 = "planned-ruin-family-candidate-v2";
var ALPHA_RUIN_V2_IDS = freezeWire([...ALPHA_RUIN_RESERVATION_IDS, "repeatable-slot:ruin:volcanic:large:01"]);
var RUIN_TIER_POLICY_V2 = freezeWire({
  ...RUIN_TIER_POLICY,
  large: { minimumExteriorChunks: 6, minimumApproachChunks: 2, exteriorTiles: [56, 70], floors: [{ role: "roofless-quadrangle", tiles: [44, 38] }, { role: "fractured-gallery", tiles: [38, 34] }, { role: "buried-sanctum", tiles: [40, 36] }] },
  deep: { minimumExteriorChunks: 6, minimumApproachChunks: 2, exteriorTiles: [56, 70], floors: [{ role: "terraced-court", tiles: [46, 40] }, { role: "collapsed-cloister", tiles: [42, 38] }, { role: "buried-cistern", tiles: [40, 40] }, { role: "sealed-archive", tiles: [44, 38] }] }
});
var RUIN_ADAPTATION_V2 = freezeWire({ version: PLANNED_RUIN_V2, parentRuntime: "8ac6eb56c3cf6f21", parentContentHash: RUIN_FAMILY_PACKAGE.contentHash, tiers: RUIN_TIER_POLICY_V2, preserveSmallStandard: true, exteriorVariants: [[56, 70], [84, 44]], interiorPolicy: "seeded-quadrangle-gallery-cloister-cistern-v2", rewardPolicy: "ordinary-floor-chest-personal-clearance-v1", encounterPolicy: "existing-ordinary-gargoyle-cursed-blade-rust-nibbler", deepPopulation: "isolated-development-fixture-only", clockPolicy: "unchanged-60hz-and-catch-up-caps" });
var RUIN_CONTENT_HASH_V2 = "865e2dc45391ab883567d8484dadf58689d07c73b2de74877e6d6bcdac0b8a25";
var RUIN_PACKAGE_V2 = freezeWire({ ...RUIN_FAMILY_PACKAGE, packageVersion: PLANNED_RUIN_V2, contentHash: RUIN_CONTENT_HASH_V2 });
var RUIN_CATALOG_V2 = freezeWire({ schemaVersion: "site-content-catalog-d9-v1", catalogVersion: PLANNED_RUIN_V2, packages: [RUIN_PACKAGE_V2] });

// src/shared/content/planned_fort_policy_v1.js
var PLANNED_FORT_VERSION = "planned-fort-family-candidate-v1";
var FORT_FAMILY_PACKAGE_ID = "procedural-fort-family";
var FORT_TIER_POLICY = freezeWire({
  small: { minimumExteriorChunks: 4, minimumApproachChunks: 2, exteriorTiles: [48, 36], floors: [{ role: "ground", tiles: [14, 12] }] },
  standard: { minimumExteriorChunks: 6, minimumApproachChunks: 2, exteriorTiles: [56, 60], floors: [{ role: "ground", tiles: [24, 22] }, { role: "upper", tiles: [24, 22] }, { role: "underground", tiles: [32, 28] }] },
  large: { minimumExteriorChunks: 9, minimumApproachChunks: 3, exteriorTiles: [80, 70], floors: [{ role: "ground", tiles: [30, 26] }, { role: "upper", tiles: [30, 26] }, { role: "upper-tower", tiles: [24, 22] }, { role: "underground", tiles: [38, 32] }] },
  deep: { minimumExteriorChunks: 9, minimumApproachChunks: 3, exteriorTiles: [80, 70], floors: [{ role: "ground", tiles: [30, 26] }, { role: "upper", tiles: [30, 26] }, { role: "underground", tiles: [38, 32] }, { role: "deep-underground", tiles: [40, 34] }] }
});
var ALPHA_FORT_RESERVATION_IDS = freezeWire(["repeatable-slot:fort:grassland:small:01", "repeatable-slot:fort:woodland:standard:01"]);
var FORT_ADAPTATION = freezeWire({ version: PLANNED_FORT_VERSION, parentPackageId: "woodland-fort", parentVersion: "woodland-fort-d11.2-v1", parentContentHash: "f79728292e714330b5139fbca3c4e14b57722b17d45b013a2e7bc50162485a22", repeatable: true, unique: false, exteriorProfile: "compound-monument", interiorScaleIndependent: true, resetPolicy: "explicit-cleared-vacant-no-transition-bounded-d13c2", encounterPolicy: "temporary-existing-ordinary-and-elite-v1", rewardPolicy: "existing-ordinary-floor-chests-provisional", biomePolicy: "authoritative-planned-reservation-biome", tiers: FORT_TIER_POLICY });
var FORT_FAMILY_CONTENT_HASH = "fb01ee67919c53e545b69d440a9df99b035a86bca6162d61b3c2a483e5b3380f";
var FORT_FAMILY_PACKAGE = freezeWire({ packageId: FORT_FAMILY_PACKAGE_ID, packageVersion: PLANNED_FORT_VERSION, contentHash: FORT_FAMILY_CONTENT_HASH, siteClass: "dungeon", capabilities: ["interior"], biomes: ["woodland", "grassland", "wetland", "upland", "desert", "frostland", "tropical", "volcanic"], minimumLevel: 1, maximumLevel: null, repeatable: true, unique: false, reservedSiteId: null });
var PLANNED_FORT_CATALOG = freezeWire({ schemaVersion: "site-content-catalog-d9-v1", catalogVersion: PLANNED_FORT_VERSION, packages: [FORT_FAMILY_PACKAGE] });

// src/shared/content/planned_fort_policy_v2.js
var PLANNED_FORT_V2 = "planned-fort-family-candidate-v2";
var ALPHA_FORT_V2_IDS = freezeWire([...ALPHA_FORT_RESERVATION_IDS, "repeatable-slot:fort:tropical:large:01"]);
var FORT_ADAPTATION_V2 = freezeWire({
  version: PLANNED_FORT_V2,
  parentRuntime: "422cbf122da801d1",
  parentContentHash: FORT_FAMILY_PACKAGE.contentHash,
  tiers: FORT_TIER_POLICY,
  exteriorPolicy: "actual-reserved-shape-bounded-layout-variants",
  standardWideTiles: [76, 44],
  preserveExistingSmallStandard: true,
  interiorPolicy: "seeded-courtyard-gallery-vault-v2",
  rewardPolicy: "existing-ordinary-floor-chests-provisional",
  deepPopulation: "isolated-development-fixture-only",
  clockPolicy: "unchanged-60hz-and-catch-up-caps"
});
var FORT_CONTENT_HASH_V2 = "089700accd337a7bc3bb385f2ca41b59ce7a7e578c3ab34b686c4f10d4f4130f";
var FORT_PACKAGE_V2 = freezeWire({ ...FORT_FAMILY_PACKAGE, packageVersion: PLANNED_FORT_V2, contentHash: FORT_CONTENT_HASH_V2 });
var FORT_CATALOG_V2 = freezeWire({ schemaVersion: "site-content-catalog-d9-v1", catalogVersion: PLANNED_FORT_V2, packages: [FORT_PACKAGE_V2] });

// src/shared/content/planned_cave_policy_v1.js
var PLANNED_CAVE_TIERS = Object.freeze(["small", "standard", "large", "deep"]);

// src/shared/content/planned_cave_population_v2.js
var ALPHA_PLANNED_CAVES = Object.freeze([
  {
    "reservationId": "repeatable-slot:cave:woodland:small:01",
    "tier": "small",
    "biome": "woodland",
    "band": 2,
    "footprintChunk": {
      "x": 70,
      "y": 232
    },
    "approachChunk": {
      "x": 71,
      "y": 232
    }
  },
  {
    "reservationId": "repeatable-slot:cave:desert:standard:01",
    "tier": "standard",
    "biome": "desert",
    "band": 3,
    "footprintChunk": {
      "x": 154,
      "y": 190
    },
    "approachChunk": {
      "x": 155,
      "y": 190
    }
  },
  {
    "reservationId": "repeatable-slot:cave:upland:large:01",
    "tier": "large",
    "biome": "upland",
    "band": 2,
    "footprintChunk": {
      "x": 64,
      "y": 220
    },
    "approachChunk": {
      "x": 65,
      "y": 220
    }
  },
  {
    "reservationId": "repeatable-slot:cave:tropical:deep:01",
    "tier": "deep",
    "biome": "tropical",
    "band": 3,
    "footprintChunk": {
      "x": 116,
      "y": 72
    },
    "approachChunk": {
      "x": 117,
      "y": 72
    }
  }
].map((r) => Object.freeze({ ...r, footprintChunk: Object.freeze(r.footprintChunk), approachChunk: Object.freeze(r.approachChunk) })));

// src/shared/content/open_town_template_v1.js
var OPEN_TOWN_TEMPLATE_V1 = freezeWire({
  "allocation": {
    "civic": 3,
    "home": 15,
    "service": 5,
    "support": 5
  },
  "arrival": [
    2,
    44
  ],
  "buildings": [
    {
      "doorPoint": [
        75,
        16
      ],
      "doorSide": "south",
      "h": 10,
      "id": "town-open:roof:001",
      "kind": "civic",
      "label": "Chapel",
      "path": [
        [
          75,
          18
        ],
        [
          75,
          19
        ],
        [
          75,
          20
        ],
        [
          75,
          21
        ],
        [
          75,
          22
        ],
        [
          75,
          23
        ],
        [
          75,
          24
        ],
        [
          75,
          25
        ],
        [
          75,
          26
        ],
        [
          75,
          27
        ],
        [
          75,
          28
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 74,
        "y": 16
      },
      "target": [
        66,
        6
      ],
      "w": 12,
      "x": 69,
      "y": 6
    },
    {
      "doorPoint": [
        14,
        18
      ],
      "doorSide": "north",
      "h": 10,
      "id": "town-open:roof:002",
      "kind": "civic",
      "label": "Civic hall",
      "path": [
        [
          14,
          15
        ],
        [
          14,
          14
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 13,
        "y": 15
      },
      "target": [
        8,
        18
      ],
      "w": 14,
      "x": 7,
      "y": 18
    },
    {
      "doorPoint": [
        82,
        66
      ],
      "doorSide": "north",
      "h": 8,
      "id": "town-open:roof:003",
      "kind": "civic",
      "label": "Guardhouse / cells",
      "path": [
        [
          82,
          63
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 81,
        "y": 63
      },
      "target": [
        76,
        66
      ],
      "w": 10,
      "x": 77,
      "y": 66
    },
    {
      "doorPoint": [
        87,
        27
      ],
      "doorSide": "south",
      "h": 8,
      "id": "town-open:roof:004",
      "kind": "service",
      "label": "Merchant / market",
      "path": [
        [
          87,
          29
        ],
        [
          86,
          29
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 86,
        "y": 27
      },
      "target": [
        51,
        18
      ],
      "w": 12,
      "x": 81,
      "y": 19
    },
    {
      "doorPoint": [
        30,
        12
      ],
      "doorSide": "south",
      "h": 8,
      "id": "town-open:roof:005",
      "kind": "service",
      "label": "Gear merchant",
      "path": [
        [
          30,
          14
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 29,
        "y": 12
      },
      "target": [
        51,
        18
      ],
      "w": 10,
      "x": 25,
      "y": 4
    },
    {
      "doorPoint": [
        46,
        59
      ],
      "doorSide": "north",
      "h": 9,
      "id": "town-open:roof:006",
      "kind": "service",
      "label": "Forge",
      "path": [
        [
          46,
          56
        ],
        [
          46,
          55
        ],
        [
          46,
          54
        ],
        [
          47,
          54
        ],
        [
          48,
          54
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 45,
        "y": 56
      },
      "target": [
        51,
        18
      ],
      "w": 11,
      "x": 41,
      "y": 59
    },
    {
      "doorPoint": [
        88,
        37
      ],
      "doorSide": "north",
      "h": 8,
      "id": "town-open:roof:007",
      "kind": "service",
      "label": "Alchemy",
      "path": [
        [
          88,
          34
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 87,
        "y": 34
      },
      "target": [
        51,
        18
      ],
      "w": 10,
      "x": 83,
      "y": 37
    },
    {
      "doorPoint": [
        52,
        20
      ],
      "doorSide": "west",
      "h": 12,
      "id": "town-open:roof:008",
      "kind": "service",
      "label": "Tavern + lodging",
      "path": [
        [
          49,
          20
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 49,
        "y": 19
      },
      "target": [
        51,
        18
      ],
      "w": 14,
      "x": 52,
      "y": 14
    },
    {
      "doorPoint": [
        33,
        46
      ],
      "doorSide": "north",
      "h": 10,
      "id": "town-open:roof:009",
      "kind": "support",
      "label": "Barn",
      "path": [
        [
          33,
          43
        ],
        [
          34,
          43
        ],
        [
          35,
          43
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 32,
        "y": 43
      },
      "target": [
        3,
        5
      ],
      "w": 14,
      "x": 26,
      "y": 46
    },
    {
      "doorPoint": [
        16,
        67
      ],
      "doorSide": "north",
      "h": 8,
      "id": "town-open:roof:010",
      "kind": "support",
      "label": "Granary",
      "path": [
        [
          16,
          64
        ],
        [
          15,
          64
        ],
        [
          15,
          63
        ],
        [
          15,
          62
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 15,
        "y": 64
      },
      "target": [
        8,
        60
      ],
      "w": 10,
      "x": 11,
      "y": 67
    },
    {
      "doorPoint": [
        54,
        7
      ],
      "doorSide": "west",
      "h": 8,
      "id": "town-open:roof:011",
      "kind": "support",
      "label": "Stable",
      "path": [
        [
          51,
          7
        ],
        [
          50,
          7
        ],
        [
          49,
          7
        ],
        [
          48,
          7
        ],
        [
          47,
          7
        ],
        [
          46,
          7
        ],
        [
          45,
          7
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 51,
        "y": 6
      },
      "target": [
        80,
        8
      ],
      "w": 12,
      "x": 54,
      "y": 3
    },
    {
      "doorPoint": [
        68,
        65
      ],
      "doorSide": "north",
      "h": 8,
      "id": "town-open:roof:012",
      "kind": "support",
      "label": "Warehouse",
      "path": [
        [
          68,
          62
        ],
        [
          68,
          61
        ],
        [
          68,
          60
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 67,
        "y": 62
      },
      "target": [
        62,
        65
      ],
      "w": 12,
      "x": 62,
      "y": 65
    },
    {
      "doorPoint": [
        33,
        31
      ],
      "doorSide": "east",
      "h": 6,
      "id": "town-open:roof:013",
      "kind": "support",
      "label": "Tool workshop",
      "path": [
        [
          35,
          31
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 33,
        "y": 30
      },
      "target": [
        25,
        64
      ],
      "w": 8,
      "x": 25,
      "y": 28
    },
    {
      "doorPoint": [
        7,
        38
      ],
      "doorSide": "south",
      "h": 5,
      "id": "town-open:roof:014",
      "kind": "home",
      "label": "Home 1",
      "path": [
        [
          7,
          40
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 6,
        "y": 38
      },
      "target": [
        8,
        50
      ],
      "w": 7,
      "x": 4,
      "y": 33
    },
    {
      "doorPoint": [
        45,
        75
      ],
      "doorSide": "south",
      "h": 5,
      "id": "town-open:roof:015",
      "kind": "home",
      "label": "Home 2",
      "path": [
        [
          45,
          77
        ],
        [
          44,
          77
        ],
        [
          43,
          77
        ],
        [
          42,
          77
        ],
        [
          41,
          77
        ],
        [
          40,
          77
        ],
        [
          39,
          77
        ],
        [
          38,
          77
        ],
        [
          37,
          77
        ],
        [
          36,
          77
        ],
        [
          35,
          77
        ],
        [
          34,
          77
        ],
        [
          33,
          77
        ],
        [
          32,
          77
        ],
        [
          31,
          77
        ],
        [
          30,
          77
        ],
        [
          29,
          77
        ],
        [
          28,
          77
        ],
        [
          27,
          77
        ],
        [
          26,
          77
        ],
        [
          25,
          77
        ],
        [
          24,
          77
        ],
        [
          23,
          77
        ],
        [
          22,
          77
        ],
        [
          22,
          76
        ],
        [
          22,
          75
        ],
        [
          22,
          74
        ],
        [
          22,
          73
        ],
        [
          22,
          72
        ],
        [
          22,
          71
        ],
        [
          22,
          70
        ],
        [
          22,
          69
        ],
        [
          22,
          68
        ],
        [
          22,
          67
        ],
        [
          22,
          66
        ],
        [
          22,
          65
        ],
        [
          21,
          65
        ],
        [
          20,
          65
        ],
        [
          19,
          65
        ],
        [
          18,
          65
        ],
        [
          17,
          65
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 44,
        "y": 75
      },
      "target": [
        32,
        60
      ],
      "w": 8,
      "x": 41,
      "y": 70
    },
    {
      "doorPoint": [
        65,
        44
      ],
      "doorSide": "south",
      "h": 5,
      "id": "town-open:roof:016",
      "kind": "home",
      "label": "Home 3",
      "path": [
        [
          65,
          46
        ],
        [
          66,
          46
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 64,
        "y": 44
      },
      "target": [
        73,
        48
      ],
      "w": 9,
      "x": 61,
      "y": 39
    },
    {
      "doorPoint": [
        86,
        16
      ],
      "doorSide": "south",
      "h": 6,
      "id": "town-open:roof:017",
      "kind": "home",
      "label": "Home 4",
      "path": [
        [
          86,
          18
        ],
        [
          85,
          18
        ],
        [
          85,
          17
        ],
        [
          84,
          17
        ],
        [
          83,
          17
        ],
        [
          82,
          17
        ],
        [
          81,
          17
        ],
        [
          80,
          17
        ],
        [
          79,
          17
        ],
        [
          78,
          17
        ],
        [
          77,
          17
        ],
        [
          76,
          17
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 85,
        "y": 16
      },
      "target": [
        79,
        10
      ],
      "w": 7,
      "x": 83,
      "y": 10
    },
    {
      "doorPoint": [
        19,
        11
      ],
      "doorSide": "south",
      "h": 6,
      "id": "town-open:roof:018",
      "kind": "home",
      "label": "Home 5",
      "path": [
        [
          19,
          13
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 18,
        "y": 11
      },
      "target": [
        24,
        6
      ],
      "w": 8,
      "x": 15,
      "y": 5
    },
    {
      "doorPoint": [
        65,
        51
      ],
      "doorSide": "east",
      "h": 6,
      "id": "town-open:roof:019",
      "kind": "home",
      "label": "Home 6",
      "path": [
        [
          67,
          51
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 65,
        "y": 50
      },
      "target": [
        65,
        63
      ],
      "w": 9,
      "x": 56,
      "y": 48
    },
    {
      "doorPoint": [
        15,
        53
      ],
      "doorSide": "east",
      "h": 7,
      "id": "town-open:roof:020",
      "kind": "home",
      "label": "Home 7",
      "path": [
        [
          17,
          53
        ],
        [
          18,
          53
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 15,
        "y": 52
      },
      "target": [
        8,
        50
      ],
      "w": 7,
      "x": 8,
      "y": 50
    },
    {
      "doorPoint": [
        31,
        63
      ],
      "doorSide": "west",
      "h": 7,
      "id": "town-open:roof:021",
      "kind": "home",
      "label": "Home 8",
      "path": [
        [
          28,
          63
        ],
        [
          28,
          64
        ],
        [
          28,
          65
        ],
        [
          27,
          65
        ],
        [
          26,
          65
        ],
        [
          25,
          65
        ],
        [
          24,
          65
        ],
        [
          23,
          65
        ],
        [
          22,
          65
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 28,
        "y": 62
      },
      "target": [
        32,
        60
      ],
      "w": 8,
      "x": 31,
      "y": 60
    },
    {
      "doorPoint": [
        82,
        51
      ],
      "doorSide": "west",
      "h": 7,
      "id": "town-open:roof:022",
      "kind": "home",
      "label": "Home 9",
      "path": [
        [
          79,
          51
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 79,
        "y": 50
      },
      "target": [
        73,
        48
      ],
      "w": 9,
      "x": 82,
      "y": 48
    },
    {
      "doorPoint": [
        90,
        5
      ],
      "doorSide": "east",
      "h": 5,
      "id": "town-open:roof:023",
      "kind": "home",
      "label": "Home 10",
      "path": [
        [
          92,
          5
        ],
        [
          91,
          5
        ],
        [
          91,
          6
        ],
        [
          91,
          7
        ],
        [
          91,
          8
        ],
        [
          91,
          9
        ],
        [
          91,
          10
        ],
        [
          91,
          11
        ],
        [
          91,
          12
        ],
        [
          91,
          13
        ],
        [
          91,
          14
        ],
        [
          91,
          15
        ],
        [
          91,
          16
        ],
        [
          91,
          17
        ],
        [
          90,
          17
        ],
        [
          89,
          17
        ],
        [
          88,
          17
        ],
        [
          87,
          17
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 90,
        "y": 4
      },
      "target": [
        79,
        10
      ],
      "w": 7,
      "x": 83,
      "y": 3
    },
    {
      "doorPoint": [
        28,
        18
      ],
      "doorSide": "north",
      "h": 5,
      "id": "town-open:roof:024",
      "kind": "home",
      "label": "Home 11",
      "path": [
        [
          28,
          15
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 27,
        "y": 15
      },
      "target": [
        24,
        6
      ],
      "w": 8,
      "x": 24,
      "y": 18
    },
    {
      "doorPoint": [
        55,
        75
      ],
      "doorSide": "south",
      "h": 5,
      "id": "town-open:roof:025",
      "kind": "home",
      "label": "Home 12",
      "path": [
        [
          55,
          77
        ],
        [
          54,
          77
        ],
        [
          53,
          77
        ],
        [
          52,
          77
        ],
        [
          51,
          77
        ],
        [
          50,
          77
        ],
        [
          49,
          77
        ],
        [
          48,
          77
        ],
        [
          47,
          77
        ],
        [
          46,
          77
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 54,
        "y": 75
      },
      "target": [
        65,
        63
      ],
      "w": 9,
      "x": 51,
      "y": 70
    },
    {
      "doorPoint": [
        28,
        61
      ],
      "doorSide": "east",
      "h": 6,
      "id": "town-open:roof:026",
      "kind": "home",
      "label": "Home 13",
      "path": [
        [
          30,
          61
        ],
        [
          30,
          62
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 28,
        "y": 60
      },
      "target": [
        8,
        50
      ],
      "w": 7,
      "x": 21,
      "y": 58
    },
    {
      "doorPoint": [
        35,
        75
      ],
      "doorSide": "south",
      "h": 6,
      "id": "town-open:roof:027",
      "kind": "home",
      "label": "Home 14",
      "path": [
        [
          35,
          77
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 34,
        "y": 75
      },
      "target": [
        32,
        60
      ],
      "w": 8,
      "x": 31,
      "y": 69
    },
    {
      "doorPoint": [
        76,
        44
      ],
      "doorSide": "south",
      "h": 6,
      "id": "town-open:roof:028",
      "kind": "home",
      "label": "Home 15",
      "path": [
        [
          76,
          46
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 75,
        "y": 44
      },
      "target": [
        73,
        48
      ],
      "w": 9,
      "x": 72,
      "y": 38
    }
  ],
  "core": [
    96,
    78
  ],
  "id": "town-open",
  "name": "Open agricultural / trading town",
  "places": [
    [
      "Market square",
      {
        "h": 16,
        "w": 19,
        "x": 35,
        "y": 28
      },
      "public"
    ],
    [
      "Community garden",
      {
        "h": 10,
        "w": 15,
        "x": 66,
        "y": 45
      },
      "garden"
    ]
  ],
  "streets": [
    [
      [
        [
          0,
          44
        ],
        [
          24,
          38
        ],
        [
          47,
          40
        ],
        [
          70,
          30
        ],
        [
          96,
          33
        ]
      ],
      5
    ],
    [
      [
        [
          47,
          40
        ],
        [
          48,
          14
        ],
        [
          38,
          0
        ]
      ],
      4
    ],
    [
      [
        [
          8,
          12
        ],
        [
          28,
          16
        ],
        [
          48,
          14
        ]
      ],
      3
    ],
    [
      [
        [
          24,
          38
        ],
        [
          18,
          60
        ],
        [
          0,
          68
        ]
      ],
      3
    ],
    [
      [
        [
          50,
          55
        ],
        [
          78,
          62
        ],
        [
          96,
          62
        ]
      ],
      3
    ],
    [
      [
        [
          47,
          40
        ],
        [
          50,
          55
        ]
      ],
      3
    ]
  ]
});

// src/shared/generation/settlement_geometry_v1.js
var TILE = D9_PROFILE.tileSize;
var tilePoint = (p) => ({ x: (p[0] + 0.5) * TILE, y: (p[1] + 0.5) * TILE });
var frontage = (b) => tilePoint([b.porch.x + 1, b.porch.y + 1]);
var propCache = /* @__PURE__ */ new WeakMap();
function propsFor(t) {
  if (propCache.has(t)) return propCache.get(t);
  const props = [];
  for (const b of t.buildings.filter((b2) => b2.kind !== "home")) {
    const x = b.x - 1, y = b.y + b.h - 1;
    if (x < 1 || y < 1 || x >= t.core[0] - 1 || y >= t.core[1] - 1 || t.buildings.some((q) => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h) || t.buildings.some((q) => q.path.some((p) => PM.hypot(p[0] - x, p[1] - y) < 2) || PM.hypot(q.porch.x + 1 - x, q.porch.y + 1 - y) < 3)) continue;
    props.push({ id: b.id + ":barrel", x, y });
  }
  propCache.set(t, props);
  return props;
}

// src/shared/generation/planned_town_v1.js
var TOWN_START_TILES = freezeWire([{ x: 5871, y: 5760 }, { x: 5872, y: 5760 }, { x: 5871, y: 5761 }, { x: 5872, y: 5761 }]);
var PLANNED_TOWN_ID = "settlement-slot:town:05";
var townStartTilesV1 = perWorldV1(() => townTilesV1(PLANNED_TOWN_ID, TOWN_START_TILES));
var materials = /* @__PURE__ */ new Map();
var put = (x, y, type) => {
  if (x >= 0 && x < 96 && y >= 0 && y < 78 && materials.get(x + "," + y) !== "r") materials.set(x + "," + y, type);
};
for (const [points, width] of OPEN_TOWN_TEMPLATE_V1.streets) for (let i = 1; i < points.length; i++) {
  const [ax, ay] = points[i - 1], [bx, by] = points[i], dx = bx - ax, dy = by - ay, d = dx * dx + dy * dy;
  for (let y = Math.floor(Math.min(ay, by) - width); y <= Math.ceil(Math.max(ay, by) + width); y++) for (let x = Math.floor(Math.min(ax, bx) - width); x <= Math.ceil(Math.max(ax, bx) + width); x++) {
    const f = d ? Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / d)) : 0;
    if (PM.hypot(x + 0.5 - ax - f * dx, y + 0.5 - ay - f * dy) <= width / 2) put(x, y, "r");
  }
}
for (const b of OPEN_TOWN_TEMPLATE_V1.buildings) {
  for (const [x, y] of b.path) put(x, y, "p");
  const p = b.porch;
  for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) put(x, y, "p");
}
var TOWN_TAVERN = OPEN_TOWN_TEMPLATE_V1.buildings.find((b) => b.label === "Tavern + lodging");
var TOWN_FRONTAGE = freezeWire({ x: 5824 + frontage(TOWN_TAVERN).x / 32 - 0.5, y: 5720 + frontage(TOWN_TAVERN).y / 32 - 0.5 });
var townFrontageV1 = perWorldV1(() => townTileV1(PLANNED_TOWN_ID, TOWN_FRONTAGE));
var TOWN_PROPS = propsFor(OPEN_TOWN_TEMPLATE_V1);

// src/shared/generation/local_water_geometry_v3.js
var LOCAL_WATER_VERSION = "local-water-geometry-v3";
function createLocalWaterGeometry(p, macro, shoreline, riverSegments) {
  const protectedChunks = shoreline.protectedChunks, cache = /* @__PURE__ */ new Map(), coastCache = /* @__PURE__ */ new Map();
  const seed = parseInt(p.seedDigest.slice(0, 8), 16) >>> 0;
  const hash = (x, y, d) => {
    let n = seed ^ Math.imul(x + d, 73856093) ^ Math.imul(y - d, 19349663);
    n ^= n >>> 16;
    n = Math.imul(n, 2146121005);
    n ^= n >>> 15;
    n = Math.imul(n, 2221713035);
    return (n ^ n >>> 16) >>> 0;
  };
  function noise(x, y, size, d) {
    const xx = x / size, yy = y / size, ix = Math.floor(xx), iy = Math.floor(yy), u = xx - ix, v = yy - iy, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v), h = (x2, y2) => hash(x2, y2, d) / 4294967295;
    return (h(ix, iy) * (1 - a) + h(ix + 1, iy) * a) * (1 - b) + (h(ix, iy + 1) * (1 - a) + h(ix + 1, iy + 1) * a) * b;
  }
  const islandStyles = Object.freeze(p.landmasses.map((l) => {
    let d = 0;
    for (const c of l.id) d = Math.imul(d, 31) + c.charCodeAt(0) >>> 0;
    return Object.freeze({ landmassId: l.id, domain: d % 1e5, expression: l.classId === "minor-island" ? "asymmetric-lobed-small-island" : ["angular-headlands", "asymmetric-coves", "elongated-frontage", "soft-lobes"][hash(0, 0, d) % 4] });
  }));
  const lakeByCell = /* @__PURE__ */ new Map(), lakeBasins = [];
  for (const row of p.cellRows) for (const c of row.cells) if (c[4] && !lakeByCell.has(c[0] + "," + row.y)) {
    const cells = [[c[0], row.y]], seen = /* @__PURE__ */ new Set([c[0] + "," + row.y]);
    for (let i = 0; i < cells.length; i++) {
      const [x, y] = cells[i];
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const key2 = x + dx + "," + (y + dy), n = macro(x + dx, y + dy);
        if (n?.[4] && n[1] === c[1] && !seen.has(key2)) {
          seen.add(key2);
          cells.push([x + dx, y + dy]);
        }
      }
    }
    const basin = Object.freeze({ id: "local-lake:" + c[0] + ":" + row.y, domain: hash(c[0], row.y, 701) % 1e5, minX: Math.min(...cells.map((q) => q[0])) * 64, minY: Math.min(...cells.map((q) => q[1])) * 52, maxX: (Math.max(...cells.map((q) => q[0])) + 1) * 64, maxY: (Math.max(...cells.map((q) => q[1])) + 1) * 52, macroCells: cells.length });
    lakeBasins.push(basin);
    for (const [x, y] of cells) lakeByCell.set(x + "," + y, basin);
  }
  Object.freeze(lakeBasins);
  const protectedNear = /* @__PURE__ */ new Map();
  function protection(x, y) {
    const cx2 = Math.floor(x / 32), cy2 = Math.floor(y / 26), id = cx2 * 65536 + cy2;
    let near = protectedNear.get(id);
    if (!near) {
      near = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (protectedChunks.has(cx2 + dx + "," + (cy2 + dy))) near.push((cx2 + dx) * 32, (cy2 + dy) * 26);
      protectedNear.set(id, near);
    }
    let distance2 = Infinity;
    for (let i = 0; i < near.length; i += 2) {
      const a = near[i], b = near[i + 1];
      distance2 = Math.min(distance2, PM.hypot(Math.max(a - x, 0, x - a - 32), Math.max(b - y, 0, y - b - 26)));
    }
    const t = Math.min(1, distance2 / 9);
    return t * t * (3 - 2 * t);
  }
  function rawCoast(x, y) {
    const mx = Math.floor(x / 64), my = Math.floor(y / 52), c = macro(mx, my), old = shoreline.tile(x, y);
    if (!c || p.landmasses[c[1]].classId === "primary-mainland" || old?.protected) return old;
    const style = islandStyles[c[1]], px = x + 0.5, py = y + 0.5, t = protection(px, py);
    let neighbors = coastCache.get(mx + "," + my);
    if (!neighbors) {
      neighbors = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!macro(mx + dx, my + dy)) neighbors.push([mx + dx, my + dy]);
      coastCache.set(mx + "," + my, neighbors);
    }
    if (!neighbors.length) return old;
    let distance2 = Infinity;
    for (const [a, b] of neighbors) distance2 = Math.min(distance2, PM.hypot(Math.max(a * 64 - px, 0, px - (a + 1) * 64), Math.max(b * 52 - py, 0, py - (b + 1) * 52)));
    if (distance2 > 32) return old;
    const inset = (2 + 8 * noise(px, py, 43, style.domain) + 5 * noise(px, py, 91, style.domain + 17)) * t;
    let margin = distance2 - inset;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) if (!macro(mx + sx, my) && !macro(mx, my + sy)) {
      const r = 12 + 13 * noise(px, py, 69, style.domain + 37), lx = sx < 0 ? px - mx * 64 : (mx + 1) * 64 - px, ly = sy < 0 ? py - my * 52 : (my + 1) * 52 - py;
      if (lx < r && ly < r) {
        const cut = style.expression === "angular-headlands" ? (lx + ly - r) * 0.707 : r - PM.hypot(lx - r, ly - r);
        margin = Math.min(margin, cut * t + Math.min(lx, ly) * (1 - t) - inset * 0.25);
      }
    }
    if (p.landmasses[c[1]].classId === "minor-island") {
      const b = p.landmasses[c[1]].bounds, w = (b.maxXExclusive - b.minX) * 64, h = (b.maxYExclusive - b.minY) * 52, cx2 = (b.minX + b.maxXExclusive) * 32, cy2 = (b.minY + b.maxYExclusive) * 26, angle = (hash(2, 3, style.domain) / 4294967295 - 0.5) * 1.2, phase = hash(5, 7, style.domain) / 4294967295 * Math.PI * 2, dx = px - cx2, dy = py - cy2, rx = w * (0.35 + 0.07 * noise(cx2, cy2, 73, style.domain + 61)), ry = h * (0.31 + 0.08 * noise(cx2, cy2, 83, style.domain + 71)), u = (dx * PM.cos(angle) + dy * PM.sin(angle)) / rx, v = (-dx * PM.sin(angle) + dy * PM.cos(angle)) / ry, theta = PM.atan2(v, u), shape = (1 - PM.hypot(u, v) + 0.16 * PM.sin(3 * theta + phase) + 0.08 * PM.sin(2 * theta - phase) + 0.05 * (noise(px, py, 29, style.domain + 89) - 0.5)) * Math.min(rx, ry);
      margin = shape * t + distance2 * (1 - t);
    }
    return { water: margin < 0, shore: margin >= 0 && margin < (old?.width ?? 4), classId: old?.classId ?? "exposed-rocky-shore", margin, width: old?.width ?? 4, protected: false };
  }
  const rawCache = /* @__PURE__ */ new Map(), classes = [null, "frozen-shore", "black-sand-beach", "marsh-reed-shore", "sea-cliff", "dune-beach", "sandy-beach", "exposed-rocky-shore"];
  function cachedRaw(x, y) {
    const mx = Math.floor(x / 64), my = Math.floor(y / 52), c = macro(mx, my);
    if (!c) return null;
    if (p.landmasses[c[1]].classId === "primary-mainland") return shoreline.tile(x, y);
    const key2 = mx + "," + my;
    let exposed = coastCache.get(key2);
    if (!exposed) {
      exposed = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!macro(mx + dx, my + dy)) exposed.push([mx + dx, my + dy]);
      coastCache.set(key2, exposed);
    }
    if (!exposed.length) return null;
    let data = rawCache.get(key2);
    if (!data) {
      const flags = new Uint8Array(3328), classCodes = new Uint8Array(3328), widths = new Float32Array(3328), margins = new Float32Array(3328);
      for (let ly = 0; ly < 52; ly++) for (let lx = 0; lx < 64; lx++) {
        const n2 = ly * 64 + lx, q = rawCoast(mx * 64 + lx, my * 52 + ly);
        if (q) {
          flags[n2] = 8 | (q.water ? 1 : 0) | (q.shore ? 2 : 0) | (q.protected ? 4 : 0);
          classCodes[n2] = classes.indexOf(q.classId);
          widths[n2] = q.width;
          margins[n2] = q.margin;
        }
      }
      data = { flags, classCodes, widths, margins };
      rawCache.set(key2, data);
    }
    const n = (y - my * 52) * 64 + x - mx * 64, f = data.flags[n];
    return f & 8 ? { water: !!(f & 1), shore: !!(f & 2), protected: !!(f & 4), classId: classes[data.classCodes[n]], width: data.widths[n], margin: data.margins[n] } : null;
  }
  const dryRaw = (x, y) => !!macro(Math.floor(x / 64), Math.floor(y / 52)) && !cachedRaw(x, y)?.water;
  const drySample = (x, y) => !!macro(Math.floor(x / 64), Math.floor(y / 52)) && !rawCoast(x, y)?.water;
  function resolvedCoast(x, y, sampleRaw, dry) {
    const c = sampleRaw(x, y);
    if (!c || c.water || c.protected || p.landmasses[macro(Math.floor(x / 64), Math.floor(y / 52))[1]].classId === "primary-mainland") return c;
    const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => dry(a, b));
    let isolated = !neighbors.length;
    if (neighbors.length === 1) {
      const [a, b] = neighbors[0];
      isolated = !sampleRaw(a, b)?.protected && [[a - 1, b], [a + 1, b], [a, b - 1], [a, b + 1]].filter(([u, v]) => dry(u, v)).length === 1;
    }
    return isolated ? { ...c, water: true, shore: false } : c;
  }
  const guards = p.waterGeometry.bridgeGuards;
  function guard(x, y) {
    for (const b of guards) if (x >= b.x1 - 6 && x <= b.x2 + 6 && y >= b.y1 - 6 && y <= b.y2 + 6) return true;
    return false;
  }
  const distance = (x, y, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, u = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return PM.hypot(x - a.x - u * dx, y - a.y - u * dy);
  };
  function maskForCell(mx, my) {
    const key2 = mx + "," + my;
    if (cache.has(key2)) return cache.get(key2);
    const c = macro(mx, my);
    if (!c || !c[4] && !c[5]) return null;
    const mask = new Uint8Array(64 * 52), old = new Uint8Array(64 * 52), segments = riverSegments.get(key2) ?? [];
    if (c[4]) {
      old.fill(1);
      for (let ly = 0; ly < 52; ly++) for (let lx = 0; lx < 64; lx++) {
        const x = mx * 64 + lx + 0.5, y = my * 52 + ly + 0.5, t = protection(x, y), inset = (2 + 5 * noise(x, y, 39, 401)) * t;
        let margin = Infinity;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (!macro(mx + dx, my + dy)?.[4]) margin = Math.min(margin, dx < 0 ? lx + 0.5 : dx > 0 ? 63.5 - lx : dy < 0 ? ly + 0.5 : 51.5 - ly);
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) if (!macro(mx + sx, my)?.[4] && !macro(mx, my + sy)?.[4]) {
          const r = 13 + 8 * noise(x, y, 67, 419), a = sx < 0 ? lx + 0.5 : 63.5 - lx, b = sy < 0 ? ly + 0.5 : 51.5 - ly;
          if (a < r && b < r) margin = Math.min(margin, (r - PM.hypot(a - r, b - r)) * t + Math.min(a, b) * (1 - t));
        }
        const basin = lakeByCell.get(key2), cx2 = (basin.minX + basin.maxX) / 2, cy2 = (basin.minY + basin.maxY) / 2, rx = (basin.maxX - basin.minX) * 0.47, ry = (basin.maxY - basin.minY) * 0.46, u = (x - cx2) / rx, v = (y - cy2) / ry, theta = PM.atan2(v, u), phase = hash(7, 9, basin.domain) / 4294967295 * Math.PI * 2, shape = (1 - PM.hypot(u, v) + 0.1 * PM.sin(3 * theta + phase) + 0.06 * PM.sin(2 * theta - phase) + 0.05 * (noise(x, y, 47, basin.domain) - 0.5)) * Math.min(rx, ry);
        margin = Math.min(margin, shape * t + margin * (1 - t));
        mask[ly * 64 + lx] = margin >= inset ? 1 : 0;
      }
    } else {
      for (let ly = 0; ly < 52; ly++) for (let lx = 0; lx < 64; lx++) if (segments.some(([a, b, w]) => distance(mx * 64 + lx + 0.5, my * 52 + ly + 0.5, a, b) <= w)) old[ly * 64 + lx] = 1;
      for (const [a, b, w] of segments) {
        const dx = b.x - a.x, dy = b.y - a.y, len = PM.hypot(dx, dy), steps = Math.ceil(len * 2);
        for (let i = 0; i <= steps; i++) {
          const u = i / steps, xx = a.x + dx * u, yy = a.y + dy * u, t = protection(xx, yy), bend = PM.sin(Math.PI * u) * (noise(xx, yy, 37, 503) - 0.5) * 11 * t * (guard(xx, yy) ? 0 : 1), x = xx - dy / len * bend, y = yy + dx / len * bend, r = w + 0.3 * PM.sin(Math.PI * u) * noise(xx, yy, 29, 523);
          for (let ly = Math.max(0, Math.floor(y - r - my * 52)); ly < Math.min(52, Math.ceil(y + r - my * 52)); ly++) for (let lx = Math.max(0, Math.floor(x - r - mx * 64)); lx < Math.min(64, Math.ceil(x + r - mx * 64)); lx++) if (PM.hypot(mx * 64 + lx + 0.5 - x, my * 52 + ly + 0.5 - y) <= r) mask[ly * 64 + lx] = 1;
        }
      }
    }
    for (let ly = 0; ly < 52; ly++) for (let lx = 0; lx < 64; lx++) {
      const x = mx * 64 + lx + 0.5, y = my * 52 + ly + 0.5;
      if (protection(x, y) === 0 || guard(x, y)) mask[ly * 64 + lx] = old[ly * 64 + lx];
    }
    if (c[4]) {
      const seen = new Uint8Array(3328), queue = new Int32Array(3328);
      let head = 0, tail = 0;
      const flood = () => {
        while (head < tail) {
          const n = queue[head++], x = n % 64, y = Math.floor(n / 64);
          for (const q of [x ? n - 1 : -1, x < 63 ? n + 1 : -1, y ? n - 64 : -1, y < 51 ? n + 64 : -1]) if (q >= 0 && mask[q] && !seen[q]) {
            seen[q] = 1;
            queue[tail++] = q;
          }
        }
      };
      seen[26 * 64 + 32] = 1;
      queue[tail++] = 26 * 64 + 32;
      flood();
      for (let n = 0; n < 3328; n++) if (mask[n] && !seen[n] && (protection(mx * 64 + n % 64 + 0.5, my * 52 + Math.floor(n / 64) + 0.5) === 0 || guard(mx * 64 + n % 64 + 0.5, my * 52 + Math.floor(n / 64) + 0.5))) {
        let x = n % 64, y = Math.floor(n / 64);
        while (!seen[y * 64 + x]) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (x + dx >= 0 && x + dx < 64 && y + dy >= 0 && y + dy < 52) mask[(y + dy) * 64 + x + dx] = 1;
          if (x !== 32) x += Math.sign(32 - x);
          else y += Math.sign(26 - y);
        }
        head = 0;
        tail = 0;
        seen.fill(0);
        seen[26 * 64 + 32] = 1;
        queue[tail++] = 26 * 64 + 32;
        flood();
      }
      for (let n = 0; n < 3328; n++) if (mask[n] && !seen[n]) mask[n] = 0;
    }
    cache.set(key2, mask);
    return mask;
  }
  function inland(x, y) {
    const mx = Math.floor(x / 64), my = Math.floor(y / 52), c = macro(mx, my), mask = maskForCell(mx, my);
    if (!mask) return null;
    const lx = x - mx * 64, ly = y - my * 52, water = mask[ly * 64 + lx] === 1;
    let bank = false;
    if (!water) for (let dy = -2; dy <= 2 && !bank; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy, mm = maskForCell(Math.floor(xx / 64), Math.floor(yy / 52));
      if (mm?.[(yy % 52 + 52) % 52 * 64 + (xx % 64 + 64) % 64]) {
        bank = true;
        break;
      }
    }
    return { water, kind: c[4] ? "lake" : "river", bank };
  }
  return Object.freeze({ version: LOCAL_WATER_VERSION, coast: (x, y) => resolvedCoast(x, y, cachedRaw, dryRaw), sampleCoast: (x, y) => resolvedCoast(x, y, rawCoast, drySample), inland, maskForCell, islandStyles, lakeBasins, protectedChunks });
}

// src/shared/generation/local_shoreline_v2.js
var LOCAL_SHORELINE_VERSION = "local-shoreline-runtime-v2";
function createLocalShoreline(p, macro) {
  const protectedChunks = /* @__PURE__ */ new Set(), add = (cs) => {
    for (const c of cs ?? []) protectedChunks.add(c.x + "," + c.y);
  };
  for (const s of p.settlements) {
    add(s.core);
    add(s.expansion);
    add(s.sockets);
  }
  for (const s of p.sites) {
    add(s.footprint);
    add(s.approach);
  }
  for (const s of p.factions) {
    add(s.campus);
    add(s.activity);
    add(s.approach);
    add(s.arrival);
  }
  for (const s of p.futureIslands) add([s.entrance, s.approach, s.landing, s.breathing]);
  add(p.extraProtected);
  add(p.originZone.runtimeChunks.map((c) => ({ x: c.chunkX, y: c.chunkY })));
  const seed = Number.parseInt(p.seedDigest.slice(0, 8), 16) >>> 0, cache = /* @__PURE__ */ new Map();
  const hash = (x, y, domain) => {
    let n = seed ^ Math.imul(x + domain, 73856093) ^ Math.imul(y - domain, 19349663);
    n ^= n >>> 16;
    n = Math.imul(n, 2146121005);
    n ^= n >>> 15;
    n = Math.imul(n, 2221713035);
    return (n ^ n >>> 16) >>> 0;
  };
  function noise(x, y, size, domain) {
    const xx = x / size, yy = y / size, ix = Math.floor(xx), iy = Math.floor(yy), u = xx - ix, v = yy - iy, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v), h = (x2, y2) => hash(x2, y2, domain) / 4294967295;
    return (h(ix, iy) * (1 - a) + h(ix + 1, iy) * a) * (1 - b) + (h(ix, iy + 1) * (1 - a) + h(ix + 1, iy + 1) * a) * b;
  }
  function tile(x, y) {
    const mx = Math.floor(x / 64), my = Math.floor(y / 52), c = macro(mx, my);
    if (!c) return null;
    const ck = mx + "," + my;
    let ocean = cache.get(ck);
    if (!ocean) {
      ocean = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!macro(mx + dx, my + dy)) ocean.push([mx + dx, my + dy]);
      cache.set(ck, ocean);
    }
    if (!ocean.length) return null;
    const px = x + 0.5, py = y + 0.5;
    let distance = Infinity;
    for (const [ox, oy] of ocean) {
      const dx = Math.max(ox * 64 - px, 0, px - (ox + 1) * 64), dy = Math.max(oy * 52 - py, 0, py - (oy + 1) * 52);
      distance = Math.min(distance, PM.hypot(dx, dy));
    }
    if (distance > 30) return null;
    let protection = Infinity;
    const cx2 = Math.floor(x / 32), cy2 = Math.floor(y / 26);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (protectedChunks.has(cx2 + dx + "," + (cy2 + dy))) {
      const a = (cx2 + dx) * 32, b = (cy2 + dy) * 26;
      protection = Math.min(protection, PM.hypot(Math.max(a - px, 0, px - a - 32), Math.max(b - py, 0, py - b - 26)));
    }
    const t = Math.min(1, protection / 8), taper = t * t * (3 - 2 * t);
    const inset = (2 + 10 * noise(px, py, 56, 31) + 3 * noise(px, py, 112, 97)) * taper;
    let margin = distance - inset;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) if (!macro(mx + sx, my) && !macro(mx, my + sy)) {
      const r = 18 + 5 * noise(px, py, 80, 151), lx = sx < 0 ? px - mx * 64 : (mx + 1) * 64 - px, ly = sy < 0 ? py - my * 52 : (my + 1) * 52 - py;
      if (lx < r && ly < r) {
        const cut = (r - PM.hypot(lx - r, ly - r)) * taper + Math.min(lx, ly) * (1 - taper);
        margin = Math.min(margin, cut - inset * 0.3);
      }
    }
    const biome = p.biomeIds[c[2] - 1], slope = c[8];
    const classId = biome === "biome:frostland" ? "frozen-shore" : biome === "biome:volcanic" ? "black-sand-beach" : biome === "biome:wetland" ? "marsh-reed-shore" : slope >= 500 ? "sea-cliff" : slope < 350 && noise(px, py, 96, 233) > 0.46 ? biome === "biome:desert" ? "dune-beach" : "sandy-beach" : "exposed-rocky-shore";
    const beach = classId.includes("beach"), width = Math.max(2, Math.min(22, (beach ? 7 : 3) + 6 * noise(px, py, 36, 211) - slope / 250));
    return { water: margin < 0, shore: margin >= 0 && margin < width, classId, margin, width, protected: protection === 0 };
  }
  return Object.freeze({ tile, protectedChunks, version: LOCAL_SHORELINE_VERSION });
}

// src/shared/generation/planned_world_foundation_v1.js
var PLANNED_WORLD_VERSION = "planned-world-runtime-foundation-v1";
var PLANNED_SHORELINE_VERSION = "planned-world-shoreline-v2";
var PLANNED_WATER_VERSION = "planned-world-water-v3";
var PLANNED_SCALE = Object.freeze({ tilePixels: 32, chunkTilesX: 32, chunkTilesY: 26, macroTilesX: 64, macroTilesY: 52 });
var PLANNED_ADDRESS_OFFSET = Object.freeze({ chunkX: 1024, chunkY: 1024 });
var BIOME_CODES = Object.freeze({ woodland: "w", grassland: "a", wetland: "m", upland: "r", desert: "d", frostland: "s", tropical: "t", volcanic: "l" });
var BIOME_PRESENTATION_COVERAGE = Object.freeze({ woodland: "existing ground, leaf litter, trees; partial coast kit", wetland: "existing marsh ground/reeds; partial water kit", upland: "existing rocky ground and rocks; partial cliff kit", grassland: "adapted ground palette; temporary meadow detail", desert: "temporary sand palette and stones; no complete desert kit", frostland: "temporary snow palette and stones; no complete frost kit", tropical: "temporary jungle palette and existing foliage; no complete tropical kit", volcanic: "temporary basalt palette and rocks; no complete volcanic kit" });
function requirePlan(condition, message) {
  if (!condition) throw new TypeError(message);
}
var mixPlan = (text) => {
  let n = 2166136261;
  for (let i = 0; i < text.length; i++) {
    n ^= text.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
};
function validateRuntimePlan(p) {
  requirePlan([PLANNED_WORLD_VERSION, PLANNED_SHORELINE_VERSION, PLANNED_WATER_VERSION].includes(p?.version) && p.exactLandCells === 8e3, "Planned runtime version/land budget");
  if ([PLANNED_SHORELINE_VERSION, PLANNED_WATER_VERSION].includes(p.version)) {
    const s = p.shoreline;
    requirePlan(s?.version === LOCAL_SHORELINE_VERSION && s.minimumBandTiles === 2 && s.maximumBandTiles === 22 && s.coordinateOverlay === false, "Invalid local shoreline policy");
    for (const k of ["predecessorAssetHash", "sourcePolicyHash", "realizationHash"]) requirePlan(/^[a-f0-9]{64}$/.test(s[k]), "Invalid shoreline commitment");
  }
  if (p.version === PLANNED_WATER_VERSION) {
    const w = p.waterGeometry;
    requirePlan(w?.version === LOCAL_WATER_VERSION && w.receiverDirectionsAvailable === false && Array.isArray(w.bridgeGuards) && w.bridgeGuards.length <= 64, "Invalid local water policy");
    for (const k of ["predecessorAssetHash", "realizationHash"]) requirePlan(/^[a-f0-9]{64}$/.test(w[k]), "Invalid water commitment");
    for (const b of w.bridgeGuards) requirePlan(Object.keys(b).sort().join(",") === "x1,x2,y1,y2" && Object.values(b).every(Number.isSafeInteger) && b.x1 <= b.x2 && b.y1 <= b.y2 && b.x2 - b.x1 <= 20 && b.y2 - b.y1 <= 20, "Invalid immutable bridge guard");
  }
  requirePlan(p.scale.tilePixels === 32 && p.scale.chunkTilesX === 32 && p.scale.chunkTilesY === 26 && p.scale.macroTilesX === 64 && p.scale.macroTilesY === 52, "Planned spatial scale");
  requirePlan(p.settlements.length === 20 && p.sites.length === (p.firstJourney ? 125 : p.wildernessExtension ? 124 : p.populationOverlay ? 51 : 48) && p.futureIslands.length === 6 && p.factions.length === 3 && p.stonewatch.candidateCount > 0, "Incomplete planned reservations");
  if (p.worldReshape) requirePlan(p.worldReshape.version === RESHAPE_VERSION && p.worldReshape.hash === RESHAPE_HASH && p.firstJourney && p.assetId === "alpha", "Uncommitted world reshape");
  if (p.firstJourney) requirePlan(p.firstJourney.version === ACCESS_VERSION && p.firstJourney.hash === ACCESS_HASH && p.wildernessExtension && p.hydrologyPlan && p.assetId === "alpha" && p.sites.filter((s) => s.id === "repeatable-slot:cave:woodland:small:109").length === 1, "Uncommitted first journey");
  if (p.wildernessExtension) requirePlan(p.wildernessExtension.version === WILDERNESS_VERSION && p.wildernessExtension.hash === WILDERNESS_HASH && p.assetId === "alpha", "Uncommitted wilderness extension");
  if (p.populationOverlay) requirePlan(p.populationOverlay.version === ALPHA_POPULATION_VERSION && p.populationOverlay.hash === ALPHA_POPULATION_HASH && p.populationOverlay.parentAssetHash === ALPHA_POPULATION_BASE_HASH && p.assetId === "alpha", "Uncommitted population overlay");
  const seen = /* @__PURE__ */ new Set();
  let count = 0;
  for (const row of p.cellRows) for (const c of row.cells) {
    const key2 = c[0] + "," + row.y;
    requirePlan(!seen.has(key2) && c.length === 11 && c[1] >= 0 && c[1] < p.landmasses.length && c[2] >= 1 && c[2] <= 8 && c[3] >= 1 && c[3] <= 5, "Invalid/overlapping planned cell");
    seen.add(key2);
    count++;
  }
  requirePlan(count === 8e3, "Missing planned cell");
  for (const list of [p.settlements, p.sites, p.futureIslands, p.factions]) requirePlan(new Set(list.map((r) => r.id)).size === list.length, "Duplicate planned destination");
  return p;
}
function createPlannedTerrain(p) {
  validateRuntimePlan(p);
  const width = p.domain.width, height = p.domain.height, cells = new Array(width * height).fill(null), landmass = p.landmasses;
  for (const row of p.cellRows) for (const c of row.cells) cells[row.y * width + c[0]] = c;
  const macro = (x, y) => x >= 0 && y >= 0 && x < width && y < height ? cells[y * width + x] : null, softBiome = p.worldReshape ? createSoftBiomeSampler(p, macro) : null;
  const shoreline = [PLANNED_SHORELINE_VERSION, PLANNED_WATER_VERSION].includes(p.version) ? createLocalShoreline(p, macro) : null;
  const riverSegments = /* @__PURE__ */ new Map(), add = (x, y, a, b, w) => {
    const k = x + "," + y;
    if (!riverSegments.has(k)) riverSegments.set(k, []);
    riverSegments.get(k).push([a, b, w]);
  };
  for (const row of p.cellRows) for (const c of row.cells) if (c[5] > 0 && !c[4]) {
    const x = c[0], y = row.y, center = { x: x * 64 + 32, y: y * 52 + 26 }, dx = c[6], dy = c[7], radius = c[5] >= 3 ? 3 : c[5] === 2 ? 2 : 1;
    if (dx || dy) {
      const to = { x: center.x + dx * 64, y: center.y + dy * 52 };
      add(x, y, center, to, radius);
      add(x + dx, y + dy, center, to, radius);
    } else {
      let links = 0;
      for (const [a, b] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const neighbor = macro(x + a, y + b);
        if (neighbor && neighbor[1] === c[1] && neighbor[5] > 0 && !neighbor[4]) {
          add(x, y, center, { x: center.x + a * 32, y: center.y + b * 26 }, radius);
          links++;
        }
      }
      if (!links) add(x, y, { x: center.x - 8, y: center.y }, { x: center.x + 8, y: center.y }, radius);
      const sides = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([a, b]) => !macro(x + a, y + b));
      if (sides.length) {
        const [a, b] = sides[mixPlan(p.seedDigest + "/outlet/" + x + "/" + y) % sides.length];
        add(x, y, center, { x: center.x + a * 32, y: center.y + b * 26 }, radius);
      }
    }
  }
  const parentWater = p.version === PLANNED_WATER_VERSION ? createLocalWaterGeometry(p, macro, shoreline, riverSegments) : null, waterGeometry = p.hydrologyPlan ? createHydrologyGeometryV1(p.hydrologyPlan, parentWater) : parentWater;
  const segmentDistance = (x, y, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, u = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return PM.hypot(x - a.x - u * dx, y - a.y - u * dy);
  };
  function base(x, y, sparseCoast = false) {
    const mx = Math.floor(x / 64), my = Math.floor(y / 52), c = macro(mx, my);
    if (!c) return { walkable: false, kind: "ocean", biome: "o", landmassId: null, band: 0 };
    const coast = waterGeometry ? sparseCoast ? waterGeometry.sampleCoast(x, y) : waterGeometry.coast(x, y) : shoreline?.tile(x, y);
    if (coast?.water) return { walkable: false, kind: "ocean", biome: "o", landmassId: null, band: 0 };
    const biome = p.biomeIds[(softBiome ? softBiome(x, y, mx, my, c) : c[2]) - 1].replace("biome:", ""), code = BIOME_CODES[biome], inland = waterGeometry?.inland(x, y);
    if (inland?.water) return { walkable: false, kind: inland.kind, biome: code, landmassId: landmass[c[1]].id, band: c[3] };
    if (!waterGeometry && c[4]) return { walkable: false, kind: "lake", biome: code, landmassId: landmass[c[1]].id, band: c[3] };
    for (const [a, b, w] of (!waterGeometry ? riverSegments.get(mx + "," + my) : null) ?? []) if (segmentDistance(x + 0.5, y + 0.5, a, b) <= w) return { walkable: false, kind: "river", biome: code, landmassId: landmass[c[1]].id, band: c[3] };
    const lx = x - mx * 64, ly = y - my * 52, oldCoastal = !macro(mx - 1, my) && lx < 3 || !macro(mx + 1, my) && lx >= 61 || !macro(mx, my - 1) && ly < 3 || !macro(mx, my + 1) && ly >= 49;
    return { walkable: true, bank: inland?.bank ?? false, kind: (shoreline ? coast?.shore : oldCoastal) ? "shore" : "land", shoreClassId: coast?.classId ?? null, biome: code, biomeId: "biome:" + biome, landmassId: landmass[c[1]].id, band: c[3], slope: c[8], geology: c[9], elevation: c[10] };
  }
  return Object.freeze({ base, sampleBase: (x, y) => base(x, y, true), macro, widthTiles: width * 64, heightTiles: height * 52, riverSegments: p.hydrologyPlan ? null : riverSegments, shoreline, waterGeometry });
}

// src/shared/generation/hydrology_bridges_v2.js
var HYDROLOGY_BRIDGE_VERSION = "hydrology-crossing-v2";
function planHydrologyBridgesV2(p, kind) {
  const bridges = [], retired = [], failures = [], covered = /* @__PURE__ */ new Set(), ids = /* @__PURE__ */ new Set();
  const hash = (s) => {
    let n = 2166136261;
    for (const c of s) {
      n ^= c.charCodeAt(0);
      n = Math.imul(n, 16777619);
    }
    return (n >>> 0).toString(16);
  };
  function valid(b) {
    const a = b.start, z = b.end, dx = Math.sign(z.x - a.x), dy = Math.sign(z.y - a.y), len = Math.abs(z.x - a.x) + Math.abs(z.y - a.y), radius = (b.widthTiles - 1) / 2;
    if (kind(a.x, a.y) !== 0 || kind(z.x, z.y) !== 0) return false;
    let water = false;
    for (let n = 0; n <= len; n++) for (let r = -radius; r <= radius; r++) {
      const x = a.x + dx * n - dy * r, y = a.y + dy * n + dx * r, k = kind(x, y);
      if (k !== 0 && k !== 1) return false;
      water ||= k === 1;
    }
    return water;
  }
  function add(b) {
    if (ids.has(b.id)) return;
    ids.add(b.id);
    bridges.push(b);
    const dx = Math.sign(b.end.x - b.start.x), dy = Math.sign(b.end.y - b.start.y), len = Math.abs(b.end.x - b.start.x) + Math.abs(b.end.y - b.start.y), r = (b.widthTiles - 1) / 2;
    for (let n = 0; n <= len; n++) for (let j = -r; j <= r; j++) covered.add(b.start.x + dx * n - dy * j + "," + (b.start.y + dy * n + dx * j));
  }
  for (const b of p.routes.bridges) if (valid(b)) add(b);
  else retired.push({ id: b.id, reason: "Predecessor crossing no longer matches the corrected channel; road remains on its existing line" });
  function segment(a, z, e) {
    const dx = Math.sign(z.x - a.x), dy = Math.sign(z.y - a.y), len = Math.abs(z.x - a.x) + Math.abs(z.y - a.y);
    if (dx && dy) {
      const steps = Math.max(Math.abs(z.x - a.x), Math.abs(z.y - a.y));
      if (Array.from({ length: steps + 1 }, (_, i2) => kind(Math.round(a.x + (z.x - a.x) * i2 / (steps || 1)), Math.round(a.y + (z.y - a.y) * i2 / (steps || 1)))).includes(1)) failures.push({ code: "NONCARDINAL_WATER_CROSSING", edge: e.id, a, z });
      return;
    }
    let i = 0;
    while (i <= len) {
      const x = a.x + dx * i, y = a.y + dy * i;
      if (kind(x, y) !== 1 || covered.has(x + "," + y)) {
        i++;
        continue;
      }
      const first = i;
      while (i <= len && kind(a.x + dx * i, a.y + dy * i) === 1) i++;
      let from = first - 2, to = i + 1;
      while (kind(a.x + dx * from, a.y + dy * from) !== 0 && first - from < 40) from--;
      while (kind(a.x + dx * to, a.y + dy * to) !== 0 && to - i < 40) to++;
      const start = { x: a.x + dx * from, y: a.y + dy * from }, end = { x: a.x + dx * to, y: a.y + dy * to }, b = { id: "bridge:" + hash("hydrology-v2/" + p.seedDigest + "/" + e.id + "/" + JSON.stringify([start, end])), start, end, landmassId: e.landmassId, orientation: dx ? "horizontal" : "vertical", widthTiles: e.kind === "main" ? 5 : 3, waterSpanMaximumTiles: 40, crossingVersion: HYDROLOGY_BRIDGE_VERSION, underlyingHydrologyPreserved: true };
      if (to - from > 40 || !valid(b)) {
        failures.push({ code: "CROSSING_REQUIRES_ROUTE_REPAIR", edge: e.id, start, end, length: to - from });
        continue;
      }
      add(b);
    }
  }
  for (const e of p.routes.edges) {
    if (e.path.length < 2) continue;
    let a = e.path[0], prev = a, axis = null;
    for (let i = 1; i < e.path.length; i++) {
      const q = e.path[i], next = q.x === prev.x ? "y" : q.y === prev.y ? "x" : "diagonal";
      if (axis && next !== axis) {
        segment(a, prev, e);
        a = prev;
      }
      axis = next;
      prev = q;
    }
    segment(a, prev, e);
  }
  return { version: HYDROLOGY_BRIDGE_VERSION, bridges, retired, failures, retained: bridges.filter((b) => !b.crossingVersion).length, added: bridges.filter((b) => b.crossingVersion).length };
}

// src/shared/generation/world_maker_v1/core.js
var W = 150;
var H = 160;
var N = W * H;
var LAND_CELLS = 8e3;
var BIOMES = ["woodland", "grassland", "wetland", "upland", "desert", "frostland", "tropical", "volcanic"];
var idx = (x, y) => y * W + x;
var cx = (i) => i % W;
var cy = (i) => i / W | 0;
var inside = (x, y, m = 0) => x >= m && y >= m && x < W - m && y < H - m;
var N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
var N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function hash32(text) {
  let n = 2166136261;
  for (let i = 0; i < text.length; i++) {
    n ^= text.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  n = Math.imul(n ^ n >>> 16, 2246822507);
  n = Math.imul(n ^ n >>> 13, 3266489909);
  return (n ^ n >>> 16) >>> 0;
}
var unit = (text) => hash32(text) / 4294967296;
function stream(seed, tag) {
  let s = hash32(seed + "/" + tag) || 1;
  return () => {
    s = s + 1831565813 | 0;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function valueNoise(seed, tag) {
  const k = hash32(seed + "/noise/" + tag) | 0;
  const lat = (x, y) => {
    let n = Math.imul(x, 668265261) ^ Math.imul(y, 374761393) ^ k;
    n = Math.imul(n ^ n >>> 15, 2246822507);
    n = Math.imul(n ^ n >>> 13, 3266489909);
    return ((n ^ n >>> 16) >>> 0) / 4294967296;
  };
  return (x, y, s) => {
    const fx = x / s, fy = y / s, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), a = lat(ix, iy), b = lat(ix + 1, iy), c = lat(ix, iy + 1), d = lat(ix + 1, iy + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
}
function fbm(noise, x, y, s, octaves = 4) {
  let a = 0, amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    a += amp * noise(x + o * 101.3, y - o * 57.1, s / (1 << o));
    total += amp;
    amp *= 0.5;
  }
  return a / total;
}
function quantileMap(values, table) {
  const order = [...values.keys()].sort((a, b) => values[a] - values[b] || a - b), out = new Array(values.length);
  order.forEach((k, r) => {
    const q = r / Math.max(1, order.length - 1) * (table.length - 1), i = Math.floor(q), t = q - i;
    out[k] = Math.round(table[i] + (table[Math.min(table.length - 1, i + 1)] - table[i]) * t);
  });
  return out;
}
var Heap = class {
  constructor() {
    this.k = [];
    this.v = [];
  }
  get size() {
    return this.k.length;
  }
  push(key2, val) {
    const k = this.k, v = this.v;
    let i = k.length;
    k.push(key2);
    v.push(val);
    while (i) {
      const j = i - 1 >> 1;
      if (k[j] <= key2) break;
      k[i] = k[j];
      v[i] = v[j];
      i = j;
    }
    k[i] = key2;
    v[i] = val;
  }
  pop() {
    const k = this.k, v = this.v, top = v[0], key2 = k.pop(), val = v.pop();
    if (k.length) {
      let i = 0;
      for (; ; ) {
        let j = i * 2 + 1;
        if (j >= k.length) break;
        if (j + 1 < k.length && k[j + 1] < k[j]) j++;
        if (k[j] >= key2) break;
        k[i] = k[j];
        v[i] = v[j];
        i = j;
      }
      k[i] = key2;
      v[i] = val;
    }
    return top;
  }
  peekKey() {
    return this.k[0];
  }
};
function sha256Hex(text) {
  const K = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];
  const bytes = new TextEncoder().encode(text), len = bytes.length, total = len + 9 + 63 >> 6 << 6, m = new Uint8Array(total);
  m.set(bytes);
  m[len] = 128;
  const bits = len * 8;
  for (let i = 0; i < 4; i++) m[total - 1 - i] = bits / PM.pow(2, 8 * i) & 255;
  const h = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225], w = new Int32Array(64), r = (x, n) => x >>> n | x << 32 - n;
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = m[o + i * 4] << 24 | m[o + i * 4 + 1] << 16 | m[o + i * 4 + 2] << 8 | m[o + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const a2 = w[i - 15], b2 = w[i - 2];
      w[i] = (r(a2, 7) ^ r(a2, 18) ^ a2 >>> 3) + w[i - 16] + (r(b2, 17) ^ r(b2, 19) ^ b2 >>> 10) + w[i - 7] | 0;
    }
    let [a, b, c, d, e, f, g, k] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = k + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + (e & f ^ ~e & g) + K[i] + w[i] | 0, t2 = (r(a, 2) ^ r(a, 13) ^ r(a, 22)) + (a & b ^ a & c ^ b & c) | 0;
      k = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    h[0] = h[0] + a | 0;
    h[1] = h[1] + b | 0;
    h[2] = h[2] + c | 0;
    h[3] = h[3] + d | 0;
    h[4] = h[4] + e | 0;
    h[5] = h[5] + f | 0;
    h[6] = h[6] + g | 0;
    h[7] = h[7] + k | 0;
  }
  return h.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

// src/shared/generation/world_maker_v1/land.js
var ELEVATION_TABLE = [423, 852, 956, 1041, 1111, 1167, 1215, 1265, 1310, 1353, 1394, 1438, 1477, 1519, 1567, 1604, 1642, 1681, 1725, 1772, 1818, 1855, 1899, 1943, 1990, 2042, 2101, 2164, 2231, 2295, 2373, 2471, 2569, 2682, 2808, 2950, 3132, 3337, 3600, 3600, 3600];
var SLOPE_TABLE = [0, 0, 26, 53, 68, 81, 89, 98, 106, 114, 120, 126, 133, 141, 148, 155, 163, 169, 175, 181, 187, 192, 199, 206, 212, 218, 224, 230, 238, 245, 252, 261, 270, 280, 290, 302, 312, 325, 342, 370, 454];
var MARGIN = 4;
function makeLand(seed) {
  const rnd = stream(seed, "land"), noiseA = valueNoise(seed, "coast-a"), noiseB = valueNoise(seed, "coast-b");
  const owner = new Int16Array(N).fill(-1), landmasses = [];
  const islets = [];
  for (let n = 24 + Math.floor(rnd() * 8), i = 0; i < n; i++) islets.push(rnd() < 0.6 ? 1 : rnd() < 0.6 ? 2 : 3);
  const majors = [0, 1, 2].map(() => 880 + Math.floor(rnd() * 160)), mediums = [0, 1, 2, 3].map(() => 290 + Math.floor(rnd() * 80));
  const mainland = LAND_CELLS - islets.reduce((a, b) => a + b, 0) - majors.reduce((a, b) => a + b, 0) - mediums.reduce((a, b) => a + b, 0);
  const near = (i, gap, self2) => {
    const x = cx(i), y = cy(i);
    for (let dy = -gap; dy <= gap; dy++) for (let dx = -gap; dx <= gap; dx++) {
      const nx = x + dx, ny = y + dy;
      if (!inside(nx, ny)) continue;
      const o = owner[idx(nx, ny)];
      if (o >= 0 && o !== self2) return true;
    }
    return false;
  };
  function grow(id, centre, budget, gap) {
    const theta = rnd() * Math.PI, aspect = 1 + rnd() * 0.9, R = Math.sqrt(budget / Math.PI), ca = PM.cos(theta), sa = PM.sin(theta), x0 = cx(centre), y0 = cy(centre), warp = 8 + rnd() * 10;
    const score = (i) => {
      const x = cx(i), y = cy(i), wx = x + (fbm(noiseB, x, y, 20, 2) - 0.5) * warp, wy = y + (fbm(noiseB, x + 300, y, 20, 2) - 0.5) * warp, u = ((wx - x0) * ca + (wy - y0) * sa) / Math.sqrt(aspect), v = (-(wx - x0) * sa + (wy - y0) * ca) * Math.sqrt(aspect);
      const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
      return PM.hypot(u, v) / R - 0.9 * fbm(noiseA, x, y, 16, 4) + Math.max(0, 14 - edge) * 0.06;
    };
    const heap = new Heap(), claimed = [], seen = new Uint8Array(N);
    heap.push(score(centre), centre);
    seen[centre] = 1;
    while (heap.size && claimed.length < budget) {
      const i = heap.pop();
      if (owner[i] >= 0 || near(i, gap, id)) continue;
      owner[i] = id;
      claimed.push(i);
      for (const [dx, dy] of N4) {
        const nx = cx(i) + dx, ny = cy(i) + dy;
        if (!inside(nx, ny, MARGIN)) continue;
        const j = idx(nx, ny);
        if (!seen[j]) {
          seen[j] = 1;
          heap.push(score(j), j);
        }
      }
    }
    if (claimed.length < budget) {
      for (const i of claimed) owner[i] = -1;
      return null;
    }
    tidy(id, claimed, score, gap);
    return claimed;
  }
  function tidy(id, claimed, score, gap) {
    const mine = (i) => owner[i] === id, n4 = (i) => N4.reduce((a, [dx, dy]) => a + (inside(cx(i) + dx, cy(i) + dy) && mine(idx(cx(i) + dx, cy(i) + dy)) ? 1 : 0), 0);
    const safe = (i) => {
      const x = cx(i), y = cy(i), l = N4.filter(([dx, dy]) => mine(idx(x + dx, y + dy)));
      if (l.length === 1) return true;
      if (l.length !== 2) return false;
      const [a, b] = l;
      if (a[0] === -b[0] && a[1] === -b[1]) return false;
      return mine(idx(x + a[0] + b[0], y + a[1] + b[1]));
    };
    const set = new Set(claimed);
    for (let pass = 0; pass < 6; pass++) {
      const reach = new Uint8Array(N), q2 = [];
      for (let x = 0; x < W; x++) for (const y of [0, H - 1]) {
        reach[idx(x, y)] = 1;
        q2.push(idx(x, y));
      }
      for (let y = 0; y < H; y++) for (const x of [0, W - 1]) {
        reach[idx(x, y)] = 1;
        q2.push(idx(x, y));
      }
      for (let h = 0; h < q2.length; h++) {
        const i = q2[h];
        for (const [dx, dy] of N4) {
          const nx = cx(i) + dx, ny = cy(i) + dy;
          if (!inside(nx, ny)) continue;
          const j = idx(nx, ny);
          if (!reach[j] && !mine(j)) {
            reach[j] = 1;
            q2.push(j);
          }
        }
      }
      const add = [];
      for (let i = 0; i < N; i++) if (!reach[i] && owner[i] < 0) add.push(i);
      for (const i of set) for (const [dx, dy] of N4) {
        const nx = cx(i) + dx, ny = cy(i) + dy;
        if (!inside(nx, ny, MARGIN)) continue;
        const j = idx(nx, ny);
        if (owner[j] < 0 && !add.includes(j) && n4(j) >= 3 && !near(j, gap, id)) add.push(j);
      }
      const tips = [...set].filter((i) => n4(i) <= 1);
      if (!add.length && !tips.length) break;
      for (const i of add) {
        owner[i] = id;
        set.add(i);
      }
      let excess = add.length;
      for (const i of tips) {
        if (n4(i) <= 1 && safe(i) && set.size > 1) {
          owner[i] = -1;
          set.delete(i);
          excess--;
        }
      }
      while (excess > 0) {
        let best = -1, bs = -Infinity;
        for (const i of set) if (safe(i)) {
          const s = score(i);
          if (s > bs) {
            bs = s;
            best = i;
          }
        }
        if (best < 0) break;
        owner[best] = -1;
        set.delete(best);
        excess--;
      }
      while (excess < 0) {
        let best = -1, bs = Infinity;
        for (const i of set) for (const [dx, dy] of N4) {
          const nx = cx(i) + dx, ny = cy(i) + dy;
          if (!inside(nx, ny, MARGIN)) continue;
          const j = idx(nx, ny);
          if (owner[j] < 0 && !near(j, gap, id)) {
            const s = score(j) - n4(j);
            if (s < bs) {
              bs = s;
              best = j;
            }
          }
        }
        if (best < 0) break;
        owner[best] = id;
        set.add(best);
        excess++;
      }
    }
    claimed.length = 0;
    claimed.push(...set);
  }
  const place = (classId, budget, gap, pick) => {
    for (let attempt = 0; attempt < 400; attempt++) {
      const c = pick();
      if (owner[c] >= 0 || near(c, gap + 2, -2)) continue;
      const id = landmasses.length, cells = grow(id, c, budget, gap);
      if (cells) {
        landmasses.push({ classId, cells });
        return true;
      }
    }
    return false;
  };
  const anywhere = (r) => () => idx(MARGIN + r + Math.floor(rnd() * (W - 2 * (MARGIN + r))), MARGIN + r + Math.floor(rnd() * (H - 2 * (MARGIN + r))));
  if (!place("primary-mainland", mainland, 3, anywhere(26))) throw Error("No room for the mainland");
  for (const b of majors) if (!place("major-island", b, 3, anywhere(14))) throw Error("No room for a great island");
  for (const b of mediums) if (!place("medium-island", b, 2, anywhere(8))) throw Error("No room for a medium island");
  const coast = [];
  for (let i = 0; i < N; i++) if (owner[i] >= 0 && N4.some(([dx, dy]) => owner[idx(cx(i) + dx, cy(i) + dy)] < 0)) coast.push(i);
  for (const b of islets) {
    if (!place("minor-island", b, 1, () => {
      const c = coast[Math.floor(rnd() * coast.length)], a = rnd() * Math.PI * 2, d = 3 + rnd() * 6, x = Math.round(cx(c) + PM.cos(a) * d), y = Math.round(cy(c) + PM.sin(a) * d);
      return inside(x, y, MARGIN) ? idx(x, y) : c;
    })) throw Error("No room for an islet");
  }
  const land = [];
  for (let i = 0; i < N; i++) if (owner[i] >= 0) land.push(i);
  if (land.length !== LAND_CELLS) throw Error("Land budget " + land.length);
  const depth = new Float64Array(N).fill(0), q = [];
  for (const i of land) if (N8.some(([dx, dy]) => owner[idx(cx(i) + dx, cy(i) + dy)] < 0)) {
    depth[i] = 1;
    q.push(i);
  }
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    for (const [dx, dy] of N4) {
      const j = idx(cx(i) + dx, cy(i) + dy);
      if (owner[j] >= 0 && !depth[j]) {
        depth[j] = depth[i] + 1;
        q.push(j);
      }
    }
  }
  const maxDepth = landmasses.map(() => 1);
  for (const i of land) maxDepth[owner[i]] = Math.max(maxDepth[owner[i]], depth[i]);
  const ridgeN = valueNoise(seed, "ridge"), rollN = valueNoise(seed, "roll"), lift = { "primary-mainland": 0.1, "major-island": 0.05, "medium-island": 0, "minor-island": -0.1 };
  const raw = land.map((i) => {
    const x = cx(i), y = cy(i), d = (depth[i] - 1) / Math.max(1, maxDepth[owner[i]] - 1), ridge = 1 - Math.abs(2 * fbm(ridgeN, x, y, 26, 3) - 1);
    return 0.34 * PM.pow(d, 0.7) + 0.46 * ridge * ridge * Math.min(1, d * 2.5) + 0.2 * fbm(rollN, x, y, 10, 3) + lift[landmasses[owner[i]].classId];
  });
  const elevation = new Int16Array(N), slope = new Int16Array(N), geology = new Uint8Array(N);
  quantileMap(raw, ELEVATION_TABLE).forEach((v, k) => elevation[land[k]] = v);
  const grad = land.map((i) => {
    let g = 0;
    for (const [dx, dy] of N8) {
      const j = idx(cx(i) + dx, cy(i) + dy), e = owner[j] >= 0 ? elevation[j] : 300;
      g = Math.max(g, Math.abs(e - elevation[i]) / PM.hypot(dx, dy));
    }
    return g;
  });
  quantileMap(grad, SLOPE_TABLE).forEach((v, k) => slope[land[k]] = v);
  const rock = land.map((i) => slope[i] / 454 * 0.6 + elevation[i] / 3600 * 0.4), cut = [...rock].sort((a, b) => b - a)[Math.floor(land.length * 0.18)];
  land.forEach((i, k) => {
    if (rock[k] > cut) geology[i] = 1;
  });
  const ordinal = {};
  for (const l of landmasses) {
    const n = ordinal[l.classId] = (ordinal[l.classId] ?? 0) + 1;
    l.id = "landmass:" + l.classId + ":seeded:" + String(n).padStart(2, "0") + ":" + hash32(seed + "/" + l.classId + "/" + n).toString(16).padStart(8, "0");
  }
  return { owner, landmasses, land, elevation, slope, geology, depth };
}

// src/shared/generation/world_maker_v1/layout.js
var CHUNK_KEYS = /* @__PURE__ */ new Set(["core", "expansion", "sockets"]);
function relocate(record, dx, dy, fromLandmass, toLandmass) {
  const walk = (v, k) => {
    if (Array.isArray(v)) return v.map((e) => walk(e, k));
    if (typeof v === "string") {
      if (v.startsWith(fromLandmass)) return toLandmass + v.slice(fromLandmass.length);
      if (k === "macroCellKey") {
        const [x, y] = v.split(",").map(Number);
        return x + dx + "," + (y + dy);
      }
      return v;
    }
    if (!v || typeof v !== "object") return v;
    if ("chunkX" in v && "chunkY" in v) {
      const x = v.chunkX + 2 * dx, y = v.chunkY + 2 * dy;
      return { ...v, chunkX: x, chunkY: y, key: x + "," + y };
    }
    if (k === "anchor") return { key: v.x + dx + "," + (v.y + dy), x: v.x + dx, y: v.y + dy };
    if (k === "tileOrigin") return { x: v.x + 64 * dx, y: v.y + 52 * dy };
    if (CHUNK_KEYS.has(k) && "x" in v) return { x: v.x + 2 * dx, y: v.y + 2 * dy };
    return Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, walk(vv, kk)]));
  };
  return walk(record, null);
}
var settlementChunks = (s) => [...s.core, ...s.expansion, ...s.sockets];
var marineChunks = (s) => Object.values(s.connectionReadiness.marineConnectionSlotsById).flatMap((m) => [m.endpointReservation.anchorChunk, ...m.endpointReservation.approachChunks]).map((c) => ({ x: c.chunkX, y: c.chunkY }));
function makeLayout(seed, land, templates) {
  const { owner, landmasses, elevation, slope, depth } = land, rnd = stream(seed, "layout"), LM = landmasses.map((l, k) => l.id);
  const isLand = (x, y) => inside(x, y) && owner[idx(x, y)] >= 0, coastal = (x, y) => isLand(x, y) && N4.some(([dx, dy]) => !isLand(x + dx, y + dy));
  const taken = new Int16Array(W * H).fill(-1), placed = /* @__PURE__ */ new Map();
  function fits(t, ax, ay, k, spacing = 2) {
    const dx = ax - t.anchor.x, dy = ay - t.anchor.y;
    for (const c of settlementChunks(t)) {
      const mx = Math.floor((c.x + 2 * dx) / 2), my = Math.floor((c.y + 2 * dy) / 2);
      if (!isLand(mx, my) || owner[idx(mx, my)] !== k) return false;
      for (let yy = my - spacing; yy <= my + spacing; yy++) for (let xx = mx - spacing; xx <= mx + spacing; xx++) if (inside(xx, yy) && taken[idx(xx, yy)] >= 0) return false;
    }
    for (const c of marineChunks(t)) {
      const mx = Math.floor((c.x + 2 * dx) / 2), my = Math.floor((c.y + 2 * dy) / 2);
      if (!inside(mx, my) || isLand(mx, my) && (owner[idx(mx, my)] !== k || !coastal(mx, my))) return false;
    }
    if (!marineChunks(t).length) for (const c of t.core) {
      const mx = Math.floor((c.x + 2 * dx) / 2), my = Math.floor((c.y + 2 * dy) / 2);
      if (coastal(mx, my)) return false;
    }
    return true;
  }
  function put2(id, ax, ay, k) {
    const t = templates.get(id), r = relocate(t, ax - t.anchor.x, ay - t.anchor.y, t.landmassId, LM[k]);
    for (const c of settlementChunks(r)) taken[idx(Math.floor(c.x / 2), Math.floor(c.y / 2))] = 1;
    placed.set(id, r);
    return r;
  }
  function choose(id, ks2, score, spacing = 2) {
    const t = templates.get(id);
    let best = null, bv = -Infinity;
    for (let i = 0; i < W * H; i++) {
      const k = owner[i];
      if (k < 0 || !ks2.includes(k)) continue;
      const v = score(i) + rnd() * 0.01;
      if (v <= bv) continue;
      if (fits(t, cx(i), cy(i), k, spacing)) {
        bv = v;
        best = i;
      }
    }
    if (best === null) return null;
    return put2(id, cx(best), cy(best), owner[best]);
  }
  const ofClass = (c) => landmasses.map((l, k) => l.classId === c ? k : -1).filter((k) => k >= 0);
  const mainland = ofClass("primary-mainland"), majors = ofClass("major-island"), mediums = ofClass("medium-island");
  const mcells = landmasses[mainland[0]].cells, mx0 = mcells.reduce((a, i) => a + cx(i), 0) / mcells.length, my0 = mcells.reduce((a, i) => a + cy(i), 0) / mcells.length;
  const far = (i) => PM.hypot(cx(i) - mx0, cy(i) - my0);
  const maxFar = Math.max(...mcells.map(far));
  const startAngle = rnd() * Math.PI * 2, startDir = (i) => PM.cos(PM.atan2(cy(i) - my0, cx(i) - mx0) - startAngle);
  const alder = choose("settlement-slot:village-outpost:01", mainland, (i) => -Math.abs(far(i) / maxFar - 0.62) * 3 + startDir(i) * 0.8 - slope[i] / 300 + (depth[i] >= 3 ? 0.4 : 0), 3);
  if (!alder) throw Error("No room for Alderwood");
  const A = alder.anchor;
  const cap = choose("settlement-slot:capital-great-hold:01", mainland, (i) => {
    const d = PM.hypot(cx(i) - A.x, cy(i) - A.y);
    return -Math.abs(d - 7) - slope[i] / 400;
  });
  if (!cap) throw Error("No room for the capital");
  const islands = [...majors, ...mediums], icells = islands.flatMap((k) => landmasses[k].cells), ix0 = icells.reduce((a, i) => a + cx(i), 0) / icells.length, iy0 = icells.reduce((a, i) => a + cy(i), 0) / icells.length;
  const hub = choose("settlement-slot:village-outpost:06", mainland, (i) => -PM.hypot(cx(i) - ix0, cy(i) - iy0) / 20 - Math.max(0, 8 - PM.hypot(cx(i) - A.x, cy(i) - A.y)) * 0.3);
  if (!hub) throw Error("No room for the ferry harbour");
  const hubChunk = marineChunks(hub)[0], hubCell = idx(Math.floor(hubChunk.x / 2), Math.floor(hubChunk.y / 2));
  const landings = [{ landmass: mainland[0], cell: hubCell, hub: true }, ...islands.map((k) => {
    let best = null, bd = Infinity;
    for (const i of landmasses[k].cells) {
      if (!coastal(cx(i), cy(i))) continue;
      const d = PM.hypot(cx(i) - cx(hubCell), cy(i) - cy(hubCell));
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return { landmass: k, cell: best };
  })];
  const travel = new Float64Array(W * H).fill(Infinity), start = idx(A.x, A.y), heap = new Heap(), links = /* @__PURE__ */ new Map();
  for (const l of landings.slice(1)) {
    const a = hubCell, b = l.cell, cost = 8 + 0.6 * PM.hypot(cx(a) - cx(b), cy(a) - cy(b));
    for (const [u, v] of [[a, b], [b, a]]) {
      if (!links.has(u)) links.set(u, []);
      links.get(u).push([v, cost]);
    }
  }
  travel[start] = 0;
  heap.push(0, start);
  while (heap.size) {
    const d = heap.peekKey(), i = heap.pop();
    if (d > travel[i]) continue;
    for (const [dx, dy] of N8) {
      const x = cx(i) + dx, y = cy(i) + dy;
      if (!isLand(x, y)) continue;
      const j = idx(x, y);
      if (owner[j] !== owner[i]) continue;
      const v = d + PM.hypot(dx, dy) * (1 + slope[j] / 900);
      if (v < travel[j]) {
        travel[j] = v;
        heap.push(v, j);
      }
    }
    for (const [j, c] of links.get(i) ?? []) if (d + c < travel[j]) {
      travel[j] = d + c;
      heap.push(d + c, j);
    }
  }
  const landCells = land.land;
  let farthest = 0;
  for (const i of landCells) if (Number.isFinite(travel[i])) farthest = Math.max(farthest, travel[i]);
  for (const i of landCells) if (!Number.isFinite(travel[i])) travel[i] = farthest + (owner[i] >= 0 ? 4 : 0);
  const band = new Uint8Array(W * H);
  [...landCells].sort((a, b) => travel[a] - travel[b] || a - b).forEach((i, k, all) => {
    const q = k / all.length;
    band[i] = q < 0.12 ? 1 : q < 0.32 ? 2 : q < 0.58 ? 3 : q < 0.85 ? 4 : 5;
  });
  return { placed, taken, fits, put: put2, choose, landings, travel, band, mainland, majors, mediums, ofClass, coastal, isLand, hubCell };
}

// src/shared/generation/world_maker_v1/biomes.js
var SHARE = { min: 0.1, max: 0.15, target: 0.125, band: 0.4, woodlandBand1: 0.5 };
var B = Object.fromEntries(BIOMES.map((b, k) => [b, k]));
function makeBiomes(seed, land, layout) {
  const { owner, landmasses, elevation, slope, depth } = land, { band, travel } = layout, cells = land.land, total = cells.length, rnd = stream(seed, "biomes");
  const bandSize = [0, 0, 0, 0, 0, 0];
  for (const i of cells) bandSize[band[i]]++;
  const cap = { total: Math.floor(total * SHARE.max), min: Math.ceil(total * SHARE.min) };
  const bandCap = (b, k) => Math.floor(bandSize[k] * (b === B.woodland && k === 1 ? SHARE.woodlandBand1 : SHARE.band));
  const phi = rnd() * Math.PI * 2, ux = PM.cos(phi), uy = PM.sin(phi);
  let lo = Infinity, hi = -Infinity;
  for (const i of cells) {
    const p = cx(i) * ux + cy(i) * uy;
    lo = Math.min(lo, p);
    hi = Math.max(hi, p);
  }
  const tN = valueNoise(seed, "temp"), mN = valueNoise(seed, "moist"), hN = valueNoise(seed, "hotspot"), gN = BIOMES.map((b) => valueNoise(seed, "grow/" + b));
  const T = new Float64Array(W * H), M = new Float64Array(W * H), E = new Float64Array(W * H), S = new Float64Array(W * H), HOT = new Float64Array(W * H);
  for (const i of cells) {
    const x = cx(i), y = cy(i), c = (x * ux + y * uy - lo) / (hi - lo || 1);
    E[i] = (elevation[i] - 423) / 3177;
    S[i] = slope[i] / 454;
    T[i] = 1 - c * 0.9 - E[i] * 0.3 + (fbm(tN, x, y, 18, 3) - 0.5) * 0.3;
    M[i] = 0.55 * fbm(mN, x, y, 16, 3) + 0.45 * (1 - Math.min(1, (depth[i] - 1) / 9));
    HOT[i] = fbm(hN, x, y, 14, 3);
  }
  {
    const A0 = layout.placed.get("settlement-slot:village-outpost:01").anchor, shift = 0.55 - T[idx(A0.x, A0.y)];
    for (const i of cells) T[i] += shift;
  }
  const pref = [
    (i) => Math.abs(T[i] - 0.55) * 1.2 + Math.abs(M[i] - 0.62) * 1.2 + Math.max(0, E[i] - 0.7),
    (i) => Math.abs(T[i] - 0.6) * 1.1 + Math.abs(M[i] - 0.42) + S[i] * 0.8 + Math.max(0, E[i] - 0.6),
    (i) => Math.abs(M[i] - 0.85) * 1.2 + E[i] + Math.abs(T[i] - 0.55) * 0.6,
    (i) => (1 - E[i]) * 1.4 + (1 - S[i]) * 0.4,
    (i) => Math.abs(T[i] - 0.85) * 1.2 + M[i] * 1.2,
    (i) => Math.max(0, T[i]) * 1.6,
    (i) => Math.abs(T[i] - 0.9) * 2 + Math.abs(M[i] - 0.75) * 0.8 + Math.min(1, depth[i] / 8) * 0.3,
    (i) => (1 - HOT[i]) * 1.4 + (landmasses[owner[i]].classId === "primary-mainland" ? 0.3 : 0)
  ];
  const allowed = (b, i) => (b !== B.volcanic || band[i] >= 4) && (band[i] > 1 || b <= B.upland);
  const A = layout.placed.get("settlement-slot:village-outpost:01").anchor, start = idx(A.x, A.y), seeds = [];
  const addSeed = (b, i, why) => seeds.push({ b, i, why });
  addSeed(B.woodland, start, "Alderwood");
  const nearStart = (b, lo2, hi2) => {
    let best = -1, bv = Infinity;
    for (const i of cells) {
      if (owner[i] !== owner[start]) continue;
      const d = PM.hypot(cx(i) - A.x, cy(i) - A.y);
      if (d < lo2 || d > hi2 || seeds.some((s) => PM.hypot(cx(s.i) - cx(i), cy(s.i) - cy(i)) < lo2 * 0.8)) continue;
      const v = pref[b](i) + rnd() * 0.2;
      if (v < bv) {
        bv = v;
        best = i;
      }
    }
    if (best >= 0) addSeed(b, best, "near the start");
  };
  nearStart(B.grassland, 7, 13);
  nearStart([B.upland, B.wetland].sort((a, b) => pref[a](start) - pref[b](start))[0], 8, 15);
  for (let round = 0; round < 3; round++) for (const b of BIOMES.map((_, k) => k)) {
    if (seeds.filter((s) => s.b === b).length > round) continue;
    let best = -1, bv = Infinity;
    for (const i of cells) {
      if (!allowed(b, i) || landmasses[owner[i]].classId === "minor-island") continue;
      if (seeds.some((s) => PM.hypot(cx(s.i) - cx(i), cy(s.i) - cy(i)) < (s.b === b ? 28 : 9))) continue;
      const v = pref[b](i) + rnd() * 0.3;
      if (v < bv) {
        bv = v;
        best = i;
      }
    }
    if (best >= 0) addSeed(b, best, "climate");
  }
  for (const [k, l] of landmasses.entries()) for (let want = l.classId === "major-island" ? 2 : 1; l.classId !== "minor-island" && seeds.filter((s) => owner[s.i] === k).length < want; ) {
    let best = null, bv = Infinity;
    for (const i of l.cells) for (let b = 0; b < BIOMES.length; b++) {
      if (!allowed(b, i) || seeds.some((s) => owner[s.i] === k && (s.b === b || PM.hypot(cx(s.i) - cx(i), cy(s.i) - cy(i)) < 8))) continue;
      const v = pref[b](i) + 0.15 * seeds.filter((s) => s.b === b).length + rnd() * 0.1;
      if (v < bv) {
        bv = v;
        best = { b, i };
      }
    }
    if (!best) break;
    addSeed(best.b, best.i, "island");
  }
  const biome = new Int8Array(W * H).fill(-1), count = new Array(BIOMES.length).fill(0), inBand = BIOMES.map(() => [0, 0, 0, 0, 0, 0]);
  const locked = new Uint8Array(W * H);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = A.x + dx, y = A.y + dy;
    if (inside(x, y) && owner[idx(x, y)] === owner[start]) locked[idx(x, y)] = 1;
  }
  const room = (b, i) => allowed(b, i) && (!locked[i] || b === B.woodland) && count[b] < cap.total && inBand[b][band[i]] < bandCap(b, band[i]);
  const claim = (b, i) => {
    if (biome[i] >= 0) {
      count[biome[i]]--;
      inBand[biome[i]][band[i]]--;
    }
    biome[i] = b;
    count[b]++;
    inBand[b][band[i]]++;
  };
  const CLASH = BIOMES.map(() => []);
  for (const [p, q] of [["frostland", "tropical"], ["frostland", "desert"]]) {
    CLASH[B[p]].push(B[q]);
    CLASH[B[q]].push(B[p]);
  }
  const clash = (b, x, y) => {
    if (!CLASH[b].length) return 1;
    for (const [dx, dy] of N8) {
      const nx = x + dx, ny = y + dy;
      if (inside(nx, ny) && CLASH[b].includes(biome[idx(nx, ny)])) return 3;
    }
    return 1;
  };
  const grow = () => {
    biome.fill(-1);
    count.fill(0);
    for (const r of inBand) r.fill(0);
    const heap = new Heap(), best = new Float64Array(W * H * BIOMES.length).fill(Infinity);
    for (const s of seeds) {
      best[s.i * 8 + s.b] = 0;
      heap.push(0, s.i * 8 + s.b);
    }
    while (heap.size) {
      const d = heap.peekKey(), e = heap.pop(), i = e >> 3, b = e & 7;
      if (d > best[e] || biome[i] >= 0 && biome[i] !== b) continue;
      if (biome[i] < 0) {
        if (!room(b, i)) continue;
        claim(b, i);
      }
      for (const [dx, dy] of N8) {
        const x = cx(i) + dx, y = cy(i) + dy;
        if (!inside(x, y)) continue;
        const j = idx(x, y);
        if (owner[j] !== owner[i] || biome[j] >= 0) continue;
        const v = d + PM.hypot(dx, dy) * (1 + 1.8 * pref[b](j)) * (0.3 + 1.4 * fbm(gN[b], x, y, 10, 3)) * clash(b, x, y);
        if (v < best[j * 8 + b]) {
          best[j * 8 + b] = v;
          heap.push(v, j * 8 + b);
        }
      }
    }
  };
  for (let round = 0; round < 10; round++) {
    grow();
    const open = cells.filter((i) => biome[i] < 0 && landmasses[owner[i]].classId !== "minor-island");
    if (open.length < 12) break;
    const k = owner[open[0]], mine = open.filter((i) => owner[i] === k);
    let pick = null, pv = Infinity;
    for (let b = 0; b < BIOMES.length; b++) {
      const left = cap.total - count[b];
      if (left < mine.length * 0.5) continue;
      for (const i of mine) {
        if (!allowed(b, i) || seeds.some((s) => PM.hypot(cx(s.i) - cx(i), cy(s.i) - cy(i)) < 5)) continue;
        const v = pref[b](i) - left / 4e3 + rnd() * 0.05;
        if (v < pv) {
          pv = v;
          pick = { b, i };
        }
      }
    }
    if (!pick) break;
    addSeed(pick.b, pick.i, "unclaimed land");
  }
  for (let pass = 0; pass < 2; pass++) {
    const q = [];
    for (const i of cells) if (biome[i] >= 0) q.push(i);
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      for (const [dx, dy] of N4) {
        const x = cx(i) + dx, y = cy(i) + dy;
        if (!inside(x, y)) continue;
        const j = idx(x, y);
        if (owner[j] < 0 || biome[j] >= 0) continue;
        if (pass === 0 && owner[j] !== owner[i]) continue;
        if (pass === 0 && !room(biome[i], j)) continue;
        if (!allowed(biome[i], j) || locked[j] && biome[i] !== B.woodland) continue;
        claim(biome[i], j);
        q.push(j);
      }
    }
  }
  for (const i of cells) if (biome[i] < 0) claim(locked[i] ? B.woodland : B.grassland, i);
  for (const i of cells) if (locked[i] && biome[i] !== B.woodland) claim(B.woodland, i);
  const border = (b, filter) => {
    const out = [];
    for (const i of cells) {
      if (biome[i] === b || !filter(i)) continue;
      if (N4.some(([dx, dy]) => {
        const x = cx(i) + dx, y = cy(i) + dy;
        return inside(x, y) && owner[idx(x, y)] === owner[i] && biome[idx(x, y)] === b;
      })) out.push(i);
    }
    return out;
  };
  const plant = (o, from, n) => {
    let pick = -1, pv = Infinity;
    for (const i of cells) if (from(i) && room(o, i)) {
      const v = pref[o](i);
      if (v < pv) {
        pv = v;
        pick = i;
      }
    }
    if (pick < 0) return 0;
    const q = [pick], seen = new Set(q);
    let moved2 = 0;
    for (let h = 0; h < q.length && moved2 < n; h++) {
      const i = q[h];
      if (from(i) && room(o, i)) {
        claim(o, i);
        moved2++;
      }
      for (const [dx, dy] of N4) {
        const x = cx(i) + dx, y = cy(i) + dy;
        if (!inside(x, y)) continue;
        const j = idx(x, y);
        if (!seen.has(j) && owner[j] === owner[i] && from(j)) {
          seen.add(j);
          q.push(j);
        }
      }
    }
    return moved2;
  };
  const fixLow = (b) => {
    let c = border(b, (i) => room(b, i) && count[biome[i]] > cap.min + 40);
    if (!c.length) c = border(b, (i) => room(b, i) && count[biome[i]] > cap.min);
    c.sort((p, q) => pref[b](p) - pref[b](q));
    let n = 0;
    for (const i of c.slice(0, 8)) if (room(b, i) && count[biome[i]] > cap.min) {
      claim(b, i);
      n++;
    }
    return n > 0 || plant(b, (i) => count[biome[i]] > cap.min + 40, cap.min - count[b] + 8) > 0;
  };
  const fixOver = (b, k) => {
    const c = [];
    for (const i of cells) {
      if (biome[i] !== b || k && band[i] !== k) continue;
      for (const [dx, dy] of N4) {
        const x = cx(i) + dx, y = cy(i) + dy;
        if (!inside(x, y)) continue;
        const j = idx(x, y), o = biome[j];
        if (owner[j] === owner[i] && o >= 0 && o !== b && room(o, i) && count[b] > cap.min) {
          c.push([pref[o](i) - pref[b](i), i, o]);
          break;
        }
      }
    }
    let n = 0;
    c.sort((p, q) => p[0] - q[0]);
    for (const [, i, o] of c.slice(0, 8)) if (room(o, i) && count[b] > cap.min) {
      claim(o, i);
      n++;
    }
    if (n) return true;
    const excess = (k ? inBand[b][k] - bandCap(b, k) : count[b] - cap.total) + 4;
    for (const o of BIOMES.map((_, o2) => o2).filter((o2) => o2 !== b).sort((p, q) => count[p] - count[q])) if (plant(o, (i) => biome[i] === b && (!k || band[i] === k), excess)) return true;
    return false;
  };
  for (let guard = 0; guard < 3e3; guard++) {
    const todo = [];
    for (let b = 0; b < BIOMES.length; b++) {
      if (count[b] < cap.min) todo.push(() => fixLow(b));
      if (count[b] > cap.total) todo.push(() => fixOver(b, 0));
      for (let k = 1; k <= 5; k++) if (inBand[b][k] > bandCap(b, k)) todo.push(() => fixOver(b, k));
    }
    if (!todo.length || !todo.some((fix) => fix())) break;
  }
  return { biome, seeds, count, inBand, bandSize, bandCap, cap, pref, T, M };
}

// src/shared/generation/world_maker_v1/roles.js
var FIRST_CAVE = "repeatable-slot:cave:woodland:small:109";
var BOSS_HOMES = { corrosive_abomination: ["ruin", "standard", "wetland"], void_overseer: ["ruin", "deep", "frostland"], chronos_arbitrator: ["ruin", "standard", "upland"], nexus_overseer: ["ruin", "standard", "tropical"], gilded_vault_keeper: ["crypt", "standard", "upland"], marcus: ["fort", "standard", "grassland"], hooktail: ["ruin", "standard", "desert"], cinderhart: ["ruin", "standard", "woodland"], barrow_king: ["ruin", "large", "grassland"], sun_pharaoh: ["crypt", "deep", "desert"], aegis_goliath: ["fort", "deep", "upland"], brimstone_colossus: ["ruin", "large", "volcanic"] };
var STARTER_HOMES = { "starter-cave": ["cave", "small", "woodland"], "starter-elite-fort": ["fort", "standard", "woodland"] };
var REQUIRED_SITES = [...Object.values(BOSS_HOMES), ...Object.values(STARTER_HOMES)];
function makeRoles(asset) {
  const biomeOf = (id) => asset.worldReshape.siteBiomes[id], kind = (s) => [s.familyId.split(":")[1], s.tier, biomeOf(s.id)];
  const realized = asset.sites.filter((s) => biomeOf(s.id) && s.id !== FIRST_CAVE), start = asset.settlements.find((s) => s.id === "settlement-slot:village-outpost:01").anchor;
  const of = (home) => realized.filter((s) => kind(s).join() === home.join()), byId = (p, q) => p.id < q.id ? -1 : p.id > q.id ? 1 : 0;
  const pick = (name, list) => {
    if (!list.length) throw Error("No site for " + name);
    return list[0].id;
  };
  const bosses = Object.fromEntries(Object.entries(BOSS_HOMES).map(([id, home]) => [id, pick(id, of(home).sort((p, q) => q.band - p.band || byId(p, q)))]));
  const near = (s) => PM.hypot(s.anchor.x - start.x, s.anchor.y - start.y);
  const starterSites = { ...Object.fromEntries(Object.entries(STARTER_HOMES).map(([role, home]) => [role, pick(role, of(home).sort((p, q) => near(p) - near(q) || byId(p, q)))])), "advanced-ruin": bosses.cinderhart };
  const eliteSites = {};
  for (const b of BIOMES) {
    const ids = realized.filter((s) => {
      const [f, t, sb] = kind(s);
      return sb === b && t === "small" && ["fort", "ruin", "crypt"].includes(f);
    }).map((s) => s.id).sort();
    if (ids.length) eliteSites[b] = ids;
  }
  const factionHalls = Object.fromEntries(asset.factions.map((f) => [f.id.split(":")[1], f.hallSettlementId]));
  return { version: WORLD_ROLES_VERSION, bosses, starterSites, firstCave: FIRST_CAVE, eliteSites, factionHalls };
}

// src/shared/generation/world_maker_v1/places.js
var moveSite = (t, dx, dy, lm) => ({ ...t, anchor: { key: t.anchor.x + dx + "," + (t.anchor.y + dy), x: t.anchor.x + dx, y: t.anchor.y + dy }, footprint: t.footprint.map((c) => ({ x: c.x + 2 * dx, y: c.y + 2 * dy })), approach: t.approach.map((c) => ({ x: c.x + 2 * dx, y: c.y + 2 * dy })), landmassId: lm });
var SITE_MIX = { cave: { small: 33, standard: 4, large: 2, deep: 2 }, crypt: { small: 12, standard: 2, large: 1, deep: 1 }, fort: { small: 2, standard: 14, large: 1, deep: 1 }, ruin: { small: 4, standard: 27, large: 2, deep: 1 } };
function makePlaces(seed, land, layout, biomes, catalog) {
  const { owner, landmasses, elevation, slope, depth } = land, { band, placed, taken, fits, put: put2, choose, mainland, majors, mediums, coastal, isLand } = layout, { biome } = biomes, rnd = stream(seed, "places");
  const LM = landmasses.map((l) => l.id), B2 = Object.fromEntries(BIOMES.map((b, k) => [b, k]));
  const inner = new Float64Array(W * H).fill(0);
  {
    const q = [];
    for (const i of land.land) {
      if (N4.some(([dx, dy]) => {
        const x = cx(i) + dx, y = cy(i) + dy;
        return !isLand(x, y) || biome[idx(x, y)] !== biome[i];
      })) {
        inner[i] = 1;
        q.push(i);
      }
    }
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      for (const [dx, dy] of N4) {
        const x = cx(i) + dx, y = cy(i) + dy;
        if (!isLand(x, y)) continue;
        const j = idx(x, y);
        if (!inner[j] && biome[j] === biome[i]) {
          inner[j] = inner[i] + 1;
          q.push(j);
        }
      }
    }
  }
  const sameBiome = (id, ax, ay, b) => {
    const t = catalog.settlements.get(id), dx = ax - t.anchor.x, dy = ay - t.anchor.y;
    return t.core.every((c) => biome[idx(Math.floor((c.x + 2 * dx) / 2), Math.floor((c.y + 2 * dy) / 2))] === b);
  };
  const settle = (id, ks2, score, test = () => true) => {
    for (const spacing of [3, 2, 1]) {
      const t = catalog.settlements.get(id);
      let best = null, bv = -Infinity;
      for (const i of land.land) {
        const k = owner[i];
        if (!ks2.includes(k)) continue;
        const v = score(i) + rnd() * 0.01;
        if (v <= bv || !test(i)) continue;
        if (fits(t, cx(i), cy(i), k, spacing)) {
          bv = v;
          best = i;
        }
      }
      if (best !== null) return put2(id, cx(best), cy(best), owner[best]);
    }
    throw Error("No room for " + id);
  };
  const away = (i) => {
    let d = 99;
    for (const s of placed.values()) d = Math.min(d, PM.hypot(cx(i) - s.anchor.x, cy(i) - s.anchor.y));
    return Math.min(d, 30) / 30;
  };
  const TOWNS = { "settlement-slot:town:01": "grassland", "settlement-slot:town:02": "woodland", "settlement-slot:town:03": "wetland", "settlement-slot:town:04": "desert", "settlement-slot:town:05": "upland", "settlement-slot:town:06": "frostland", "settlement-slot:town:07": "tropical", "settlement-slot:town:08": "volcanic" };
  const all = landmasses.map((_, k) => k).filter((k) => landmasses[k].classId !== "minor-island");
  for (const [id, b] of Object.entries(TOWNS)) settle(id, all, (i) => biome[i] === B2[b] ? Math.min(inner[i], 6) / 6 + away(i) - slope[i] / 600 : -9, (i) => biome[i] === B2[b] && sameBiome(id, cx(i), cy(i), B2[b]));
  const A = placed.get("settlement-slot:village-outpost:01").anchor, fromStart = (i) => PM.hypot(cx(i) - A.x, cy(i) - A.y);
  settle("settlement-slot:city:01", mainland, (i) => Math.min(depth[i], 8) / 8 - Math.abs(band[i] - 2.5) * 0.5 + away(i));
  settle("settlement-slot:city:02", mainland, (i) => -elevation[i] / 1500 + Math.min(depth[i], 6) / 12 - Math.abs(band[i] - 2) * 0.4 + away(i));
  settle("settlement-slot:city:03", mainland, (i) => -Math.abs(band[i] - 3) * 0.5 + away(i));
  settle("settlement-slot:village-outpost:02", mainland, (i) => -Math.abs(band[i] - 2) * 0.6 + away(i) - slope[i] / 800);
  settle("settlement-slot:village-outpost:03", mainland, (i) => -Math.abs(band[i] - 3) * 0.6 - elevation[i] / 2500 + away(i));
  const byIsland = (k) => [...placed.values()].some((s) => s.landmassId === LM[k]);
  const majorsBySize = [...majors].sort((a, b) => landmasses[b].cells.length - landmasses[a].cells.length);
  for (const id of ["settlement-slot:capital-great-hold:02", "settlement-slot:city:04", "settlement-slot:village-outpost:04"]) {
    const free = majorsBySize.filter((k) => !byIsland(k));
    settle(id, free.length ? free : majorsBySize, (i) => away(i) - slope[i] / 800);
  }
  {
    const free = mediums.filter((k) => !byIsland(k));
    settle("settlement-slot:village-outpost:05", free.length ? free : mediums, (i) => away(i));
  }
  const settlements2 = [...catalog.settlements.keys()].map((id) => {
    const s = placed.get(id);
    if (!s) throw Error("Unplaced " + id);
    const i = idx(s.anchor.x, s.anchor.y);
    return { ...s, biomeId: "biome:" + BIOMES[biome[i]], band: band[i] };
  });
  for (const [id, b] of Object.entries(TOWNS)) if (settlements2.find((s) => s.id === id).biomeId !== "biome:" + b) throw Error(id + " is not in " + b);
  const used = /* @__PURE__ */ new Set(), key2 = (x, y) => x + "," + y, block = (c, r) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) used.add(key2(c.x + dx, c.y + dy));
  };
  for (const s of settlements2) for (const c of [...s.core, ...s.expansion, ...s.sockets]) block(c, 2);
  const anchors = [], sites = [];
  const siteFits = (t, ax, ay, b) => {
    const dx = ax - t.anchor.x, dy = ay - t.anchor.y, k = owner[idx(ax, ay)];
    for (const c of [...t.footprint, ...t.approach]) {
      const x = c.x + 2 * dx, y = c.y + 2 * dy, m = idx(Math.floor(x / 2), Math.floor(y / 2));
      if (!isLand(Math.floor(x / 2), Math.floor(y / 2)) || owner[m] !== k || biome[m] !== b || used.has(key2(x, y))) return false;
    }
    return true;
  };
  let serial = 200;
  const nextId = (f, b, t) => "repeatable-slot:" + f + ":" + b + ":" + t + ":" + ++serial;
  function placeSite(id, t, b, score) {
    let best = null, bv = -Infinity;
    for (const i of land.land) {
      if (biome[i] !== b || landmasses[owner[i]].classId === "minor-island") continue;
      const v = score(i);
      if (v <= bv) continue;
      if (siteFits(t, cx(i), cy(i), b)) {
        bv = v;
        best = i;
      }
    }
    if (best === null) return null;
    const s = { ...moveSite(t, cx(best) - t.anchor.x, cy(best) - t.anchor.y, LM[owner[best]]), id, band: band[best] };
    for (const c of [...s.footprint, ...s.approach]) block(c, 1);
    anchors.push({ x: cx(best), y: cy(best) });
    sites.push(s);
    return s;
  }
  const spread = (i) => {
    let d = 40;
    for (const a of anchors) d = Math.min(d, PM.hypot(cx(i) - a.x, cy(i) - a.y));
    for (const s of settlements2) d = Math.min(d, PM.hypot(cx(i) - s.anchor.x, cy(i) - s.anchor.y) + 1);
    return Math.min(d, 12);
  };
  if (!placeSite(FIRST_CAVE, catalog.site("cave", "small"), B2.woodland, (i) => -Math.abs(fromStart(i) - 6) + (band[i] === 1 ? 2 : 0))) throw Error("No room for the first cave");
  const bandCells = {};
  for (const i of land.land) {
    const c = bandCells[biome[i]] ??= [0, 0, 0, 0, 0, 0];
    c[band[i]]++;
  }
  const deepest = (b) => [5, 4, 3, 2, 1].find((k) => bandCells[b][k] >= 25) ?? 1;
  for (const t of catalog.signatures) {
    const b = B2[t.biome];
    const s = placeSite(t.id, t, b, (i) => (band[i] === deepest(b) ? 10 : band[i]) + spread(i) / 3 + unit(seed + t.id + i) * 0.5);
    if (!s) throw Error("No home for " + t.id);
  }
  const slots = [];
  for (const [f, tiers] of Object.entries(SITE_MIX)) for (const [t, n] of Object.entries(tiers)) for (let k = 0; k < n; k++) slots.push({ f, t });
  slots[slots.findIndex((s) => s.f === "cave" && s.t === "small")] = null;
  const lairs = slots.filter((s) => s && (s.t === "large" || s.t === "deep")), rest = slots.filter((s) => s && s.t !== "large" && s.t !== "deep");
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const area = BIOMES.map((_, b) => land.land.filter((i) => biome[i] === b).length), order = BIOMES.map((_, b) => b).sort((a, b) => area[b] - area[a] || a - b);
  const share = BIOMES.map(() => []), isLair = (s) => s.t === "large" || s.t === "deep";
  for (const [f, t, b] of REQUIRED_SITES) {
    const pool = isLair({ t }) ? lairs : rest, k = pool.findIndex((s) => s.f === f && s.t === t);
    if (k < 0) throw Error("No " + t + " " + f + " left for " + b);
    share[B2[b]].push(pool.splice(k, 1)[0]);
  }
  const lairless = order.filter((b) => !share[b].some(isLair));
  lairs.forEach((s, k) => share[k < lairless.length ? lairless[k] : order[(k - lairless.length) % 8]].push(s));
  let next = 0;
  const quota = (b) => 13 + (order.indexOf(b) < 5 ? 1 : 0) - (b === B2.woodland ? 1 : 0);
  for (const b of order) while (share[b].length < quota(b) && next < rest.length) share[b].push(rest[next++]);
  while (next < rest.length) share[order[next % 8]].push(rest[next++]);
  for (const b of order) for (const { f, t } of share[b].sort((p, q) => ["deep", "large", "standard", "small"].indexOf(p.t) - ["deep", "large", "standard", "small"].indexOf(q.t))) {
    const lair = t === "large" || t === "deep", deep = deepest(b);
    const s = placeSite(nextId(f, BIOMES[b], t), catalog.site(f, t), b, (i) => spread(i) + (lair ? (band[i] >= deep - 1 ? 6 : 0) + Math.min(inner[i], 4) : t === "small" ? -Math.abs(band[i] - 2.5) * 0.3 : 0) + unit(seed + f + t + i) * 0.8);
    if (!s) throw Error("No room for a " + t + " " + f + " in " + BIOMES[b]);
  }
  const islets = landmasses.map((l, k) => ({ k, l })).filter(({ l }) => l.classId === "minor-island").map(({ k, l }) => ({ k, i: [...l.cells].sort((a, b) => band[b] - band[a] || a - b)[0] })).filter(({ i }) => !used.has(key2(2 * cx(i), 2 * cy(i)))).sort((a, b) => band[b.i] - band[a.i] || unit(seed + a.i) - unit(seed + b.i));
  if (islets.length < 6) throw Error("Too few islets for the future islands");
  const futureIslands = catalog.futureIslands.map((f, n) => {
    const { k, i } = islets[n], dx = cx(i) - f.anchor.x, dy = cy(i) - f.anchor.y, mv = (c) => ({ x: c.x + 2 * dx, y: c.y + 2 * dy });
    return { anchor: { x: cx(i), y: cy(i) }, approach: mv(f.approach), band: band[i], breathing: mv(f.breathing), entrance: mv(f.entrance), id: f.id, landing: mv(f.landing), landmassId: LM[k] };
  });
  const HALLS = { "faction-hq-candidate:martial": "settlement-slot:city:02", "faction-hq-candidate:stealth": "settlement-slot:city:03", "faction-hq-candidate:magic": "settlement-slot:city:01" };
  const factions = catalog.factions.map((f) => {
    const s = settlements2.find((s2) => s2.id === HALLS[f.id]), mx = s.anchor.x * 2 + 0.5, my = s.anchor.y * 2 + 0.5, c = [...s.core].sort((a, b) => PM.hypot(a.x - mx, a.y - my) - PM.hypot(b.x - mx, b.y - my) || a.y - b.y || a.x - b.x)[0];
    return { activity: [], anchor: { x: s.anchor.x, y: s.anchor.y }, approach: [], arrival: [{ x: c.x, y: c.y }], campus: [], contentBinding: null, dimensions: [32, 26], id: f.id, landmassId: s.landmassId, tileOrigin: { x: c.x * 32, y: c.y * 26 }, hallSettlementId: s.id };
  });
  return { settlements: settlements2, sites, futureIslands, factions, deepest, inner };
}

// src/shared/generation/world_maker_v1/world.js
function makeWorldPlan(seed, catalog) {
  const t = [performance.now()], lap = () => {
    t.push(performance.now());
    return Math.round(t.at(-1) - t.at(-2));
  }, ms = {};
  const land = makeLand(seed);
  ms.land = lap();
  const layout = makeLayout(seed, land, catalog.settlements);
  ms.layout = lap();
  const biomes = makeBiomes(seed, land, layout);
  ms.biomes = lap();
  const places = makePlaces(seed, land, layout, biomes, catalog);
  ms.places = lap();
  return { seed, land, layout, biomes, places, ms };
}

// src/shared/generation/world_maker_v1/asset.js
var FORMAT = { version: "planned-world-water-v3", shoreline: "local-shoreline-runtime-v2", water: "local-water-geometry-v3", routes: "planned-world-routes-water-v3", wilderness: "wilderness-distribution-v2-native", access: "alderwood-first-journey-v1", reshape: "world-reshape-v2", hydrology: "alpha-hydrology-plan-v2", hydrologyPolicy: "terrain-drainage-lake-outlets-v3" };
var chunkRef = (c) => ({ chunkX: c.x, chunkY: c.y, key: c.x + "," + c.y });
function baseAsset(plan, catalog) {
  const { seed, land, layout, biomes, places } = plan, { owner, landmasses, elevation, slope, geology } = land, { band } = layout, { biome } = biomes;
  const seedDigest = sha256Hex("seeded-world/" + seed), campaignSeedHex = sha256Hex("seeded-campaign/" + seed).slice(0, 32);
  const volcanic = land.land.filter((i) => BIOMES[biome[i]] === "volcanic").sort((a, b) => elevation[b] - elevation[a]);
  for (const i of volcanic.slice(0, Math.ceil(volcanic.length * 0.08))) geology[i] = 2;
  const cellRows = [];
  for (let y = 0; y < H; y++) {
    const cells = [];
    for (let x = 0; x < W; x++) {
      const i = idx(x, y);
      if (owner[i] < 0) continue;
      cells.push([x, owner[i], biome[i] + 1, band[i], 0, 0, 0, 0, slope[i], geology[i], elevation[i]]);
    }
    if (cells.length) cellRows.push({ cells, y });
  }
  const lms = landmasses.map((l) => {
    let minX = W, minY = H, maxX = 0, maxY = 0;
    for (const i of l.cells) {
      minX = Math.min(minX, cx(i));
      minY = Math.min(minY, cy(i));
      maxX = Math.max(maxX, cx(i) + 1);
      maxY = Math.max(maxY, cy(i) + 1);
    }
    return { bounds: { maxXExclusive: maxX, maxYExclusive: maxY, minX, minY }, cellCount: l.cells.length, classId: l.classId, id: l.id };
  });
  const A = places.settlements.find((s) => s.id === "settlement-slot:village-outpost:01"), core = A.core, spawnTile = { x: Math.round(core.reduce((a, c) => a + c.x, 0) / core.length * 32 + 16), y: Math.round(core.reduce((a, c) => a + c.y, 0) / core.length * 26 + 13) };
  const extraProtected = [...places.settlements.flatMap((s) => marineChunks(s).map((c) => ({ classId: "settlement-marine-approach", x: c.x, y: c.y }))), ...places.factions.flatMap((f) => f.arrival.map((c) => ({ classId: "faction-campus-arrival-approach-activity", x: c.x, y: c.y })))];
  const seen = /* @__PURE__ */ new Set(), extra = extraProtected.filter((e) => {
    const k = e.classId + e.x + "," + e.y;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const crypt = places.sites.find((s) => s.familyId === "site-family:crypt");
  const digest = (t) => sha256Hex(seedDigest + "/" + t);
  return {
    assetId: "seeded",
    biomeIds: catalog.biomeIds,
    campaignSeedHex,
    cellRows,
    domain: { height: H, minX: 0, minY: 0, width: W },
    exactLandCells: LAND_CELLS,
    extraProtected: extra,
    factions: places.factions,
    futureIslands: places.futureIslands,
    landmasses: lms,
    originZone: { coordinateSelected: false, macroCellKey: A.anchor.x + "," + A.anchor.y, macroRegionId: "macro-region:seeded:start", progressionBand: 1, runtimeChunks: [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dy]) => chunkRef({ x: A.anchor.x * 2 + dx, y: A.anchor.y * 2 + dy })) },
    reviewJourneys: [],
    reviewWaterExamples: [],
    routeHash: null,
    routes: null,
    scale: catalog.scale,
    seed,
    seedDigest,
    settlements: places.settlements,
    shoreline: { coordinateOverlay: false, maximumBandTiles: 22, minimumBandTiles: 2, predecessorAssetHash: digest("land"), realizationHash: digest("shoreline"), sourcePolicyHash: digest("shoreline-policy"), version: FORMAT.shoreline },
    sites: places.sites,
    spawnTile,
    stonewatch: { candidateCount: 1, candidates: [{ anchor: crypt.anchor, biomeId: "biome:" + BIOMES[biome[idx(crypt.anchor.x, crypt.anchor.y)]], landmassId: crypt.landmassId, progressionBand: crypt.band }], definitionId: "def:d2000000000000000000000000000002", familyId: "site-family:crypt", finalPlacementAuthorityPublished: false, outcome: "success", preferredCandidate: { anchor: crypt.anchor, landmassId: crypt.landmassId, progressionBand: crypt.band }, variantId: "site-variant:stonewatch", version: "seeded-stonewatch-v1" },
    templates: catalog.templates,
    upstream: null,
    version: FORMAT.version,
    waterGeometry: { bridgeGuards: [], predecessorAssetHash: digest("shoreline"), realizationHash: digest("water"), receiverDirectionsAvailable: false, version: FORMAT.water }
  };
}
function reshapeLayer(asset, ferry) {
  const cell = new Map(asset.cellRows.flatMap((r) => r.cells.map((c) => [c[0] + "," + r.y, c])));
  const siteBiomes = Object.fromEntries(asset.sites.filter((s) => !s.id.startsWith("repeatable-slot:signature:")).map((s) => [s.id, asset.biomeIds[cell.get(s.anchor.x + "," + s.anchor.y)[2] - 1].replace("biome:", "")]));
  const ferryLandings = Object.fromEntries(ferry.landings.map((l) => {
    const c = cell.get(Math.floor(l.tile.x / 64) + "," + Math.floor(l.tile.y / 52));
    return [l.id, { biomeId: asset.biomeIds[c[2] - 1], band: c[3] }];
  }));
  return { version: FORMAT.reshape, hash: sha256Hex(asset.seedDigest + "/reshape"), siteBiomes, ferryLandings };
}

// src/shared/generation/drainage_network_v3.js
var DRAINAGE_V3_VERSION = "terrain-drainage-network-v3";
var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]];
var MAX_BREACH = 320;
function planDrainageV3(p, { protectedTile, extraTile, routeAt }) {
  const cells = /* @__PURE__ */ new Map(), nodes = /* @__PURE__ */ new Map(), hash = (s) => {
    let h = 2166136261;
    for (const c of p.seedDigest + "/drainage-v3/" + s) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }, key2 = (x, y) => x + "," + y;
  for (const row of p.cellRows) for (const c of row.cells) cells.set(key2(c[0], row.y), { x: c[0], y: row.y, c });
  const safePoint = (x, y, landmass, outlet = false) => {
    const c = cells.get(key2(Math.floor(x / 64), Math.floor(y / 52)));
    if (!c) return outlet;
    if (c.c[1] !== landmass) return false;
    return !protectedTile(Math.floor(x), Math.floor(y)) && !extraTile(Math.floor(x), Math.floor(y));
  };
  function safeEdge(points, landmass, outlet = false) {
    let roadRun = 0;
    for (const v of points) {
      for (const [dx, dy] of [[0, 0], [-6, 0], [6, 0], [0, -6], [0, 6], [-4, -4], [4, -4], [-4, 4], [4, 4]]) if (!safePoint(v.x + dx, v.y + dy, landmass, outlet)) return false;
      let nearRoad = false;
      for (let j = -6; j <= 6 && !nearRoad; j++) if (routeAt(Math.floor(v.x) + j, Math.floor(v.y)) || routeAt(Math.floor(v.x), Math.floor(v.y) + j)) nearRoad = true;
      if (nearRoad) roadRun += 3;
      else roadRun = 0;
      if (roadRun > 24) return false;
    }
    return true;
  }
  const straight = (a, b) => {
    const n = Math.max(1, Math.ceil(PM.hypot(b.x - a.x, b.y - a.y) / 3)), points = [];
    for (let i = 0; i <= n; i++) points.push({ x: a.x + (b.x - a.x) * i / n, y: a.y + (b.y - a.y) * i / n });
    return points;
  };
  function mouthPoints(a, b, domain) {
    const dx = b.x - a.x, dy = b.y - a.y, len = PM.hypot(dx, dy), steps = Math.max(1, Math.ceil(len / 3)), points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, bend = PM.sin(t * Math.PI) * (PM.sin(t * Math.PI * 2 + hash(domain) % 628 / 100) * 3);
      points.push({ x: a.x + dx * t - dy / (len || 1) * bend, y: a.y + dy * t + dx / (len || 1) * bend });
    }
    return points;
  }
  for (const v of cells.values()) {
    if (p.landmasses[v.c[1]].classId === "minor-island") continue;
    const options = [[0, 0], [-16, -10], [16, 10], [-16, 10], [16, -10], [0, -12], [0, 12], [-18, 0], [18, 0]].map(([x, y], i) => ({ x: v.x * 64 + 32 + x + (hash(v.x + "/" + v.y + "/x") % 9 - 4), y: v.y * 52 + 26 + y + (hash(v.x + "/" + v.y + "/y") % 7 - 3), order: i }));
    const point = options.find((q) => {
      if (!safeEdge([q], v.c[1])) return false;
      for (let d = -12; d <= 12; d++) if (routeAt(Math.floor(q.x) + d, Math.floor(q.y)) || routeAt(Math.floor(q.x), Math.floor(q.y) + d)) return false;
      return true;
    });
    if (point) nodes.set(key2(v.x, v.y), { ...v, key: key2(v.x, v.y), point, elevation: v.c[10], filled: Infinity, receiver: null, order: -1, accumulation: 1, children: [] });
  }
  const cache = /* @__PURE__ */ new Map();
  function edge(a, b) {
    const pair = [a.key, b.key].sort().join("|");
    if (cache.has(pair)) return cache.get(pair);
    const value = safeEdge(straight(a.point, b.point), a.c[1]);
    cache.set(pair, value);
    return value;
  }
  const heap = [], less = (a, b) => a.level < b.level || a.level === b.level && a.seq < b.seq, push = (v) => {
    heap.push(v);
    let i = heap.length - 1;
    while (i) {
      const j = i - 1 >> 1;
      if (!less(heap[i], heap[j])) break;
      [heap[i], heap[j]] = [heap[j], heap[i]];
      i = j;
    }
  }, pop = () => {
    const first = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let j = i * 2 + 1;
        if (j >= heap.length) break;
        if (j + 1 < heap.length && less(heap[j + 1], heap[j])) j++;
        if (!less(heap[j], heap[i])) break;
        [heap[j], heap[i]] = [heap[i], heap[j]];
        i = j;
      }
    }
    return first;
  };
  let roots = 0, seq = 0;
  const rootOrder = [...nodes.values()].sort((a, b) => hash("root/" + a.key) - hash("root/" + b.key) || (a.key < b.key ? -1 : 1));
  for (const n of rootOrder) {
    const candidates = DIRS.slice(0, 4).filter(([dx, dy]) => !cells.has(key2(n.x + dx, n.y + dy))).map(([dx, dy]) => mouthPoints(n.point, { x: n.x * 64 + 32 + dx * 44, y: n.y * 52 + 26 + dy * 38 }, "mouth/" + n.key + "/" + dx + "/" + dy));
    const points = candidates.find((points2) => safeEdge(points2, n.c[1], true));
    if (points) {
      n.filled = n.elevation;
      n.outlet = points;
      push({ node: n, level: n.filled, seq: seq++ });
      roots++;
    }
  }
  const order = [];
  while (heap.length) {
    const { node: n } = pop();
    if (n.order >= 0) continue;
    n.order = order.length;
    order.push(n);
    for (const [dx, dy] of DIRS) {
      const q = nodes.get(key2(n.x + dx, n.y + dy));
      if (!q || q.c[1] !== n.c[1] || q.filled !== Infinity || !edge(n, q)) continue;
      q.filled = Math.max(n.filled, q.elevation);
      push({ node: q, level: q.filled, seq: seq++ });
    }
  }
  for (const n of order) {
    if (n.outlet) continue;
    let best = null, score = -Infinity;
    for (const [dx, dy] of DIRS) {
      const q = nodes.get(key2(n.x + dx, n.y + dy));
      if (!q || q.order < 0 || q.order >= n.order || q.c[1] !== n.c[1] || !edge(n, q)) continue;
      const s = (n.filled - q.filled) / PM.hypot(dx, dy) * 1e6 - q.order;
      if (s > score) {
        score = s;
        best = q;
      }
    }
    n.receiver = best.key;
    best.children.push(n.key);
  }
  for (const n of [...order].reverse()) if (n.receiver) nodes.get(n.receiver).accumulation += n.accumulation;
  const heads = [], selected = /* @__PURE__ */ new Set(), riverlessLandmasses = [], pathOf = (n) => {
    const path = [];
    let v = n;
    while (v) {
      path.push(v);
      v = v.receiver ? nodes.get(v.receiver) : null;
    }
    return path;
  };
  for (const [li, l] of p.landmasses.entries()) {
    if (l.classId === "minor-island") continue;
    const threshold = l.classId === "primary-mainland" ? 28 : l.classId === "major-island" ? 16 : 9, maxHeads = l.classId === "primary-mainland" ? 7 : l.classId === "major-island" ? 4 : 2;
    const candidates = order.filter((n) => n.c[1] === li && n.accumulation >= threshold && n.receiver).map((n) => {
      const path = pathOf(n);
      let low = Infinity, breach = 0;
      for (const v of path) {
        low = Math.min(low, v.elevation);
        breach = Math.max(breach, v.elevation - low);
      }
      return { node: n, path, breach, drop: n.elevation - path.at(-1).elevation, length: path.reduce((s, v, i) => i ? s + PM.hypot(v.x - path[i - 1].x, v.y - path[i - 1].y) : 0, 0) };
    }).filter((q) => q.length >= 5 && q.drop >= 80).sort((a, b) => b.length + PM.log2(b.node.accumulation) - (a.length + PM.log2(a.node.accumulation)) || hash(a.node.key) - hash(b.node.key));
    const fit = candidates.filter((q) => q.breach <= MAX_BREACH), pool = fit.length ? fit : [...candidates].sort((a, b) => a.breach - b.breach || hash(a.node.key) - hash(b.node.key)).slice(0, 1);
    const picked = [];
    for (const c of pool) {
      if (picked.some((h) => PM.hypot(h.x - c.node.x, h.y - c.node.y) < 5) || selected.has(c.node.key)) continue;
      picked.push(c.node);
      heads.push({ node: c.node.key, kind: "terrain-headwater", point: c.node.point, landmassId: l.id, sourceElevation: c.node.elevation, outletElevation: c.path.at(-1).elevation, conditionedElevation: c.node.filled, catchmentCells: c.node.accumulation, stepsToOutlet: c.path.length - 1 });
      for (const n of c.path) selected.add(n.key);
      if (picked.length === maxHeads) break;
    }
    if (!picked.length) riverlessLandmasses.push({ code: "NO_TERRAIN_SUPPORTED_RIVER", landmassId: l.id, reachableCells: order.filter((n) => n.c[1] === li).length, candidates: candidates.length });
  }
  const connectors = [];
  function connect(id, point, landmassId) {
    const li = p.landmasses.findIndex((l) => l.id === landmassId), mx = Math.floor(point.x / 64), my = Math.floor(point.y / 52);
    const near = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const n = nodes.get(key2(mx + dx, my + dy));
      if (n && n.c[1] === li && n.order >= 0) near.push(n);
    }
    const level = cells.get(key2(mx, my))?.c[10] ?? Infinity, cut = (n) => {
      let low = level, deepest = 0;
      for (const v of pathOf(n)) {
        if (selected.has(v.key)) break;
        low = Math.min(low, v.elevation);
        deepest = Math.max(deepest, v.elevation - low);
      }
      return deepest;
    };
    near.sort((a, b) => cut(a) - cut(b) || PM.hypot(a.point.x - point.x, a.point.y - point.y) - PM.hypot(b.point.x - point.x, b.point.y - point.y) || a.order - b.order);
    for (const n of near) {
      const points = straight(point, n.point);
      if (!safeEdge(points.slice(Math.ceil(points.length / 3)), li)) continue;
      const path = pathOf(n), meets = path.findIndex((v) => selected.has(v.key));
      for (const v of path) selected.add(v.key);
      connectors.push({ id, node: n.key, points, landmassId });
      return { node: n.key, steps: meets < 0 ? path.length - 1 : meets, joins: meets < 0 ? "sea" : "river" };
    }
    return null;
  }
  const curves = /* @__PURE__ */ new Map();
  function finish() {
    const carved = /* @__PURE__ */ new Map();
    for (const k of selected) carved.set(k, nodes.get(k).elevation);
    for (const n of [...order].reverse()) if (selected.has(n.key) && n.receiver) carved.set(n.receiver, Math.min(carved.get(n.receiver), carved.get(n.key)));
    const main = (n) => {
      let best = null;
      for (const k of n.children) if (selected.has(k) && (!best || nodes.get(k).accumulation > best.accumulation)) best = nodes.get(k);
      return best;
    };
    const curve = (n, r) => {
      const P1 = n.point, P2 = r.point, c = main(n), P0 = c ? c.point : { x: 2 * P1.x - P2.x, y: 2 * P1.y - P2.y }, P3 = r.receiver ? nodes.get(r.receiver).point : r.outlet ? r.outlet[Math.min(r.outlet.length - 1, 6)] : { x: 2 * P2.x - P1.x, y: 2 * P2.y - P1.y }, len = PM.hypot(P2.x - P1.x, P2.y - P1.y), steps = Math.max(2, Math.ceil(len / 3)), phase = hash("meander/" + n.key) % 628 / 100, amp = Math.min(4, len * 0.05), points = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, t2 = t * t, t3 = t2 * t, f = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3), x = f(P0.x, P1.x, P2.x, P3.x), y = f(P0.y, P1.y, P2.y, P3.y), bend = PM.sin(Math.PI * t) * PM.sin(2 * Math.PI * t + phase) * amp;
        points.push({ x: x - (P2.y - P1.y) / len * bend, y: y + (P2.x - P1.x) / len * bend });
      }
      points[0] = { ...P1 };
      points[points.length - 1] = { ...P2 };
      return points;
    };
    const network = [];
    let smooth = 0, fallback = 0;
    for (const k of [...selected].sort()) {
      const n = nodes.get(k), radius = Math.min(5, 2 + PM.log2(n.accumulation) / 3);
      if (n.receiver) {
        const dest = nodes.get(n.receiver);
        if (!curves.has(k)) {
          const bent = curve(n, dest), ok2 = safeEdge(bent, n.c[1]);
          curves.set(k, { ok: ok2, points: ok2 ? bent : straight(n.point, dest.point) });
        }
        const { ok, points } = curves.get(k);
        ok ? smooth++ : fallback++;
        network.push({ id: "drainage:" + k, from: k, to: n.receiver, kind: "terrain-channel", landmassId: p.landmasses[n.c[1]].id, points, radius, routingElevation: carved.get(k), receiverRoutingElevation: carved.get(n.receiver), breachDepth: dest.elevation - carved.get(n.receiver), drainageOrder: n.order, receiverOrder: dest.order });
      } else network.push({ id: "drainage:mouth:" + k, from: k, to: "ocean:" + k, kind: "ocean-outlet", landmassId: p.landmasses[n.c[1]].id, points: n.outlet, radius, routingElevation: carved.get(k), receiverRoutingElevation: carved.get(k), breachDepth: 0, drainageOrder: n.order, receiverOrder: -1 });
    }
    for (const c of connectors) {
      const n = nodes.get(c.node);
      network.push({ id: "drainage:lake-outlet:" + c.id, from: c.id, to: c.node, kind: "lake-outlet", landmassId: c.landmassId, points: c.points, radius: 2, routingElevation: carved.get(c.node), receiverRoutingElevation: carved.get(c.node), breachDepth: 0, drainageOrder: -1, receiverOrder: n.order });
    }
    const pits = [];
    for (const k of [...selected].sort()) {
      const n = nodes.get(k), r = n.receiver && nodes.get(n.receiver);
      if (!r || r.elevation <= n.elevation || carved.get(k) !== n.elevation) continue;
      let depth = 0;
      for (let v = r; v && carved.get(v.key) < v.elevation; v = v.receiver ? nodes.get(v.receiver) : null) depth = Math.max(depth, v.elevation - carved.get(v.key));
      pits.push({ node: k, point: n.point, depth, landmassId: p.landmasses[n.c[1]].id });
    }
    const channels = network.filter((e) => e.kind === "terrain-channel"), rawUphill = channels.filter((e) => nodes.get(e.to).elevation > nodes.get(e.from).elevation), breaches = channels.filter((e) => e.breachDepth > 0).map((e) => e.breachDepth).sort((a, b) => a - b);
    return { version: DRAINAGE_V3_VERSION, network, headwaters: heads, pits, failures: [], diagnostics: { landCells: cells.size, routingNodes: nodes.size, reachedNodes: order.length, unreachedNodes: nodes.size - order.length, coastalRoots: roots, edgeEvaluations: cache.size, riverlessLandmasses, headwaters: heads.length, outlets: network.filter((e) => e.kind === "ocean-outlet").length, lakeOutlets: connectors.length, smoothChannels: smooth, straightFallbacks: fallback, diagonalSteps: channels.filter((e) => {
      const [a, b] = e.from.split(",").map(Number), [c, d] = e.to.split(",").map(Number);
      return a !== c && b !== d;
    }).length, rawUphillSteps: rawUphill.length, uphillAfterBreach: channels.filter((e) => e.receiverRoutingElevation > e.routingElevation).length, breachedSteps: breaches.length, maxBreachDepth: breaches.at(-1) ?? 0, medianBreachDepth: breaches[breaches.length >> 1] ?? 0, conditioning: "eight-neighbour priority flood, steepest conditioned descent, breached river profiles" } };
  }
  return { connect, finish, selected: () => new Set(selected), node: (k) => nodes.get(k) };
}

// src/shared/generation/world_maker_v1/rivers.js
var key = (x, y) => x + "," + y;
function planRivers(asset, terrain, { guards = [], landings = [], firstCave }) {
  const W2 = terrain.widthTiles, H2 = terrain.heightTiles, hash = (s) => hash32(asset.seedDigest + "/hydrology-v1/" + s), rnd = (s) => hash(s) / 4294967296;
  const cells = new Map(asset.cellRows.flatMap((r) => r.cells.map((c) => [key(c[0], r.y), { x: c[0], y: r.y, c }])));
  const water = /* @__PURE__ */ new Map(), protectedChunks = terrain.shoreline.protectedChunks, routePages = new Map(asset.routes.routePages.map((p) => [p.key, p.rows])), guardRects = terrain.waterGeometry.bridgeGuards ?? asset.waterGeometry.bridgeGuards;
  const route = (x, y) => Number(routePages.get(key(Math.floor(x / 32), Math.floor(y / 26)))?.[y % 26]?.[x % 32] ?? 0);
  const guarded = (x, y) => guardRects.some((r) => x >= r.x1 - 6 && x <= r.x2 + 6 && y >= r.y1 - 6 && y <= r.y2 + 6);
  const protectedTile = (x, y) => protectedChunks.has(key(Math.floor(x / 32), Math.floor(y / 26)));
  const extras = /* @__PURE__ */ new Set(), guard = (t, r) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) extras.add((t.y + dy) * W2 + t.x + dx);
  };
  for (const t of asset.wildernessExtension.trailTiles) guard(t, 2);
  for (const e of asset.wildernessExtension.eventCapacities) for (const t of e.cells) guard(t, 2);
  for (const l of landings) for (const t of [...l.arrivals, ...l.approach]) guard(t, 5);
  guard(asset.spawnTile, 8);
  for (const r of guards) for (let y = r.y1; y <= r.y2; y++) for (let x = r.x1; x <= r.x2; x++) extras.add(y * W2 + x);
  for (const c of [...firstCave.footprint, ...firstCave.approach]) for (let y = c.y * 26 - 4; y < c.y * 26 + 30; y++) for (let x = c.x * 32 - 4; x < c.x * 32 + 36; x++) extras.add(y * W2 + x);
  const extraTile = (x, y) => extras.has(y * W2 + x);
  const oldWater = (x, y) => {
    const q = terrain.base(x, y);
    return q.kind === "river" ? 1 : q.kind === "lake" ? 2 : 0;
  };
  function put2(x, y, kind, keepLakes = false) {
    if (x < 0 || y < 0 || x >= W2 || y >= H2 || !cells.has(key(Math.floor(x / 64), Math.floor(y / 52)))) return;
    if (keepLakes && water.get(y * W2 + x) === 2) return;
    water.set(y * W2 + x, kind);
  }
  function disk(x, y, r, kind, keepLakes) {
    for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) if (PM.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r) put2(xx, yy, kind, keepLakes);
  }
  function channelRadius(x, y, r) {
    let clearance = 18;
    const cx2 = Math.floor(x / 32), cy2 = Math.floor(y / 26);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (protectedChunks.has(key(cx2 + dx, cy2 + dy))) {
      const a = (cx2 + dx) * 32, b = (cy2 + dy) * 26;
      clearance = Math.min(clearance, PM.hypot(Math.max(a - x, 0, x - a - 32), Math.max(b - y, 0, y - b - 26)));
    }
    for (const b of guardRects) clearance = Math.min(clearance, PM.hypot(Math.max(b.x1 - 6 - x, 0, x - b.x2 - 6), Math.max(b.y1 - 6 - y, 0, y - b.y2 - 6)));
    for (let dy = -8; dy <= 8; dy += 2) for (let dx = -8; dx <= 8; dx += 2) if (route(Math.floor(x) + dx, Math.floor(y) + dy)) clearance = Math.min(clearance, PM.hypot(dx, dy));
    const t = Math.min(1, clearance / 12);
    return Math.min(5.5, r * (1 + 0.3 * t * t * (3 - 2 * t)));
  }
  function stroke(points, r, keepLakes = false) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], n = Math.ceil(PM.hypot(a.x - b.x, a.y - b.y) * 2);
      for (let j = 0; j <= n; j++) {
        const t = j / (n || 1), x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        disk(x, y, channelRadius(x, y, r), 1, keepLakes);
      }
    }
  }
  const basins = [], failures = [];
  for (const b of terrain.waterGeometry.lakeBasins) {
    const cx2 = Math.floor((b.minX + b.maxX) / 2), cy2 = Math.floor((b.minY + b.maxY) / 2);
    basins.push({ id: b.id, kind: "lake", origin: "preserved-parent", landmassId: terrain.base(cx2, cy2).landmassId, center: { x: cx2, y: cy2 }, bounds: { x: b.minX, y: b.minY, width: b.maxX - b.minX, height: b.maxY - b.minY } });
  }
  for (const row of asset.cellRows) for (const c of row.cells) if (c[4]) {
    for (let y = row.y * 52; y < (row.y + 1) * 52; y++) for (let x = c[0] * 64; x < (c[0] + 1) * 64; x++) if (oldWater(x, y) === 2) put2(x, y, 2);
  }
  const drainage = planDrainageV3(asset, { protectedTile, extraTile, routeAt: route }), first = drainage.finish(), stroked = /* @__PURE__ */ new Set();
  for (const e of first.network) {
    stroke(e.points, e.radius, true);
    stroked.add(e.id);
  }
  const taken = [];
  function basinFits(cx2, cy2, rx, ry, inline = false) {
    for (let y = Math.floor(cy2 - ry - 5); y <= cy2 + ry + 5; y += 2) for (let x = Math.floor(cx2 - rx - 5); x <= cx2 + rx + 5; x += 2) {
      if (PM.pow((x - cx2) / (rx + 5), 2) + PM.pow((y - cy2) / (ry + 5), 2) > 1.2) continue;
      const c = terrain.macro(Math.floor(x / 64), Math.floor(y / 52));
      if (!c || c[4] || c[9] === 2 || protectedTile(x, y) || guarded(x, y) || extraTile(x, y) || route(x, y) || !inline && water.has(y * W2 + x) || terrain.waterGeometry.sampleCoast(x, y)?.water) return false;
    }
    return true;
  }
  for (const l of asset.landmasses.filter((l2) => ["primary-mainland", "major-island"].includes(l2.classId))) {
    const candidates = first.network.filter((e) => e.kind === "terrain-channel" && e.landmassId === l.id).sort((a, b) => hash("inline/" + a.id) - hash("inline/" + b.id));
    for (const e of candidates) {
      const m = e.points[Math.floor(e.points.length / 2)], cx2 = m.x, cy2 = m.y, rx = 24, ry = 18;
      if (!basinFits(cx2, cy2, rx, ry, true)) continue;
      const id = "basin:inline:" + l.id;
      for (let y = Math.floor(cy2 - ry * 1.15); y <= cy2 + ry * 1.15; y++) for (let x = Math.floor(cx2 - rx * 1.15); x <= cx2 + rx * 1.15; x++) {
        const u = (x + 0.5 - cx2) / rx, v = (y + 0.5 - cy2) / ry, theta = PM.atan2(v, u);
        if (PM.hypot(u, v) < 1 + 0.07 * PM.sin(theta * 3 + rnd(id) * 6.28)) put2(x, y, 2);
      }
      taken.push({ x: cx2, y: cy2 });
      basins.push({ id, kind: "lake", origin: "river-connected-addition", landmassId: l.id, center: { x: cx2, y: cy2 }, radii: { x: rx, y: ry }, bounds: { x: Math.floor(cx2 - rx * 1.15), y: Math.floor(cy2 - ry * 1.15), width: Math.ceil(rx * 2.3), height: Math.ceil(ry * 2.3) }, riverEdge: e.id });
      break;
    }
  }
  for (const pit of [...first.pits].filter((q) => q.depth >= 100).sort((a, b) => b.depth - a.depth || (a.node < b.node ? -1 : 1))) {
    if (taken.some((q) => PM.hypot(pit.point.x - q.x, pit.point.y - q.y) < 160)) continue;
    for (const [rx, ry] of [[26, 20], [19, 15]]) {
      const cx2 = pit.point.x, cy2 = pit.point.y;
      if (!basinFits(cx2, cy2, rx, ry, true)) continue;
      const id = "basin:river-lake:" + pit.node;
      for (let y = Math.floor(cy2 - ry * 1.15); y <= cy2 + ry * 1.15; y++) for (let x = Math.floor(cx2 - rx * 1.15); x <= cx2 + rx * 1.15; x++) {
        const u = (x + 0.5 - cx2) / rx, v = (y + 0.5 - cy2) / ry, theta = PM.atan2(v, u);
        if (PM.hypot(u, v) < 1 + 0.07 * PM.sin(theta * 3 + rnd(id) * 6.28) + 0.03 * PM.sin(theta * 5 + 1)) put2(x, y, 2);
      }
      taken.push({ x: cx2, y: cy2 });
      basins.push({ id, kind: "lake", origin: "river-lake", landmassId: pit.landmassId, center: { x: cx2, y: cy2 }, radii: { x: rx, y: ry }, bounds: { x: Math.floor(cx2 - rx * 1.15), y: Math.floor(cy2 - ry * 1.15), width: Math.ceil(rx * 2.3), height: Math.ceil(ry * 2.3) }, riverNode: pit.node, spillDepth: pit.depth });
      break;
    }
  }
  for (const [li, l] of asset.landmasses.entries()) {
    if (l.classId === "minor-island") continue;
    const target = l.classId === "primary-mainland" ? { lake: 5, pond: 10 } : l.classId === "major-island" ? { lake: 2, pond: 4 } : { lake: 1, pond: 2 };
    const candidates = [...cells.values()].filter((v) => v.c[1] === li && !v.c[4] && v.c[8] < 400 && v.c[9] !== 2).sort((a, b) => a.c[10] + a.c[8] * 2 + hash("basin/" + key(a.x, a.y)) % 700 - (b.c[10] + b.c[8] * 2 + hash("basin/" + key(b.x, b.y)) % 700) || a.y - b.y || a.x - b.x);
    for (const kind of ["lake", "pond"]) {
      let count = 0;
      for (const v of candidates) {
        const tag = kind + "/" + key(v.x, v.y), cx2 = v.x * 64 + 20 + rnd(tag + "x") * 24, cy2 = v.y * 52 + 18 + rnd(tag + "y") * 16, rx = kind === "lake" ? 35 + rnd(tag + "rx") * 25 : 7 + rnd(tag + "rx") * 8, ry = kind === "lake" ? 22 + rnd(tag + "ry") * 18 : 5 + rnd(tag + "ry") * 7;
        if (taken.some((p) => PM.hypot(cx2 - p.x, cy2 - p.y) < (kind === "lake" ? 240 : 110)) || !basinFits(cx2, cy2, rx, ry)) continue;
        const id = "basin:" + li + ":" + kind + ":" + count;
        for (let y = Math.floor(cy2 - ry * 1.2); y <= cy2 + ry * 1.2; y++) for (let x = Math.floor(cx2 - rx * 1.2); x <= cx2 + rx * 1.2; x++) {
          const u = (x + 0.5 - cx2) / rx, w = (y + 0.5 - cy2) / ry, theta = PM.atan2(w, u), r = 1 + 0.08 * PM.sin(3 * theta + rnd(tag) * 6.28) + 0.035 * PM.sin(5 * theta + 2);
          if (PM.hypot(u, w) < r) put2(x, y, 2);
        }
        taken.push({ x: cx2, y: cy2 });
        basins.push({ id, kind, origin: "closed-basin-addition", landmassId: l.id, center: { x: cx2, y: cy2 }, radii: { x: rx, y: ry }, bounds: { x: Math.floor(cx2 - rx * 1.2), y: Math.floor(cy2 - ry * 1.2), width: Math.ceil(rx * 2.4), height: Math.ceil(ry * 2.4) }, evidence: { macroCell: { x: v.x, y: v.y }, elevation: v.c[10], slope: v.c[8], geology: v.c[9] } });
        if (++count === target[kind]) break;
      }
      if (count < target[kind]) failures.push({ code: "BASIN_TARGET_UNMET", landmassId: l.id, kind, requested: target[kind], count });
    }
  }
  for (const b of basins) if (b.kind === "lake" && !["river-connected-addition", "river-lake"].includes(b.origin)) {
    const r = drainage.connect(b.id, b.center, b.landmassId);
    if (r) b.outlet = r;
    else failures.push({ code: "LAKE_WITHOUT_OUTLET", basinId: b.id });
  }
  const final = drainage.finish();
  for (const e of final.network) if (!stroked.has(e.id)) stroke(e.points, e.radius, true);
  let blockedNew = 0;
  for (const [n] of water) {
    const x = n % W2, y = Math.floor(n / W2);
    if ((protectedTile(x, y) || extraTile(x, y)) && oldWater(x, y) !== 2) {
      water.delete(n);
      blockedNew++;
    }
  }
  for (const row of asset.cellRows) for (const c of row.cells) if (c[4]) {
    for (let y = row.y * 52; y < (row.y + 1) * 52; y++) for (let x = c[0] * 64; x < (c[0] + 1) * 64; x++) if (oldWater(x, y) === 2) put2(x, y, 2);
  }
  const unseen = new Set(water.keys()), discardedBankSlivers = [];
  while (unseen.size) {
    const head = unseen.values().next().value;
    unseen.delete(head);
    const q = [head];
    let lake = false, ocean = false;
    for (let i = 0; i < q.length; i++) {
      const n = q[i], x = n % W2, y = Math.floor(n / W2);
      lake ||= water.get(n) === 2;
      ocean ||= terrain.waterGeometry.sampleCoast(x, y)?.water === true;
      for (const m of [n - 1, n + 1, n - W2, n + W2]) if (unseen.delete(m)) q.push(m);
    }
    if (lake || ocean) continue;
    if (q.length <= 128 && q.every((n) => !oldWater(n % W2, Math.floor(n / W2)) && !protectedTile(n % W2, Math.floor(n / W2)))) {
      for (const n of q) water.delete(n);
      discardedBankSlivers.push({ tiles: q.length, first: { x: head % W2, y: Math.floor(head / W2) } });
    } else failures.push({ code: "DETACHED_CHANNEL", tiles: q.length, point: { x: head % W2, y: Math.floor(head / W2) } });
  }
  const receivers = new Set(final.network.map((e) => e.to)), headwaters = final.headwaters.filter((h) => !receivers.has(h.node));
  return { water, network: final.network, headwaters, basins, failures, drainage: final.diagnostics, blockedNew, discardedBankSlivers };
}
function hydrologyPlan(asset, rivers, bridgePlan, parent) {
  const W2 = asset.domain.width * 64, H2 = asset.domain.height * 52, pages = /* @__PURE__ */ new Map();
  for (const [n, kind] of rivers.water) {
    const x = n % W2, y = Math.floor(n / W2), k = key(Math.floor(x / 32), Math.floor(y / 26));
    if (!pages.has(k)) pages.set(k, new Uint8Array(832));
    pages.get(k)[y % 26 * 32 + x % 32] = kind;
  }
  const encoded = [...pages].sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0).map(([key2, data]) => {
    const runs = [];
    for (let i = 0; i < data.length; ) {
      if (!data[i]) {
        i++;
        continue;
      }
      let j = i + 1;
      while (j < data.length && data[j] === data[i]) j++;
      runs.push([i, j - i, data[i]]);
      i = j;
    }
    return { key: key2, runs };
  });
  const failures = [...rivers.failures, ...bridgePlan.failures];
  return { bridgePlan, drainage: rivers.drainage, version: "alpha-hydrology-plan-v2", policy: "terrain-drainage-lake-outlets-v3", parent, seed: asset.seed, widthTiles: W2, heightTiles: H2, macroOwnershipChanged: false, progressionChanged: false, network: rivers.network, headwaters: rivers.headwaters, basins: rivers.basins, pages: encoded, diagnostics: { chosenNetworkEdges: rivers.network.length, protectedWaterClips: rivers.blockedNew, discardedBankSlivers: rivers.discardedBankSlivers, waterTiles: rivers.water.size, basinCounts: rivers.basins.reduce((o, b) => (o[b.kind] = (o[b.kind] ?? 0) + 1, o), {}), lakeOutlets: rivers.basins.filter((b) => b.outlet).length }, failures };
}

// src/shared/generation/harbor_town_v1.js
var HARBOR_TOWN_VERSION = "harbor-town-v1";
var HARBOR_TOWN_ID = "settlement-slot:village-outpost:06";
var HARBOR_TOWN_NAME = "Mainland Harbor";
var HARBOR_DEPTH = 24;
var HARBOR_JOIN = HARBOR_DEPTH + 2;
var BEACH_MAX = 6;
var REACH = 6;
var CLASSIC_HARBOR = freezeWire({ version: HARBOR_TOWN_VERSION, pier: 12 });
function house(n, kind, label, x, y, w, h, side, at, path = []) {
  const doorPoint = side === "south" ? [at, y + h] : side === "north" ? [at, y] : side === "east" ? [x + w, at] : [x, at];
  const porch = side === "south" ? { x: at - 1, y: y + h, w: 3, h: 3 } : side === "north" ? { x: at - 1, y: y - 3, w: 3, h: 3 } : side === "east" ? { x: x + w, y: at - 1, w: 3, h: 3 } : { x: x - 3, y: at - 1, w: 3, h: 3 };
  return { id: "harbor:roof:" + n, kind, label, x, y, w, h, doorSide: side, doorPoint, porch, path, target: [x, y] };
}
var SOUTH = {
  id: "harbor-south",
  name: "Harbor",
  core: [40, HARBOR_DEPTH],
  landing: [20, HARBOR_DEPTH],
  streets: [[[[20.5, 0], [20.5, HARBOR_DEPTH]], 3], [[[2, 9], [38, 9]], 2]],
  places: [["Harbor quay", { x: 1, y: 20, w: 38, h: 4 }, "quay"], ["Harbor garden", { x: 13, y: 1, w: 5, h: 6 }, "garden"]],
  buildings: [
    house("001", "service", "Harbor master", 23, 11, 10, 8, "south", 27),
    house("002", "support", "Fish market", 7, 11, 10, 8, "south", 12),
    house("003", "home", "Home 1", 3, 1, 8, 6, "south", 6),
    house("004", "home", "Home 2", 24, 1, 8, 6, "south", 27),
    house("005", "home", "Home 3", 33, 2, 6, 5, "south", 35)
  ],
  dressing: [{ id: "nets", kind: "nets", x: 34, y: 15, w: 3 }, { id: "crates:1", kind: "crates", x: 3, y: 17, w: 2 }, { id: "crates:2", kind: "crates", x: 35, y: 18, w: 2 }]
};
var EAST = {
  id: "harbor-east",
  name: "Harbor",
  core: [HARBOR_DEPTH, 40],
  landing: [HARBOR_DEPTH, 20],
  streets: [[[[0, 20.5], [HARBOR_DEPTH, 20.5]], 3], [[[1, 9], [20, 9]], 2], [[[1, 31], [20, 31]], 2]],
  places: [["Harbor quay", { x: 20, y: 1, w: 4, h: 38 }, "quay"], ["Harbor garden", { x: 2, y: 33, w: 7, h: 6 }, "garden"]],
  buildings: [
    house("001", "service", "Harbor master", 8, 10, 10, 8, "south", 13),
    house("002", "home", "Home 1", 1, 11, 6, 6, "south", 4),
    house("003", "home", "Home 2", 2, 1, 8, 6, "south", 5),
    house("004", "home", "Home 3", 11, 1, 7, 5, "south", 14),
    house("005", "support", "Fish market", 8, 23, 10, 7, "north", 13),
    house("006", "home", "Home 4", 1, 23, 6, 6, "north", 4),
    house("007", "home", "Home 5", 11, 33, 7, 5, "north", 14)
  ],
  dressing: [{ id: "nets", kind: "nets", x: 18, y: 13, w: 2 }, { id: "crates:1", kind: "crates", x: 18, y: 25, w: 2 }, { id: "crates:2", kind: "crates", x: 18, y: 28, w: 1 }]
};
function mirror(t, id) {
  const W2 = t.core[0], side = { east: "west", west: "east" };
  return {
    ...t,
    id,
    core: [...t.core],
    landing: [W2 - 1 - t.landing[0], t.landing[1]],
    streets: t.streets.map(([pts, w]) => [pts.map(([x, y]) => [W2 - x, y]), w]),
    places: t.places.map(([n, p, k]) => [n, { ...p, x: W2 - p.x - p.w }, k]),
    dressing: t.dressing.map((d) => ({ ...d, x: W2 - d.x - d.w })),
    buildings: t.buildings.map((b) => ({ ...b, x: W2 - b.x - b.w, doorSide: side[b.doorSide] ?? b.doorSide, doorPoint: [side[b.doorSide] ? W2 - b.doorPoint[0] : W2 - 1 - b.doorPoint[0], b.doorPoint[1]], porch: { ...b.porch, x: W2 - b.porch.x - b.porch.w }, path: b.path.map(([x, y]) => [W2 - 1 - x, y]), target: [W2 - b.x - b.w, b.y] }))
  };
}
var WEST = mirror(EAST, "harbor-west");
var HARBOR_TEMPLATES = freezeWire({ south: SOUTH, east: EAST, west: WEST });
var FACING = { "0,1": "south", "1,0": "east", "-1,0": "west" };
var across = (f) => f.y ? { x: 1, y: 0 } : { x: 0, y: 1 };
var box = (list) => {
  const xs = list.map((p) => p.x), ys = list.map((p) => p.y), x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x + 1, h: Math.max(...ys) - y + 1 };
};
var span = (L, f, u, k0, k1, j0, j1) => box([{ x: L.x + f.x * k0 + u.x * j0, y: L.y + f.y * k0 + u.y * j0 }, { x: L.x + f.x * k1 + u.x * j1, y: L.y + f.y * k1 + u.y * j1 }]);
function harborLayoutV1(landing, length, id = "ferry:landing") {
  const f = landing.facing, facing = FACING[f.x + "," + f.y];
  if (!facing) return null;
  const t = HARBOR_TEMPLATES[facing], L = landing.tile, u = across(f), origin = { x: L.x - t.landing[0], y: L.y - t.landing[1] }, body = { x: origin.x, y: origin.y, w: t.core[0], h: t.core[1] };
  const at = (k, j) => ({ x: L.x + f.x * k + u.x * j, y: L.y + f.y * k + u.y * j });
  const pierDressing = [{ id: "pier:crates", kind: "crates", ...at(2, -1) }, { id: "pier:barrel", kind: "barrels", ...at(3, 1) }, { id: "pier:bollard", kind: "bollard", ...at(length - 2, 1) }, { id: "pier:lamp", kind: "lamp", ...at(length - 1, -1) }];
  const pier = span(L, f, u, 0, length - 1, -1, 1), boat = span(L, f, u, length - 6, length - 1, 2, 4);
  return freezeWire({
    version: HARBOR_TOWN_VERSION,
    id: HARBOR_TOWN_ID,
    name: HARBOR_TOWN_NAME,
    landingId: landing.id ?? id,
    facing,
    f: { ...f },
    u,
    template: t,
    origin,
    body,
    landing: { ...L },
    pier: { ...pier, length, beach: length - REACH },
    boat,
    pierDressing,
    dressing: t.dressing.map((d) => ({ ...d, x: origin.x + d.x, y: origin.y + d.y })),
    bounds: box([{ x: Math.min(body.x, pier.x, boat.x), y: Math.min(body.y, pier.y, boat.y) }, { x: Math.max(body.x + body.w, pier.x + pier.w, boat.x + boat.w) - 1, y: Math.max(body.y + body.h, pier.y + pier.h, boat.y + boat.h) - 1 }])
  });
}
function harborFitV1(base, x, y, fx, fy, free = () => true) {
  const facing = FACING[fx + "," + fy];
  if (!facing) return 0;
  const t = HARBOR_TEMPLATES[facing], ox = x - t.landing[0], oy = y - t.landing[1], f = { x: fx, y: fy }, u = across(f);
  const sea = (k, j) => {
    const b = base(x + fx * k + u.x * j, y + fy * k + u.y * j);
    return !b.walkable && b.kind === "ocean";
  };
  let beach = 1;
  while (beach <= BEACH_MAX && base(x + fx * beach, y + fy * beach).walkable) beach++;
  if (beach > BEACH_MAX) return 0;
  const length = beach + REACH;
  for (let k = 1; k < length + 2; k++) for (let j = -1; j <= 1; j++) {
    if (k >= beach) {
      if (!sea(k, j)) return 0;
    } else {
      const b = base(x + fx * k + u.x * j, y + fy * k + u.y * j);
      if (!b.walkable && b.kind !== "ocean") return 0;
    }
  }
  for (let k = length - 6; k < length; k++) for (let j = 2; j <= 4; j++) if (!sea(k, j)) return 0;
  for (let k = HARBOR_DEPTH + 1; k <= HARBOR_JOIN; k++) {
    const jx = x - fx * k, jy = y - fy * k;
    if (!base(jx, jy).walkable || !free(jx, jy)) return 0;
  }
  for (let yy = oy; yy < oy + t.core[1]; yy++) for (let xx = ox; xx < ox + t.core[0]; xx++) if (!base(xx, yy).walkable || !free(xx, yy)) return 0;
  return length;
}

// src/shared/generation/world_maker_v1/curved_roads.js
var TW = W * 64;
var TH = H * 52;
var CW = W * 2;
var SHAPE = { main: { value: 3, width: 5, radius: 38, meander: [3.4, 72, 0.6, 18], rank: 2, slope: 1 }, secondary: { value: 2, width: 3, radius: 24, meander: [2.8, 52, 0.7, 14], rank: 1, slope: 1 }, trail: { value: 1, width: 1, radius: 9, meander: [1.6, 26, 0.7, 8], rank: 0, slope: 0.5 } };
var hyp = (x, y) => Math.sqrt(x * x + y * y);
var DISC = [1, 0.7, 0.45, 0.45];
var DIRS2 = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 1], [1, 2], [-2, 1], [-1, 2], [2, -1], [1, -2], [-2, -1], [-1, -2]];
var MOVES = new Map([4, 2].map((L) => [L, DIRS2.map(([mx, my]) => {
  const dx = mx * L, dy = my * L, len = hyp(dx, dy), n = Math.max(1, Math.ceil(len)), off = [];
  for (let i = 1; i <= n; i++) off.push(Math.round(dx * i / n), Math.round(dy * i / n));
  const diag = [];
  for (let k = 0; k < off.length; k += 2) {
    const px = k ? off[k - 2] : 0, py = k ? off[k - 1] : 0;
    if (off[k] !== px && off[k + 1] !== py) diag.push(off[k], py, px, off[k + 1]);
  }
  return { mx, my, dx, dy, len, n, off, diag };
})]));
var PASSES = [[4, 2, 4e5], [4, 6, 7e5], [2, 6, 9e5], [2, null, 15e5]];
var HW = 2.6;
var RIVER = 26;
function planCurvedRoads(asset, terrain, waterAt, ferry, stats = {}) {
  stats.searches = 0;
  stats.nodes = 0;
  stats.widened = 0;
  const macro = terrain.macro, lmIndex = new Map(asset.landmasses.map((l, k) => [l.id, k])), soft = valueNoise(asset.seedDigest, "roads-v2/soft"), wave = valueNoise(asset.seedDigest, "roads-v2/meander");
  const land = new Int16Array(W * H).fill(-1), box2 = [];
  for (let my = 0; my < H; my++) for (let mx = 0; mx < W; mx++) {
    const c = macro(mx, my);
    if (!c) continue;
    land[my * W + mx] = c[1];
    const b = box2[c[1]] ??= [mx, my, mx, my];
    if (mx < b[0]) b[0] = mx;
    if (my < b[1]) b[1] = my;
    if (mx > b[2]) b[2] = mx;
    if (my > b[3]) b[3] = my;
  }
  const landAt = (x, y) => x < 0 || y < 0 || x >= TW || y >= TH ? -1 : land[(y / 52 | 0) * W + (x >> 6)];
  const owner = new Int16Array(CW * H * 2), ownerKey = /* @__PURE__ */ new Map(), own = (id) => {
    let k = ownerKey.get(id);
    if (k === void 0) {
      k = ownerKey.size + 1;
      ownerKey.set(id, k);
    }
    return k;
  };
  for (const s of asset.settlements) for (const c of s.core) owner[c.y * CW + c.x] = own(s.id);
  for (const s of asset.sites) for (const c of s.footprint) owner[c.y * CW + c.x] = own(s.id);
  for (const f of asset.futureIslands) for (const c of [f.entrance, f.breathing]) owner[c.y * CW + c.x] = own(f.id);
  const ownerAt = (x, y) => owner[(y / 26 | 0) * CW + (x >> 5)], allowOf = (ids) => ids.map((id) => ownerKey.get(id) ?? 0);
  const hl = ferry.landings[0], hb = hl?.harborTown ? harborLayoutV1(hl, hl.harborTown.pier).body : null;
  const inHarbor = (x, y) => Boolean(hb) && x >= hb.x - 1 && x <= hb.x + hb.w && y >= hb.y - 1 && y <= hb.y + hb.h, inBody = (x, y) => Boolean(hb) && x >= hb.x && x < hb.x + hb.w && y >= hb.y && y < hb.y + hb.h;
  const pageLand = new Int16Array(CW * H * 2);
  for (let p = 0; p < pageLand.length; p++) pageLand[p] = land[((p / CW | 0) >> 1) * W + (p % CW >> 1)];
  const NP = CW * H * 2, GP = new Array(NP).fill(null), CP = new Array(NP).fill(null), RP = new Array(NP).fill(null), page = (x, y) => (y / 26 | 0) * CW + (x >> 5), off = (x, y) => y % 26 * 32 + (x & 31);
  const seaNear = new Array(W * H);
  for (let my = 0; my < H; my++) for (let mx = 0; mx < W; mx++) {
    if (land[my * W + mx] < 0) continue;
    const l = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = mx + dx, ny = my + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || land[ny * W + nx] < 0) l.push(nx * 64, ny * 52);
    }
    if (l.length) seaNear[my * W + mx] = l;
  }
  const nearSea = (m, x, y) => {
    const l = seaNear[m];
    if (!l) return false;
    const px = x + 0.5, py = y + 0.5;
    for (let i = 0; i < l.length; i += 2) {
      const dx = Math.max(l[i] - px, 0, px - l[i] - 64), dy = Math.max(l[i + 1] - py, 0, py - l[i + 1] - 52);
      if (dx * dx + dy * dy <= 1089) return true;
    }
    return false;
  };
  const wg = terrain.waterGeometry, classify = wg ? (x, y) => {
    if (inHarbor(x, y)) return 0;
    const m = (y / 52 | 0) * W + (x >> 6), coast = nearSea(m, x, y) ? wg.sampleCoast(x, y)?.water : false, w = waterAt(x, y);
    if (w === 1 && !coast) return 2;
    return w || coast || land[m] < 0 ? 0 : 1;
  } : (x, y) => {
    if (inHarbor(x, y)) return 0;
    const b = terrain.sampleBase(x, y), w = waterAt(x, y);
    return w === 1 && !terrain.waterGeometry?.sampleCoast(x, y)?.water ? 2 : b.walkable && !w ? 1 : 0;
  };
  function ground(x, y) {
    if (x < 0 || y < 0 || x >= TW || y >= TH) return 0;
    const g = GP[page(x, y)] ??= new Uint8Array(832).fill(255), o = off(x, y);
    let v = g[o];
    if (v === 255) {
      v = classify(x, y);
      g[o] = v;
    }
    return v;
  }
  function cost(x, y) {
    const c = CP[page(x, y)] ??= new Float32Array(832).fill(-1), o = off(x, y);
    let v = c[o];
    if (v < 0) {
      const g = ground(x, y);
      v = g === 1 ? 1 + 0.45 * soft(x, y, 34) : g === 2 ? RIVER : Infinity;
      c[o] = v;
    }
    return v;
  }
  const valueAt = (x, y) => {
    if (x < 0 || y < 0 || x >= TW || y >= TH) return 0;
    const r = RP[page(x, y)];
    return r ? r[off(x, y)] : 0;
  };
  const stamp = (x, y, v) => {
    if (x < 0 || y < 0 || x >= TW || y >= TH || inBody(x, y)) return;
    const r = RP[page(x, y)] ??= new Uint8Array(832), o = off(x, y);
    if (r[o] < v) r[o] = v;
  };
  const elev = new Float64Array(W * H).fill(NaN);
  for (let my = 0; my < H; my++) for (let mx = 0; mx < W; mx++) {
    const c = macro(mx, my);
    if (c) elev[my * W + mx] = c[10];
  }
  function height(x, y) {
    const fx = (x - 32) / 64, fy = (y - 26) / 52, mx = Math.floor(fx), my = Math.floor(fy), u = fx - mx, v = fy - my;
    let s = 0, wt = 0;
    for (let k = 0; k < 4; k++) {
      const cx2 = mx + (k & 1), cy2 = my + (k >> 1);
      if (cx2 < 0 || cy2 < 0 || cx2 >= W || cy2 >= H) continue;
      const h = elev[cy2 * W + cx2];
      if (h !== h) continue;
      const w = (k & 1 ? u : 1 - u) * (k >> 1 ? v : 1 - v);
      s += h * w;
      wt += w;
    }
    return wt ? s / wt : 0;
  }
  const tileOk = (x, y, lm, allow, river) => {
    const g = ground(x, y);
    if (!g || g === 2 && !river || landAt(x, y) !== lm) return false;
    const o = ownerAt(x, y);
    return !o || allow.includes(o);
  };
  const mark = new Uint16Array(W * H);
  let gen = 0;
  function corridor(a, b, lm, pad) {
    const start = (a.y / 52 | 0) * W + (a.x >> 6), goal = (b.y / 52 | 0) * W + (b.x >> 6), gx = b.x / 64, gy = b.y / 52, dist = /* @__PURE__ */ new Map([[start, 0]]), from = /* @__PURE__ */ new Map(), heap = new Heap();
    heap.push(0, start);
    const hc = (x, y) => hyp(x - gx, y - gy) * 0.9;
    while (heap.size) {
      const k = heap.peekKey(), i = heap.pop();
      if (i === goal) break;
      const x = i % W, y = i / W | 0, d = dist.get(i);
      if (k > d + hc(x, y) + 1e-9) continue;
      for (const [dx, dy] of DIRS2.slice(0, 8)) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || land[ny * W + nx] !== lm) continue;
        const c = macro(nx, ny), j = ny * W + nx, v = d + (dx && dy ? Math.SQRT2 : 1) * (1 + c[8] / 350);
        if (v < (dist.get(j) ?? Infinity)) {
          dist.set(j, v);
          from.set(j, i);
          heap.push(v + hc(nx, ny), j);
        }
      }
    }
    if (!dist.has(goal)) return null;
    if (++gen === 65536) {
      mark.fill(0);
      gen = 1;
    }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let i = goal; ; i = from.get(i)) {
      const x = i % W, y = i / W | 0;
      for (let dy = -pad; dy <= pad; dy++) for (let dx = -pad; dx <= pad; dx++) {
        const mx = x + dx, my = y + dy;
        if (mx < 0 || my < 0 || mx >= W || my >= H) continue;
        mark[my * W + mx] = gen;
        if (mx < x0) x0 = mx;
        if (my < y0) y0 = my;
        if (mx > x1) x1 = mx;
        if (my > y1) y1 = my;
      }
      if (i === start) break;
    }
    return { gen, x0: x0 * 64, y0: y0 * 52, x1: x1 * 64 + 63, y1: y1 * 52 + 51 };
  }
  const passable = (x, y, lm) => landAt(x, y) === lm && ground(x, y) !== 0;
  const onGoal = (goal, x, y) => goal.min > 0 && valueAt(x, y) >= goal.min && ground(x, y) === 1 && goal.near(x, y);
  function search(a, goal, lm, allow, kind, L, cor, limit) {
    const b = cor ?? (() => {
      const c = box2[lm];
      return { x0: c[0] * 64, y0: c[1] * 52, x1: c[2] * 64 + 63, y1: c[3] * 52 + 51 };
    })();
    const x0 = Math.floor(b.x0 / L) * L, y0 = Math.floor(b.y0 / L) * L, nx = Math.floor((Math.min(TW - 1, b.x1) - x0) / L) + 1, ny = Math.floor((Math.min(TH - 1, b.y1) - y0) / L) + 1, n = nx * ny;
    const clampN = (v, o, m) => Math.max(0, Math.min(m - 1, Math.round((v - o) / L))), sx = clampN(a.x, x0, nx), sy = clampN(a.y, y0, ny), start = sy * nx + sx;
    const dist = new Float64Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), state = new Uint8Array(n), hs = new Float32Array(n).fill(NaN), hit = new Int32Array(n), heap = new Heap();
    const moves = MOVES.get(L), slope = SHAPE[kind].slope, pt = goal.pt, minV = goal.min ?? 0, near = goal.near, hw = HW, h = (x, y) => pt ? hyp(x - pt.x, y - pt.y) * hw : 0;
    const heightOf = (i, x, y) => {
      let v = hs[i];
      if (v !== v) {
        v = height(x, y);
        hs[i] = v;
      }
      return v;
    };
    dist[start] = 0;
    heap.push(0, start);
    let end = -1, nodes = 0;
    while (heap.size) {
      const i = heap.pop();
      if (state[i] === 2) continue;
      state[i] = 2;
      if (++nodes > limit) break;
      const lx = i % nx, ly = i / nx | 0, x = x0 + lx * L, y = y0 + ly * L;
      if (i !== start && (hit[i] || pt && Math.abs(x - pt.x) <= L && Math.abs(y - pt.y) <= L && lineCost({ x, y }, pt, lm, allow, false) < Infinity || onGoal(goal, x, y))) {
        end = i;
        break;
      }
      const d = dist[i], e0 = heightOf(i, x, y);
      for (const m of moves) {
        const X = x + m.dx, Y = y + m.dy, kx = lx + m.mx, ky = ly + m.my;
        if (kx < 0 || ky < 0 || kx >= nx || ky >= ny) continue;
        if (cor && mark[(Y / 52 | 0) * W + (X >> 6)] !== cor.gen) continue;
        const j = ky * nx + kx;
        if (state[j] === 2) continue;
        let sum = 0, ok = true, goalTile = 0;
        const o = m.off;
        for (let k = 0; k < o.length; k += 2) {
          const tx = x + o[k], ty = y + o[k + 1], p = (ty / 26 | 0) * CW + (tx >> 5);
          if (pageLand[p] !== lm) {
            ok = false;
            break;
          }
          const w = owner[p];
          if (w && !allow.includes(w)) {
            ok = false;
            break;
          }
          const of = ty % 26 * 32 + (tx & 31), cp = CP[p];
          let c = cp ? cp[of] : -1;
          if (c < 0) c = cost(tx, ty);
          if (c === Infinity) {
            ok = false;
            break;
          }
          const r = RP[p], v2 = r ? r[of] : 0;
          sum += c * DISC[v2];
          if (minV && v2 >= minV && c < RIVER && !goalTile && near(tx, ty)) goalTile = ty * TW + tx + 1;
        }
        const dg = m.diag;
        for (let k = 0; k < dg.length && ok; k += 4) if (!passable(x + dg[k], y + dg[k + 1], lm) && !passable(x + dg[k + 2], y + dg[k + 3], lm)) ok = false;
        if (!ok) continue;
        const dh = Math.abs(heightOf(j, X, Y) - e0) / m.len / 2.2, v = d + sum * m.len / m.n + m.len * slope * Math.min(6, dh * dh);
        if (v < dist[j]) {
          dist[j] = v;
          from[j] = i;
          hit[j] = goalTile;
          heap.push(v + h(X, Y), j);
        }
      }
    }
    stats.nodes += nodes;
    stats.searches++;
    if (end < 0) return null;
    const path = [];
    for (let i = end; i >= 0; i = from[i]) path.push({ x: x0 + i % nx * L, y: y0 + (i / nx | 0) * L });
    path.reverse();
    const last = path[path.length - 1];
    if (hit[end]) {
      const g = hit[end] - 1;
      path.pop();
      path.push({ x: g % TW, y: g / TW | 0 });
    } else if (pt && !onGoal(goal, last.x, last.y) && (last.x !== pt.x || last.y !== pt.y)) path.push({ x: pt.x, y: pt.y });
    return path;
  }
  function route(a, goal, lm, allow, kind) {
    for (const [L, pad, limit] of PASSES) {
      const cor = pad === null ? null : corridor(a, goal.pt ?? a, lm, pad);
      if (pad !== null && !cor) continue;
      const p = search(a, goal, lm, allow, kind, L, cor, limit);
      if (p) return p;
      stats.widened++;
    }
    return null;
  }
  function lineCost(p, q, lm, allow, river) {
    const L = hyp(q.x - p.x, q.y - p.y), n = Math.max(1, Math.ceil(L));
    let sum = 0, lx = NaN, ly = NaN;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(p.x + (q.x - p.x) * i / n), y = Math.round(p.y + (q.y - p.y) * i / n);
      if (!tileOk(x, y, lm, allow, river)) return Infinity;
      if (lx === lx && x !== lx && y !== ly && !tileOk(x, ly, lm, allow, river) && !tileOk(lx, y, lm, allow, river)) return Infinity;
      lx = x;
      ly = y;
      sum += cost(x, y);
    }
    return sum * L / (n + 1);
  }
  function taut(P, lm, allow, reach) {
    const n = P.length, cum = new Float64Array(n);
    for (let k = 1; k < n; k++) cum[k] = cum[k - 1] + lineCost(P[k - 1], P[k], lm, allow, true);
    const out = [P[0]];
    let i = 0;
    const fits = (j) => {
      const c = lineCost(P[i], P[j], lm, allow, false);
      return c < Infinity && c <= (cum[j] - cum[i]) * 1.04 + 1;
    };
    while (i < n - 1) {
      let cap = Math.min(n - 1, i + reach);
      for (let k = i + 1; k < cap; k++) if (P[k].lock) {
        cap = k;
        break;
      }
      let hi = cap, lo = i + 1;
      if (hi > lo && !fits(hi)) {
        while (hi - lo > 1) {
          const mid = lo + hi >> 1;
          if (fits(mid)) lo = mid;
          else hi = mid;
        }
        hi = lo;
      }
      out.push(P[hi]);
      i = hi;
    }
    return out;
  }
  function riverAxis(cx2, cy2) {
    let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (ground(cx2 + dx, cy2 + dy) === 2) {
      n++;
      sx += dx;
      sy += dy;
      sxx += dx * dx;
      syy += dy * dy;
      sxy += dx * dy;
    }
    if (n < 3) return null;
    const mx = sx / n, my = sy / n, a = sxx / n - mx * mx, b = sxy / n - mx * my, c = syy / n - my * my, l = (a + c) / 2 + Math.sqrt((a - c) * (a - c) / 4 + b * b);
    let vx = l - c, vy = b;
    if (hyp(vx, vy) < 1e-9) {
      vx = b;
      vy = l - a;
    }
    const vl = hyp(vx, vy);
    return vl < 1e-9 ? null : { x: vx / vl, y: vy / vl };
  }
  function straightBridge(c, hint, lm, width) {
    const c0x = Math.round(c.x), c0y = Math.round(c.y), hx = Math.abs(hint.x), hy = Math.abs(hint.y), ax = Math.max(hx, hy) < 1.5 * Math.min(hx, hy) ? riverAxis(c0x, c0y) : null, across2 = ax ? Math.abs(ax.y) >= Math.abs(ax.x) : hx >= hy;
    for (const horiz of [across2, !across2]) for (const sh of [0, 1, -1, 2, -2, 3, -3]) {
      const cx2 = c0x + (horiz ? 0 : sh), cy2 = c0y + (horiz ? sh : 0), d = horiz ? { x: Math.sign(hint.x) || 1, y: 0 } : { x: 0, y: Math.sign(hint.y) || 1 }, r = (width - 1) / 2;
      let b0 = 0, b1 = 0;
      while (ground(cx2 - d.x * (b0 + 1), cy2 - d.y * (b0 + 1)) === 2 && b0 < 30) b0++;
      while (ground(cx2 + d.x * (b1 + 1), cy2 + d.y * (b1 + 1)) === 2 && b1 < 30) b1++;
      const s = { x: cx2 - d.x * (b0 + 1), y: cy2 - d.y * (b0 + 1) }, e = { x: cx2 + d.x * (b1 + 1), y: cy2 + d.y * (b1 + 1) };
      if (ground(cx2, cy2) !== 2 || !tileOk(s.x, s.y, lm, [], false) || !tileOk(e.x, e.y, lm, [], false) || b0 + b1 + 4 > 40) continue;
      let deck = true;
      for (let k = -b0 - 2; k <= b1 + 2 && deck; k++) for (let j = -r; j <= r; j++) if (!ground(cx2 + d.x * k - d.y * j, cy2 + d.y * k + d.x * j)) {
        deck = false;
        break;
      }
      if (!deck) continue;
      for (const A of [4, 2, 0]) {
        let dry = true;
        for (let k = 1; k <= A && dry; k++) if (ground(s.x - d.x * k, s.y - d.y * k) !== 1 || ground(e.x + d.x * k, e.y + d.y * k) !== 1) dry = false;
        if (dry) return { d, start: s, end: e, a0: { x: s.x - d.x * A, y: s.y - d.y * A }, a1: { x: e.x + d.x * A, y: e.y + d.y * A } };
      }
    }
    return null;
  }
  function bridgeRun(V) {
    for (let k = 0; k < V.length - 1; k++) {
      if (V[k].lock && V[k + 1].lock) continue;
      const p = V[k], q = V[k + 1], n = Math.max(1, Math.ceil(hyp(q.x - p.x, q.y - p.y)));
      let t0 = -1;
      for (let i = 0; i <= n; i++) {
        const t = i / n, r = ground(Math.round(p.x + (q.x - p.x) * t), Math.round(p.y + (q.y - p.y) * t)) === 2;
        if (r && t0 < 0) t0 = t;
        if (!r && t0 >= 0) return { k, t0, t1: t };
      }
      if (t0 >= 0) return { k, t0, t1: 1 };
    }
    return null;
  }
  function bridges(V, lm, width) {
    const out = [];
    for (let guard = 0; guard < 24; guard++) {
      const run = bridgeRun(V);
      if (!run) break;
      const { k, t0, t1 } = run, p = V[k], q = V[k + 1], tm = (t0 + t1) / 2, c = { x: p.x + (q.x - p.x) * tm, y: p.y + (q.y - p.y) * tm }, b = straightBridge(c, { x: q.x - p.x, y: q.y - p.y }, lm, width);
      const same = (u, v) => u.x === v.x && u.y === v.y;
      if (!b || out.some((o) => same(o.start, b.start) && same(o.end, b.end) || same(o.start, b.end) && same(o.end, b.start))) {
        p.lock = q.lock = true;
        continue;
      }
      const far = (v) => hyp(v.x - c.x, v.y - c.y);
      let i0 = k, i1 = k + 1;
      while (i0 > 0 && !V[i0].lock && far(V[i0]) < far(b.a0) + 2) i0--;
      while (i1 < V.length - 1 && !V[i1].lock && far(V[i1]) < far(b.a1) + 2) i1++;
      V.splice(i0 + 1, i1 - i0 - 1, { ...b.a0, lock: true }, { ...b.start, lock: true }, { ...b.end, lock: true }, { ...b.a1, lock: true });
      out.push(b);
    }
    return out;
  }
  function fillet(V, R) {
    const out = [V[0]];
    for (let k = 1; k < V.length - 1; k++) {
      const p = V[k - 1], q = V[k], r = V[k + 1];
      if (q.lock || R <= 0) {
        out.push(q);
        continue;
      }
      const ux0 = p.x - q.x, uy0 = p.y - q.y, vx0 = r.x - q.x, vy0 = r.y - q.y, lu = hyp(ux0, uy0), lv = hyp(vx0, vy0);
      if (lu < 1e-6 || lv < 1e-6) continue;
      const ux = ux0 / lu, uy = uy0 / lu, vx = vx0 / lv, vy = vy0 / lv, cos2 = Math.max(-1, Math.min(1, ux * vx + uy * vy));
      if (cos2 < -0.99955 || cos2 > 0.9999) {
        out.push(q);
        continue;
      }
      const tanH = Math.sqrt((1 - cos2) / (1 + cos2)), sinH = Math.sqrt((1 - cos2) / 2), tmax = Math.min(lu * (p.lock ? 0.95 : 0.48), lv * (r.lock ? 0.95 : 0.48)), tl = Math.min(R / tanH, tmax), rr = tl * tanH;
      const p1 = { x: q.x + ux * tl, y: q.y + uy * tl }, p2 = { x: q.x + vx * tl, y: q.y + vy * tl }, bx = ux + vx, by = uy + vy, bl = hyp(bx, by), dc = rr / sinH, cc = { x: q.x + bx / bl * dc, y: q.y + by / bl * dc };
      const a1 = PM.atan2(p1.y - cc.y, p1.x - cc.x), a2 = PM.atan2(p2.y - cc.y, p2.x - cc.x);
      let da = a2 - a1;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      const n = Math.max(2, Math.ceil(Math.abs(da) * rr / 1.2));
      for (let i = 0; i <= n; i++) {
        const ang = a1 + da * i / n;
        out.push({ x: cc.x + PM.cos(ang) * rr, y: cc.y + PM.sin(ang) * rr });
      }
    }
    out.push(V[V.length - 1]);
    return out;
  }
  function resample(P) {
    const out = [{ ...P[0], s: 0 }];
    let s = 0, carry = 0;
    for (let k = 0; k < P.length - 1; k++) {
      const p = P[k], q = P[k + 1], L = hyp(q.x - p.x, q.y - p.y);
      if (L < 1e-9) continue;
      let t = 1 - carry;
      while (t <= L) {
        s += 1;
        out.push({ x: p.x + (q.x - p.x) * t / L, y: p.y + (q.y - p.y) * t / L, s, lock: !!(p.lock && q.lock) });
        t += 1;
      }
      carry = L - (t - 1);
    }
    const z = P[P.length - 1];
    out.push({ ...z, s: s + carry });
    return out;
  }
  function straight(P) {
    const out = [];
    let s = 0;
    for (let k = 0; k < P.length - 1; k++) {
      const p = P[k], q = P[k + 1], L = hyp(q.x - p.x, q.y - p.y), n = Math.max(1, Math.ceil(L));
      for (let i = 0; i < n; i++) out.push({ x: p.x + (q.x - p.x) * i / n, y: p.y + (q.y - p.y) * i / n, s: s + L * i / n, lock: i ? !!(p.lock && q.lock) : !!p.lock });
      s += L;
    }
    out.push({ ...P[P.length - 1], s });
    return out;
  }
  function meander(P, kind, salt2, lm, allow) {
    const [A1, L1, A2, L2] = SHAPE[kind].meander, total = P[P.length - 1].s, half = SHAPE[kind].width / 2, R = Math.ceil(half), locks = P.filter((p) => p.lock).map((p) => p.s);
    const near = (s) => {
      let d = Math.min(s, total - s);
      for (const l of locks) d = Math.min(d, Math.abs(s - l));
      return d;
    };
    const nrm = P.map((p, i) => {
      const q = P[Math.min(P.length - 1, i + 2)], o = P[Math.max(0, i - 2)], tx = q.x - o.x, ty = q.y - o.y, tl = hyp(tx, ty) || 1;
      return [-ty / tl, tx / tl];
    });
    const ok = (x, y) => {
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        if (dx * dx + dy * dy > (half + 0.5) * (half + 0.5)) continue;
        if (!tileOk(Math.round(x + dx), Math.round(y + dy), lm, allow, false)) return false;
      }
      return true;
    };
    let shift = P.map((p, i) => {
      if (p.lock) return 0;
      const f = Math.min(1, near(p.s) / (L1 * 0.45)), fade = f * f * (3 - 2 * f);
      let m = ((wave(p.s, salt2, L1) - 0.5) * 2 * A1 + (wave(p.s + 977, salt2 + 31, L2) - 0.5) * 2 * A2) * fade;
      for (const sc of [1, 0.6, 0.3, 0]) {
        if (sc === 0 || ok(p.x + nrm[i][0] * m * sc, p.y + nrm[i][1] * m * sc)) {
          m *= sc;
          break;
        }
      }
      return m;
    });
    for (let pass = 0; pass < 2; pass++) shift = shift.map((m, i) => {
      if (P[i].lock) return 0;
      let s = 0, n = 0;
      for (let j = Math.max(0, i - 6); j <= Math.min(P.length - 1, i + 6); j++) {
        s += Math.min(Math.abs(m), Math.abs(shift[j])) * Math.sign(shift[j] || m);
        n++;
      }
      return s / n;
    });
    return P.map((p, i) => ({ ...p, x: p.x + nrm[i][0] * shift[i], y: p.y + nrm[i][1] * shift[i] }));
  }
  const fillScore = (x, y) => ground(x, y) !== 1 ? 0 : ownerAt(x, y) ? 1 : 2;
  function chain(P) {
    const t = [];
    let lx = NaN, ly = NaN;
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[i + 1], n = q ? Math.max(1, Math.ceil(hyp(q.x - p.x, q.y - p.y) - 1e-9)) : 1;
      for (let s = 0; s < n; s++) {
        const fx = q ? p.x + (q.x - p.x) * s / n : p.x, fy = q ? p.y + (q.y - p.y) * s / n : p.y, x = Math.round(fx), y = Math.round(fy);
        if (x === lx && y === ly) continue;
        if (lx === lx && x !== lx && y !== ly) {
          const a = fillScore(x, ly), b = fillScore(lx, y), ax = x - fx, ay = ly - fy, bx = lx - fx, by = y - fy;
          t.push(a > b || a === b && ax * ax + ay * ay <= bx * bx + by * by ? { x, y: ly, fill: true } : { x: lx, y, fill: true });
        }
        t.push({ x, y });
        lx = x;
        ly = y;
      }
    }
    return t;
  }
  const onDeck = (b, x, y) => b.d.y === 0 ? y === b.start.y && x >= Math.min(b.start.x, b.end.x) && x <= Math.max(b.start.x, b.end.x) : x === b.start.x && y >= Math.min(b.start.y, b.end.y) && y <= Math.max(b.start.y, b.end.y);
  function valid(P, decks, lm, allow) {
    const t = chain(P);
    for (let i = 3; i < t.length - 3; i++) {
      const { x, y } = t[i];
      if (tileOk(x, y, lm, allow, false)) continue;
      if (ground(x, y) === 2 && landAt(x, y) === lm && decks.some((b) => onDeck(b, x, y))) continue;
      return false;
    }
    return true;
  }
  function shape(path, kind, lm, allow, salt2, L) {
    const P0 = path.map((p) => ({ x: p.x, y: p.y })), decks = bridges(P0, lm, kind === "main" ? 5 : 3), V0 = taut(P0, lm, allow, Math.round(140 / L)), R = SHAPE[kind].radius;
    for (const [r, drift] of [[R, true], [R, false], [R / 2, false]]) {
      let P2 = resample(fillet(V0, r));
      if (drift) P2 = meander(P2, kind, salt2, lm, allow);
      if (valid(P2, decks, lm, allow)) return { P: P2, decks };
    }
    const P = straight(V0);
    if (!valid(P, decks, lm, allow)) stats.unshaped = (stats.unshaped ?? 0) + 1;
    return { P, decks };
  }
  const built = /* @__PURE__ */ new Map(), cellKey = (x, y) => Math.floor(y / 8) * 1200 + Math.floor(x / 8);
  const addBuilt = (P, kind) => {
    for (const p of P) {
      const k = cellKey(p.x, p.y);
      let l = built.get(k);
      if (!l) built.set(k, l = []);
      l.push({ x: p.x, y: p.y, kind });
    }
  };
  function nearestBuilt(x, y, kind, rings = 1) {
    const bx = Math.floor(x / 8), by = Math.floor(y / 8), rank = SHAPE[kind].rank;
    let best = null, bd = Infinity;
    for (let r = 0; r <= rings; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        for (const q of built.get((by + dy) * 1200 + bx + dx) ?? []) {
          if (SHAPE[q.kind].rank < rank) continue;
          const d = hyp(q.x - x, q.y - y);
          if (d < bd) {
            bd = d;
            best = q;
          }
        }
      }
      if (best && bd <= r * 8) break;
    }
    return best ? { q: best, d: bd } : null;
  }
  function merge(P, kind) {
    const w = SHAPE[kind].width, joined = P.map((p) => {
      if (p.lock) return null;
      const n = nearestBuilt(p.x, p.y, kind);
      return n && n.d < (w + SHAPE[n.q.kind].width) / 2 * 0.6 + 1 && ground(Math.round(n.q.x), Math.round(n.q.y)) === 1 ? n.q : null;
    });
    const pieces = [];
    let cur = null;
    for (let i = 0; i < P.length; i++) {
      if (joined[i]) {
        if (cur) {
          cur.push({ x: joined[i].x, y: joined[i].y, joint: joined[i] });
          pieces.push(cur);
          cur = null;
        }
        continue;
      }
      if (!cur) {
        cur = [];
        if (i > 0 && joined[i - 1]) cur.push({ x: joined[i - 1].x, y: joined[i - 1].y, joint: joined[i - 1] });
      }
      cur.push(P[i]);
    }
    if (cur) pieces.push(cur);
    return pieces.filter((p) => p.length >= 4);
  }
  function enter(P, lm, allow) {
    for (const end of [0, 1]) {
      const n = P.length;
      if (n < 14) break;
      const Q = end ? P[n - 1] : P[0];
      if (!Q.joint) continue;
      const ai = end ? n - 9 : 8, A = P[ai], Z = P[end ? ai - 3 : ai + 3], tl = hyp(A.x - Z.x, A.y - Z.y) || 1, L = hyp(Q.x - A.x, Q.y - A.y), C = { x: A.x + (A.x - Z.x) / tl * L * 0.5, y: A.y + (A.y - Z.y) / tl * L * 0.5 }, k = Math.max(2, Math.round(L * 1.2)), line = [];
      for (let i = 1; i <= k; i++) {
        const u = i / k, w0 = (1 - u) * (1 - u), w1 = 2 * (1 - u) * u, w2 = u * u;
        line.push({ x: w0 * A.x + w1 * C.x + w2 * Q.x, y: w0 * A.y + w1 * C.y + w2 * Q.y });
      }
      line[line.length - 1] = Q;
      const qx = Math.round(Q.x), qy = Math.round(Q.y);
      if (chain([A, ...line]).some((t) => (t.x !== qx || t.y !== qy) && !tileOk(t.x, t.y, lm, allow, false))) continue;
      if (end) P.splice(ai + 1, n - ai - 1, ...line);
      else P.splice(0, ai, ...line.reverse());
    }
    return P;
  }
  const raster = (P, kind) => {
    const { value, width } = SHAPE[kind], r = Math.max(0.75, width / 2 + 0.15), R = Math.ceil(r);
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[i + 1], n = q ? Math.max(1, Math.ceil(hyp(q.x - p.x, q.y - p.y) * 2)) : 1;
      for (let s = 0; s < n; s++) {
        const x = q ? p.x + (q.x - p.x) * s / n : p.x, y = q ? p.y + (q.y - p.y) * s / n : p.y, cx2 = Math.round(x), cy2 = Math.round(y);
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (hyp(cx2 + dx - x, cy2 + dy - y) <= r) stamp(cx2 + dx, cy2 + dy, value);
      }
    }
    for (const t of chain(P)) stamp(t.x, t.y, value);
  };
  function tilePath(P) {
    const t = chain(P).filter((c) => !c.fill);
    const out = [t[0]];
    for (let i = 1; i < t.length - 1; i++) {
      const z = t[i - 1], a = t[i], b = t[i + 1], sx = a.x - z.x, sy = a.y - z.y;
      if (sx === b.x - a.x && sy === b.y - a.y && Math.abs(sx) <= 1 && Math.abs(sy) <= 1) continue;
      out.push(a);
    }
    if (t.length > 1) out.push(t[t.length - 1]);
    return out;
  }
  function simplify(P) {
    const keep = new Uint8Array(P.length);
    keep[0] = keep[P.length - 1] = 1;
    const stack = [[0, P.length - 1]];
    while (stack.length) {
      const [i, j] = stack.pop();
      const a = P[i], b = P[j], dx = b.x - a.x, dy = b.y - a.y, l = hyp(dx, dy) || 1;
      let far = -1, fd = 0.15;
      for (let k = i + 1; k < j; k++) {
        const d = Math.abs((P[k].x - a.x) * dy - (P[k].y - a.y) * dx) / l;
        if (d > fd) {
          fd = d;
          far = k;
        }
      }
      if (far >= 0) {
        keep[far] = 1;
        stack.push([i, far], [far, j]);
      }
    }
    const out = [];
    for (let i = 0; i < P.length; i++) if (keep[i]) out.push(Math.round(P[i].x * 10) / 10, Math.round(P[i].y * 10) / 10);
    return out;
  }
  const edges = [], failures = [], dest = new Map(asset.routes.destinations.map((d) => [d.id, d]));
  function addRoute(from, to, kind, lmId, P, decks) {
    const lm = lmIndex.get(lmId), pieces = merge(P, kind);
    let added = 0;
    for (const piece of pieces) {
      const C = enter(piece, lm, []), path = tilePath(C);
      if (path.length < 2) continue;
      let len = 0;
      for (let i = 1; i < C.length; i++) len += hyp(C[i].x - C[i - 1].x, C[i].y - C[i - 1].y);
      raster(C, kind);
      addBuilt(C, kind);
      added++;
      edges.push({ bridgeIds: [], centerline: simplify(C), from, id: "route:seeded:" + String(edges.length).padStart(3, "0"), idealWalkSeconds: len * 32 / 180, kind, landmassId: lmId, lengthPixels: Math.round(len * 32), nodes: path.length, path, to });
    }
    return added;
  }
  const salt = (id) => {
    let n = 0;
    for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) % 9973;
    return n;
  };
  const byLand = /* @__PURE__ */ new Map();
  for (const s of asset.settlements) {
    if (!byLand.has(s.landmassId)) byLand.set(s.landmassId, []);
    byLand.get(s.landmassId).push({ id: s.id, point: dest.get(s.id).point, kind: /capital|city/.test(s.id) ? "main" : "secondary" });
  }
  for (const l of ferry.landings) {
    if (!byLand.has(l.landmassId)) byLand.set(l.landmassId, []);
    byLand.get(l.landmassId).push({ id: l.id, point: l.routeJoin, kind: "secondary" });
  }
  for (const [lmId, nodes] of byLand) {
    const lm = lmIndex.get(lmId), start = nodes.find((n) => /capital/.test(n.id)) ?? nodes.find((n) => !n.id.startsWith("ferry:")) ?? nodes[0], linked = [start], rest = nodes.filter((n) => n !== start);
    rest.sort((a, b) => (a.kind === "main" ? 0 : 1) - (b.kind === "main" ? 0 : 1));
    while (rest.length) {
      let pick = null, pd = Infinity, to = null;
      for (const n of rest) for (const m of linked) {
        const d = hyp(n.point.x - m.point.x, n.point.y - m.point.y) * (n.kind === "main" && m.kind === "main" ? 0.5 : 1);
        if (d < pd) {
          pd = d;
          pick = n;
          to = m;
        }
      }
      rest.splice(rest.indexOf(pick), 1);
      const kind = pick.kind === "main" && to.kind === "main" ? "main" : "secondary", allow = allowOf([pick.id, to.id]);
      const path = route(pick.point, { pt: to.point, min: kind !== "main" ? 2 : 0, near: (x, y) => hyp(x - pick.point.x, y - pick.point.y) > 40 }, lm, allow, kind);
      if (!path) {
        failures.push({ code: "NO_ROAD", from: pick.id, to: to.id, start: ground(pick.point.x, pick.point.y), goal: ground(to.point.x, to.point.y), lm });
        continue;
      }
      path.unshift({ ...pick.point });
      const { P, decks } = shape(path, kind, lm, allow, salt(pick.id + ">" + to.id), 4);
      addRoute(pick.id, to.id, kind, lmId, P, decks);
      linked.push(pick);
    }
  }
  connectors();
  const roadLands = new Set(edges.filter((e) => e.kind !== "trail").map((e) => e.landmassId));
  for (const d of asset.routes.destinations) {
    if (d.kind !== "trail") continue;
    const lm = lmIndex.get(d.landmassId), landing = ferry.landings.find((l) => l.landmassId === d.landmassId);
    let near = false;
    for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) if (valueAt(d.point.x + dx, d.point.y + dy) > 0) {
      near = true;
      break;
    }
    if (near) continue;
    const hasRoad = roadLands.has(d.landmassId);
    if (!hasRoad && !landing) {
      if (asset.landmasses[lm].classId !== "minor-island") failures.push({ code: "NO_NETWORK", to: d.id });
      continue;
    }
    let target = landing?.routeJoin ?? null;
    if (hasRoad) {
      const nb = nearestBuilt(d.point.x, d.point.y, "trail", 400);
      if (nb && landAt(Math.round(nb.q.x), Math.round(nb.q.y)) === lm) target = { x: Math.round(nb.q.x), y: Math.round(nb.q.y) };
    }
    const allow = allowOf([d.id]), path = route(d.point, { pt: target, min: hasRoad ? 1 : 0, near: (x, y) => hyp(x - d.point.x, y - d.point.y) > 6 }, lm, allow, "trail");
    if (!path) {
      failures.push({ code: "NO_TRAIL", to: d.id });
      continue;
    }
    path.unshift({ ...d.point });
    const { P, decks } = shape(path, "trail", lm, allow, salt(d.id), 4);
    if (!addRoute(d.id, hasRoad ? "network" : landing.id, "trail", d.landmassId, P, decks)) failures.push({ code: "NO_TRAIL", to: d.id });
  }
  const routePages = [];
  for (let p = 0; p < RP.length; p++) if (RP[p]) routePages.push([p % CW + "," + Math.floor(p / CW), RP[p]]);
  routePages.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return { edges, failures, routePages: routePages.map(([key2, p]) => ({ key: key2, rows: Array.from({ length: 26 }, (_, y) => Array.from(p.subarray(y * 32, y * 32 + 32)).join("")) })), valueAt, stats };
  function connectors() {
    const towns = asset.settlements.map((s) => ({ id: s.id, lm: s.landmassId, p: dest.get(s.id)?.point, core: s.core })).filter((t) => t.p), pairs = [];
    for (let i = 0; i < towns.length; i++) for (let j = i + 1; j < towns.length; j++) {
      const A = towns[i], B2 = towns[j];
      if (A.lm !== B2.lm) continue;
      const line = hyp(A.p.x - B2.p.x, A.p.y - B2.p.y);
      if (line >= 300 && line <= 2600) pairs.push({ A, B: B2, line });
    }
    pairs.sort((p, q) => p.line - q.line || (p.A.id < q.A.id ? -1 : 1));
    let added = 0, tries = 0, g = graph(towns);
    const report = [];
    for (const pr of pairs) {
      if (added >= 10 || tries >= 24) break;
      const road = g.trip(pr.A.id, pr.B.id);
      if (road <= pr.line * 1.5) continue;
      tries++;
      const kind = /capital|city/.test(pr.A.id) && /capital|city/.test(pr.B.id) ? "main" : "secondary", lm = lmIndex.get(pr.A.lm), allow = allowOf([pr.A.id, pr.B.id]), B2 = pr.B.p, A = pr.A.p;
      const path = route(A, { pt: B2, min: 2, near: (x, y) => hyp(x - B2.x, y - B2.y) < 70 && hyp(x - A.x, y - A.y) > 70 }, lm, allow, kind);
      if (!path) continue;
      path.unshift({ ...A });
      const { P, decks } = shape(path, kind, lm, allow, salt("link>" + pr.A.id + ">" + pr.B.id), 4);
      if (!addRoute(pr.A.id, pr.B.id, kind, pr.A.lm, P, decks)) continue;
      added++;
      g = graph(towns);
      report.push({ from: pr.A.id, to: pr.B.id, line: Math.round(pr.line), before: Math.round(road), after: Math.round(g.trip(pr.A.id, pr.B.id)) });
    }
    stats.connectors = report;
  }
  function graph(towns) {
    const id = /* @__PURE__ */ new Map(), xs = [], ys = [], adj = [], node = (x, y) => {
      const k = Math.round(y / 2) * 1e4 + Math.round(x / 2);
      let i = id.get(k);
      if (i === void 0) {
        i = xs.length;
        id.set(k, i);
        xs.push(Math.round(x / 2) * 2);
        ys.push(Math.round(y / 2) * 2);
        adj.push([]);
      }
      return i;
    };
    const link = (p, q, d) => {
      if (p === q) return;
      adj[p].push(q, d);
      adj[q].push(p, d);
    };
    for (const e of edges) {
      if (e.kind === "trail") continue;
      const c = e.centerline;
      let prev = -1;
      for (let i = 0; i < c.length; i += 2) {
        const a = c[i], b = c[i + 1];
        if (prev >= 0) {
          const n = Math.max(1, Math.ceil(hyp(a - xs[prev], b - ys[prev]) / 2));
          for (let k = 1; k <= n; k++) {
            const q = node(xs[prev] + (a - xs[prev]) * k / n, ys[prev] + (b - ys[prev]) * k / n);
            link(prev, q, hyp(xs[q] - xs[prev], ys[q] - ys[prev]));
            prev = q;
          }
        } else prev = node(a, b);
      }
    }
    const grid = /* @__PURE__ */ new Map();
    for (let i = 0; i < xs.length; i++) {
      const k = cellKey(xs[i], ys[i]);
      let l = grid.get(k);
      if (!l) grid.set(k, l = []);
      l.push(i);
    }
    const around = (x0, y0, x1, y1, f) => {
      for (let by = Math.floor(y0 / 8); by <= Math.floor(y1 / 8); by++) for (let bx = Math.floor(x0 / 8); bx <= Math.floor(x1 / 8); bx++) for (const j of grid.get(by * 1200 + bx) ?? []) f(j);
    };
    const real = xs.length;
    for (let i = 0; i < real; i++) around(xs[i] - 3, ys[i] - 3, xs[i] + 3, ys[i] + 3, (j) => {
      if (j > i) {
        const d = hyp(xs[j] - xs[i], ys[j] - ys[i]);
        if (d <= 2.9) link(i, j, d);
      }
    });
    const hub = /* @__PURE__ */ new Map(), addHub = (key2, x, y) => {
      const h = xs.length;
      xs.push(x);
      ys.push(y);
      adj.push([]);
      hub.set(key2, h);
      return h;
    };
    for (const t of towns) {
      const h = addHub(t.id, t.p.x, t.p.y);
      for (const c of t.core) {
        const x0 = c.x * 32 - 6, y0 = c.y * 26 - 6, x1 = c.x * 32 + 38, y1 = c.y * 26 + 32;
        around(x0, y0, x1, y1, (j) => {
          if (j < real && xs[j] >= x0 && xs[j] <= x1 && ys[j] >= y0 && ys[j] <= y1) link(h, j, 0);
        });
      }
      around(t.p.x - 12, t.p.y - 12, t.p.x + 12, t.p.y + 12, (j) => {
        if (j < real && hyp(xs[j] - t.p.x, ys[j] - t.p.y) <= 12) link(h, j, 0);
      });
    }
    for (const l of ferry.landings) {
      const P = l.routeJoin, h = addHub(l.id, P.x, P.y);
      around(P.x - 16, P.y - 16, P.x + 16, P.y + 16, (j) => {
        if (j < real && hyp(xs[j] - P.x, ys[j] - P.y) <= 16) link(h, j, 0);
      });
    }
    const dist = new Float64Array(xs.length);
    return { trip(a, b) {
      const s = hub.get(a), t = hub.get(b);
      if (s === void 0 || t === void 0) return Infinity;
      dist.fill(Infinity);
      dist[s] = 0;
      const heap = new Heap();
      heap.push(0, s);
      while (heap.size) {
        const k = heap.peekKey(), i = heap.pop();
        if (i === t) return k;
        if (k > dist[i]) continue;
        const l = adj[i];
        for (let n = 0; n < l.length; n += 2) {
          const j = l[n], v = k + l[n + 1];
          if (v < dist[j]) {
            dist[j] = v;
            heap.push(v, j);
          }
        }
      }
      return Infinity;
    } };
  }
}

// src/shared/generation/world_maker_v1/roads.js
var TW2 = W * 64;
var TH2 = H * 52;
function planFerry(asset, terrain, layout) {
  const lm = asset.landmasses, landings = [], taken = /* @__PURE__ */ new Set(), hold = (c) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) taken.add(c.x + dx + "," + (c.y + dy));
  };
  for (const s of asset.sites) for (const c of [...s.footprint, ...s.approach]) hold(c);
  for (const s of asset.settlements) for (const c of s.core) hold(c);
  for (const f of asset.futureIslands) for (const c of [f.entrance, f.breathing]) hold(c);
  const free = (x, y) => !taken.has(Math.floor(x / 32) + "," + Math.floor(y / 26));
  const own = /* @__PURE__ */ new Set();
  {
    const h = asset.settlements.find((s) => s.id === HARBOR_TOWN_ID);
    for (const c of h?.core ?? []) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) own.add(c.x + dx + "," + (c.y + dy));
  }
  const others = /* @__PURE__ */ new Set();
  for (const s of asset.sites) for (const c of [...s.footprint, ...s.approach]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) others.add(c.x + dx + "," + (c.y + dy));
  const harborFree = (x, y) => {
    const k = Math.floor(x / 32) + "," + Math.floor(y / 26);
    return !taken.has(k) || own.has(k) && !others.has(k);
  };
  const named = {};
  for (const [n, l] of layout.landings.entries()) {
    const id = lm[l.landmass].id, cls = lm[l.landmass].classId, k = named[cls] = (named[cls] ?? 0) + 1, host = asset.settlements.find((s) => s.landmassId === id && marineChunks(s).length && (n > 0 || s.id === "settlement-slot:village-outpost:06"));
    const c = host ? marineChunks(host)[0] : { x: l.cell % W * 2, y: Math.floor(l.cell / W) * 2 }, cx0 = c.x * 32 + 16, cy0 = c.y * 26 + 13;
    let best = null, bd = Infinity;
    const town = n === 0, shores = [], seen = /* @__PURE__ */ new Map(), tile = (x2, y2) => {
      const k2 = y2 * TW2 + x2;
      let v = seen.get(k2);
      if (!v) {
        v = terrain.base(x2, y2);
        seen.set(k2, v);
      }
      return v;
    };
    for (const R of [90, 240, 600]) if (!best) {
      for (let y2 = cy0 - R; y2 <= cy0 + R; y2 += R > 90 ? 4 : 2) for (let x2 = cx0 - R; x2 <= cx0 + R; x2 += R > 90 ? 4 : 2) {
        if (x2 < 0 || y2 < 0 || x2 >= TW2 || y2 >= TH2) continue;
        const b = terrain.sampleBase(x2, y2);
        if (!b.walkable || b.landmassId !== id) continue;
        for (const [fx2, fy2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (town) {
            if (!harborFree(x2, y2)) continue;
            let k2 = 1;
            while (k2 <= 6 && tile(x2 + fx2 * k2, y2 + fy2 * k2).walkable) k2++;
            const b2 = tile(x2 + fx2 * k2, y2 + fy2 * k2);
            if (k2 <= 6 && !b2.walkable && b2.kind === "ocean") shores.push({ x: x2, y: y2, fx: fx2, fy: fy2, d: PM.hypot(x2 - cx0, y2 - cy0) });
            continue;
          }
          let open = true;
          for (let k2 = 1; k2 <= 8 && open; k2++) if (!terrain.waterGeometry.sampleCoast(x2 + fx2 * k2, y2 + fy2 * k2)?.water) open = false;
          if (!open) continue;
          let dry = free(x2, y2) && free(x2 - fx2 * 24, y2 - fy2 * 24);
          for (let k2 = 1; k2 <= 24 && dry; k2++) if (!terrain.sampleBase(x2 - fx2 * k2, y2 - fy2 * k2).walkable) dry = false;
          if (!dry) continue;
          const d = PM.hypot(x2 - cx0, y2 - cy0);
          if (d < bd) {
            bd = d;
            best = { x: x2, y: y2, fx: fx2, fy: fy2 };
          }
        }
      }
      if (town) {
        shores.sort((a, b) => a.d - b.d);
        for (const s of shores) {
          const pier = harborFitV1(tile, s.x, s.y, s.fx, s.fy, harborFree);
          if (pier) {
            best = { ...s, pier };
            break;
          }
        }
        shores.length = 0;
      }
    }
    if (!best) throw Error(town ? "No shore for the harbor town" : "No ferry landing on " + id);
    const { x, y, fx, fy } = best, reach = town ? HARBOR_JOIN : 24, join = { x: x - fx * reach, y: y - fy * reach };
    landings.push({ id: "ferry:seeded:" + String(n).padStart(2, "0"), name: n === 0 ? "Mainland Harbor" : (cls === "major-island" ? "Great Island " : "Island ") + k + " Landing", landmassId: id, classId: lm[l.landmass].classId, facing: { x: fx, y: fy }, tile: { x, y }, water: { x: x + fx * 6, y: y + fy * 6 }, arrivals: [{ x, y }, { x: x - fx * 2, y: y - fy * 2 }, { x: x - fy * 2, y: y - fx * 2 }, { x: x + fy * 2, y: y + fx * 2 }], approach: [{ x, y }, join], routeJoin: { ...join }, sourceSettlementId: host?.id ?? null, ...town ? { harborTown: { version: HARBOR_TOWN_VERSION, pier: best.pier } } : {} });
  }
  return { version: "seeded-ferry-v1", landings, connections: landings.slice(1).map((l) => ({ bidirectional: true, from: landings[0].id, id: "ferry-route:" + l.id, to: l.id })) };
}
function planDestinations(asset) {
  const centre = (c) => ({ x: c.x * 32 + 15, y: c.y * 26 + 13 }), main = /capital|city/;
  return [
    ...asset.settlements.map((s) => {
      const c = s.connectionReadiness.landApproachSockets[0]?.anchorChunk, socket = c ? { x: c.chunkX, y: c.chunkY } : s.sockets[0];
      return { id: s.id, kind: main.test(s.id) ? "main" : "secondary", landmassId: s.landmassId, point: centre(socket), reservationId: s.id, socket };
    }),
    ...asset.sites.map((s) => ({ id: s.id, kind: "trail", landmassId: s.landmassId, point: centre(s.approach[0]), reservationId: s.id, socket: s.approach[0] })),
    ...asset.futureIslands.map((f) => ({ id: f.id, kind: "trail", landmassId: f.landmassId, point: centre(f.approach), reservationId: f.id, socket: f.approach }))
  ];
}

// src/shared/generation/world_maker_v1/wild.js
var TW3 = W * 64;
var TH3 = H * 52;
var DIAMOND = [[0, -3, 0], [-2, -2, 2], [-3, -1, 3], [-4, 0, 4], [-3, 1, 3], [-2, 2, 2], [0, 3, 0]];
var EVENT_MIX = { pathside: 52, backcountry: 88, deep_wild: 36 };
function planEvents(asset, terrain, roads, waterAt) {
  const G = 8, GW = TW3 / G, GH = TH3 / G, far = new Uint16Array(GW * GH).fill(65535), q = [];
  for (const p of asset.routes.routePages) {
    const [cx2, cy2] = p.key.split(",").map(Number);
    p.rows.forEach((r, y) => {
      for (let x = 0; x < 32; x++) if (r[x] !== "0") {
        const g = Math.floor((cy2 * 26 + y) / G) * GW + Math.floor((cx2 * 32 + x) / G);
        if (far[g]) {
          far[g] = 0;
          q.push(g);
        }
      }
    });
  }
  for (let h = 0; h < q.length; h++) {
    const g = q[h], x = g % GW, y = g / GW | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const j = ny * GW + nx;
      if (far[j] > far[g] + 1) {
        far[j] = far[g] + 1;
        q.push(j);
      }
    }
  }
  const reserved = /* @__PURE__ */ new Set(), res = (c, r = 1) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) reserved.add(c.x + dx + "," + (c.y + dy));
  };
  for (const s of asset.settlements) for (const c of [...s.core, ...s.expansion, ...s.sockets]) res(c);
  for (const s of asset.sites) for (const c of [...s.footprint, ...s.approach]) res(c);
  for (const f of asset.futureIslands) for (const c of [f.entrance, f.approach, f.landing, f.breathing]) res(c, 0);
  for (const e of asset.extraProtected) res(e, 0);
  for (const c of asset.originZone.runtimeChunks) res({ x: c.chunkX, y: c.chunkY }, 0);
  for (const l of asset.ferry.landings) for (const t of [...l.arrivals, ...l.approach]) res({ x: Math.floor(t.x / 32), y: Math.floor(t.y / 26) }, 1);
  const cells = (x, y) => DIAMOND.flatMap(([dy, a, b]) => Array.from({ length: b - a + 1 }, (_, k) => ({ x: x + a + k, y: y + dy })));
  const clear = (x, y) => {
    if (reserved.has(Math.floor(x / 32) + "," + Math.floor(y / 26))) return false;
    for (const c of cells(x, y)) if (!terrain.sampleBase(c.x, c.y).walkable || waterAt(c.x, c.y) || roads.valueAt(c.x, c.y)) return false;
    for (let dy = -6; dy <= 6; dy += 3) for (let dx = -6; dx <= 6; dx += 3) if (waterAt(x + dx, y + dy) || roads.valueAt(x + dx, y + dy)) return false;
    return true;
  };
  const cand = { pathside: [], backcountry: [], deep_wild: [] };
  for (let y = 16; y < TH3 - 16; y += 16) for (let x = 16; x < TW3 - 16; x += 16) {
    if (!terrain.macro(Math.floor(x / 64), Math.floor(y / 52))) continue;
    const b = terrain.sampleBase(x, y);
    if (!b.walkable) continue;
    const d = far[Math.floor(y / G) * GW + Math.floor(x / G)] * G, kind = d <= 24 ? d >= 6 ? "pathside" : null : d <= 110 ? "backcountry" : "deep_wild";
    if (!kind) continue;
    const jx = x + Math.floor(unit(asset.seedDigest + "/ev/x/" + x + "/" + y) * 8) - 4, jy = y + Math.floor(unit(asset.seedDigest + "/ev/y/" + x + "/" + y) * 8) - 4;
    cand[kind].push({ x: jx, y: jy, biome: b.biome, band: b.band, landmassId: b.landmassId });
  }
  const cellBiome = {}, area = {};
  for (const r of asset.cellRows) for (const c of r.cells) {
    const b = asset.biomeIds[c[2] - 1].replace("biome:", "");
    area[b] = (area[b] ?? 0) + 1;
  }
  const code = Object.fromEntries(BIOMES.map((b) => [{ woodland: "w", grassland: "a", wetland: "m", upland: "r", desert: "d", frostland: "s", tropical: "t", volcanic: "l" }[b], b]));
  const picked = [], events = [];
  let n = 0;
  for (const [kind, count] of Object.entries(EVENT_MIX)) {
    const want = Object.fromEntries(BIOMES.map((b) => [b, Math.round(count * (area[b] ?? 0) / 8e3)])), got = {};
    const list = cand[kind].sort((a, b) => unit(asset.seedDigest + kind + a.x + "," + a.y) - unit(asset.seedDigest + kind + b.x + "," + b.y));
    for (const pass of [0, 1]) for (const c of list) {
      if (events.filter((e) => e.category === kind).length >= count) break;
      const b = code[c.biome];
      if (pass === 0 && (got[b] ?? 0) >= want[b]) continue;
      if (picked.some((p) => PM.hypot(p.x - c.x, p.y - c.y) < (pass ? 150 : 220))) continue;
      if (!clear(c.x, c.y)) continue;
      picked.push(c);
      got[b] = (got[b] ?? 0) + 1;
      events.push({ eventSlotId: "density-v2-event-capacity-" + String(++n).padStart(3, "0"), category: kind, biome: b, landmassId: c.landmassId, position: { x: c.x, y: c.y }, cells: cells(c.x, c.y) });
    }
  }
  return events;
}

// src/shared/content/world_event_plan_v1.js
var WORLD_EVENT_PLAN_VERSION = "world-event-plan-v1";
var WORLD_EVENT_KINDS = Object.freeze(["cursed_shrine", "nests", "road_ambush", "raided_camp", "buried_cache", "trophy_hunt", "wayside_shrine", "den"]);
var WORLD_EVENT_SHARES = freezeWire({
  pathside: { road_ambush: 55, wayside_shrine: 45 },
  backcountry: { cursed_shrine: 20, nests: 25, raided_camp: 15, buried_cache: 20, den: 20 },
  deep_wild: { trophy_hunt: 40, cursed_shrine: 30, den: 30 }
});
var EVENT_NEAR = 600;
var EVENT_CACHE_REACH = 900;
function unit2(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  h = Math.imul(h ^ h >>> 16, 2246822507);
  h = Math.imul(h ^ h >>> 13, 3266489909);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
var d2 = (a, b) => {
  const x = a.position.x - b.position.x, y = a.position.y - b.position.y;
  return x * x + y * y;
};
function planWorldEventsV1({ seed, clearings, pinned = {} }) {
  for (const c of clearings) requireContract(Object.hasOwn(WORLD_EVENT_SHARES, c.category), "EVENT_PLAN:CLEARING");
  const kind = /* @__PURE__ */ new Map(), cache = /* @__PURE__ */ new Map(), near = new Map(clearings.map((c) => [c, clearings.filter((o) => o !== c && d2(c, o) <= EVENT_NEAR * EVENT_NEAR)]));
  const bySlot = new Map(clearings.map((c) => [c.eventSlotId, c])), n = {}, count = {}, cat = (c) => c.category;
  for (const c of clearings) {
    n[cat(c)] = (n[cat(c)] ?? 0) + 1;
    count[cat(c)] ??= {};
  }
  const put2 = (c, k) => {
    kind.set(c, k);
    count[cat(c)][k] = (count[cat(c)][k] ?? 0) + 1;
  }, sameNear = (c, k) => near.get(c).some((o) => kind.get(o) === k);
  for (const [id, row] of Object.entries(pinned)) {
    const c = bySlot.get(id);
    requireContract(c && WORLD_EVENT_KINDS.includes(row.event), "EVENT_PLAN:PINNED");
    put2(c, row.event);
    if (row.cacheSlotId) cache.set(c, row.cacheSlotId);
  }
  const order = (tag) => clearings.filter((c) => !kind.has(c)).sort((a, b) => unit2(seed + tag + a.eventSlotId) - unit2(seed + tag + b.eventSlotId) || (a.eventSlotId < b.eventSlotId ? -1 : 1));
  const camps = Math.round((n.backcountry ?? 0) * WORLD_EVENT_SHARES.backcountry.raided_camp / 100);
  for (const a of order("/camp/")) {
    if ((count.backcountry?.raided_camp ?? 0) >= camps) break;
    if (cat(a) !== "backcountry" || kind.has(a) || sameNear(a, "raided_camp")) continue;
    let best = null;
    for (const b of clearings) if (b !== a && !kind.has(b) && cat(b) === "backcountry" && b.landmassId === a.landmassId && d2(a, b) <= EVENT_CACHE_REACH * EVENT_CACHE_REACH && !sameNear(b, "buried_cache") && (!best || d2(a, b) < d2(a, best) || d2(a, b) === d2(a, best) && b.eventSlotId < best.eventSlotId)) best = b;
    if (best) {
      put2(a, "raided_camp");
      put2(best, "buried_cache");
      cache.set(a, best.eventSlotId);
    }
  }
  for (const c of order("/event/")) {
    const shares = WORLD_EVENT_SHARES[cat(c)];
    let best = null, low = Infinity;
    for (const k of Object.keys(shares)) {
      if (k === "raided_camp") continue;
      let s = (count[cat(c)][k] ?? 0) * 100 / (shares[k] * n[cat(c)]) + unit2(seed + "/pick/" + c.eventSlotId + "/" + k) / 1e3;
      for (const o of near.get(c)) if (kind.get(o) === k) s += 3 * (1 - d2(c, o) / (EVENT_NEAR * EVENT_NEAR));
      if (s < low) {
        low = s;
        best = k;
      }
    }
    put2(c, best);
  }
  return freezeWire({ version: WORLD_EVENT_PLAN_VERSION, events: clearings.map((c) => cache.has(c) ? { eventSlotId: c.eventSlotId, event: kind.get(c), cacheSlotId: cache.get(c) } : { eventSlotId: c.eventSlotId, event: kind.get(c) }) });
}
var CLASSIC_SLOTS = {
  cursed_shrine: [54, 56, 57, 58, 60, 67, 74, 77, 82, 84, 87, 111, 127, 129, 133, 135, 136, 141, 143, 147, 150, 152, 158, 159, 160, 165, 170, 174],
  nests: [27, 51, 55, 66, 68, 73, 79, 83, 85, 89, 90, 91, 97, 104, 107, 112, 113, 116, 119, 121, 123, 128, 130, 138, 153],
  road_ambush: [4, 5, 7, 9, 10, 11, 12, 13, 14, 17, 18, 22, 23, 24, 26, 28, 29, 31, 33, 34, 38, 40, 42, 46, 50, 52],
  raided_camp: [30, 71, 88, 92, 93, 102, 103, 105, 106, 108, 118, 137, 139, 140],
  buried_cache: [53, 59, 65, 69, 72, 75, 76, 78, 81, 94, 96, 101, 109, 110, 115, 124, 131, 132, 134],
  trophy_hunt: [144, 145, 148, 154, 156, 157, 161, 163, 166, 167, 168, 169, 173, 175],
  wayside_shrine: [1, 2, 3, 6, 8, 15, 16, 19, 20, 21, 25, 32, 35, 36, 37, 39, 41, 43, 44, 45, 47, 48, 49],
  den: [61, 62, 63, 64, 70, 80, 86, 95, 98, 99, 100, 114, 117, 120, 122, 125, 126, 142, 146, 149, 151, 155, 162, 164, 171, 172, 176]
};
var CLASSIC_CACHES = { 30: 132, 71: 96, 88: 115, 92: 65, 93: 81, 102: 109, 103: 134, 105: 69, 106: 131, 108: 59, 118: 78, 137: 101, 139: 75, 140: 124 };
var slotId = (n) => "density-v2-event-capacity-" + String(n).padStart(3, "0");
var CLASSIC_EVENT_PLAN = freezeWire({ version: WORLD_EVENT_PLAN_VERSION, events: Object.entries(CLASSIC_SLOTS).flatMap(([event, list]) => list.map((n) => ({ n, event }))).sort((a, b) => a.n - b.n).map(({ n, event }) => CLASSIC_CACHES[n] ? { eventSlotId: slotId(n), event, cacheSlotId: slotId(CLASSIC_CACHES[n]) } : { eventSlotId: slotId(n), event }) });

// src/shared/generation/world_maker_v1/make.js
var TW4 = W * 64;
var WORLD_MAKER_VERSION = "world-maker-v1.6";
function makeWorld(seed, catalog, tries = 4, onStep = null) {
  const started = performance.now();
  let w, why = [];
  for (let attempt = 0; attempt < tries; attempt++) {
    const variant = attempt ? seed + "#" + attempt : seed;
    try {
      w = buildWorld(variant, catalog, onStep);
    } catch (e) {
      why.push(variant + ": " + e.message);
      continue;
    }
    const bad = [...w.asset.hydrologyPlan.failures.map((f) => f.code), ...w.asset.routes.failures.map((f) => f.code)];
    w.asset.upstream = { ...w.asset.upstream, seed, variant: attempt, retries: why };
    if (!bad.length) break;
    why.push(variant + ": " + bad.join(" "));
  }
  if (!w) throw Error("No world for " + seed + ": " + why.join("; "));
  w.ms.total = Math.round(performance.now() - started);
  w.ms.retries = why.length;
  return w;
}
function buildWorld(seed, catalog, onStep) {
  const started = performance.now(), ms = {}, lap = (k, t2) => {
    ms[k] = Math.round(performance.now() - t2);
    onStep?.(k);
    return performance.now();
  };
  const plan = makeWorldPlan(seed, catalog);
  Object.assign(ms, plan.ms);
  onStep?.("plan");
  let t = performance.now();
  const asset = baseAsset(plan, catalog), digest = (s) => sha256Hex(asset.seedDigest + "/" + s);
  asset.routes = { bridges: [], destinations: planDestinations(asset), edges: [], failures: [], protectedChunkCount: 0, riverCrossings: { implemented: 0, mechanism: "Timber bridge decks span river channels only; lakes and the sea are never bridged." }, routePages: [], statistics: {}, version: FORMAT.routes };
  asset.wildernessExtension = { version: FORMAT.wilderness, hash: digest("wilderness"), sourceAssetHash: digest("land"), trailTiles: [], eventCapacities: [], sites: [] };
  asset.firstJourney = { version: FORMAT.access, hash: digest("first-journey"), siteId: FIRST_CAVE, trail: { id: "trail:alderwood-first-cave", kind: "trail", widthTiles: 3, path: [] }, parentRuntime: "seeded" };
  asset.worldReshape = { version: FORMAT.reshape, hash: digest("reshape"), siteBiomes: {}, ferryLandings: {} };
  const parent = { baseAssetHash: digest("land"), populationHash: null, wildernessHash: asset.wildernessExtension.hash, ferryHash: digest("ferry") };
  const dryPlan = (rivers2) => ({ ...hydrologyPlan(asset, rivers2, { bridges: [], failures: [] }, parent), failures: [] });
  const none = { water: /* @__PURE__ */ new Map(), network: [], headwaters: [], basins: [], failures: [], drainage: {}, blockedNew: 0, discardedBankSlivers: [] };
  const terrain0 = createPlannedTerrain(presentSeededWorldV1({ ...asset, hydrologyPlan: dryPlan(none) }));
  t = lap("terrain", t);
  const ferry = planFerry(asset, terrain0, plan.layout);
  asset.ferry = ferry;
  t = lap("ferry", t);
  const hl = ferry.landings[0], harbor = harborLayoutV1(hl, hl.harborTown.pier), hd = asset.routes.destinations.find((d) => d.id === HARBOR_TOWN_ID), hb = harbor.body;
  if (hd.point.x >= hb.x - 1 && hd.point.x <= hb.x + hb.w && hd.point.y >= hb.y - 1 && hd.point.y <= hb.y + hb.h) hd.point = { x: hl.routeJoin.x, y: hl.routeJoin.y };
  const firstCave = asset.sites.find((s) => s.id === FIRST_CAVE);
  const hr = harbor.bounds;
  let guards = [{ x1: hr.x - 3, y1: hr.y - 3, x2: hr.x + hr.w + 2, y2: hr.y + hr.h + 2 }], G, passes = 0;
  const pass = [];
  for (; ; ) {
    passes++;
    let q = performance.now();
    const rivers2 = planRivers(asset, terrain0, { guards, landings: ferry.landings, firstCave }), waterAt2 = (x, y) => rivers2.water.get(y * TW4 + x) ?? 0;
    const tr = performance.now() - q;
    q = performance.now();
    const terrainR2 = createPlannedTerrain(presentSeededWorldV1({ ...asset, hydrologyPlan: dryPlan(rivers2) }));
    const tt = performance.now() - q;
    q = performance.now();
    const roads2 = planCurvedRoads(asset, terrainR2, waterAt2, ferry);
    (ms.passes ??= []).push({ rivers: Math.round(tr), terrain: Math.round(tt), roads: Math.round(performance.now() - q) });
    pass.push({ searches: roads2.stats.searches, nodes: roads2.stats.nodes, widened: roads2.stats.widened ?? 0 });
    const kind = (x, y) => terrainR2.waterGeometry.sampleCoast(x, y)?.water ? 3 : waterAt2(x, y);
    const bridgePlan2 = planHydrologyBridgesV2({ ...asset, routes: { ...asset.routes, edges: roads2.edges, bridges: [] } }, kind);
    G = { rivers: rivers2, waterAt: waterAt2, terrainR: terrainR2, roads: roads2, bridgePlan: bridgePlan2 };
    const bad = bridgePlan2.failures.filter((f) => f.start && f.end || f.a && f.z);
    if (!bad.length || passes === 5) break;
    for (const f of bad) {
      const a = f.start ?? f.a, z = f.end ?? f.z;
      guards.push({ x1: Math.min(a.x, z.x) - 12, y1: Math.min(a.y, z.y) - 12, x2: Math.max(a.x, z.x) + 12, y2: Math.max(a.y, z.y) + 12 });
    }
  }
  t = lap("geography", t);
  const { rivers, waterAt, terrainR, roads, bridgePlan } = G;
  if (harborFitV1(terrainR.base, hl.tile.x, hl.tile.y, hl.facing.x, hl.facing.y) !== hl.harborTown.pier) throw Error("The harbor town lost its ground");
  asset.routes = { ...asset.routes, bridges: bridgePlan.bridges, edges: roads.edges, failures: roads.failures, routePages: roads.routePages, riverCrossings: { ...asset.routes.riverCrossings, implemented: bridgePlan.bridges.length }, statistics: { searches: roads.stats.searches, nodes: roads.stats.nodes, passes, guards: guards.length, pass } };
  asset.routes.protectedChunkCount = terrainR.shoreline.protectedChunks.size;
  asset.wildernessExtension.eventCapacities = planEvents(asset, terrainR, roads, waterAt);
  t = lap("events", t);
  const caveTrail = roads.edges.find((e) => e.from === FIRST_CAVE);
  asset.firstJourney.trail.path = caveTrail ? [...caveTrail.path].reverse() : [asset.routes.destinations.find((d) => d.id === FIRST_CAVE).point];
  const soft = rivers.failures.filter((f) => f.code === "BASIN_TARGET_UNMET");
  rivers.failures = rivers.failures.filter((f) => f.code !== "BASIN_TARGET_UNMET");
  asset.hydrologyPlan = hydrologyPlan(asset, rivers, bridgePlan, parent);
  asset.hydrologyPlan.notes = { basinTargetsUnmet: soft };
  asset.worldReshape = reshapeLayer(asset, ferry);
  for (const l of ferry.landings) Object.assign(l, asset.worldReshape.ferryLandings[l.id]);
  asset.contentRoles = makeRoles(asset);
  asset.eventPlan = planWorldEventsV1({ seed: asset.seedDigest, clearings: asset.wildernessExtension.eventCapacities });
  asset.routeHash = sha256Hex(JSON.stringify(asset.routes.edges.map((e) => e.path)));
  asset.upstream = { planHash: digest("plan"), physicalPlanHash: digest("physical"), planningPolicyHash: digest("policy"), maker: WORLD_MAKER_VERSION, seed };
  ms.total = Math.round(performance.now() - started);
  return { asset, plan, ms, terrain: terrainR, waterAt, water: rivers.water };
}

// src/shared/generation/world_maker_v1/catalog.js
var CATALOG_PATH = "assets/world-maker-v1/catalog.json";
function catalogFrom(c) {
  const shape = new Map(Object.entries(c.shapes));
  return {
    settlements: new Map(c.settlements.map((s) => [s.id, s])),
    site: (f, t) => {
      const s = shape.get(f + "/" + t);
      if (!s) throw Error("No shape for " + f + "/" + t);
      return s;
    },
    signatures: c.signatures.map((s) => ({ ...s, biome: s.id.split(":")[2] })),
    futureIslands: c.futureIslands,
    factions: c.factions,
    templates: c.templates,
    scale: c.scale,
    biomeIds: c.biomeIds
  };
}

// src/entrypoints/world_maker_worker.js
async function worldHashV1(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function startWorldMakerWorker(scope, { catalogUrl = CATALOG_PATH } = {}) {
  let catalog = null;
  const loadCatalog = () => catalog ??= fetch(new URL(catalogUrl, scope.location.href)).then((r) => {
    if (!r.ok) throw Error("World maker catalog " + r.status);
    return r.json();
  }).then(catalogFrom).catch((e) => {
    catalog = null;
    throw e;
  });
  scope.addEventListener("message", async ({ data }) => {
    if (data?.type !== "make") return;
    const seed = String(data.seed);
    try {
      const w = makeWorld(seed, await loadCatalog(), 4, (step) => scope.postMessage({ type: "step", seed, step }));
      const text = JSON.stringify(w.asset);
      scope.postMessage({ type: "world", seed, hash: await worldHashV1(text), maker: WORLD_MAKER_VERSION, ms: w.ms, text });
    } catch (e) {
      scope.postMessage({ type: "error", seed, message: String(e?.message ?? e) });
    }
  });
}

// world-maker-worker.js
startWorldMakerWorker(self);
