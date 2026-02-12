// Debug helper to test API key in browser console
export function checkGoogleAIStatus() {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;

    console.log('=== Google AI Service Debug ===');
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    console.log('API Key first 10 chars:', apiKey?.substring(0, 10) || 'N/A');
    console.log('API URL:', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent');

    if (!apiKey) {
        console.error('❌ VITE_GOOGLE_AI_API_KEY not found!');
        console.log('Make sure:');
        console.log('1. .env file has VITE_GOOGLE_AI_API_KEY=your_key');
        console.log('2. Restart dev server after adding env variables');
        return false;
    }

    console.log('✅ API Key configured correctly');
    return true;
}

declare global {
    interface Window {
        checkGoogleAI: () => boolean;
    }
}

// Call this on module load to help debug
if (typeof window !== 'undefined') {
    window.checkGoogleAI = checkGoogleAIStatus;
    console.log('💡 Run checkGoogleAI() in console to debug API key');
}
