import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Activity, Calendar } from 'lucide-react';

export function HistoryPage() {
    const { token } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchHistory();
        }
    }, [token]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container p-8 max-w-6xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Clock className="text-tum-blue" size={32} />
                        Activity History
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        A log of your interactions with the simulator.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tum-blue"></div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-16">
                        <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-xl text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 w-1/4">Configuration</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 w-1/4">Results</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 w-1/4">Details</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 w-1/4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {history.map((item) => {
                                    let parsedDetails = null;
                                    let isJson = false;
                                    try {
                                        parsedDetails = JSON.parse(item.details);
                                        if (parsedDetails && typeof parsedDetails === 'object' && parsedDetails.config) {
                                            isJson = true;
                                        }
                                    } catch (e) {
                                        // Not JSON
                                    }

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-4 align-top">
                                                {isJson ? (
                                                    <div className="text-sm space-y-1">
                                                        <div className="font-medium text-gray-900 dark:text-white">Cache: {parsedDetails.config.cacheSize}B</div>
                                                        <div className="text-gray-500">Block: {parsedDetails.config.blockSize}B</div>
                                                        <div className="text-gray-500">Assoc: {parsedDetails.config.associativity}-way</div>
                                                        <div className="text-gray-500">Policy: {parsedDetails.config.replacementPolicy}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">N/A</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                {isJson ? (
                                                    <div className="text-sm space-y-1">
                                                        <div className="font-bold text-green-600 dark:text-green-400">Hit Rate: {parsedDetails.results.hitRate}</div>
                                                        <div className="text-gray-600 dark:text-gray-300">Hits: {parsedDetails.results.hits}</div>
                                                        <div className="text-gray-600 dark:text-gray-300">Misses: {parsedDetails.results.misses}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">N/A</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium text-gray-900 dark:text-white">{item.action}</span>
                                                    {!isJson && (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.details}</span>
                                                    )}
                                                    {isJson && (
                                                        <span className="text-xs text-gray-400">{parsedDetails.results.instructions} Instructions</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top text-gray-500 dark:text-gray-400 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
