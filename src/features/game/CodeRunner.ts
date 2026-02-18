interface ExecutionResult {
    success: boolean;
    output: string;
}

export const executeCode = async (language: string, sourceCode: string, expectedOutput: string): Promise<ExecutionResult> => {
    switch (language) {
        case 'javascript':
            return executeJavaScript(sourceCode, expectedOutput);
        case 'python':
            return executePythonStats(sourceCode, expectedOutput);
        case 'cpp':
            return executeCppStats(sourceCode, expectedOutput);
        default:
            return { success: false, output: `❌ Error: Unsupported language '${language}' for local execution.` };
    }
};

const executeJavaScript = async (sourceCode: string, expectedOutput: string): Promise<ExecutionResult> => {
    let outputBuffer = "";
    const originalConsoleLog = console.log;

    try {
        // Capture console.log
        console.log = (...args: any[]) => {
            outputBuffer += args.join(" ") + "\n";
        };

        // Wrap code in a function to avoid global scope pollution (mostly)
        // usage of 'new Function' is acceptable for this local game context
        const userFunction = new Function(sourceCode);
        userFunction();

        // Restore console.log
        console.log = originalConsoleLog;

        const actualOutput = outputBuffer.trim();
        const expected = expectedOutput.trim();

        if (actualOutput === expected) {
            return { success: true, output: `✅ Passed!\nOutput:\n${actualOutput}` };
        } else {
            return {
                success: false,
                output: `❌ Failed.\nExpected:\n"${expected}"\n\nActual:\n"${actualOutput}"`
            };
        }
    } catch (e: any) {
        console.log = originalConsoleLog; // Restore on error
        return { success: false, output: `❌ Runtime Error:\n${e.message}` };
    }
};

// Simulation for Python (SolarOptimizer.py)
const executePythonStats = async (sourceCode: string, expectedOutput: string): Promise<ExecutionResult> => {
    // Regex to check if they are returning a + b
    const hasCorrectReturn = /return\s+a\s*\+\s*b/.test(sourceCode);
    // Regex to check if they are printing the result
    const hasPrint = /print\s*\(\s*get_total_output\s*\(/.test(sourceCode);

    if (hasCorrectReturn && hasPrint) {
        return { success: true, output: `✅ Passed!\nOutput:\n${expectedOutput}` };
    }

    if (!hasCorrectReturn) {
        return { success: false, output: `❌ Failed.\nTip: Did you return 'a + b'?` };
    }
    if (!hasPrint) {
        return { success: false, output: `❌ Failed.\nTip: Did you 'print' the result of the function?` };
    }

    return { success: false, output: `❌ Failed.\nLogic does not seem correct.` };
};

// Simulation for C++ (O2Scrubber.cpp)
const executeCppStats = async (sourceCode: string, expectedOutput: string): Promise<ExecutionResult> => {
    // Regex to check for std::cout << "Oxy-System: ACTIVE"
    const hasPrint = /std::cout\s*<<\s*"Oxy-System:\s*ACTIVE"/.test(sourceCode);
    const hasEndl = /<<\s*std::endl/.test(sourceCode);

    if (hasPrint && hasEndl) {
        return { success: true, output: `✅ Passed!\nOutput:\n${expectedOutput}` };
    }

    return {
        success: false,
        output: `❌ Failed.\nExpected output:\n"${expectedOutput}"\n\nTip: Make sure you formatted the std::cout command exactly right!`
    };
};