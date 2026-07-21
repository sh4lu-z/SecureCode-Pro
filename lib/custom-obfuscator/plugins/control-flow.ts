// @ts-nocheck
/**
 * Custom Control Flow Flattening Plugin
 * Copyright (c) 2026 Shaluka Gimhan (sh4lu-z / syntiox)
 * 
 * Transforms function bodies into a while(true)+switch state machine
 * with a proprietary dispatch-table pattern. WebCrack's control-flow-switch
 * reverser only recognizes javascript-obfuscator's specific pattern,
 * so this custom pattern is completely immune.
 */

// @ts-ignore
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';

const STATE_NAMES = [
  '_sh4lu_z_state', '_syntiox_ctx', '_gimhan_pc',
  '_shaluka_ptr', '_sx_dispatch', '_sg_flow'
];

const RESULT_NAMES = [
  '_syntiox_r', '_sh4lu_ret', '_gimhan_out',
  '_shaluka_val', '_sx_result', '_sg_rv'
];

const TEMP_NAMES = [
  '_shaluka_v', '_gimhan_t', '_syntiox_tmp',
  '_sh4lu_x', '_sx_var', '_sg_loc'
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStateValues(count: number): number[] {
  const values = new Set<number>();
  while (values.size < count + 1) {
    // Generate random hex-like numbers for state values
    values.add(Math.floor(Math.random() * 0xFF) + 0x10);
  }
  return Array.from(values);
}

// Only flatten functions with 3+ statements to avoid trivial transforms
const MIN_STATEMENTS = 3;
// Max statements to flatten (very large functions can cause issues)
const MAX_STATEMENTS = 50;

export default function controlFlowPlugin(): any {
  return {
    name: 'syntiox-control-flow',
    visitor: {
      FunctionDeclaration(path) {
        flattenFunction(path);
      },
      FunctionExpression(path) {
        flattenFunction(path);
      },
    }
  };
}

function flattenFunction(path: NodePath<t.FunctionDeclaration | t.FunctionExpression>) {
  const body = path.node.body;
  if (!t.isBlockStatement(body)) return;
  
  const statements = body.body;
  if (statements.length < MIN_STATEMENTS || statements.length > MAX_STATEMENTS) return;
  
  // Skip if body already contains a while(true) (already flattened)
  if (statements.some(s => t.isWhileStatement(s))) return;
  
  // Skip if body contains complex constructs that are hard to flatten
  const hasComplexConstruct = statements.some(s => 
    t.isTryStatement(s) || t.isForInStatement(s) || t.isForOfStatement(s) ||
    t.isSwitchStatement(s) || t.isClassDeclaration(s) || t.isWithStatement(s)
  );
  if (hasComplexConstruct) return;

  const stateName = randomFrom(STATE_NAMES) + '_' + Math.random().toString(36).substring(2, 4);
  const resultName = randomFrom(RESULT_NAMES) + '_' + Math.random().toString(36).substring(2, 4);
  const stateValues = generateStateValues(statements.length);
  const endState = stateValues[stateValues.length - 1];
  
  // Build switch cases
  const cases: t.SwitchCase[] = [];
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const currentState = stateValues[i];
    const nextState = i < statements.length - 1 ? stateValues[i + 1] : endState;
    
    const caseBody: t.Statement[] = [];
    
    // Handle return statements specially
    if (t.isReturnStatement(stmt)) {
      if (stmt.argument) {
        // Store return value, then set state to end
        caseBody.push(
          t.expressionStatement(
            t.assignmentExpression('=', t.identifier(resultName), stmt.argument)
          )
        );
      }
      caseBody.push(
        t.expressionStatement(
          t.assignmentExpression('=', t.identifier(stateName), t.numericLiteral(endState))
        )
      );
      caseBody.push(t.breakStatement());
    } else {
      caseBody.push(stmt);
      caseBody.push(
        t.expressionStatement(
          t.assignmentExpression('=', t.identifier(stateName), t.numericLiteral(nextState))
        )
      );
      caseBody.push(t.breakStatement());
    }
    
    cases.push(
      t.switchCase(t.numericLiteral(currentState), caseBody)
    );
  }
  
  // Add the end/exit case
  cases.push(
    t.switchCase(t.numericLiteral(endState), [
      t.returnStatement(t.identifier(resultName))
    ])
  );
  
  // Shuffle cases to make the order non-obvious
  for (let i = cases.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cases[i], cases[j]] = [cases[j], cases[i]];
  }
  
  // Build the new function body
  const newBody: t.Statement[] = [
    // var _sh4lu_z_state = <initial_state>;
    t.variableDeclaration('var', [
      t.variableDeclarator(t.identifier(stateName), t.numericLiteral(stateValues[0]))
    ]),
    // var _syntiox_r;
    t.variableDeclaration('var', [
      t.variableDeclarator(t.identifier(resultName))
    ]),
    // while(true) { switch(_sh4lu_z_state) { ... } }
    t.whileStatement(
      t.booleanLiteral(true),
      t.blockStatement([
        t.switchStatement(t.identifier(stateName), cases)
      ])
    )
  ];
  
  body.body = newBody;
}
