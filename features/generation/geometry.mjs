import {checkingQuality} from '../../lib/validate.mjs';
import {gridQuality,rotationallySymmetric} from '../../lib/grid-quality.mjs';
export const GEOMETRY_PROFILES=Object.freeze({
 'quick-v5':{sizes:[9,11,13],symmetry:true,minimumLength:3,minimumChecking:.5,maxUncheckedRun:1,maxBlackRatio:.37,maxSolidBlocks:0},
 'american-15':{sizes:[15],symmetry:true,minimumLength:3,minimumChecking:1,maxUncheckedRun:0,maxBlackRatio:.16,maxSolidBlocks:3,maxWords:78},
 'american-15-themeless':{sizes:[15],symmetry:true,minimumLength:3,minimumChecking:1,maxUncheckedRun:0,maxBlackRatio:.16,maxSolidBlocks:3,maxWords:72}
});
export function validateGeometry(puzzle,profileName=puzzle.geometryProfile||'quick-v5') {
 const profile=GEOMETRY_PROFILES[profileName];if(!profile)return ['Unknown geometry profile'];
 const errors=[],quality=gridQuality(puzzle.grid,puzzle.cols,puzzle.rows),checking=checkingQuality(puzzle);
 if(puzzle.cols!==puzzle.rows||!profile.sizes.includes(puzzle.cols))errors.push('Dimensions outside geometry profile');
 if(profile.symmetry&&!rotationallySymmetric(puzzle.grid))errors.push('Geometry symmetry failure');
 if(quality.blackRatio>profile.maxBlackRatio||quality.solidBlackSquares>profile.maxSolidBlocks)errors.push('Geometry block limit exceeded');
 if(profile.maxWords&&puzzle.entries.length>profile.maxWords)errors.push('Geometry word count exceeded');
 if(puzzle.entries.some(e=>e.answer.length<profile.minimumLength)||checking.entries.some(e=>e.ratio<profile.minimumChecking||e.longestUnchecked>profile.maxUncheckedRun))errors.push('Geometry checking requirement failed');
 return errors;
}
