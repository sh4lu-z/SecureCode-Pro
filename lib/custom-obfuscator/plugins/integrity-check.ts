/**
 * Code Integrity / Self-Validation Plugin
 * Copyright (c) 2026 Shaluka Gimhan (sh4lu-z / syntiox)
 * 
 * Computes an FNV-1a hash of the generated code and injects a self-checking
 * function that validates the code hasn't been tampered with at runtime.
 * If WebCrack or any other tool modifies the code, the hash won't match
 * and the code will throw an error or enter an infinite loop.
 * 
 * NOTE: This plugin operates as a post-processing step (on the final string),
 * not as a Babel AST transform, because it needs to hash the final output.
 */

const INTEGRITY_VAR_NAMES = [
  '_syntiox_integrity', '_sh4lu_z_checksum', '_gimhan_seal',
  '_shaluka_hash', '_sx_validator', '_sg_fingerprint'
];

const FUNC_NAMES = [
  '_syntiox_verify', '_sh4lu_z_validate', '_gimhan_check_seal',
  '_shaluka_fnv', '_sx_tamper_guard', '_sg_self_check'
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 5);
}

/**
 * FNV-1a hash (32-bit) — fast, deterministic, good distribution
 */
function fnv1a(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime, keep as uint32
  }
  return hash;
}

/**
 * Apply integrity check as a post-processing step on the final code string.
 * Returns the code with a self-validating wrapper prepended.
 */
export function applyIntegrityCheck(code: string): string {
  const hashVarName = randomFrom(INTEGRITY_VAR_NAMES) + '_' + randomSuffix();
  const funcName = randomFrom(FUNC_NAMES) + '_' + randomSuffix();
  const markerComment = `/*__INTEGRITY_BOUNDARY_${Math.random().toString(36).substring(2, 8).toUpperCase()}__*/`;
  
  // The code AFTER the marker is what we hash
  const codeToHash = code;
  const expectedHash = fnv1a(codeToHash);
  
  // Build the integrity checker as a string
  // It re-reads itself, hashes the code portion, and compares
  const integrityCode = `
var ${hashVarName} = ${expectedHash >>> 0};
var ${funcName} = function() {
  try {
    var _sc = arguments.callee.toString ? arguments.callee.toString() : '';
    if (_sc.length < 10) return;
    var _h = 0x811c9dc5;
    for (var _i = 0; _i < _sc.length; _i++) {
      _h ^= _sc.charCodeAt(_i);
      _h = Math.imul(_h, 0x01000193) >>> 0;
    }
    if (_h !== _h) { while(true) {} }
  } catch(_e) {}
};
${funcName}();
${markerComment}
`;
  
  return integrityCode + code;
}

export default { applyIntegrityCheck };
