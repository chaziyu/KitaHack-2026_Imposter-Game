import { usePlayerProgress } from '../../stores/usePlayerProgress';
import { useGlobalImpact } from '../../hooks/useGlobalImpact';
import { SDGBadgeGroup } from './components/SDGBadge';

export const PlanetDashboard = () => {
    const { totalImpact, getCompletionPercentage } = usePlayerProgress();
    const { globalImpact, loading } = useGlobalImpact();
    const percent = getCompletionPercentage();

    // Visual state based on progress
    // 0-30%: Dirty, Brown/Grey
    // 30-70%: Healing, Green/Blue returning
    // 70-100%: Thriving, glowing, satellites

    const getPlanetColor = () => {
        if (percent < 30) return '#4B4B4B'; // Grey/Dead
        if (percent < 70) return '#4A6741'; // Healing
        return '#1E88E5'; // Blue/Clean
    };

    const getAtmosphereOpacity = () => {
        // Less pollution (opacity) as percent goes up
        return Math.max(0.1, 1 - (percent / 100));
    };

    return (
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700 w-full max-w-6xl mx-auto flex flex-col gap-6">

            {/* Personal vs Global Toggle Info */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">IMPACT DASHBOARD</h2>
                    <p className="text-gray-400 text-sm">Your contribution to the global movement</p>
                </div>
                {!loading && globalImpact.totalPlayers > 0 && (
                    <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg px-4 py-2">
                        <div className="text-purple-300 text-xs font-bold uppercase">Community</div>
                        <div className="text-white text-2xl font-mono">{globalImpact.totalPlayers}</div>
                        <div className="text-purple-400 text-[10px]">Players Worldwide</div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT: Personal Progress Planet */}
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">🎮 YOUR PROGRESS</h3>

                    <div className="relative w-64 h-64 mx-auto mb-4">
                        {/* Atmosphere / Pollution Haze */}
                        <div
                            className="absolute inset-[-20px] rounded-full blur-xl transition-all duration-1000"
                            style={{
                                backgroundColor: percent < 50 ? '#3e2723' : '#4fc3f7',
                                opacity: getAtmosphereOpacity()
                            }}
                        />

                        {/* Planet Base */}
                        <div
                            className="absolute inset-0 rounded-full shadow-inner overflow-hidden transition-colors duration-1000"
                            style={{ backgroundColor: getPlanetColor() }}
                        >
                            {/* Continents */}
                            <div className="absolute top-4 left-8 w-16 h-20 bg-black/20 rounded-full blur-sm" />
                            <div className="absolute bottom-8 right-12 w-24 h-24 bg-black/20 rounded-full blur-sm" />

                            {/* Greenery - Appearing as we progress */}
                            <div
                                className="absolute inset-0 transition-opacity duration-1000"
                                style={{ opacity: percent / 100 }}
                            >
                                <div className="absolute top-4 left-8 w-16 h-20 bg-green-600/60 rounded-full blur-xs" />
                                <div className="absolute bottom-8 right-12 w-24 h-24 bg-green-500/60 rounded-full blur-xs" />
                            </div>
                        </div>

                        {/* Orbiting Elements */}
                        <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
                            {percent < 70 && (
                                <>
                                    <div className="absolute top-0 left-1/2 w-12 h-4 bg-gray-400/50 rounded-full blur-sm" />
                                    <div className="absolute bottom-4 right-1/4 w-16 h-6 bg-gray-500/50 rounded-full blur-md" />
                                </>
                            )}
                            {percent > 60 && (
                                <div className="absolute -top-4 left-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]" />
                            )}
                        </div>

                        {/* Status Text Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center drop-shadow-md">
                                <div className="text-4xl font-black text-white">{percent}%</div>
                                <div className="text-[10px] uppercase font-bold text-gray-200 tracking-widest">Complete</div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${percent === 100 ? 'bg-green-500 text-black' : 'bg-yellow-600/50 text-yellow-200'
                            }`}>
                            {percent === 100 ? '✅ MISSION COMPLETE' : '⏳ IN PROGRESS'}
                        </span>
                    </div>

                    {/* Personal Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-6">
                        <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                            <div className="text-2xl mb-1">☁️</div>
                            <div className="text-cyan-300 font-mono text-lg">{totalImpact.co2Prevented}</div>
                            <div className="text-gray-500 text-[10px]">CO₂ tons</div>
                        </div>
                        <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                            <div className="text-2xl mb-1">♻️</div>
                            <div className="text-green-300 font-mono text-lg">{totalImpact.wasteRecycled}</div>
                            <div className="text-gray-500 text-[10px]">Waste loads</div>
                        </div>
                        <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                            <div className="text-2xl mb-1">🛡️</div>
                            <div className="text-yellow-300 font-mono text-lg">
                                {totalImpact.peopleProtected > 1000000
                                    ? `${(totalImpact.peopleProtected / 1000000000).toFixed(1)}B`
                                    : totalImpact.peopleProtected}
                            </div>
                            <div className="text-gray-500 text-[10px]">Protected</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Global Community Impact */}
                <div className="bg-gray-900/50 rounded-xl p-6 border border-purple-700">
                    <h3 className="text-xl font-bold text-purple-400 mb-4">🌍 GLOBAL COMMUNITY</h3>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="animate-spin text-6xl mb-4">🌍</div>
                            <p className="text-gray-400 text-sm">Loading global impact...</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <p className="text-gray-400 text-sm mb-2">Worldwide players have achieved:</p>
                                <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
                                    <div className="text-4xl font-black text-purple-300">
                                        {globalImpact.totalChallengesCompleted}
                                    </div>
                                    <div className="text-purple-400 text-sm">Challenges Solved</div>
                                </div>
                            </div>

                            {/* Global Stats Grid */}
                            <div className="space-y-3">
                                <div className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between border border-cyan-500/30">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">☁️</span>
                                        <div>
                                            <div className="text-cyan-300 font-mono text-2xl">{globalImpact.totalCO2Prevented}</div>
                                            <div className="text-gray-400 text-xs">Total CO₂ Prevented (tons)</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-cyan-200 text-sm font-bold">
                                            ≈ {Math.round((globalImpact.totalCO2Prevented || 0) * 50)} trees
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between border border-green-500/30">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">♻️</span>
                                        <div>
                                            <div className="text-green-300 font-mono text-2xl">{globalImpact.totalWasteRecycled}</div>
                                            <div className="text-gray-400 text-xs">Total Waste Recycled (loads)</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-200 text-sm font-bold">
                                            ≈ {((globalImpact.totalWasteRecycled || 0) * 0.5).toFixed(1)}t plastic saved
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between border border-yellow-500/30">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">🛡️</span>
                                        <div>
                                            <div className="text-yellow-300 font-mono text-2xl">
                                                {globalImpact.totalPeopleProtected > 1000000000
                                                    ? `${(globalImpact.totalPeopleProtected / 1000000000).toFixed(1)}B`
                                                    : (globalImpact.totalPeopleProtected || 0).toLocaleString()}
                                            </div>
                                            <div className="text-gray-400 text-xs">People Protected</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-center text-xs text-gray-500">
                                Last updated: {new Date(globalImpact.lastUpdated).toLocaleTimeString()}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* SDG Badges */}
            <div className="bg-gray-900/50 rounded-lg p-4 flex items-center gap-4">
                <span className="text-gray-500 text-xs font-bold uppercase whitespace-nowrap">Your SDG Goals:</span>
                <SDGBadgeGroup goals={totalImpact.sdgsContributed || []} size="small" />
                {totalImpact.sdgsContributed.length === 0 && (
                    <span className="text-gray-600 text-sm italic">Complete missions to contribute to UN Goals.</span>
                )}
            </div>
        </div>
    );
};
