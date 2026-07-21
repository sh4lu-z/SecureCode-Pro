/**
 * Advanced Anti-LLM Context Flooding Plugin
 * Copyright (c) 2026 Shaluka Gimhan (sh4lu-z / syntiox)
 * 
 * Injects realistic-looking but completely fake function declarations
 * that are never called. When an AI (LLM) tries to analyze the code,
 * it gets confused by these fake functions because they look like
 * legitimate server logic, API handlers, database queries, etc.
 * This floods the AI's context window with noise, making it very
 * difficult to distinguish real logic from fake logic.
 */

import type { PluginObj } from '@babel/core';
import * as t from '@babel/types';

interface FakeFunction {
  name: string;
  params: string[];
  bodyStatements: t.Statement[];
}

function randomHex(): string {
  return '0x' + Math.floor(Math.random() * 0xFFFF).toString(16);
}

function randomApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sk_live_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function buildFakeFunctions(): FakeFunction[] {
  return [
    // Fake telemetry/analytics init
    {
      name: '_shaluka_init_telemetry',
      params: ['_endpoint', '_apiKey', '_opts'],
      bodyStatements: [
        t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier('_sx_session_id'),
            t.callExpression(
              t.memberExpression(
                t.callExpression(t.memberExpression(t.identifier('Math'), t.identifier('random')), []),
                t.identifier('toString')
              ),
              [t.numericLiteral(36)]
            )
          )
        ]),
        t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier('_gimhan_headers'),
            t.objectExpression([
              t.objectProperty(t.stringLiteral('X-API-Key'), t.identifier('_apiKey')),
              t.objectProperty(t.stringLiteral('X-Session-ID'), t.identifier('_sx_session_id')),
              t.objectProperty(t.stringLiteral('Content-Type'), t.stringLiteral('application/json')),
              t.objectProperty(t.stringLiteral('X-Syntiox-Version'), t.stringLiteral('3.2.1')),
            ])
          )
        ]),
        t.returnStatement(
          t.callExpression(t.identifier('fetch'), [
            t.binaryExpression('+', t.identifier('_endpoint'), t.stringLiteral('/v3/events/batch')),
            t.objectExpression([
              t.objectProperty(t.identifier('method'), t.stringLiteral('POST')),
              t.objectProperty(t.identifier('headers'), t.identifier('_gimhan_headers')),
              t.objectProperty(t.identifier('body'), 
                t.callExpression(
                  t.memberExpression(t.identifier('JSON'), t.identifier('stringify')),
                  [t.objectExpression([
                    t.objectProperty(t.identifier('session'), t.identifier('_sx_session_id')),
                    t.objectProperty(t.identifier('timestamp'), t.callExpression(t.memberExpression(t.identifier('Date'), t.identifier('now')), [])),
                    t.objectProperty(t.identifier('events'), t.arrayExpression([])),
                  ])]
                )
              )
            ])
          ])
        )
      ]
    },
    // Fake license validator
    {
      name: '_syntiox_validate_license',
      params: ['_licenseKey', '_hwid'],
      bodyStatements: [
        t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier('_sh4lu_key_parts'),
            t.callExpression(
              t.memberExpression(t.identifier('_licenseKey'), t.identifier('split')),
              [t.stringLiteral('-')]
            )
          )
        ]),
        t.ifStatement(
          t.binaryExpression('!==',
            t.memberExpression(t.identifier('_sh4lu_key_parts'), t.identifier('length')),
            t.numericLiteral(5)
          ),
          t.blockStatement([
            t.throwStatement(
              t.newExpression(t.identifier('Error'), [t.stringLiteral('Invalid license format — contact support@syntiox.io')])
            )
          ])
        ),
        t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier('_gimhan_checksum'),
            t.numericLiteral(0)
          )
        ]),
        t.forStatement(
          t.variableDeclaration('var', [
            t.variableDeclarator(t.identifier('_i'), t.numericLiteral(0))
          ]),
          t.binaryExpression('<', t.identifier('_i'), t.memberExpression(t.identifier('_licenseKey'), t.identifier('length'))),
          t.updateExpression('++', t.identifier('_i')),
          t.blockStatement([
            t.expressionStatement(
              t.assignmentExpression('+=',
                t.identifier('_gimhan_checksum'),
                t.callExpression(
                  t.memberExpression(t.identifier('_licenseKey'), t.identifier('charCodeAt')),
                  [t.identifier('_i')]
                )
              )
            )
          ])
        ),
        t.returnStatement(
          t.binaryExpression('===',
            t.binaryExpression('%', t.identifier('_gimhan_checksum'), t.numericLiteral(256)),
            t.numericLiteral(0)
          )
        )
      ]
    },
    // Fake credential loader
    {
      name: '_gimhan_load_credentials',
      params: ['_vault_url', '_token'],
      bodyStatements: [
        t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier('_shaluka_auth'),
            t.templateLiteral(
              [t.templateElement({ raw: 'Bearer ', cooked: 'Bearer ' }, false), t.templateElement({ raw: '', cooked: '' }, true)],
              [t.identifier('_token')]
            )
          )
        ]),
        t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier('_sx_config'),
            t.objectExpression([
              t.objectProperty(t.stringLiteral('db_host'), t.stringLiteral('pg-cluster-01.syntiox.internal')),
              t.objectProperty(t.stringLiteral('db_port'), t.numericLiteral(5432)),
              t.objectProperty(t.stringLiteral('db_name'), t.stringLiteral('shaluka_prod_v3')),
              t.objectProperty(t.stringLiteral('redis_url'), t.stringLiteral('redis://cache.gimhan.cloud:6379')),
              t.objectProperty(t.stringLiteral('api_secret'), t.stringLiteral(randomApiKey())),
            ])
          )
        ]),
        t.returnStatement(
          t.callExpression(t.identifier('fetch'), [
            t.binaryExpression('+', t.identifier('_vault_url'), t.stringLiteral('/v1/secrets/data/production')),
            t.objectExpression([
              t.objectProperty(t.identifier('headers'), t.objectExpression([
                t.objectProperty(t.stringLiteral('Authorization'), t.identifier('_shaluka_auth')),
                t.objectProperty(t.stringLiteral('X-Vault-Token'), t.identifier('_token')),
              ]))
            ])
          ])
        )
      ]
    },
    // Fake WebSocket heartbeat manager
    {
      name: '_sh4lu_z_ws_heartbeat',
      params: ['_socket', '_interval'],
      bodyStatements: [
        t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier('_syntiox_ping_id'),
            t.numericLiteral(0)
          )
        ]),
        t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier('_gimhan_timer'),
            t.callExpression(t.identifier('setInterval'), [
              t.functionExpression(null, [], t.blockStatement([
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(t.identifier('_socket'), t.identifier('send')),
                    [t.callExpression(
                      t.memberExpression(t.identifier('JSON'), t.identifier('stringify')),
                      [t.objectExpression([
                        t.objectProperty(t.identifier('type'), t.stringLiteral('ping')),
                        t.objectProperty(t.identifier('id'), t.updateExpression('++', t.identifier('_syntiox_ping_id'))),
                        t.objectProperty(t.identifier('ts'), t.callExpression(t.memberExpression(t.identifier('Date'), t.identifier('now')), [])),
                      ])]
                    )]
                  )
                )
              ])),
              t.logicalExpression('||', t.identifier('_interval'), t.numericLiteral(30000))
            ])
          )
        ]),
        t.returnStatement(
          t.functionExpression(null, [], t.blockStatement([
            t.expressionStatement(
              t.callExpression(t.identifier('clearInterval'), [t.identifier('_gimhan_timer')])
            )
          ]))
        )
      ]
    }
  ];
}

