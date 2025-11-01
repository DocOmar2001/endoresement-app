import React, { useState, useCallback } from 'react';
import { analyzeMedicalImage } from '../services/geminiService';
import { UploadCloudIcon } from './icons';
import Spinner from './Spinner';

interface ImageAnalysisPanelProps {
  imageAnalysis: string;
  setImageAnalysis: (analysis: string) => void;
}

const ImageAnalysisPanel: React.FC<ImageAnalysisPanelProps> = ({ imageAnalysis, setImageAnalysis }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageAnalysis('');
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // remove the `data:mimeType;base64,` prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    try {
      const base64Image = await fileToBase64(imageFile);
      const result = await analyzeMedicalImage(base64Image, imageFile.type);
      setImageAnalysis(result);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, setImageAnalysis]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 flex flex-col gap-4 animate-fade-in h-full">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Medical Image Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
        {/* Left Side: Upload and Preview */}
        <div className="flex flex-col gap-4">
          <label htmlFor="image-upload" className="w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            {imagePreview ? (
              <img src={imagePreview} alt="Medical scan preview" className="max-h-full max-w-full object-contain rounded-md" />
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400">
                <UploadCloudIcon />
                <p className="mt-2 font-semibold">Click to upload image</p>
                <p className="text-xs">PNG, JPG, or WEBP</p>
              </div>
            )}
          </label>
          <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFileChange} />
          <button
            onClick={handleAnalyzeClick}
            disabled={!imageFile || isLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all flex justify-center items-center"
          >
            {isLoading ? <Spinner /> : 'Analyze Image'}
          </button>
        </div>

        {/* Right Side: Analysis Result */}
        <div className="flex flex-col">
          <h3 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">AI Analysis</h3>
          <div className="flex-grow p-4 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600 overflow-y-auto">
            {isLoading && <p className="text-slate-500 dark:text-slate-400">Analyzing image, please wait...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!isLoading && !error && imageAnalysis && <p className="whitespace-pre-wrap text-sm">{imageAnalysis}</p>}
            {!isLoading && !imageAnalysis && !error && <p className="text-slate-500 dark:text-slate-400">Analysis results will appear here.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysisPanel;
