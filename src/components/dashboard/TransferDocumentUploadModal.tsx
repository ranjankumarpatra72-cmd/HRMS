import React, { useState } from 'react';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  FileCheck,
  Calendar,
  Layers,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { TransferRecord, TransferDocument, TransferDocumentType } from '../../types/index';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface TransferDocumentUploadModalProps {
  transfer: TransferRecord;
  initialType?: TransferDocumentType;
  onClose: () => void;
  onSuccess: (updatedTransfer: TransferRecord) => void;
}

export const TransferDocumentUploadModal: React.FC<TransferDocumentUploadModalProps> = ({
  transfer,
  initialType = 'Transfer Order',
  onClose,
  onSuccess
}) => {
  const { addToast, showProcessing, hideProcessing, user } = useAuth();

  const [documentType, setDocumentType] = useState<TransferDocumentType>(initialType);
  const [documentTitle, setDocumentTitle] = useState(
    initialType === 'Approval Order'
      ? `BDO Forwarding & Recommendation Letter – ${transfer.employeeName}`
      : `${initialType} – ${transfer.employeeName}`
  );
  const [orderNumber, setOrderNumber] = useState(
    initialType === 'Approval Order'
      ? 'LTR-BDO/2026/0412'
      : initialType === 'Transfer Order'
      ? (transfer.orderNumber || 'ORD-PRDW-2026/1185')
      : ''
  );
  const [orderDate, setOrderDate] = useState(
    transfer.orderDate || new Date().toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  // Calculate current version for selected documentType
  const existingDocsOfType = (transfer.documents || []).filter(
    (d) => d.documentType === documentType
  );
  const currentMaxVersion = existingDocsOfType.length > 0
    ? Math.max(...existingDocsOfType.map((d) => d.version || 1))
    : 0;
  const nextVersion = currentMaxVersion + 1;

  const handleTypeChange = (newType: TransferDocumentType) => {
    setDocumentType(newType);
    if (newType === 'Approval Order') {
      setDocumentTitle(`BDO Forwarding & Recommendation Letter – ${transfer.employeeName}`);
      setOrderNumber('LTR-BDO/2026/0412');
    } else {
      setDocumentTitle(`${newType} – ${transfer.employeeName}`);
      if (newType === 'Transfer Order') {
        setOrderNumber(transfer.orderNumber || 'ORD-PRDW-2026/1185');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        addToast('error', 'Invalid File Format', 'Please upload an official PDF (.pdf) document only.');
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
      const sizeKb = Math.round(file.size / 1024);
      setFileSize(`${sizeKb} KB`);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    showProcessing(`Uploading ${documentType} PDF (Version ${nextVersion})...`);
    try {
      const res = await apiFetch(`/api/transfers/${transfer.id}/documents/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          documentTitle: documentTitle.trim() || `${documentType} – ${transfer.employeeName}`,
          fileName: fileName || `${documentType.replace(/\s+/g, '_')}_v${nextVersion}.pdf`,
          fileSize: fileSize || '195 KB',
          orderNumber: orderNumber.trim() || undefined,
          orderDate: orderDate || undefined,
          remarks: remarks.trim() || undefined
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Document Uploaded', data.message || `${documentType} uploaded successfully.`);
        onSuccess(data.transfer || transfer);
        onClose();
      } else {
        addToast('error', 'Upload Failed', data.message);
      }
    } catch (err) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to upload document to server.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Upload Official Transfer Document
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Transfer Ref: {transfer.requestNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          {/* Employee Target Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-slate-700">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Target</span>
              <span className="font-bold text-slate-900">{transfer.employeeName} ({transfer.employeeId})</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination</span>
              <span className="font-bold text-teal-800">{transfer.preferredDistrict} ({transfer.preferredBlock})</span>
            </div>
          </div>

          {/* Document Type Selection */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={documentType}
              onChange={(e) => handleTypeChange(e.target.value as TransferDocumentType)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
              required
            >
              <option value="Approval Order">Approval Order</option>
              <option value="Transfer Order">Transfer Order</option>
              <option value="Relieving Order">Relieving Order</option>
              <option value="Joining Order">Joining Order</option>
              <option value="Other Supporting Document">Other Supporting Document</option>
            </select>
          </div>

          {/* Version Notice Banner */}
          {currentMaxVersion > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-amber-900">
              <Layers className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Version Control Active:</span> This transfer already has a {documentType} (v{currentMaxVersion}). Uploading now will create <strong>Version {nextVersion}</strong> as the current active document while preserving previous versions in history.
              </div>
            </div>
          )}

          {/* Document Title */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g. Official Transfer Order – Laxmi Naik"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          {/* Order Number & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                Order / Reference Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-PRDW-2026/1185"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                Order Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* PDF File Picker */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
              Select Official PDF File (.pdf) <span className="text-red-500">*</span>
            </label>
            <div className="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileText className="w-6 h-6 text-teal-600 shrink-0" />
                <div className="overflow-hidden">
                  <span className="text-slate-800 font-bold block truncate">
                    {fileName ? fileName : 'Upload signed PDF order...'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {fileSize ? `File Size: ${fileSize}` : 'Supported format: .pdf only'}
                  </span>
                </div>
              </div>

              <label className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[11px] shrink-0 cursor-pointer shadow-2xs transition-colors">
                Browse PDF
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
              Remarks / Administrative Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Issued following BDO recommendation and Directorate clearance..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload & Save Document (v{nextVersion})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
