import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { search } from '../services/api';

interface SearchResult {
    id: string;
    video_id: string;
    video_title: string;
    text: string;
    start_time: number;
    end_time: number;
    confidence: number;
}

interface SearchResults {
    query: string;
    results: SearchResult[];
    total: number;
    processing_time: number;
}

const VideoSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSearch = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!query.trim()) {
            setError('请输入搜索关键词');
            return;
        }

        try {
            setSearching(true);
            setError(null);
            
            // 执行搜索
            const searchResults = await search.searchTranscripts(query);
            setResults(searchResults);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : '搜索失败，请重试');
        } finally {
            setSearching(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleResultClick = (videoId: string, startTime: number) => {
        navigate(`/videos/${videoId}?t=${startTime}`);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <form onSubmit={handleSearch} className="mb-8">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="输入要搜索的台词..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={searching}
                    />
                    <button
                        type="submit"
                        disabled={searching}
                        className={`px-6 py-2 rounded-md text-white font-medium ${
                            searching
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {searching ? '搜索中...' : '搜索'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="text-red-500 text-sm mb-4">
                    {error}
                </div>
            )}

            {results && (
                <div className="space-y-4">
                    <div className="text-sm text-gray-500">
                        找到 {results.total} 个结果，用时 {results.processing_time.toFixed(2)} 秒
                    </div>

                    {results.results.map((result) => (
                        <div
                            key={result.id}
                            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleResultClick(result.video_id, result.start_time)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-lg">
                                    {result.video_title}
                                </h3>
                                <span className="text-sm text-gray-500">
                                    {formatTime(result.start_time)} - {formatTime(result.end_time)}
                                </span>
                            </div>
                            <p className="text-gray-700">{result.text}</p>
                            <div className="mt-2 text-sm text-gray-500">
                                置信度: {(result.confidence * 100).toFixed(1)}%
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VideoSearch; 