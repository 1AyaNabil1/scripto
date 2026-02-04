import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Settings, Loader2 } from 'lucide-react';
import SEO from '../common/SEO';
import type { GenerationRequest, StoryInputProps } from '../../types';

const StoryInput: React.FC<StoryInputProps> = ({ onGenerate, isLoading, disabled = false }) => {
  const [prompt, setPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [genre, setGenre] = useState('');
  const [visualStyle, setVisualStyle] = useState('');
  const [mood, setMood] = useState('');
  const [frameCount, setFrameCount] = useState(3);
  const [cameraAngles, setCameraAngles] = useState<string[]>(['Medium Shot']);
  const [includeDialogue, setIncludeDialogue] = useState(true);
  const [includeActionNotes, setIncludeActionNotes] = useState(true);

  const genres = ['Action', 'Drama', 'Comedy', 'Horror', 'Sci-Fi', 'Fantasy', 'Romance', 'Thriller'];
  const visualStyles = ['Realistic', 'Cartoon', 'Anime', 'Comic Book', 'Cinematic', 'Minimalist'];
  const moods = ['Dark', 'Bright', 'Mysterious', 'Energetic', 'Calm', 'Intense', 'Whimsical'];
  const availableCameraAngles = ['Wide Shot', 'Close-up', 'Medium Shot', 'Bird\'s Eye', 'Low Angle', 'High Angle'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      return;
    }

    const request: GenerationRequest = {
      prompt: prompt.trim(),
      genre: genre || undefined,
      visualStyle: visualStyle || undefined,
      mood: mood || undefined,
      frameCount,
      cameraAngles,
      includeDialogue,
      includeActionNotes,
    };

    onGenerate(request);
  };

  const handleCameraAngleToggle = (angle: string) => {
    setCameraAngles(prev => 
      prev.includes(angle)
        ? prev.filter(a => a !== angle)
        : [...prev, angle]
    );
  };

  return (
    <>
      <SEO 
        title="AI Storyboard Weaver - Create Professional Storyboards with AI"
        description="Transform your stories into visual narratives using AI. Generate professional storyboards with multiple art styles, camera angles, and export options. Perfect for filmmakers and content creators."
        keywords="Scripto, AI storyboard generator, visual storytelling, storyboard creation, AI art generation, film pre-production, animation planning"
        url="https://Scripto.ashraf.zone/"
        canonical="https://Scripto.ashraf.zone/"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          Scripto - AI Storyboard Weaver
        </h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
          Transform your stories into visual narratives. Describe your story and watch it come to life 
          as a professional storyboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        {/* Story Input */}
        <div className="mb-6">
          <label htmlFor="story" className="block text-sm font-medium text-neutral-700 mb-2">
            Your Story
          </label>
          <textarea
            id="story"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Once upon a time, in a world where magic and technology coexisted, a young inventor discovered an ancient artifact that would change everything..."
            className="w-full h-32 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all duration-200"
            required
          />
          <p className="text-sm text-neutral-500 mt-2">
            {prompt.length}/2000 characters
          </p>
        </div>

        {/* Style Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select genre...</option>
              {genres.map(genreOption => (
                <option key={genreOption} value={genreOption}>{genreOption}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Visual Style</label>
            <select
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select style...</option>
              {visualStyles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select mood...</option>
              {moods.map(moodOption => (
                <option key={moodOption} value={moodOption}>{moodOption}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Frame Count */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Number of Frames: {frameCount}
          </label>
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tip:</strong> For best results on your first try, use 2 frames or less. 
              Higher frame counts may cause timeout errors due to processing limits.
            </p>
          </div>
          <input
            type="range"
            min="2"
            max="6"
            value={frameCount}
            onChange={(e) => setFrameCount(parseInt(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>2 frames</span>
            <span>6 frames</span>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-primary-orange hover:text-primary-blue transition-colors duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced Options
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-2"
            >
              ↓
            </motion.div>
          </button>
        </div>

        {/* Advanced Options Panel */}
        <motion.div
          initial={false}
          animate={{ height: showAdvanced ? 'auto' : 0, opacity: showAdvanced ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="border-t border-neutral-200 pt-6 mb-6">
            {/* Camera Angles */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Preferred Camera Angles
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCameraAngles.map(angle => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => handleCameraAngleToggle(angle)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                      cameraAngles.includes(angle)
                        ? 'text-white'
                        : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                    }`}
                    style={cameraAngles.includes(angle) ? {
                      backgroundImage: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
                    } : {}}
                  >
                    {angle}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeDialogue}
                  onChange={(e) => setIncludeDialogue(e.target.checked)}
                  className="mr-2 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                Include dialogue suggestions
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeActionNotes}
                  onChange={(e) => setIncludeActionNotes(e.target.checked)}
                  className="mr-2 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                Include action notes
              </label>
            </div>
          </div>
        </motion.div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <motion.button
            type="submit"
            disabled={isLoading || !prompt.trim() || disabled}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: (isLoading || disabled) ? 1 : 1.05 }}
            whileTap={{ scale: (isLoading || disabled) ? 1 : 0.95 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Storyboard...</span>
              </>
            ) : disabled ? (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Please complete setup to generate</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Generate Storyboard</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
    </>
  );
};

export default StoryInput;
