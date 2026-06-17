'use client';

import { useState } from 'react';
import { TreeAnalysisResult, Language } from '../types';
import {
  Upload,
  Activity,
  FileImage,
  Layers,
  MapPin,
  Trees,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface AgroforestryAnalysisProps {
  language: Language;
}

export default function AgroforestryAnalysis({ language }: AgroforestryAnalysisProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TreeAnalysisResult | null>(null);

  // Image tab selector
  const [activeImageTab, setActiveImageTab] = useState<'overlay' | 'original'>('overlay');

  const text = {
    en: {
      title: 'Agroforestry Analysis',
      subtitle: 'Upload drone or satellite images to count trees and analyze canopy health',
      uploadTitle: 'Upload Farm Image',
      dragDropText: 'Drag and drop your image here, or click to browse',
      supportedFormats: 'Supports JPEG, PNG, WEBP (Max 20MB)',
      analyzeBtn: 'Analyze Farm Image',
      analyzing: 'Processing image & running AI analysis...',
      results: 'Analysis Results',
      totalTrees: 'Total Tree Count',
      density: 'Tree Density',
      densityVal: 'trees/acre',
      confidence: 'Confidence Score',
      canopy: 'Canopy Coverage',
      healthBreakdown: 'Canopy Health Status',
      healthy: 'Healthy',
      needsCare: 'Needs Care',
      needsReplacement: 'Needs Replacement',
      observations: 'AI Observations',
      recommendations: 'Agronomic Recommendations',
      species: 'Detected Species Guess',
      imageOverlay: 'CV Annotated Overlay',
      imageOriginal: 'Original Image',
      viewOriginal: 'View Original',
      viewOverlay: 'View Overlay',
      resetBtn: 'Analyze Another Image',
      missingFile: 'Please select an image file to analyze.',
      errorTitle: 'Analysis Failed',
      cvDetails: 'Computer Vision Details',
      resolution: 'Original Resolution',
      peaks: 'Initial Peaks Detected',
    },
    sw: {
      title: 'Uchambuzi wa Misitu ya Kilimo',
      subtitle: 'Pakia picha za ndege au satelaiti kuhesabu miti na kuchambua afya ya dari ya majani',
      uploadTitle: 'Pakia Picha ya Shamba',
      dragDropText: 'Buruta na udondoshe picha yako hapa, au bonyeza ili kuvinjari',
      supportedFormats: 'Inakubali JPEG, PNG, WEBP (Upeo wa 20MB)',
      analyzeBtn: 'Chambua Picha ya Shamba',
      analyzing: 'Inapita picha na kufanya uchambuzi wa AI...',
      results: 'Matokeo ya Uchambuzi',
      totalTrees: 'Jumla ya Idadi ya Miti',
      density: 'Uzito wa Miti',
      densityVal: 'miti/ekari',
      confidence: 'Kiwango cha Uhakika',
      canopy: 'Kufunikwa kwa Dari ya Majani',
      healthBreakdown: 'Hali ya Afya ya Miti',
      healthy: 'Mizuri / Yenye Afya',
      needsCare: 'Inahitaji Utunzaji',
      needsReplacement: 'Inahitaji Kubadilishwa',
      observations: 'Uchunguzi wa AI',
      recommendations: 'Mapendekezo ya Kilimo',
      species: 'Aina ya Mti Inayokisiwa',
      imageOverlay: 'Picha Iliyowekwa Alama (CV)',
      imageOriginal: 'Picha Halisi',
      viewOriginal: 'Angalia Picha Halisi',
      viewOverlay: 'Angalia Picha ya CV',
      resetBtn: 'Chambua Picha Nyingine',
      missingFile: 'Tafadhali chagua picha ili kuichambua.',
      errorTitle: 'Uchambuzi Umefeli',
      cvDetails: 'Maelezo ya Visual ya Kompyuta',
      resolution: 'Azimio Halisi la Picha',
      peaks: 'Miti ya Kwanza Iliyotambuliwa',
    }
  };

  const t = text[language];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t.missingFile);
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/trees/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze the image');
      }

      const data: TreeAnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-600 p-2.5 rounded-lg">
            <Trees className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 bg-white dark:bg-gray-900 min-h-[300px] ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 scale-[0.99]'
                  : file
                  ? 'border-emerald-500'
                  : 'border-gray-300 dark:border-gray-700 hover:border-emerald-500'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
              />
              
              {!file ? (
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    {t.dragDropText}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.supportedFormats}
                  </p>
                </label>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-emerald-500/10 p-4 rounded-full mb-4">
                    <FileImage className="w-10 h-10 text-emerald-600" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round(file.size / 1024 / 1024 * 100) / 100} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="mt-4 text-xs font-semibold text-red-500 hover:underline"
                  >
                    Remove File
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">{t.errorTitle}</h4>
                  <p className="text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  {t.analyzing}
                </>
              ) : (
                <>
                  <Trees className="w-5 h-5" />
                  {t.analyzeBtn}
                </>
              )}
            </button>
        </form>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Stats Header */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{t.totalTrees}</p>
                <h3 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                  {result.total_tree_count}
                </h3>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-full">
                <Trees className="w-7 h-7 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{t.density}</p>
                <h3 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">
                  {result.tree_density_per_acre}
                </h3>
                <span className="text-[10px] text-gray-400">{t.densityVal}</span>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Layers className="w-7 h-7 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{t.canopy}</p>
                <h3 className="text-3xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">
                  {result.canopy_coverage_pct}%
                </h3>
              </div>
              <div className="bg-teal-500/10 p-3 rounded-full">
                <Activity className="w-7 h-7 text-teal-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{t.confidence}</p>
                <h3 className="text-3xl font-extrabold text-purple-700 dark:text-purple-400 mt-1">
                  {Math.round(result.confidence_score * 100)}%
                </h3>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <HelpCircle className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Species and Location Card */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                {t.species}
              </p>
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                {result.tree_species_guess}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>
                {result.location}, {result.county}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual CV Image & Overlay View */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-600" />
                  Visual Output
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveImageTab('overlay')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeImageTab === 'overlay'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {t.viewOverlay}
                  </button>
                  <button
                    onClick={() => setActiveImageTab('original')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeImageTab === 'original'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {t.viewOriginal}
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-black/5 dark:bg-black/40 flex-1 min-h-[350px] flex items-center justify-center">
                <img
                  src={activeImageTab === 'overlay' ? result.overlay_image_url : result.original_image_url}
                  alt={activeImageTab === 'overlay' ? t.imageOverlay : t.imageOriginal}
                  className="max-h-[450px] object-contain w-full rounded-xl transition-all duration-300 hover:scale-[1.02]"
                />
              </div>

              {result.cv_debug && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    {t.resolution}: <span className="font-semibold text-gray-700 dark:text-gray-200">{result.cv_debug.orig_resolution}</span>
                  </div>
                  <div>
                    {t.peaks}: <span className="font-semibold text-gray-700 dark:text-gray-200">{result.cv_debug.peaks_detected}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Health Breakdown & AI Recommendations */}
            <div className="space-y-6">
              {/* Health Breakdown */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  {t.healthBreakdown}
                </h3>
                
                <div className="space-y-3">
                  {/* Healthy */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        {t.healthy}
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{result.tree_health.healthy}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(result.tree_health.healthy / result.total_tree_count) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Needs Care */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        {t.needsCare}
                      </span>
                      <span className="font-bold text-yellow-700 dark:text-yellow-400">{result.tree_health.needs_care}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                        style={{ width: `${(result.tree_health.needs_care / result.total_tree_count) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Needs Replacement */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        {t.needsReplacement}
                      </span>
                      <span className="font-bold text-red-700 dark:text-red-400">{result.tree_health.needs_replacement}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-red-50 rounded-full transition-all duration-500"
                        style={{ width: `${(result.tree_health.needs_replacement / result.total_tree_count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-900/30 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2">
                    {t.observations}
                  </h4>
                  <ul className="space-y-2">
                    {result.observations.map((obs, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2">
                        <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-emerald-200/30">
                  <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2">
                    {t.recommendations}
                  </h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2">
                        <span className="inline-block w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold rounded-xl shadow transition-all duration-300"
            >
              {t.resetBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
