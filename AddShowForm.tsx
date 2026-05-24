import React, { useState } from 'react';
import { Plus, X, Globe, Tv } from 'lucide-react';
import { extractShowNameFromUrl, generateId, generateEpisodes } from '../utils';
import type { Show } from '../types';

interface AddShowFormProps {
  onAdd: (show: Show) => void;
  existingColors: string[];
  onCancel: () => void;
}

const AddShowForm: React.FC<AddShowFormProps> = ({ onAdd, existingColors, onCancel }) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [numSeasons, setNumSeasons] = useState(1);
  const [episodesPerSeason, setEpisodesPerSeason] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleUrlBlur = () => {
    if (!name && url.trim()) {
      const suggested = extractShowNameFromUrl(url);
      if (suggested) setName(suggested);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const color = existingColors.length > 0
      ? existingColors[Math.floor(Math.random() * existingColors.length)]
      : '#3b82f6';

    const episodes = generateEpisodes(name.trim(), numSeasons, episodesPerSeason);

    const newShow: Show = {
      id: generateId(),
      name: name.trim(),
      url: url.trim(),
      color,
      episodes,
    };

    onAdd(newShow);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Add a Show</h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Show URL <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://www.netflix.com/title/80057281"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Show Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Stranger Things"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
          >
            <Tv className="w-3.5 h-3.5" />
            {showAdvanced ? 'Hide' : 'Show'} episode settings
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Seasons
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={numSeasons}
                  onChange={(e) => setNumSeasons(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Episodes per Season
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={episodesPerSeason}
                  onChange={(e) => setEpisodesPerSeason(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {name.trim() && (
            <div className="bg-gray-800/50 rounded-xl p-3 text-sm text-gray-400 border border-gray-700/50">
              <span className="text-violet-400 font-medium">{name.trim()}</span>
              {' '}&mdash;{' '}
              {numSeasons} season{numSeasons !== 1 ? 's' : ''} × {episodesPerSeason} episode{episodesPerSeason !== 1 ? 's' : ''}
              {' '}= <span className="text-white font-medium">{numSeasons * episodesPerSeason} total episodes</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
            >
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add Show
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShowForm;
