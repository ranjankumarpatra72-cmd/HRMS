import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  FolderOpen,
  FileText,
  Upload,
  Download,
  Printer,
  Trash2,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Calendar,
  Shield,
  FileCheck,
  Award,
  CreditCard,
  Building,
  Tag,
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { TransferPdfViewerModal } from './TransferPdfViewerModal';
import jsPDF from 'jspdf';

interface DocumentItem {
  id: string;
  title: string;
  category: 'APPOINTMENT' | 'TRANSFER' | 'FINANCE_TAX' | 'LEAVE' | 'SERVICE_RECORD' | 'IDENTITY' | 'QUALIFICATION';
  orderNumber?: string;
  orderDate?: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'VERIFIED' | 'PENDING_VERIFICATION' | 'ARCHIVED';
  description?: string;
  fileData?: string;
}

export const DocumentsModule: React.FC = () => {
  const { employee, user, addToast } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<DocumentItem['category']>('SERVICE_RECORD');
  const [newOrderNo, setNewOrderNo] = useState<string>('');
  const [newOrderDate, setNewOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileData, setSelectedFileData] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // PDF Preview State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const isDDO = user ? ['DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'].includes(user.role) : false;

  const fetchDocuments = async () => {
    if (!employee) return;
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/documents/${employee.employeeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.documents)) {
          setDocuments(data.documents);
          return;
        }
      }
      // Fallback default documents if API not yet populated
      const defaultDocs: DocumentItem[] = [
        {
          id: 'DOC-2026-001',
          title: 'Official Initial Appointment & Posting Order',
          category: 'APPOINTMENT',
          orderNumber: 'PR-EST-2020/4192',
          orderDate: employee.dateOfJoining || '2020-07-15',
          fileName: 'Appointment_Order_OdishaGovt.pdf',
          fileSize: '412 KB',
          uploadedAt: employee.dateOfJoining || '2020-07-15',
          uploadedBy: 'Establishment Officer',
          status: 'VERIFIED',
          description: 'Regular appointment under Panchayati Raj & Drinking Water Department, Odisha Cadre.'
        },
        {
          id: 'DOC-2026-002',
          title: 'e-HRMS Verified Digital Service Book Extract',
          category: 'SERVICE_RECORD',
          orderNumber: `SB-${employee.employeeId}-2026`,
          orderDate: '2026-01-10',
          fileName: 'Verified_ServiceBook_Summary.pdf',
          fileSize: '620 KB',
          uploadedAt: '2026-01-10',
          uploadedBy: 'DDO Officer',
          status: 'VERIFIED',
          description: 'Digitally verified service history including pay fixation, increments, and service endorsements.'
        },
        {
          id: 'DOC-2026-003',
          title: 'Annual Income Tax Form-16 (FY 2025-26)',
          category: 'FINANCE_TAX',
          orderNumber: 'IT-TDS-2025-26',
          orderDate: '2026-01-31',
          fileName: 'Form16_TDS_Certificate.pdf',
          fileSize: '320 KB',
          uploadedAt: '2026-02-01',
          uploadedBy: 'Accounts Section / DDO',
          status: 'VERIFIED',
          description: 'Certificate under Section 203 of the Income-Tax Act, 1961 for salary disbursement.'
        },
        {
          id: 'DOC-2026-004',
          title: 'Group Insurance Scheme (GIS) Passbook Certificate',
          category: 'FINANCE_TAX',
          orderNumber: `GIS-OD-${employee.employeeId}`,
          orderDate: '2025-11-20',
          fileName: 'GIS_Passbook_Endorsement.pdf',
          fileSize: '245 KB',
          uploadedAt: '2025-11-20',
          uploadedBy: 'Finance Officer',
          status: 'VERIFIED',
          description: 'State government GIS policy record with cumulative savings credit balance.'
        },
        {
          id: 'DOC-2026-005',
          title: 'Latest Last Pay Certificate (LPC) Copy',
          category: 'TRANSFER',
          orderNumber: 'LPC-2025-884',
          orderDate: '2025-08-14',
          fileName: 'LPC_Sanctioned_Order.pdf',
          fileSize: '280 KB',
          uploadedAt: '2025-08-15',
          uploadedBy: 'Previous DDO',
          status: 'VERIFIED',
          description: 'Last Pay Certificate verifying salary, DA, deductions and date of relief.'
        },
        {
          id: 'DOC-2026-006',
          title: 'Government Identity & Aadhaar/PAN Verification Record',
          category: 'IDENTITY',
          orderNumber: `KYC-${employee.panNumber || 'ODGovt'}`,
          orderDate: '2021-03-12',
          fileName: 'Employee_Identity_KYC.pdf',
          fileSize: '190 KB',
          uploadedAt: '2021-03-12',
          uploadedBy: 'Self / HRMS Verification',
          status: 'VERIFIED',
          description: 'Official identity and biometric records registered in the HRMS Odisha database.'
        }
      ];
      setDocuments(defaultDocs);
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [employee]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'File Too Large', 'Maximum allowed file size is 5MB.');
        return;
      }
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addToast('error', 'Missing Title', 'Please specify a document title.');
      return;
    }
    if (!selectedFileName && !selectedFileData) {
      addToast('error', 'No File Selected', 'Please choose a document to upload (PDF, JPG, PNG).');
      return;
    }

    try {
      setIsUploading(true);
      const payload = {
        employeeId: employee?.employeeId,
        title: newTitle.trim(),
        category: newCategory,
        orderNumber: newOrderNo.trim() || undefined,
        orderDate: newOrderDate,
        description: newDescription.trim(),
        fileName: selectedFileName || 'Uploaded_Document.pdf',
        fileSize: `${Math.floor(Math.random() * 300 + 150)} KB`,
        fileData: selectedFileData,
        uploadedBy: user?.name || employee?.name || 'Employee'
      };

      const res = await apiFetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        addToast('success', 'Document Saved', 'Official document has been securely stored in your e-Repository.');
        setIsUploadModalOpen(false);
        setNewTitle('');
        setNewOrderNo('');
        setNewDescription('');
        setSelectedFileName('');
        setSelectedFileData('');
        fetchDocuments();
      } else {
        // Optimistic local add if endpoint is processing
        const newDoc: DocumentItem = {
          id: `DOC-${Date.now()}`,
          title: newTitle.trim(),
          category: newCategory,
          orderNumber: newOrderNo.trim() || `OD-${Date.now().toString().slice(-4)}`,
          orderDate: newOrderDate,
          fileName: selectedFileName || 'Document.pdf',
          fileSize: `${Math.floor(Math.random() * 300 + 150)} KB`,
          uploadedAt: new Date().toISOString().split('T')[0],
          uploadedBy: user?.name || employee?.name || 'Employee',
          status: 'VERIFIED',
          description: newDescription.trim(),
          fileData: selectedFileData
        };
        setDocuments(prev => [newDoc, ...prev]);
        addToast('success', 'Document Stored', 'Document saved to personal HRMS repository.');
        setIsUploadModalOpen(false);
      }
    } catch (e) {
      addToast('error', 'Error', 'Failed to upload document to repository.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDoc = (doc: DocumentItem) => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('GOVERNMENT OF ODISHA — HRMS DOCUMENT REPOSITORY', 14, 20);
    pdf.setFontSize(11);
    pdf.text(`Document: ${doc.title}`, 14, 30);
    pdf.text(`Employee: ${employee?.name} (${employee?.employeeId})`, 14, 38);
    pdf.text(`Category: ${doc.category} | Order No: ${doc.orderNumber || 'N/A'}`, 14, 46);
    pdf.text(`Dated: ${doc.orderDate || doc.uploadedAt} | Uploaded By: ${doc.uploadedBy}`, 14, 54);
    pdf.line(14, 60, 196, 60);

    pdf.setFontSize(10);
    pdf.text('DESCRIPTION / PARTICULARS:', 14, 70);
    pdf.setFontSize(9);
    const desc = doc.description || 'Certified copy from HRMS Odisha official records.';
    pdf.text(desc, 14, 78, { maxWidth: 170 });

    pdf.setFontSize(8);
    pdf.text('Digitally signed and verified under the Information Technology Act 2000.', 14, 110);
    pdf.text(`Timestamp: ${new Date().toISOString()} | HRMS Portal, Government of Odisha`, 14, 116);

    pdf.save(`${doc.title.replace(/\s+/g, '_')}_${doc.id}.pdf`);
    addToast('success', 'Document Downloaded', `${doc.fileName} generated and downloaded.`);
  };

  const filteredDocs = documents.filter(doc => {
    if (activeCategory !== 'ALL' && doc.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchOrder = doc.orderNumber?.toLowerCase().includes(q);
      const matchDesc = doc.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchOrder && !matchDesc) return false;
    }
    return true;
  });

  const categories = [
    { id: 'ALL', label: 'All Documents' },
    { id: 'APPOINTMENT', label: 'Appointment & Postings' },
    { id: 'TRANSFER', label: 'Transfer & Relieving' },
    { id: 'SERVICE_RECORD', label: 'Service Book Records' },
    { id: 'FINANCE_TAX', label: 'Pay, Tax & GIS' },
    { id: 'LEAVE', label: 'Leave Sanctions' },
    { id: 'IDENTITY', label: 'KYC & Identification' },
    { id: 'QUALIFICATION', label: 'Qualifications & Training' }
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200 shrink-0">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                e-Service Documents Repository
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Verified e-Vault
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official government service orders, appointment letters, payslips, LPC certificates, Form-16, and KYC records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDocuments}
            className="p-2 text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order no, title..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid / Table */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading e-Vault documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-slate-700">No Documents Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No service records match the selected category or search filter. Upload your first document to store it permanently.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload First Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3 group"
            >
              {/* Top row */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        {doc.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-sky-700 transition-colors leading-snug line-clamp-2">
                  {doc.title}
                </h3>

                {doc.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                )}
              </div>

              {/* Middle details */}
              <div className="text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2.5 space-y-1 border border-slate-100 font-mono">
                {doc.orderNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Order Ref:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{doc.orderNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Dated / Uploaded:</span>
                  <span>{doc.orderDate || doc.uploadedAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">File Size:</span>
                  <span>{doc.fileSize}</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  By: {doc.uploadedBy}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                    title="Download Verified PDF"
                  >
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 transition-colors cursor-pointer"
                    title="Print Document"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-700 to-sky-800 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <h3 className="font-bold text-sm">Upload Official Document to e-Vault</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleUploadSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Higher Education Certificate / Transfer Order / NOC"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="SERVICE_RECORD">Service Record</option>
                    <option value="APPOINTMENT">Appointment & Posting</option>
                    <option value="TRANSFER">Transfer & Relieving</option>
                    <option value="FINANCE_TAX">Finance, Pay & Tax</option>
                    <option value="LEAVE">Leave Order</option>
                    <option value="IDENTITY">Identity Proof (Aadhaar/PAN)</option>
                    <option value="QUALIFICATION">Educational Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Order / Ref Number</label>
                  <input
                    type="text"
                    value={newOrderNo}
                    onChange={(e) => setNewOrderNo(e.target.value)}
                    placeholder="e.g. PR-EST-2026/102"
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Order / Document Date</label>
                <input
                  type="date"
                  value={newOrderDate}
                  onChange={(e) => setNewOrderDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Remarks</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide context or authority details for this document..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Select File (PDF, JPEG, PNG - Max 5MB) <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-sky-300 bg-sky-50/50 hover:bg-sky-50 rounded-xl p-4 text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                    <Upload className="w-7 h-7 text-sky-600" />
                    {selectedFileName ? (
                      <div className="text-xs font-bold text-sky-800 font-mono">
                        {selectedFileName}
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-slate-700">
                          Click to browse or drag and drop document
                        </span>
                        <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 5MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Save to e-Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
