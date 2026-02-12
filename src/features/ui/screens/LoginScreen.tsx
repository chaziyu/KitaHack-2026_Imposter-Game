import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

export const LoginScreen = () => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const login = useAuthStore(state => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (name.trim().length < 2) {
            setError('Name must be at least 2 characters');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await login(name.trim());
            // Success - useAuthStore will trigger app to show main game
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

            <div className="relative z-10 bg-gray-800/90 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl shadow-2xl p-12 max-w-md w-full mx-4">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4 animate-bounce">🌍</div>
                    <h1 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-green-400 to-purple-500 bg-clip-text text-transparent">
                        IMPOSTER GAME
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Code Green, Save the Planet
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-gray-300 mb-2">
                            Enter Your Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Player Name"
                            disabled={isLoading}
                            className="w-full px-4 py-3 bg-gray-900/50 border-2 border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                            autoComplete="off"
                            autoFocus
                        />
                        {error && (
                            <p className="mt-2 text-red-400 text-sm flex items-center gap-2">
                                <span>⚠️</span>
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || name.trim().length < 2}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">🌍</span>
                                Loading...
                            </span>
                        ) : (
                            'Start Playing'
                        )}
                    </button>
                </form>

                {/* Info */}
                <div className="mt-8 pt-8 border-t border-gray-700">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl mb-1">🎮</div>
                            <div className="text-xs text-gray-400">Fix Code</div>
                        </div>
                        <div>
                            <div className="text-2xl mb-1">🌱</div>
                            <div className="text-xs text-gray-400">Save Energy</div>
                        </div>
                        <div>
                            <div className="text-2xl mb-1">🏆</div>
                            <div className="text-xs text-gray-400">Earn Badges</div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-500 mt-6">
                        Your progress syncs across all devices
                    </p>
                </div>
            </div>
        </div>
    );
};