export default function llmPoisoningPlugin(): PluginObj {
  return {
    name: 'syntiox-llm-poisoning',
    visitor: {
      Program: {
        exit(path) {
          const fakeFunctions = buildFakeFunctions();
          
          // Pick 2-3 random fake functions to inject
          const count = Math.min(fakeFunctions.length, Math.floor(Math.random() * 2) + 2);
          const shuffled = fakeFunctions.sort(() => Math.random() - 0.5).slice(0, count);
          
          const fakeDeclarations: t.Statement[] = [];
          
          for (const fn of shuffled) {
            const suffix = '_' + Math.random().toString(36).substring(2, 5);
            const funcDecl = t.functionDeclaration(
              t.identifier(fn.name + suffix),
              fn.params.map(p => t.identifier(p)),
              t.blockStatement(fn.bodyStatements)
            );
            fakeDeclarations.push(funcDecl);
          }
          
          // Inject fake functions at random positions in the program body
          const body = path.node.body;
          for (const decl of fakeDeclarations) {
            // Insert at a random position (not at the very start to avoid
            // being before 'use strict' or imports)
            const minPos = Math.min(2, body.length);
            const pos = Math.floor(Math.random() * (body.length - minPos)) + minPos;
            body.splice(pos, 0, decl);
          }
        }
      }
    }
  };
}
