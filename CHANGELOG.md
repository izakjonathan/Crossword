# Changelog

## Shared-session review — 20 October 2026

- Keep the same shared link when either device creates another puzzle.
- Synchronise active square/clue, gameplay dialogs, checks, clue direction and board view.
- Add atomic generation leases, round-fenced edits, stale-queue backups and repeat exclusions across the session.
- Remove filled-square skipping: typing proceeds square by square and replaces existing letters.


## 2.9.0 — 19 October 2026

- Add 83 source-referenced clue variants for 74 existing longer answers: 59 tier-2 and 24 tier-3 clues.
- Expand 8+ answer coverage from four tier-2/no tier-3 alternatives to 63 tier-2 and 24 tier-3 answers; retain all direct clues.
- Keep the 1,906-answer vocabulary, field counts, difficulty/crossing rules, repeat protection, cached search and saved-game compatibility.
- Validate optional clue-source URLs and add coverage, provenance, mode-selection and deterministic-output tests.
- Record the editorial rationale, per-variant references and actual use in generated Medium/Hard puzzles.

## 2.8.2 — 19 October 2026

- Cache crossing letter groups, answer membership and editorial domain bounds within each layout fill.
- Reuse unchanged domains and precompute affected-slot relationships while preserving search order, random draws, budgets and puzzle rules.
- Add complete-output regression hashes, backtracking coverage and a repeatable matched benchmark against extracted v2.8.1 source.
- Matched comparison: about 27% lower mean Hard generation time and 39% lower mean time over the twelve-game history-aware sequence; 312 complete puzzle objects remained identical.

## 2.8.1 — 19 October 2026

- Prevent two specialist-rated answers from crossing in newly generated puzzles.
- Allocate clue variants jointly so every hardest-tier clue has a gentler crossing clue, while preserving the required difficulty mixtures.
- Backtrack word fill when a valid clue allocation is unavailable; retain strict repeat exclusions and fixed search budgets.
- Add independent versioned crossing validation and a genuine v2.8 save fixture to preserve older progress.
- Tighten RAY/PLANE geometry clues, fix the legacy PIE chart prompt, and strengthen rated-bank validation.
- Extend generation audits with specialist crossing and clue-support metrics.

## 2.8.0 — 19 October 2026

- Independently rate vocabulary and reviewed clue variants; enforce per-mode mixtures during constraint search and final validation.
- Keep Easy 9×9, Medium 11×11 and Hard 13×13 while requiring more playable squares and higher vocabulary/clue demand at each step.
- Add 168 authored answer definitions and longer checked boundary lanes: Medium reaches 8–9 letters, Hard 9–11.
- Use 515 reviewed tier-2 and 109 tier-3 alternatives rather than automatically calling every legacy alternative hard.
- Preserve valid earlier saves, progress, UI Studio colours and the shared dated repetition ledger.
- Add profile/provenance tests, difficulty audit metrics and source-backed editorial guidance.

## 2.7.0 — 19 October 2026

- Replace greedy word packing with checked layout construction and bounded constraint filling.
- Require at least half of every new answer's letters to cross another answer, with no adjacent unchecked letters.
- Strengthen geometry, clue-number and stored-state validation while retaining valid older saves and the dated repeat ledger.
- Expand the original bank from 1,528 to 1,738 answers with 210 familiar short words; correct selected factual definitions.
- Add a scrollable Across/Down clue browser, clue number/direction and fill progress.
- Improve selected-square contrast, framing, modal focus and menu descriptions.
- Add letter hints and undoable clear-word; retain assisted status after undoing a hint.
- Terminate failed/timed-out worker searches, recreate the worker on retry, and show a persistent first-load recovery action.
- Include source-backed design decisions, automated audits and reproducible benchmark records.

## 2.6.1

Keep UI Studio browser-colour metadata before the saved-palette bootstrap and extend the matching backdrop across the viewport.
