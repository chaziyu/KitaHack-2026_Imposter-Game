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
    // Regex to check if they are returning a + b (allows spaces and optional parens)
    // Matches: "return a + b", "return(a+b)", "return a+b"
    const hasCorrectReturn = /return\s*\(?\s*a\s*\+\s*b\s*\)?/.test(sourceCode);

    // Check if function is called AND result is printed (flexible order)
    const hasFunctionCall = /get_total_output\s*\(/.test(sourceCode);
    const hasPrint = /print\s*\(/.test(sourceCode);

    if (hasCorrectReturn && hasFunctionCall && hasPrint) {
        return { success: true, output: `✅ Passed!\nOutput:\n${expectedOutput}` };
    }

    // Debugging logs
    console.log("Python Check Failed:", { hasCorrectReturn, hasFunctionCall, hasPrint, sourceCode });

    if (!hasCorrectReturn) {
        return { success: false, output: `❌ Failed.\nTip: Did you return 'a + b'?` };
    }
    if (!hasFunctionCall) {
        return { success: false, output: `❌ Failed.\nTip: You need to call 'get_total_output(a, b)'.` };
    }
    if (!hasPrint) {
        return { success: false, output: `❌ Failed.\nTip: You need to 'print()' the result.` };
    }

    return { success: false, output: `❌ Failed.\nLogic does not seem correct.` };
};

// Simulation for C++ (O2Scrubber.cpp)
const executeCppStats = async (sourceCode: string, expectedOutput: string): Promise<ExecutionResult> => {
    // Regex to check for std::cout << "Oxy-System: ACTIVE"
    // Allows flexible spacing around << and within the string if needed (though string usually strict)
    const hasPrint = /std::cout\s*<<\s*"Oxy-System:\s*ACTIVE"/.test(sourceCode);
    const hasEndl = /<<\s*std::endl/.test(sourceCode);

    if (hasPrint && hasEndl) {
        return { success: true, output: `✅ Passed!\nOutput:\n${expectedOutput}` };
    }

    console.log("CPP Check Failed:", { hasPrint, hasEndl, sourceCode });

    return {
        success: false,
        output: `❌ Failed.\nExpected output:\n"${expectedOutput}"\n\nTip: Make sure you formatted the std::cout command exactly right!`
    };
};