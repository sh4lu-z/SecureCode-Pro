/**
 * Custom Obfuscation Engine — Main Entry Point
 * Copyright (c) 2026 Shaluka Gimhan (sh4lu-z / syntiox)
 * 
 * This module orchestrates all custom Babel-based obfuscation plugins.
 * It runs AFTER javascript-obfuscator as a second protective layer,
 * making the output immune to WebCrack and resistant to LLM analysis.
 */

// @ts-ignore
import { transformSync } from '@babel/core';
import stringEncryptionPlugin from './plugins/string-encryption';
import controlFlowPlugin from './plugins/control-flow';
import opaquePredicatesPlugin from './plugins/opaque-predicates';
import llmPoisoningPlugin from './plugins/llm-poisoning';
import { applyIntegrityCheck } from './plugins/integrity-check';

export interface CustomObfuscationOptions {
  /** Enable custom XOR string encryption (immune to WebCrack decoders) */
  stringEncryption?: boolean;
  /** Enable custom control flow flattening (proprietary dispatch-table) */
  controlFlow?: boolean;
  /** Enable opaque predicates and dead code injection */
  opaquePredicates?: boolean;
  /** Enable code integrity self-validation (anti-tamper) */
  integrityCheck?: boolean;
  /** Enable fake function injection to confuse LLMs */
  llmPoisoning?: boolean;
}

/**
 * Apply custom obfuscation transformations to the given code.
 * This should be called AFTER javascript-obfuscator has already processed the code.
 * 
 * @param code - The code to transform (already obfuscated by javascript-obfuscator)
 * @param options - Which custom plugins to enable
 * @returns The transformed code with custom protections applied
 */
export function applyCustomObfuscation(
  code: string,
  options: CustomObfuscationOptions = {}
): string {
  const {
    stringEncryption = false,
    controlFlow = false,
    opaquePredicates = false,
    integrityCheck = false,
    llmPoisoning = false,
  } = options;

  // Build the list of active plugins
  const plugins: any[] = [];

  // Order matters: control flow first, then string encryption, then opaque predicates, then LLM poisoning
  if (controlFlow) {
    plugins.push(controlFlowPlugin);
  }
  if (stringEncryption) {
    plugins.push(stringEncryptionPlugin);
  }
  if (opaquePredicates) {
    plugins.push(opaquePredicatesPlugin);
  }
  if (llmPoisoning) {
    plugins.push(llmPoisoningPlugin);
  }

  // If no plugins are active, return the code as-is
  if (plugins.length === 0 && !integrityCheck) {
    return code;
  }

  let result = code;

  // Apply Babel transforms if any AST plugins are active
  if (plugins.length > 0) {
    try {
      const transformed = transformSync(result, {
        plugins,
        // Don't parse as module to handle already-obfuscated code better
        sourceType: 'script',
        // Preserve the compact formatting from javascript-obfuscator
        compact: true,
        // Don't add any comments
        comments: false,
        // Don't generate source maps
        sourceMaps: false,
        // Allow return outside function (obfuscated code often has this)
        parserOpts: {
          allowReturnOutsideFunction: true,
          allowImportExportEverywhere: true,
          errorRecovery: true,
        },
      });

      if (transformed?.code) {
        result = transformed.code;
      }
    } catch (error: any) {
      // If Babel transform fails (e.g., code is too heavily obfuscated to parse),
      // fall back to the original code silently
      console.error('[Custom Obfuscator] Babel transform failed, using original code:', error.message);
    }
  }

  // Apply integrity check as a post-processing step (operates on the final string)
  if (integrityCheck) {
    result = applyIntegrityCheck(result);
  }

  return result;
}
