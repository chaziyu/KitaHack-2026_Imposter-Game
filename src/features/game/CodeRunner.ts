interface ExecutionResult {
    success: boolean;
    output: string;
}

export const executeCode = async (language: string, sourceCode: string, expectedOutput: string): Promise<ExecutionResult> => {

    // 1. Prepare payload for Piston API
    // We use version 3.10.0 for Python, 18.15.0 for Node, etc.
    const payload = {
        language: language,
        version: "*", // Use latest available
        files: [
            {
                content: sourceCode
            }
        ]
    };

    try {
        // 2. Call the free Piston API (proxied via /api/piston to avoid CORS)
        const response = await fetch('/api/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 3. Check for missing run field (compile error or API issue)
        if (!data.run) {
            return { success: false, output: `❌ Compiler Error:\n${data.compile?.stderr || 'No output from compiler.'}` };
        }

        // 4. Check for Runtime Errors
        if (data.run.stderr) {
            return { success: false, output: `❌ Error:\n${data.run.stderr}` };
        }

        // 5. Compare Output (Trim whitespace to be safe)
        const actualOutput = data.run.stdout.trim();
        const expected = expectedOutput.trim();

        if (actualOutput === expected) {
            return { success: true, output: `✅ Passed!\nOutput: ${actualOutput}` };
        } else {
            return {
                success: false,
                output: `❌ Failed.\nExpected: "${expected}"\nActual: "${actualOutput}"`
            };
        }

    } catch (e) {
        return { success: false, output: "❌ Network Error: Could not reach compiler." };
    }
};