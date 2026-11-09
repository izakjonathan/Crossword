// Node worker_threads load these ESM sources directly at runtime. No secrets,
// tests, build directories or browser profiles are included in the traces.
const sources=['./features/generation/*.mjs','./features/editorial/*.mjs','./data/editorial/*','./lib/*.mjs'];
export default {outputFileTracingIncludes:{'/api/puzzles':sources,'/api/puzzles/replenish':sources}};
