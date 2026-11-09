# Development workflow

Use Node 24. Install with `npm ci`; run with `npm run dev`. Use `npm run build` and `npm start` for a production verification run. Start from the confirmed source archive or repository revision and preserve it while making a focused change.

Review the source and applicable `AGENTS.md` before editing. Keep the established module boundaries. Run the validation commands listed in `docs/testing.md`, review the diff, update the changelog and record limitations. Do not commit `node_modules`, `.next`, environment secrets or transient screenshots. The lockfile must accompany package metadata.

The ZIP contains the repository-root files; extract and commit its contents to the existing project repository. Deployment is a separate operation through the existing Vercel/GitHub setup.

For v2.11 additions, keep library, solve options/statistics and player presence in their feature directories. Preserve existing lib/component public imports. When expanding editorial data, retain old seeded fixtures and add a documented new release fixture rather than changing historical expectations in place. Run the full suite with disposable Redis when touching atomic stats or presence, then verify production build/CSS and the puzzle audit. Never test Redis mutations against existing player rooms.


For v2.21+ content edits, use the structured editorial draft/review/import workflow in EDITORIAL-BACKEND-V2.21.md. Do not insert unchecked model output directly into the active bank. Update catalog revision, compile sources and prepare/revalidate inventory against a fresh exclusion snapshot. Run schema checks, functional publication/Redis tests, the build and the structural audit. Preserve existing publication receipts and answer-history keys. Optional local HTTP verification uses disposable Redis binaries only: REDIS_TEST_CLI=/path/to/redis-cli npm run verify:backend.
