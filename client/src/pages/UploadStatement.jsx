import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileSpreadsheet, FileText, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { statementService } from '../services/statementService.js';

const PROCESSING_STAGES = [
  'Uploading document',
  'Validating file structure & signatures',
  'Detecting bank/statement format',
  'Extracting transaction data',
  'Running OCR if required',
  'Normalizing transactions to integer paise',
  'Detecting duplicate statements & fingerprints',
  'Categorizing & identifying merchants',
  'Validating financial balance calculations',
  'Generating intelligence & anomaly alerts',
  'Preparing final preview report',
];

export default function UploadStatement() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const allowedExtensions = ['.csv', '.pdf', '.xlsx', '.xls', '.png', '.jpg', '.jpeg'];
    const name = selectedFile.name.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => name.endsWith(ext));

    if (!isAllowed) {
      setError('Please select a valid PDF, CSV, Excel (.xlsx, .xls), or scanned statement file.');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleProcessPreview = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setCurrentStage(0);

    // Simulate real pipeline progression across the 11 processing stages
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < PROCESSING_STAGES.length - 2) return prev + 1;
        return prev;
      });
    }, 280);

    try {
      const data = await statementService.previewStatement(file);
      clearInterval(stageInterval);
      setCurrentStage(PROCESSING_STAGES.length - 1);

      setTimeout(() => {
        if (data && data.preview) {
          navigate('/review', { state: { preview: data.preview } });
        } else {
          setError('Unexpected response from parsing engine.');
          setLoading(false);
        }
      }, 400);
    } catch (err) {
      clearInterval(stageInterval);
      const msg =
        err.response?.data?.error?.message ||
        'Failed to parse statement. Please check file format and try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Import Bank Statement</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload bank statements and UPI records in PDF, CSV, or Excel (.xlsx/.xls) formats.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-950">Import Failed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Processing Bank Statement</h3>
            <p className="text-xs text-slate-500">
              Running deterministic extraction, OCR, normalization, and balance reconciliation.
            </p>
          </div>

          {/* 11-Stage Processing Stepper */}
          <div className="space-y-2.5 max-w-lg mx-auto bg-slate-50 p-5 rounded-xl border border-slate-200/80">
            {PROCESSING_STAGES.map((stageName, idx) => {
              const isDone = idx < currentStage;
              const isCurrent = idx === currentStage;
              return (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                  )}
                  <span
                    className={`truncate ${
                      isDone
                        ? 'text-slate-500 font-medium'
                        : isCurrent
                        ? 'text-brand-700 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    Stage {idx + 1}: {stageName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={handleProcessPreview} className="space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition flex flex-col items-center justify-center cursor-pointer ${
              dragActive
                ? 'border-brand-500 bg-brand-50/50'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".csv,.pdf,.xlsx,.xls,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {file ? file.name : 'Choose a statement file or drag & drop'}
            </h3>

            <p className="text-xs text-slate-500 mt-1.5 max-w-md">
              Supported formats: <strong className="text-slate-700">PDF</strong>, <strong className="text-slate-700">CSV</strong>, <strong className="text-slate-700">Excel (.xlsx, .xls)</strong>, and scanned images. Max 25MB.
            </p>

            {file && (
              <div className="mt-4 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Selected: {(file.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">Local Processing & Financial Privacy</p>
              <p className="mt-0.5">
                All statement data is parsed locally on your machine. No documents or financial records are sent to external cloud APIs or third parties.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!file}
            className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Proceed to 11-Stage Extraction & Preview →</span>
          </button>
        </form>
      )}
    </div>
  );
}
