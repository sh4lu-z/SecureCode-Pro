// @ts-nocheck
/**
 * Custom XOR + Base64 String Encryption Plugin
 * Copyright (c) 2026 Shaluka Gimhan (sh4lu-z / syntiox)
 * 
 * This plugin encrypts all string literals using a custom XOR cipher
 * with a randomly generated key. WebCrack's default Base64/RC4 decoders
 * cannot reverse this because it uses a proprietary encryption scheme.
 */

// @ts-ignore
import * as t from '@babel/types';

const AUTHOR_PREFIXES = [
  '_shaluka', '_gimhan', '_sh4lu_z', '_syntiox',
  '_sg_cipher', '_sx_decode', '_gz_xor', '_sh_crypt'
];

function randomPrefix(): string {
  return AUTHOR_PREFIXES[Math.floor(Math.random() * AUTHOR_PREFIXES.length)];
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 6);
}

function generateXorKey(): string {
  const keys = ['syntiox', 'sh4lu-z', 'gimhan', 'shaluka', 'sx_pro', 'sg_key'];
  const base = keys[Math.floor(Math.random() * keys.length)];
  return base + Math.random().toString(36).substring(2, 5);
}

function xorEncrypt(str: string, key: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function stringToHexEscape(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const hex = str.charCodeAt(i).toString(16);
    result += '\\x' + (hex.length < 2 ? '0' + hex : hex);
  }
  return result;
}

// Strings shorter than this won't be encrypted (to avoid bloat on tiny strings)
const MIN_STRING_LENGTH = 2;

// Strings to never encrypt (common JS patterns that break if encrypted)
const SKIP_STRINGS = new Set([
  'use strict', 'use client', 'use server',
  '__esModule', 'default', 'exports', 'module',
  'object', 'undefined', 'function', 'number', 'string', 'boolean',
  'prototype', 'constructor', '__proto__',
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS',
]);

export default function stringEncryptionPlugin(): any {
  return {
    name: 'syntiox-string-encryption',
    visitor: {
      Program: {
        enter(path) {
          const xorKey = generateXorKey();
          const decoderName = `${randomPrefix()}_xr_${randomSuffix()}`;
          
          // Collect all string literals that need encryption
          const stringsToEncrypt: { nodePath: any; encrypted: string }[] = [];
          
          path.traverse({
            StringLiteral(strPath) {
              const value = strPath.node.value;
              
              // Skip short strings, skip-listed strings, and strings in import/require
              if (value.length < MIN_STRING_LENGTH) return;
              if (SKIP_STRINGS.has(value)) return;
              
              // Don't encrypt strings in import declarations
              if (strPath.findParent((p) => p.isImportDeclaration())) return;
              // Don't encrypt strings in export declarations that are just re-exports
              if (strPath.findParent((p) => p.isExportNamedDeclaration() || p.isExportDefaultDeclaration())) {
                // Allow encrypting strings inside function bodies of exports
                if (!strPath.findParent((p) => p.isFunctionDeclaration() || p.isFunctionExpression() || p.isArrowFunctionExpression())) {
                  return;
                }
              }
              // Don't encrypt object keys
              if (strPath.parentPath?.isObjectProperty() && strPath.parentPath.node.key === strPath.node) return;
              // Don't encrypt require() calls
              if (strPath.parentPath?.isCallExpression() && 
                  t.isIdentifier(strPath.parentPath.node.callee) && 
                  strPath.parentPath.node.callee.name === 'require') return;
              
              const encrypted = xorEncrypt(value, xorKey);
              stringsToEncrypt.push({ nodePath: strPath, encrypted });
            }
          });
          
          if (stringsToEncrypt.length === 0) return;
          
          // Replace each string with a call to the decoder
          for (const { nodePath, encrypted } of stringsToEncrypt) {
            const hexStr = stringToHexEscape(encrypted);
            nodePath.replaceWith(
              t.callExpression(
                t.identifier(decoderName),
                [t.stringLiteral(encrypted)]
              )
            );
          }
          
          // Build the XOR decoder function and inject at the top
          // var _shaluka_xr_xxxx = function(s) { var k="syntiox_xxx"; var r=''; for(var i=0;i<s.length;i++){r+=String.fromCharCode(s.charCodeAt(i)^k.charCodeAt(i%k.length));} return r; };
          const decoderFunc = t.variableDeclaration('var', [
            t.variableDeclarator(
              t.identifier(decoderName),
              t.functionExpression(
                null,
                [t.identifier('_s')],
                t.blockStatement([
                  // var _k = "xorkey";
                  t.variableDeclaration('var', [
                    t.variableDeclarator(
                      t.identifier('_k'),
                      t.stringLiteral(xorKey)
                    )
                  ]),
                  // var _r = '';
                  t.variableDeclaration('var', [
                    t.variableDeclarator(
                      t.identifier('_r'),
                      t.stringLiteral('')
                    )
                  ]),
                  // for(var _i=0;_i<_s.length;_i++){_r+=String.fromCharCode(_s.charCodeAt(_i)^_k.charCodeAt(_i%_k.length));}
                  t.forStatement(
                    t.variableDeclaration('var', [
                      t.variableDeclarator(t.identifier('_i'), t.numericLiteral(0))
                    ]),
                    t.binaryExpression('<', t.identifier('_i'), t.memberExpression(t.identifier('_s'), t.identifier('length'))),
                    t.updateExpression('++', t.identifier('_i')),
                    t.blockStatement([
                      t.expressionStatement(
                        t.assignmentExpression('+=',
                          t.identifier('_r'),
                          t.callExpression(
                            t.memberExpression(t.identifier('String'), t.identifier('fromCharCode')),
                            [
                              t.binaryExpression('^',
                                t.callExpression(
                                  t.memberExpression(t.identifier('_s'), t.identifier('charCodeAt')),
                                  [t.identifier('_i')]
                                ),
                                t.callExpression(
                                  t.memberExpression(t.identifier('_k'), t.identifier('charCodeAt')),
                                  [t.binaryExpression('%', t.identifier('_i'), t.memberExpression(t.identifier('_k'), t.identifier('length')))]
                                )
                              )
                            ]
                          )
                        )
                      )
                    ])
                  ),
                  // return _r;
                  t.returnStatement(t.identifier('_r'))
                ])
              )
            )
          ]);
          
          path.node.body.unshift(decoderFunc);
        }
      }
    }
  };
}
