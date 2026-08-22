import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { Student } from '../types';

interface DataImportWidgetProps {
  onImportStudents: (newStudents: Student[]) => void;
  existingCount: number;
}

export default function DataImportWidget({ onImportStudents, existingCount }: DataImportWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setError(null);
    setSuccessCount(null);

    if (!file.name.endsWith('.json')) {
      setError('Please upload a valid .json file containing student profile data.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        
        // Ensure it's an array or single object
        const items = Array.isArray(parsed) ? parsed : [parsed];
        
        if (items.length === 0) {
          setError('The imported data list is empty.');
          return;
        }

        // Basic validation of fields
        const validated: Student[] = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.name || !item.email || !item.major) {
            setError(`Validation Error (Item ${i + 1}): "name", "email", and "major" are required fields.`);
            return;
          }

          // Construct valid Student object with fallbacks
          validated.push({
            id: item.id || `uploaded-student-${Math.random().toString(36).substring(2, 9)}`,
            name: String(item.name),
            email: String(item.email),
            major: String(item.major),
            courses: Array.isArray(item.courses) ? item.courses.map(String) : ["CS 101: Introduction to Computer Science"],
            studyStyle: ['Quiet Focus', 'Discussion-based', 'Active Recall', 'Problem Solving'].includes(item.studyStyle)
              ? item.studyStyle
              : 'Quiet Focus',
            locationPreference: ['Virtual', 'In-person', 'Hybrid'].includes(item.locationPreference)
              ? item.locationPreference
              : 'Hybrid',
            availability: Array.isArray(item.availability) ? item.availability.map(String) : ["Mon Morning", "Wed Afternoon"],
            bio: item.bio ? String(item.bio) : "Looking for a proactive study partner to review course material together on campus.",
            isCurrentlyFree: typeof item.isCurrentlyFree === 'boolean' ? item.isCurrentlyFree : Math.random() > 0.4,
            avatarSeed: item.avatarSeed ? String(item.avatarSeed) : String(item.name).split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
          });
        }

        onImportStudents(validated);
        setSuccessCount(validated.length);
      } catch (err) {
        setError('Failed to parse JSON file. Ensure your file format is structured correctly.');
      }
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6" id="data-import-container">
      <div className="border-b border-slate-100 pb-4" id="import-header">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 flex items-center gap-2">
          <Upload className="w-4 h-4 text-slate-900" />
          Import Peer Student Data
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Dynamically populate the matching deck by uploading custom peer profiles. Currently hosting <strong className="font-bold text-slate-900">{existingCount}</strong> simulated campus students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="import-grid">
        {/* Upload Zone */}
        <div className="lg:col-span-7" id="upload-zone-wrapper">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
            id="import-file-input"
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-slate-950 bg-slate-50/60 scale-[0.99]'
                : 'border-slate-200 hover:border-slate-400 bg-white'
            }`}
            id="import-drag-drop-zone"
          >
            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <span className="font-bold text-slate-900 text-xs block">Drag and drop your JSON file here</span>
            <span className="text-[11px] text-slate-500 block mt-1">or click to browse local files</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mt-3">Supports only .json files</span>
          </div>

          {/* Feedback states */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-900 text-xs font-semibold flex items-start gap-2.5" id="import-error-msg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900 text-xs font-semibold flex items-start gap-2.5" id="import-success-msg">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Successfully imported <strong className="font-bold">{successCount}</strong> custom study buddies! Go to the Discovery Deck to match with them.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
