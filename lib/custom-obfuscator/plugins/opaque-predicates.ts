// @ts-nocheck
/**
 * Opaque Predicates & Dead Code Injection Plugin
 * Copyright (c) 2026 Shaluka Gimhan (sh4lu-z / syntiox)
 * 
 * Injects mathematically opaque predicates (expressions that always evaluate
 * to a known value but are computationally hard to prove) and fake code paths
 * that never execute. WebCrack's dead-code remover only detects trivial patterns
 * like if(false) or if(0). Our opaque predicates use mathematical identities
 * that require symbolic analysis to prove dead — which WebCrack cannot do.
 */

// @ts-ignore
import * as t from '@babel/types';

const FAKE_VAR_NAMES = [
  '_gimhan_proof', '_syntiox_guard', '_shaluka_assert',
  '_sh4lu_z_valid', '_sx_sentinel', '_sg_invariant',
  '_gimhan_check', '_syntiox_seal', '_shaluka_lock'
];

// Fake URLs and function calls to inject in dead branches
const FAKE_URLS = [
  'https://api.syntiox.io/v3/telemetry',
  'https://license.shaluka.dev/validate',
  'https://auth.gimhan.cloud/token/refresh',
  'https://cdn.sh4lu-z.net/assets/config.json',
  'https://metrics.syntiox.pro/report',
];

const FAKE_FUNCTION_BODIES: (() => t.Statement[])[] = [
  // fetch(url, { method: 'DELETE' })
  () => [
    t.expressionStatement(
      t.callExpression(t.identifier('fetch'), [
        t.stringLiteral(FAKE_URLS[Math.floor(Math.random() * FAKE_URLS.length)]),
        t.objectExpression([
          t.objectProperty(t.identifier('method'), t.stringLiteral('DELETE'))
        ])
      ])
    )
  ],
  // console.error("License expired"); process.exit(1);
  () => [
    t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier('console'), t.identifier('error')),
        [t.stringLiteral('License validation failed — contact syntiox support')]
      )
    ),
    t.throwStatement(
      t.newExpression(t.identifier('Error'), [t.stringLiteral('AUTH_REVOKED')])
    )
  ],
  // localStorage.clear(); sessionStorage.clear();
  () => [
    t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier('localStorage'), t.identifier('clear')),
        []
      )
    ),
    t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier('sessionStorage'), t.identifier('clear')),
        []
      )
    )
  ],
  // document.body.innerHTML = '';
  () => [
    t.expressionStatement(
      t.assignmentExpression('=',
        t.memberExpression(
          t.memberExpression(t.identifier('document'), t.identifier('body')),
          t.identifier('innerHTML')
        ),
        t.stringLiteral('')
      )
    )
  ]
];

/**
 * Generate an opaque predicate that ALWAYS evaluates to true,
 * but is mathematically non-trivial to prove.
 */
function generateAlwaysTruePredicate(varName: string): {
  setup: t.Statement[];
  test: t.Expression;
} {
  const predicates = [
    // (x*x + x) % 2 === 0  — always true for any integer x
    () => {
      const x = Math.floor(Math.random() * 100) + 1;
      return {
        setup: [
          t.variableDeclaration('var', [
            t.variableDeclarator(t.identifier(varName), t.numericLiteral(x))
          ])
        ],
        test: t.binaryExpression('===',
          t.binaryExpression('%',
            t.binaryExpression('+',
              t.binaryExpression('*', t.identifier(varName), t.identifier(varName)),
              t.identifier(varName)
            ),
            t.numericLiteral(2)
          ),
          t.numericLiteral(0)
        )
      };
    },
    // ((x | 0) ^ (x | 0)) === 0  — always true (x XOR x = 0)
    () => {
      const piExpr = t.binaryExpression('|',
        t.binaryExpression('*',
          t.memberExpression(t.identifier('Math'), t.identifier('PI')),
          t.numericLiteral(2)
        ),
        t.numericLiteral(0)
      );
      return {
        setup: [
          t.variableDeclaration('var', [
            t.variableDeclarator(t.identifier(varName), piExpr)
          ])
        ],
        test: t.binaryExpression('===',
          t.binaryExpression('^', t.identifier(varName), t.identifier(varName)),
          t.numericLiteral(0)
        )
      };
    },
    // typeof x === typeof x — always true
    () => {
      return {
        setup: [
          t.variableDeclaration('var', [
            t.variableDeclarator(
              t.identifier(varName),
              t.callExpression(
                t.memberExpression(t.identifier('Math'), t.identifier('floor')),
                [t.binaryExpression('*',
                  t.memberExpression(t.identifier('Math'), t.identifier('E')),
                  t.numericLiteral(100)
                )]
              )
            )
          ])
        ],
        test: t.binaryExpression('===',
          t.unaryExpression('typeof', t.identifier(varName)),
          t.unaryExpression('typeof', t.identifier(varName))
        )
      };
    },
    // (x >>> 0) >= 0 — always true for unsigned right shift
    () => {
      const val = Math.floor(Math.random() * 1000);
      return {
        setup: [
          t.variableDeclaration('var', [
            t.variableDeclarator(t.identifier(varName), t.numericLiteral(val))
          ])
        ],
        test: t.binaryExpression('>=',
          t.binaryExpression('>>>', t.identifier(varName), t.numericLiteral(0)),
          t.numericLiteral(0)
        )
      };
    }
  ];
  
  return predicates[Math.floor(Math.random() * predicates.length)]();
}

export default function opaquePredicatesPlugin(): any {
  return {
    name: 'syntiox-opaque-predicates',
    visitor: {
      Program: {
        exit(path) {
          const body = path.node.body;
          const newBody: t.Statement[] = [];
          
          let injectionsLeft = Math.min(3, Math.max(1, Math.floor(body.length / 4)));
          
          for (let i = 0; i < body.length; i++) {
            const stmt = body[i];
            newBody.push(stmt);
            
            // Only inject after expression statements or variable declarations
            if (injectionsLeft > 0 && 
                (t.isExpressionStatement(stmt) || t.isVariableDeclaration(stmt)) &&
                Math.random() > 0.5) {
              
              const varName = FAKE_VAR_NAMES[Math.floor(Math.random() * FAKE_VAR_NAMES.length)] + 
                              '_' + Math.random().toString(36).substring(2, 4);
              const predicate = generateAlwaysTruePredicate(varName);
              const fakeBody = FAKE_FUNCTION_BODIES[Math.floor(Math.random() * FAKE_FUNCTION_BODIES.length)]();
              
              // Add setup variable(s)
              newBody.push(...predicate.setup);
              
              // Add if(predicate) { real_next_stmt } else { fake_code }
              // Since predicate is always true, the else branch NEVER executes
              if (i + 1 < body.length) {
                const nextStmt = body[i + 1];
                newBody.push(
                  t.ifStatement(
                    predicate.test,
                    t.blockStatement([nextStmt]),
                    t.blockStatement(fakeBody)
                  )
                );
                i++; // Skip the next statement since we wrapped it
              } else {
                // At end of body, just inject a standalone guard
                newBody.push(
                  t.ifStatement(
                    t.unaryExpression('!', predicate.test),
                    t.blockStatement(fakeBody)
                  )
                );
              }
              
              injectionsLeft--;
            }
          }
          
          path.node.body = newBody;
        }
      }
    }
  };
}
