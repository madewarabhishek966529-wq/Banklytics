import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileSpreadsheet, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { statementService } from '../services/statementService.js';

export default function UploadStatement() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
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

    const allowedExtensions = ['.csv', '.pdf'];
    const name = selectedFile.name.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => name.endsWith(ext));

    if (!isAllowed) {
      setError('Please select a valid CSV or PDF bank statement file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
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

    try {
      const data = await statementService.previewStatement(file);
      if (data && data.preview) {
        // Navigate to review screen with preview payload
        navigate('/review', { state: { preview: data.preview } });
      } else {
        setError('Unexpected response from parsing engine.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        'Failed to parse statement. Please check file format and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Import Bank Statement</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload a machine-readable CSV or PDF statement to extract and preview transactions.
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
            accept=".csv,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            {file ? file.name : 'Choose a statement file or drag & drop'}
          </h3>

          <p className="text-xs text-slate-500 mt-1.5 max-w-sm">
            Supported formats: <strong className="text-slate-700">CSV</strong> (with columns for Date,
            Narration, Debit/Credit) and machine-readable <strong className="text-slate-700">PDF</strong>. Max 10MB.
          </p>

          {file && (
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Selected: {(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-800">Preview & Correction Workflow</p>
            <p className="mt-0.5">
              Uploading a statement generates an interactive preview. You will have full opportunity to review,
              adjust categories, verify reconciliation totals, and discard duplicates before anything is saved.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Parsing Statement & Calculating Reconciliation...</span>
            </>
          ) : (
            <span>Proceed to Import Preview →</span>
          )}
        </button>
      </form>
    </div>
  );
}
