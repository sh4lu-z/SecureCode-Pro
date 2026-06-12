import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SecureCode Pro | Advanced JS Obfuscator',
  description: 'Professional grade JavaScript obfuscator with Anti-LLM protection, copyright metadata injection, and advanced anti-deobfuscation techniques to protect your intellectual property.',
  authors: [{ name: 'Shaluka Gimhan' }],
  keywords: ['obfuscator', 'javascript protection', 'anti-deobfuscation', 'anti-llm', 'code security', 'drm'],
  openGraph: {
    title: 'SecureCode Pro | Advanced JS Obfuscator',
    description: 'Professional grade JavaScript obfuscator with Anti-LLM protection and copyright metadata injection.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecureCode Pro | Advanced JS Obfuscator',
    description: 'Protect your JavaScript from theft and AI-assisted reverse engineering.',
  }
};

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>{children}</body>
    </html>
  );
}
