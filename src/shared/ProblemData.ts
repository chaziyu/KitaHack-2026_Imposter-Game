export interface CodingChallenge {
    name: string;
    language: 'python' | 'javascript' | 'cpp';

    // Environmental & SDG Context
    sdgGoals: number[];
    environmentalImpact: string;
    storyContext: string;
    realWorldConnection: string;
    failureConsequence: string; // NEW: What happens if you fail/write inefficient code?
    successReward: string;      // NEW: The specific positive outcome of your fix

    // Educational Content
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    concepts: string[];
    description: string;
    detailedInstructions: string;

    // Code Content
    content: string;
    expectedOutput: string;
    solutionCode: string; // NEW: Required for Green Coder Analysis
    testStatus: 'PENDING' | 'PASS' | 'FAIL';
    isCorrupted?: boolean;

    // Hints (progressive)
    hints: string[];
}

export const LEVEL_1_PROBLEMS: Record<string, CodingChallenge> = {
    "file_sum": {
        name: "SolarOptimizer.py",
        language: "python",
        difficulty: "beginner",
        concepts: ["variables", "addition", "print"],

        // SDG & Environmental Context
        sdgGoals: [7, 13],
        environmentalImpact: "Every solar panel we optimize prevents 2 tons of CO₂ emissions per year!",
        storyContext: "🌅 A remote village needs 15 units of electricity to power their school and clinic. You have 2 solar panel arrays: one generates 5 units, another generates 10 units. Can you calculate if they have enough clean energy?",
        realWorldConnection: "Real solar engineers write code like this every day to plan renewable energy systems that reduce pollution and fight climate change!",
        failureConsequence: "⚠️ CRITICAL: If this calculation is wrong, the village clinic will lose power tonight.",
        successReward: "🎉 VICTORY: You've confirmed 15 units of clean energy! The clinic lights are ON.",

        // Challenge Content
        description: "Help the village! Calculate total solar energy from two arrays.",
        detailedInstructions: `🎯 Your Mission:
1. Look at the two variables: 'a' has 5 units, 'b' has 10 units
2. Add them together to get the total energy
3. Print the result to see if the village has enough power (they need 15!)

💡 Think: What do you do when you want to combine two numbers?`,

        content: `def get_total_output(a, b):
    # TODO: Return the total energy by adding a and b together
    return  # ← Write your answer here!

a = 5  # First solar array
b = 10  # Second solar array

# TODO: Call the function and print the result
# This will tell us if the village has enough power!
`,
        expectedOutput: "15",
        solutionCode: `def get_total_output(a, b):
    return a + b

a = 5
b = 10
print(get_total_output(a, b))`,
        testStatus: "FAIL",

        hints: [
            "🌟 Gentle Hint: When you have two numbers and want to know their total, you use the '+' sign to add them. Try returning a + b!",
            "💡 Specific Hint: Your function should return a + b. Then, call the function like this: result = get_total_output(a, b) and print(result) to show the answer!",
            "✅ Solution: Replace 'return' with 'return a + b', then add these lines:\nresult = get_total_output(a, b)\nprint(result)\n\nThis adds 5 + 10 = 15 units of clean solar energy!"
        ]
    },

    "file_loop": {
        name: "RecycleSorter.js",
        language: "javascript",
        difficulty: "beginner",
        concepts: ["loops", "for", "console.log"],

        // SDG & Environmental Context
        sdgGoals: [12],
        environmentalImpact: "Automated recycling reduces landfill waste by 75% and saves thousands of trees!",
        storyContext: "♻️ Your city's recycling plant needs help! 5 trucks full of recyclable materials just arrived (numbered 0 to 4). You need to program the sorting robot to check each truck one by one. If you don't, the materials go to the landfill!",
        realWorldConnection: "Modern recycling facilities use robotic systems programmed with loops just like this to automatically sort millions of items every day, keeping plastic out of oceans and reducing pollution!",
        failureConsequence: "⚠️ CRITICAL: Inefficient sorting will cause the robots to jam, sending 5 tons of plastic to the ocean.",
        successReward: "🎉 VICTORY: All 5 trucks sorted perfectly! That's 10,000 plastic bottles saved from the ocean.",

        // Challenge Content
        description: "Program the robot to check all 5 recycling trucks (indices 0-4).",
        detailedInstructions: `🎯 Your Mission:
1. Create a loop that runs 5 times (from 0 to 4)
2. Each time the loop runs, print the truck number
3. This tells the robot to process each truck in order!

💡 Think: How can you make the computer do something multiple times automatically?`,

        content: `// TODO: Write a loop to process trucks 0, 1, 2, 3, 4
// Hint: Use a 'for' loop that starts at 0 and goes up to (but not including) 5
// Each time, print the value of 'i' to show which truck is being sorted

// Your code here:

`,
        expectedOutput: "0\n1\n2\n3\n4",
        solutionCode: `for (let i = 0; i < 5; i++) {
    console.log(i);
}`,
        testStatus: "FAIL",

        hints: [
            "🌟 Gentle Hint: A 'for' loop can repeat code multiple times! Start with: for (let i = 0; i < 5; i++). Inside the loop, use console.log(i) to print each number.",
            "💡 Specific Hint: Write this code:\nfor (let i = 0; i < 5; i++) {\n    console.log(i);\n}\n\nThis loop runs 5 times, printing 0, then 1, then 2, then 3, then 4!",
            "✅ Solution:\nfor (let i = 0; i < 5; i++) {\n    console.log(i);\n}\n\nExplanation:\n- 'let i = 0' starts at truck 0\n- 'i < 5' means keep going while i is less than 5\n- 'i++' moves to the next truck\n- 'console.log(i)' tells the robot which truck to process!"
        ]
    },

    "file_cpp_hello": {
        name: "O2Scrubber.cpp",
        language: "cpp",
        difficulty: "beginner",
        concepts: ["output", "cout", "strings"],

        // SDG & Environmental Context
        sdgGoals: [13, 3],
        environmentalImpact: "Air quality monitors protect 1 billion people from harmful pollution every day!",
        storyContext: "💨 Earth's atmosphere is in danger! You're activating an oxygen monitoring system that tracks air quality. The system needs to announce when it's online by printing 'Oxy-System: ACTIVE'. This helps scientists know the pollution sensors are working!",
        realWorldConnection: "Real environmental scientists use air quality monitoring systems with code like this to detect pollution, warn communities about unhealthy air, and track climate change!",
        failureConsequence: "⚠️ CRITICAL: If the sensors don't activate, we won't detect the toxic smog wave approaching the city.",
        successReward: "🎉 VICTORY: System ACTIVE! Early warning network is live, protecting 1 million citizens.",

        // Challenge Content
        description: "Activate the oxygen monitoring system by printing the status message.",
        detailedInstructions: `🎯 Your Mission:
1. Use 'std::cout' to print text to the screen
2. Print exactly: "Oxy-System: ACTIVE"
3. End with 'std::endl' to go to a new line

💡 Think: How do you tell the computer to show text on the screen in C++?`,

        content: `#include <iostream>

int main() {
    // TODO: Print "Oxy-System: ACTIVE" to activate the air quality monitor
    // Use: std::cout << "your message here" << std::endl;
    
    // Your code here:
    
    return 0;
}`,
        expectedOutput: "Oxy-System: ACTIVE",
        solutionCode: `#include <iostream>

int main() {
    std::cout << "Oxy-System: ACTIVE" << std::endl;
    return 0;
}`,
        testStatus: "FAIL",

        hints: [
            "🌟 Gentle Hint: In C++, use std::cout to print text. Put your message in quotes like this: std::cout << \"Oxy-System: ACTIVE\" << std::endl;",
            "💡 Specific Hint: Write this line before 'return 0':\nstd::cout << \"Oxy-System: ACTIVE\" << std::endl;\n\nThis prints the activation message!",
            "✅ Solution:\nstd::cout << \"Oxy-System: ACTIVE\" << std::endl;\n\nExplanation:\n- std::cout is C++'s way to print\n- << \"Oxy-System: ACTIVE\" is the message\n- << std::endl; ends the line\n\nNow the oxygen sensors are online, protecting our air!"
        ]
    }
};