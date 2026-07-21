import { NextResponse } from 'next/server';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { applyCustomObfuscation, type CustomObfuscationOptions } from '@/lib/custom-obfuscator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, options, customPlugins } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ obfuscatedCode: '' });
    }

    // Step 1: Apply standard javascript-obfuscator
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, options || {});
    let result = obfuscationResult.getObfuscatedCode();

    // Step 2: Apply custom Babel-based obfuscation (if any plugins are enabled)
    if (customPlugins && typeof customPlugins === 'object') {
      const customOptions: CustomObfuscationOptions = {
        stringEncryption: !!customPlugins.stringEncryption,
        controlFlow: !!customPlugins.controlFlow,
        opaquePredicates: !!customPlugins.opaquePredicates,
        integrityCheck: !!customPlugins.integrityCheck,
        llmPoisoning: !!customPlugins.llmPoisoning,
      };
      
      result = applyCustomObfuscation(result, customOptions);
    }

    return NextResponse.json({ obfuscatedCode: result });
  } catch (error: any) {
    console.error('Obfuscation Error:', error);
    return NextResponse.json({ error: error.message || 'Obfuscation failed' }, { status: 500 });
  }
}
