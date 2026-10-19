# Decision: grid-first partial-checking constraint fill

Status: implemented in v2.7.0.

The previous freeform packing search could pass density checks while leaving long answers with one crossing. Choose legal, well-connected partially checked layouts before filling them. Enforce at least half-checking on every answer and no neighbouring unchecked letters. Use a finite original vocabulary with bounded backtracking rather than weakening constraints when fill is difficult.

This choice substantially improves objective support for solvers and permits much faster generation in the recorded samples. It trades away very long entries and arbitrary freeform shapes. Rotational symmetry, fully checked American grids, globally unique semantic solutions and empirically calibrated human difficulty are outside this release's guarantees. Revisit with a larger edited long-answer bank and a template library if those become requirements.
