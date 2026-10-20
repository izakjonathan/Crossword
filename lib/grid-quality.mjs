// Freeform blocked-grid quality limits, not American publication standards.
export const MAX_BLACK_RATIO = .42;
export const MAX_SOLID_BLACK_SQUARES = 3;
export function gridQuality(grid, cols, rows) {
  const black = grid.filter(cell => !cell).length;
  let solidBlackSquares = 0;
  for (let r=0;r<rows-1;r++) for(let c=0;c<cols-1;c++) {
    const i=r*cols+c;
    if(!grid[i]&&!grid[i+1]&&!grid[i+cols]&&!grid[i+cols+1]) solidBlackSquares++;
  }
  return { black, blackRatio:black / (cols*rows), solidBlackSquares };
}
export function acceptableGrid(quality) { return quality.blackRatio <= MAX_BLACK_RATIO && quality.solidBlackSquares <= MAX_SOLID_BLACK_SQUARES; }

// Local quick-crossword limits, deliberately separate from fully checked
// American publication specifications. Legacy construction keeps its limits.
export const QUICK_GEOMETRY = Object.freeze({
  easy: { maxBlackRatio: .31 },
  medium: { maxBlackRatio: .34 },
  hard: { maxBlackRatio: .37 },
});
export function rotationallySymmetric(grid) {
  return grid.every((cell, i) => Boolean(cell) === Boolean(grid[grid.length - 1 - i]));
}
export function acceptableQuickGrid(grid, cols, rows, mode, constructionVersion = 4) {
  const limits = QUICK_GEOMETRY[mode];
  const quality = gridQuality(grid, cols, rows);
  return Boolean(limits) && cols === rows && rotationallySymmetric(grid)
    && quality.blackRatio <= limits.maxBlackRatio && quality.solidBlackSquares <= (constructionVersion >= 5 ? 0 : 2);
}
