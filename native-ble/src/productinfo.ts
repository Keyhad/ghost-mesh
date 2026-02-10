// Backwards-compatible shim for the previous `productinfo` module.
// Prefer using `parseManufacturerData` from `src/manufacturer.ts`.
export { parseManufacturerData as parseProductInfo } from './manufacturer';

