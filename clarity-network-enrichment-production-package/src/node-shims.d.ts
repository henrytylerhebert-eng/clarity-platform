declare module "node:test" { const test: any; export default test; export { test }; }
declare module "node:assert/strict" { const assert: any; export default assert; }
declare module "node:fs" { export const readFileSync: any; }
declare module "node:path" { export const resolve: any; }
declare const process: any;
