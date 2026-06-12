# JS-Obfuscator PRO

A modern, highly efficient AST-based JavaScript Obfuscation tool built with Next.js, React, and Tailwind CSS.

## Features / විශේෂාංග

*   **Secure AST Transformations**: Uses highly reliable Abstract Syntax Tree (AST) manipulation via Babel internals within `javascript-obfuscator` to restructure code logically without destroying integrity.
*   **ZIP File Support**: Upload an entire application as a `.zip` file. It unpacks, obfuscates code, and rebuilds the directory tree recursively. Extracted automatically!
*   **HTML & Inline Script Support**: Not just standalone `.js` files! Automatically scans `.html` and `.htm` files to extract `<script>` tags, obfuscates the logic, and reinjects the code inside the identical payload tag.
*   **Anti-Directory Processing**: Smart exclude rules preventing obfuscation or parsing of specific builder folders like `node_modules`, `.git`, `.next`, `dist`, and `build`.
*   **Auto-RAM Server Adjustments**: Tailors obfuscation strength to matching target hosting limitations (512MB to 4GB+). Heavy Virtual Machine execution won't crash your specific server limitations!
*   **Granular Protective Toggles**:
    *   **String Encryption**: Move strings (text keys, outputs) into encrypted base64 or RC4 encoded separate memory arrays.
    *   **Control Flow Flattening**: Disrupt structured application control flow (ifs, returns) into stateful machine transitions. 
    *   **Dead Code Injection**: Adds realistic decoy code blocks throughout the logic.
    *   **Anti-LLM Defenses & Debug Protection**: Uses Hexadecimal and mangle-shuffled renaming explicitly tuned to break AI-context generation models (ChatGPT, Gemini) while employing aggressive DevTools locking.

## Setup Instructions

1. Install module dependencies inside the application:
   ```bash
   npm install
   ```
2. Start the development server on localhost:
   ```bash
   npm run dev
   ```

## Production Architecture

*   **Frontend**: React 19 + Next.js 15
*   **Styling**: Modern Tailwind CSS v4 featuring the Custom "Elegant Dark" aesthetic theme.
*   **Obfuscation Engine**: Next.js API Routes processing the payload securely server-side using `javascript-obfuscator`.
*   **Archive Handler**: `jszip` processing blob-blobs inline.

> Note: VM execution and obfuscation processes run Server-Side via `/api/obfuscate` to ensure the frontend application stays performant. 
