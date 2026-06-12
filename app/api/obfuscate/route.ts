import { NextResponse } from 'next/server';
import JavaScriptObfuscator from 'javascript-obfuscator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, options } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ obfuscatedCode: '' });
    }

    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, options || {});
    return NextResponse.json({ obfuscatedCode: obfuscationResult.getObfuscatedCode() });
  } catch (error: any) {
    console.error('Obfuscation Error:', error);
    return NextResponse.json({ error: error.message || 'Obfuscation failed' }, { status: 500 });
  }
}
