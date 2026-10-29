import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  CommunicationItem,
  CommunicationAttachment,
  CommunicationType,
  CommunicationPriority,
  CommunicationStatus,
  CommunicationAudience,
  Employee,
  TargetEmployeeSummary
} from '../../types/index';
import {
  Bell,
  Mail,
  Send,
  FileText,
  Paperclip,
  Download,
  Eye,
  Check,
  CheckCheck,
  CheckCircle,
  Clock,
  User,
  Building,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  Printer,
  Sparkles,
  ArrowRight,
  X,
  Share2,
  Calendar,
  Layers,
  Upload,
  UserCheck,
  Users,
  FileCheck,
  AlertCircle,
  FileUp,
  History
} from 'lucide-react';
import { OdishaSealLogo } from '../login/OdishaSealLogo';
import { CommunicationPdfViewerModal } from './CommunicationPdfViewerModal';
import { downloadCommunicationPdfFile } from '../../utils/communicationPdfGenerator';

interface CommunicationModuleProps {
  onNavigateTab?: (tab: string) => void;
}

export const CommunicationModule: React.FC<CommunicationModuleProps> = ({ onNavigateTab }) => {
  const { user, employee, addToast, showProcessing, hideProcessing } = useAuth();
  const [communications, setCommunications] = useState<CommunicationItem[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedReadFilter, setSelectedReadFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [adminViewTab, setAdminViewTab] = useState<'ALL_NOTICES' | 'SENT_HISTORY'>('ALL_NOTICES');

  // Selected communication for Full Detailed Window / View Modal
  const [activeCommDetail, setActiveCommDetail] = useState<CommunicationItem | null>(null);

  // PDF Viewer Modal State
  const [viewingPdfModal, setViewingPdfModal] = useState<{ comm: CommunicationItem; att?: CommunicationAttachment } | null>(null);

  // Admin Compose Modal
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingCommId, setEditingCommId] = useState<string | null>(null);

  // Compose Form State
  const [formTitle, setFormTitle] = useState('');
  const [formReferenceNo, setFormReferenceNo] = useState('');
  const [formType, setFormType] = useState<CommunicationType>('OFFICE_ORDER');
  const [formPriority, setFormPriority] = useState<CommunicationPriority>('NORMAL');
  const [formCategory, setFormCategory] = useState('Establishment Communication');
  const [formContent, setFormContent] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formAudience, setFormAudience] = useState<CommunicationAudience>('INDIVIDUAL');
  const [formDepartment, setFormDepartment] = useState('Panchayati Raj & Drinking Water Department');
  const [formStatus, setFormStatus] = useState<CommunicationStatus>('PUBLISHED');
  const [formActionRequired, setFormActionRequired] = useState(false);
  const [formActionDeadline, setFormActionDeadline] = useState('');
  const [formActionLinkTab, setFormActionLinkTab] = useState('epar');

  // Selected Employee Target State (VERY IMPORTANT)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);

  // Attached PDF File State
  const [formAttachments, setFormAttachments] = useState<CommunicationAttachment[]>([]);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user ? ['DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER', 'REPORTING_OFFICER', 'DEPT_ADMIN', 'DISTRICT_ADMIN'].includes(user.role) : false;

  // Fetch communications
  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/communications');
      const data = await res.json();
      if (data.success) {
        setCommunications(data.communications || []);
      }
    } catch (e) {
      console.error('Failed to load communications', e);
      addToast('error', 'Error', 'Failed to fetch communication notices.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee list for DDO selection
  const fetchEmployees = async () => {
    if (!isAdmin) return;
    try {
      const res = await apiFetch('/api/admin/employees');
      const data = await res.json();
      if (data.success && Array.isArray(data.employees)) {
        setEmployeesList(data.employees);
      }
    } catch (e) {
      console.error('Failed to fetch employees list', e);
    }
  };

  useEffect(() => {
    fetchCommunications();
    if (isAdmin) {
      fetchEmployees();
    }
  }, [isAdmin]);

  const handleMarkAsRead = async (comm: CommunicationItem) => {
    try {
      const res = await apiFetch(`/api/communications/${comm.id}/read`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCommunications(prev =>
          prev.map(c => {
            if (c.id === comm.id) {
              const currentEmpId = user?.employeeId || '';
              const updatedReadIds = (c.readByEmployeeIds || []).includes(currentEmpId)
                ? c.readByEmployeeIds
                : [...(c.readByEmployeeIds || []), currentEmpId];
              return { ...c, isRead: true, readByEmployeeIds: updatedReadIds };
            }
            return c;
          })
        );
        if (activeCommDetail && activeCommDetail.id === comm.id) {
          setActiveCommDetail(prev => prev ? { ...prev, isRead: true } : null);
        }
      }
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      showProcessing('Marking all notices as read...');
      const res = await apiFetch('/api/communications/mark-all-read', { method: 'POST' });
      const data = await res.json();
      hideProcessing();
      if (data.success) {
        const currentEmpId = user?.employeeId || '';
        setCommunications(prev =>
          prev.map(c => ({
            ...c,
            isRead: true,
            readByEmployeeIds: (c.readByEmployeeIds || []).includes(currentEmpId) ? c.readByEmployeeIds : [...(c.readByEmployeeIds || []), currentEmpId]
          }))
        );
        addToast('success', 'Updated', 'All official communications marked as read.');
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Error', 'Failed to mark all as read.');
    }
  };

  const handleOpenDetail = (comm: CommunicationItem) => {
    setActiveCommDetail(comm);
    if (!comm.isRead) {
      handleMarkAsRead(comm);
    }
  };

  const handleResetForm = () => {
    setEditingCommId(null);
    setFormTitle('');
    setFormReferenceNo(`OD-EST/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
    setFormType('OFFICE_ORDER');
    setFormPriority('NORMAL');
    setFormCategory('Establishment Communication');
    setFormContent('');
    setFormSummary('');
    setFormAudience('INDIVIDUAL');
    setFormDepartment('Panchayati Raj & Drinking Water Department');
    setFormStatus('PUBLISHED');
    setFormActionRequired(false);
    setFormActionDeadline('');
    setFormActionLinkTab('epar');
    setSelectedEmployeeIds([]);
    setEmpSearchQuery('');
    setFormAttachments([]);
    setShowPreviewModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // PDF File Selection and Upload Handler
  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Strict PDF MIME & Extension Validation
    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf';

    if (!isPdfExt && !isPdfMime) {
      addToast('error', 'Invalid File Type', 'Only authentic PDF (.pdf) documents are permitted. Executable files, images, videos, and ZIP archives are strictly prohibited.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Maximum File Size Check (15 MB)
    const maxSizeBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      addToast('error', 'File Too Large', `Selected PDF file (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 15 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingPdf(true);
      setPdfUploadProgress(30);

      // Read file as Base64 Data URL
      const reader = new FileReader();
      reader.onload = async () => {
        setPdfUploadProgress(70);
        const base64Data = reader.result as string;

        // Verify base64 signature
        if (!base64Data.startsWith('data:application/pdf') && !base64Data.includes('application/pdf')) {
          setIsUploadingPdf(false);
          setPdfUploadProgress(null);
          addToast('error', 'Invalid PDF', 'The selected file is not a valid PDF document.');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Upload to server validation endpoint
        try {
          const res = await apiFetch('/api/communications/upload-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64Data,
              fileSize: file.size
            })
          });

          const data = await res.json();
          setIsUploadingPdf(false);
          setPdfUploadProgress(100);

          if (data.success && data.attachment) {
            setFormAttachments([data.attachment]);
            addToast('success', 'PDF Attached', `Successfully attached "${file.name}" (${data.attachment.fileSize}).`);
          } else {
            addToast('error', 'Upload Failed', data.message || 'Failed to validate PDF document.');
          }
        } catch (err) {
          setIsUploadingPdf(false);
          setPdfUploadProgress(null);
          addToast('error', 'Upload Error', 'Could not upload PDF document to server.');
        }
      };

      reader.onerror = () => {
        setIsUploadingPdf(false);
        setPdfUploadProgress(null);
        addToast('error', 'File Read Error', 'Failed to read the selected PDF file.');
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploadingPdf(false);
      setPdfUploadProgress(null);
      addToast('error', 'Upload Error', 'Failed to process the PDF attachment.');
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setFormAttachments(prev => prev.filter(a => a.id !== attId));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast('info', 'Attachment Removed', 'PDF attachment removed.');
  };

  const handleToggleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleRemoveSelectedEmployee = (empId: string) => {
    setSelectedEmployeeIds(prev => prev.filter(id => id !== empId));
  };

  // Preview before final submit
  const handleOpenPreviewBeforeSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      addToast('error', 'Validation Error', 'Communication title / subject is required.');
      return;
    }
    if (!formContent.trim()) {
      addToast('error', 'Validation Error', 'Communication message content is required.');
      return;
    }

    if (formAudience === 'INDIVIDUAL' && selectedEmployeeIds.length === 0) {
      addToast('error', 'Recipient Required', 'Please select at least one employee recipient for this communication.');
      return;
    }

    setShowPreviewModal(true);
  };

  // Final submission of communication
  const handleFinalSaveCommunication = async () => {
    const payload = {
      title: formTitle.trim(),
      referenceNo: formReferenceNo.trim(),
      type: formType,
      priority: formPriority,
      category: formCategory,
      content: formContent.trim(),
      summary: formSummary.trim() || formTitle.trim().slice(0, 100),
      targetAudience: formAudience,
      targetDepartment: formAudience === 'DEPARTMENT' ? formDepartment : undefined,
      targetEmployeeIds: formAudience === 'INDIVIDUAL' ? selectedEmployeeIds : [],
      status: formStatus,
      actionRequired: formActionRequired,
      actionDeadline: formActionRequired ? formActionDeadline : undefined,
      actionLinkTab: formActionRequired ? formActionLinkTab : undefined,
      attachments: formAttachments
    };

    showProcessing(editingCommId ? 'Updating communication notice...' : 'Dispatching official communication to recipient(s)...');

    try {
      let res;
      if (editingCommId) {
        res = await apiFetch(`/api/admin/communications/${editingCommId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/admin/communications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Communication Dispatched', data.message || 'Communication published successfully.');
        setShowPreviewModal(false);
        setShowComposeModal(false);
        handleResetForm();
        fetchCommunications();
      } else {
        addToast('error', 'Failed', data.message || 'Could not dispatch communication.');
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to communicate with server.');
    }
  };

  const handleEditComm = (comm: CommunicationItem) => {
    setEditingCommId(comm.id);
    setFormTitle(comm.title);
    setFormReferenceNo(comm.referenceNo);
    setFormType(comm.type);
    setFormPriority(comm.priority);
    setFormCategory(comm.category || 'Establishment Communication');
    setFormContent(comm.content);
    setFormSummary(comm.summary || '');
    setFormAudience(comm.targetAudience);
    setFormDepartment(comm.targetDepartment || 'Panchayati Raj & Drinking Water Department');
    setSelectedEmployeeIds(comm.targetEmployeeIds || []);
    setFormStatus(comm.status);
    setFormActionRequired(Boolean(comm.actionRequired));
    setFormActionDeadline(comm.actionDeadline || '');
    setFormActionLinkTab(comm.actionLinkTab || 'epar');
    setFormAttachments(comm.attachments || []);
    setShowComposeModal(true);
  };

  const handleDeleteComm = async (commId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete communication notice "${title}"?`)) return;
    try {
      showProcessing('Deleting communication notice...');
      const res = await apiFetch(`/api/admin/communications/${commId}`, { method: 'DELETE' });
      const data = await res.json();
      hideProcessing();
      if (data.success) {
        addToast('success', 'Deleted', 'Communication deleted successfully.');
        if (activeCommDetail && activeCommDetail.id === commId) {
          setActiveCommDetail(null);
        }
        fetchCommunications();
      } else {
        addToast('error', 'Error', data.message || 'Failed to delete communication.');
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Error', 'Failed to delete communication.');
    }
  };

  // Filtered employees for dropdown
  const filteredEmployeesForSelect = employeesList.filter(emp => {
    const q = empSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      (emp.office && emp.office.toLowerCase().includes(q))
    );
  });

  // Filtered Communications List
  const filteredCommunications = communications.filter(c => {
    if (adminViewTab === 'SENT_HISTORY') {
      // In Sent History, show communications sent by DDO or individual targeted ones
      if (c.targetAudience !== 'INDIVIDUAL' && !c.targetEmployeeIds?.length) return true;
    }
    if (selectedTypeFilter !== 'ALL' && c.type !== selectedTypeFilter) return false;
    if (selectedPriorityFilter !== 'ALL' && c.priority !== selectedPriorityFilter) return false;
    if (selectedReadFilter === 'UNREAD' && c.isRead) return false;
    if (selectedReadFilter === 'READ' && !c.isRead) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchRef = c.referenceNo.toLowerCase().includes(q);
      const matchContent = c.content.toLowerCase().includes(q);
      const matchSender = (c.senderName || '').toLowerCase().includes(q);
      const matchRecipients = (c.targetEmployees || []).some(e => e.name.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q));
      if (!matchTitle && !matchRef && !matchContent && !matchSender && !matchRecipients) return false;
    }
    return true;
  });

  const unreadCount = communications.filter(c => !c.isRead && c.status === 'PUBLISHED').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. TOP BANNER & STATS */}
      <div className="bg-gradient-to-r from-[#1777b7] via-[#208acf] to-[#12689f] text-white p-5 sm:p-6 rounded-2xl shadow-md border-b-2 border-[#0e4d75] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white text-[#1777b7] flex items-center justify-center p-1 shrink-0 shadow-md">
            <OdishaSealLogo className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
                Official e-Communication &amp; Notices
              </h2>
              {unreadCount > 0 && !isAdmin && (
                <span className="bg-rose-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="text-xs text-sky-100 mt-1 max-w-xl">
              {isAdmin
                ? 'DDO Communication Dispatch & Management Portal: Send targeted intimations with PDF attachments to selected employees.'
                : 'Direct official intimations, establishment orders, and notifications issued by your Drawing & Disbursing Officer (DDO).'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {unreadCount > 0 && !isAdmin && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-300" />
              <span>Mark All Read</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                handleResetForm();
                setShowComposeModal(true);
              }}
              className="px-4 py-2.5 bg-[#e67e22] hover:bg-[#d35400] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Send Employee Communication</span>
            </button>
          )}

          <button
            onClick={fetchCommunications}
            className="p-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl transition-colors cursor-pointer"
            title="Refresh Communications"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ADMIN TABS: ALL NOTICES vs SENT HISTORY */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setAdminViewTab('ALL_NOTICES')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              adminViewTab === 'ALL_NOTICES'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>All Published Notices ({communications.length})</span>
          </button>

          <button
            onClick={() => setAdminViewTab('SENT_HISTORY')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              adminViewTab === 'SENT_HISTORY'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>DDO Sent History &amp; Recipient Logs</span>
          </button>
        </div>
      )}

      {/* 2. FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, Memo No, recipient employee, or PDF name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {!isAdmin && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSelectedReadFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedReadFilter === 'ALL' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({communications.length})
              </button>
              <button
                onClick={() => setSelectedReadFilter('UNREAD')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  selectedReadFilter === 'UNREAD' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setSelectedReadFilter('READ')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedReadFilter === 'READ' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Read
              </button>
            </div>
          )}

          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Categories / Types</option>
            <option value="OFFICE_ORDER">Office Orders</option>
            <option value="INTIMATION">Intimations &amp; Notices</option>
            <option value="CIRCULAR">Official Circulars</option>
            <option value="NOTIFICATION">Service Notifications</option>
            <option value="POLICY_UPDATE">Policy Updates</option>
            <option value="ADVISORY">Advisories &amp; Memos</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Normal</option>
            <option value="ROUTINE">Routine</option>
          </select>
        </div>
      </div>

      {/* 3. COMMUNICATION NOTICES LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Synchronizing official communications with server...</span>
          </div>
        ) : filteredCommunications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Mail className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 text-sm">No communications found</p>
            <p className="text-slate-400">
              {searchQuery || selectedTypeFilter !== 'ALL' || selectedReadFilter !== 'ALL'
                ? 'Try adjusting your search terms or filter selection.'
                : 'No official notices or circulars are currently published for your establishment.'}
            </p>
          </div>
        ) : (
          filteredCommunications.map((comm) => {
            const isUnread = !comm.isRead && comm.status === 'PUBLISHED';
            const hasPdf = comm.attachments && comm.attachments.length > 0;
            const primaryPdf = hasPdf ? comm.attachments[0] : undefined;

            return (
              <div
                key={comm.id}
                onClick={() => handleOpenDetail(comm)}
                className={`p-4 sm:p-5 transition-all cursor-pointer hover:bg-sky-50/60 relative flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  isUnread ? 'bg-sky-50/30' : 'bg-white'
                }`}
              >
                {/* Left Indicator bar */}
                {isUnread && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-600" />
                )}

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Top Meta: Ref No, Type, Priority, Date */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isAdmin && (
                      isUnread ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                          Unread Notice
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Read
                        </span>
                      )
                    )}

                    {/* Reference No */}
                    <span className="font-mono font-bold text-[11px] text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Ref: {comm.referenceNo}
                    </span>

                    {/* Type badge */}
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-100 text-sky-800 uppercase tracking-wider">
                      {comm.type.replace('_', ' ')}
                    </span>

                    {/* Target Audience Badge */}
                    {comm.targetAudience === 'INDIVIDUAL' ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-purple-600" />
                        Targeted: {comm.targetEmployeeIds?.length || 1} Employee{(comm.targetEmployeeIds?.length || 1) > 1 ? 's' : ''}
                      </span>
                    ) : comm.targetAudience === 'ALL_EMPLOYEES' ? (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700">
                        Broadcast: All Employees
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700">
                        {comm.targetAudience}
                      </span>
                    )}

                    {/* Priority badge */}
                    {comm.priority === 'URGENT' && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        URGENT
                      </span>
                    )}
                    {comm.priority === 'HIGH' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        HIGH PRIORITY
                      </span>
                    )}

                    {/* Status badge for admin */}
                    {isAdmin && comm.status !== 'PUBLISHED' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200 text-slate-700">
                        {comm.status}
                      </span>
                    )}

                    {/* Date */}
                    <span className="text-[11px] text-slate-400 font-mono ml-auto sm:ml-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(comm.publishDate || comm.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className={`text-sm font-bold leading-snug transition-colors ${
                    isUnread ? 'text-slate-900 font-extrabold' : 'text-slate-800 hover:text-sky-700'
                  }`}>
                    {comm.title}
                  </h3>

                  {/* Target Recipient Names if DDO View */}
                  {isAdmin && comm.targetEmployees && comm.targetEmployees.length > 0 && (
                    <div className="bg-purple-50/60 border border-purple-200 rounded-lg px-2.5 py-1.5 text-[11px] text-purple-900 flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold">Recipient(s):</span>
                      {comm.targetEmployees.map(e => (
                        <span key={e.employeeId} className="bg-white px-2 py-0.5 rounded border border-purple-200 font-medium">
                          {e.name} ({e.employeeId}) – {e.designation}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Body Snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {comm.summary || comm.content}
                  </p>

                  {/* Attached PDF card & Sender Meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <strong className="text-slate-700">{comm.senderName}</strong> ({comm.senderDesignation})
                    </span>

                    {/* PDF Attachment Highlight Card */}
                    {hasPdf && primaryPdf && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPdfModal({ comm, att: primaryPdf });
                        }}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-semibold cursor-pointer transition-colors shadow-2xs"
                      >
                        <div className="w-4 h-4 rounded bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">
                          PDF
                        </div>
                        <span className="truncate max-w-[200px]">{primaryPdf.fileName}</span>
                        <span className="text-[10px] font-mono text-red-600">({primaryPdf.fileSize})</span>
                        <Eye className="w-3 h-3 text-red-600 ml-0.5" />
                      </div>
                    )}

                    {comm.actionRequired && (
                      <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        Action Deadline: {comm.actionDeadline || 'Required'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-center sm:self-start pt-1" onClick={(e) => e.stopPropagation()}>
                  {hasPdf && primaryPdf && (
                    <button
                      onClick={() => setViewingPdfModal({ comm, att: primaryPdf })}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      title="View PDF Document"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View PDF</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenDetail(comm)}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Notice</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditComm(comm)}
                        className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Communication"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteComm(comm.id, comm.title)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Communication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. DETAILED COMMUNICATION VIEW MODAL */}
      {activeCommDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Top Modal Header */}
            <div className="bg-gradient-to-r from-[#1777b7] via-[#208acf] to-[#12689f] text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shrink-0 shadow-sm">
                  <OdishaSealLogo className="w-full h-full" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-sky-100 font-semibold">
                    Government of Odisha &bull; Official e-Communication
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {activeCommDetail.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-white/15 hover:bg-white/25 rounded-lg text-white transition-colors cursor-pointer"
                  title="Print Notice"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveCommDetail(null)}
                  className="p-2 bg-white/15 hover:bg-white/25 rounded-lg text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-800 leading-relaxed bg-[#fafcff]">
              {/* Header Box: Reference No & Metadata */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Memo / Ref No</span>
                  <span className="font-mono font-bold text-sky-900 text-xs">{activeCommDetail.referenceNo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Issue Date &amp; Time</span>
                  <span className="font-medium text-slate-800">
                    {new Date(activeCommDetail.publishDate || activeCommDetail.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Category &amp; Type</span>
                  <span className="inline-block px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-bold text-[10px] uppercase">
                    {activeCommDetail.type} &bull; {activeCommDetail.category}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Target Audience</span>
                  <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                    {activeCommDetail.targetAudience === 'INDIVIDUAL' ? 'Targeted Employee' : activeCommDetail.targetAudience}
                  </span>
                </div>
              </div>

              {/* Recipient Details Card */}
              {activeCommDetail.targetEmployees && activeCommDetail.targetEmployees.length > 0 && (
                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] text-purple-900 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                    Targeted Employee Recipient(s)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeCommDetail.targetEmployees.map(emp => (
                      <div key={emp.employeeId} className="bg-white p-2.5 rounded-lg border border-purple-200 text-xs">
                        <div className="font-bold text-slate-900">{emp.name} (HRMS: {emp.employeeId})</div>
                        <div className="text-slate-600 text-[11px]">{emp.designation} &bull; {emp.department}</div>
                        {emp.office && <div className="text-slate-400 text-[10px]">{emp.office}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sender & Department Authority Card */}
              <div className="bg-gradient-to-r from-blue-50/70 to-sky-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">Issuing Authority / DDO</span>
                  <div className="font-bold text-slate-900 text-sm">{activeCommDetail.senderName}</div>
                  <div className="text-slate-600 text-xs">{activeCommDetail.senderDesignation}</div>
                  <div className="text-slate-500 text-[11px]">{activeCommDetail.senderDepartment} &bull; {activeCommDetail.senderOffice}</div>
                </div>

                <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-blue-200 text-[11px]">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Digitally Signed &amp; Dispatched
                  </span>
                </div>
              </div>

              {/* Main Content Body */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    {activeCommDetail.title}
                  </h4>
                </div>

                {/* Formatted Text */}
                <div className="text-slate-700 text-xs sm:text-sm whitespace-pre-line leading-relaxed font-sans space-y-2">
                  {activeCommDetail.content}
                </div>
              </div>

              {/* Action Required Banner if applicable */}
              {activeCommDetail.actionRequired && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Mandatory Action Required</span>
                    </div>
                    <p className="text-xs text-amber-800">
                      Please execute the mandated compliance before deadline: <strong>{activeCommDetail.actionDeadline || 'Immediate'}</strong>.
                    </p>
                  </div>

                  {activeCommDetail.actionLinkTab && onNavigateTab && (
                    <button
                      onClick={() => {
                        const tabToOpen = activeCommDetail.actionLinkTab!;
                        setActiveCommDetail(null);
                        onNavigateTab(tabToOpen);
                      }}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <span>Proceed to {activeCommDetail.actionLinkTab.toUpperCase()} Module</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Attachments Section with PDF Viewer & Download */}
              {activeCommDetail.attachments && activeCommDetail.attachments.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                      <Paperclip className="w-4 h-4 text-sky-600" />
                      Official PDF Enclosures &amp; Documents ({activeCommDetail.attachments.length})
                    </h5>
                    <span className="text-[10px] text-slate-400">Authenticated PDF copies</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCommDetail.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3.5 bg-slate-50 hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-xl transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 font-bold text-xs border border-red-200">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate group-hover:text-red-700">
                              {att.fileName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Size: {att.fileSize} &bull; Validated PDF Document
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setViewingPdfModal({ comm: activeCommDetail, att })}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="View PDF Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View PDF</span>
                          </button>
                          <button
                            onClick={() => downloadCommunicationPdfFile(activeCommDetail, att)}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Download PDF Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="text-[11px] text-slate-500 font-mono">
                Status: {activeCommDetail.isRead ? 'Read by You' : 'Delivered'} &bull; Reference: {activeCommDetail.referenceNo}
              </div>

              <div className="flex items-center gap-2">
                {activeCommDetail.attachments && activeCommDetail.attachments.length > 0 && (
                  <button
                    onClick={() => setViewingPdfModal({ comm: activeCommDetail, att: activeCommDetail.attachments[0] })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open PDF Enclosure</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveCommDetail(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PDF VIEWER MODAL */}
      {viewingPdfModal && (
        <CommunicationPdfViewerModal
          comm={viewingPdfModal.comm}
          attachment={viewingPdfModal.att}
          onClose={() => setViewingPdfModal(null)}
        />
      )}

      {/* 6. ADMIN COMPOSE / EDIT MODAL */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] my-auto">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-[#e67e22]" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCommId ? 'Edit DDO Communication' : 'DDO → Employee Communication & PDF Dispatch'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Send targeted official communication &amp; PDF document to selected employee(s)
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowComposeModal(false);
                  handleResetForm();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenPreviewBeforeSend} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* STEP 1: TARGET AUDIENCE & EMPLOYEE SELECTION (VERY IMPORTANT) */}
              <div className="bg-purple-50/70 border-2 border-purple-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-700" />
                    Target Recipient Audience <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-purple-700 font-semibold">
                    {formAudience === 'INDIVIDUAL' ? `${selectedEmployeeIds.length} Employee(s) Selected` : formAudience}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    formAudience === 'INDIVIDUAL' ? 'bg-white border-purple-500 ring-2 ring-purple-200' : 'bg-purple-50/50 border-purple-200 hover:bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="targetAudienceRadio"
                      checked={formAudience === 'INDIVIDUAL'}
                      onChange={() => setFormAudience('INDIVIDUAL')}
                      className="text-purple-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Specific Employee(s)</div>
                      <div className="text-[10px] text-slate-500">Individual Direct Intimation</div>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    formAudience === 'ALL_EMPLOYEES' ? 'bg-white border-purple-500 ring-2 ring-purple-200' : 'bg-purple-50/50 border-purple-200 hover:bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="targetAudienceRadio"
                      checked={formAudience === 'ALL_EMPLOYEES'}
                      onChange={() => setFormAudience('ALL_EMPLOYEES')}
                      className="text-purple-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">All Employees</div>
                      <div className="text-[10px] text-slate-500">State-wide Broadcast</div>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    formAudience === 'DEPARTMENT' ? 'bg-white border-purple-500 ring-2 ring-purple-200' : 'bg-purple-50/50 border-purple-200 hover:bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="targetAudienceRadio"
                      checked={formAudience === 'DEPARTMENT'}
                      onChange={() => setFormAudience('DEPARTMENT')}
                      className="text-purple-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Specific Department</div>
                      <div className="text-[10px] text-slate-500">Departmental Order</div>
                    </div>
                  </label>
                </div>

                {/* INDIVIDUAL EMPLOYEE SELECTOR */}
                {formAudience === 'INDIVIDUAL' && (
                  <div className="space-y-2 pt-2 border-t border-purple-200">
                    <label className="block text-[11px] font-bold text-purple-900">
                      Search &amp; Select Employee Recipient(s) <span className="text-rose-500">*</span>
                    </label>

                    {/* Employee Search Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={empSearchQuery}
                        onChange={(e) => {
                          setEmpSearchQuery(e.target.value);
                          setIsEmpDropdownOpen(true);
                        }}
                        onFocus={() => setIsEmpDropdownOpen(true)}
                        placeholder="Search employee by Name, HRMS ID (e.g. EMP100201), Designation, or Office..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-purple-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Employee Selection Dropdown */}
                    {isEmpDropdownOpen && (
                      <div className="bg-white rounded-xl border border-purple-300 shadow-lg max-h-48 overflow-y-auto divide-y divide-purple-100 z-20">
                        <div className="p-2 bg-purple-50 flex items-center justify-between text-[11px] text-purple-900 font-bold">
                          <span>Click employee to select/unselect ({filteredEmployeesForSelect.length} found)</span>
                          <button
                            type="button"
                            onClick={() => setIsEmpDropdownOpen(false)}
                            className="text-purple-700 hover:underline cursor-pointer"
                          >
                            Done
                          </button>
                        </div>
                        {filteredEmployeesForSelect.map(emp => {
                          const isSelected = selectedEmployeeIds.includes(emp.employeeId);
                          return (
                            <div
                              key={emp.employeeId}
                              onClick={() => handleToggleEmployeeSelect(emp.employeeId)}
                              className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                isSelected ? 'bg-purple-100/70 font-semibold' : 'hover:bg-purple-50/50'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs">{emp.name}</span>
                                  <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-800">
                                    {emp.employeeId}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 truncate">
                                  {emp.designation} &bull; {emp.department}
                                </div>
                              </div>

                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-purple-600 rounded border-purple-300 pointer-events-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Selected Employees Chips List */}
                    {selectedEmployeeIds.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                          Selected Recipient(s) ({selectedEmployeeIds.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEmployeeIds.map(empId => {
                            const empObj = employeesList.find(e => e.employeeId === empId);
                            return (
                              <div
                                key={empId}
                                className="bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5 shadow-2xs"
                              >
                                <User className="w-3.5 h-3.5 text-purple-600" />
                                <span className="font-bold text-purple-950">
                                  {empObj ? empObj.name : empId}
                                </span>
                                <span className="text-[10px] font-mono text-purple-700">({empId})</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSelectedEmployee(empId)}
                                  className="text-purple-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Please search and select at least one employee from the list above.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* DEPARTMENT SELECTOR */}
                {formAudience === 'DEPARTMENT' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      Target Department
                    </label>
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g. Panchayati Raj & Drinking Water Department"
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Row 2: Title / Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Communication Title / Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Submission of Property Statement / Disciplinary Intimation / Service Regularization"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-xs"
                />
              </div>

              {/* Row 3: Memo / Reference No & Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Memo / Reference Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formReferenceNo}
                    onChange={(e) => setFormReferenceNo(e.target.value)}
                    placeholder="PR-EST-2026/894"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Communication Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CommunicationType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="OFFICE_ORDER">Office Order</option>
                    <option value="INTIMATION">Official Intimation</option>
                    <option value="CIRCULAR">Official Circular</option>
                    <option value="NOTIFICATION">Service Notification</option>
                    <option value="POLICY_UPDATE">Policy Update</option>
                    <option value="ADVISORY">Advisory &amp; Memo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority / Urgency
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as CommunicationPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent</option>
                    <option value="ROUTINE">Routine</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Message Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Communication Message / Order Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Enter the official intimation text, clauses, directions, or order details for the employee..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
                />
              </div>

              {/* Row 5: ATTACH PDF DOCUMENT INTERFACE (VERY IMPORTANT) */}
              <div className="bg-red-50/50 border-2 border-dashed border-red-300 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-red-600" />
                      Attach PDF Document
                    </label>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      Upload authentic PDF (.pdf) file from Desktop, Laptop, Mobile phone, or Tablet. Max size: 15 MB.
                    </p>
                  </div>

                  <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
                    PDF Only
                  </span>
                </div>

                {/* Hidden Native File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  onChange={handlePdfFileSelect}
                  className="hidden"
                />

                {/* Upload Button & Drop Area */}
                {formAttachments.length === 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-white rounded-xl border border-red-200">
                    <button
                      type="button"
                      disabled={isUploadingPdf}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingPdf ? 'Validating PDF...' : 'Choose PDF / Upload PDF'}</span>
                    </button>

                    <div className="text-xs text-slate-500 text-center sm:text-left">
                      {isUploadingPdf ? (
                        <div className="flex items-center gap-2 text-red-600 font-semibold">
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading and verifying PDF document ({pdfUploadProgress}%)...</span>
                        </div>
                      ) : (
                        <span>Click to select PDF or drag and drop your document file here.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Attached PDF Card Display */
                  <div className="space-y-2">
                    {formAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="bg-white p-3.5 rounded-xl border border-red-300 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">
                              {att.fileName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>Size: <strong>{att.fileSize}</strong></span>
                              <span>&bull;</span>
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Validated PDF Document
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Preview PDF before send */}
                          <button
                            type="button"
                            onClick={() => setViewingPdfModal({
                              comm: {
                                id: 'preview-temp',
                                referenceNo: formReferenceNo,
                                title: formTitle || 'Communication Preview',
                                type: formType,
                                priority: formPriority,
                                category: formCategory,
                                content: formContent,
                                targetAudience: formAudience,
                                status: formStatus,
                                publishDate: new Date().toISOString(),
                                attachments: formAttachments,
                                senderName: user?.name || 'Drawing & Disbursing Officer (DDO)',
                                senderDesignation: 'DDO / Establishment Officer',
                                senderDepartment: formDepartment,
                                senderOffice: 'Government of Odisha',
                                readByEmployeeIds: [],
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                              },
                              att
                            })}
                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-lg text-xs flex items-center gap-1 border border-sky-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview PDF</span>
                          </button>

                          {/* Remove PDF */}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-rose-200 cursor-pointer"
                            title="Remove PDF and select another"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 6: Mandatory Action Checkbox */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="actionReqCheck"
                    checked={formActionRequired}
                    onChange={(e) => setFormActionRequired(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                  />
                  <label htmlFor="actionReqCheck" className="text-xs font-bold text-amber-900 cursor-pointer">
                    Requires Mandatory Employee Action / Submission
                  </label>
                </div>

                {formActionRequired && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                        Compliance Deadline
                      </label>
                      <input
                        type="date"
                        value={formActionDeadline}
                        onChange={(e) => setFormActionDeadline(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                        Redirect Employee to Module
                      </label>
                      <select
                        value={formActionLinkTab}
                        onChange={(e) => setFormActionLinkTab(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                      >
                        <option value="epar">e-PAR &amp; Property Statement</option>
                        <option value="service-book">e-Service Book</option>
                        <option value="profile">My Profile &amp; KYC</option>
                        <option value="salary">Salary &amp; Payslips</option>
                        <option value="leave">Leave Application</option>
                        <option value="grievances">Grievances Help Desk</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Select & Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">Dispatch Status:</label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="formStatusRadio"
                      checked={formStatus === 'PUBLISHED'}
                      onChange={() => setFormStatus('PUBLISHED')}
                      className="text-sky-600"
                    />
                    <span className="text-xs font-bold text-emerald-800">Publish &amp; Send</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="formStatusRadio"
                      checked={formStatus === 'DRAFT'}
                      onChange={() => setFormStatus('DRAFT')}
                      className="text-sky-600"
                    />
                    <span className="text-xs font-medium text-slate-600">Save Draft</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowComposeModal(false);
                      handleResetForm();
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#e67e22] hover:bg-[#d35400] text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-[1.02]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview &amp; Send Communication</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. OFFICIAL COMMUNICATION PREVIEW BEFORE DISPATCH MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1777b7] to-[#12689f] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <h3 className="text-base font-bold text-white">Communication Dispatch Preview</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs bg-slate-50">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs">
                <strong>Confirmation Note:</strong> Please review the recipient list, message text, and PDF attachment below before confirming dispatch.
              </div>

              {/* Recipient Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Target Recipient(s)
                </span>
                {formAudience === 'INDIVIDUAL' ? (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      <span>{selectedEmployeeIds.length} Selected Employee(s) – Sent Exclusively</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                      {selectedEmployeeIds.map(empId => {
                        const empObj = employeesList.find(e => e.employeeId === empId);
                        return (
                          <div key={empId} className="py-1.5 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              {empObj ? empObj.name : empId} ({empId})
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {empObj ? `${empObj.designation}, ${empObj.department}` : 'State Employee'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="font-bold text-slate-800 text-xs">
                    {formAudience === 'ALL_EMPLOYEES' ? 'All State Employees (Broadcast)' : `Department: ${formDepartment}`}
                  </div>
                )}
              </div>

              {/* Message Details */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 border-b border-slate-100 pb-1.5">
                  <span>Ref: {formReferenceNo}</span>
                  <span>Type: {formType}</span>
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Subject</span>
                  <div className="font-bold text-slate-900 text-sm">{formTitle}</div>
                </div>
                <div className="text-slate-700 whitespace-pre-line text-xs pt-2 border-t border-slate-100 leading-relaxed">
                  {formContent}
                </div>
              </div>

              {/* PDF Attachment in Preview */}
              {formAttachments.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-red-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Attached PDF Document
                  </span>
                  <div className="flex items-center justify-between bg-red-50 p-2.5 rounded-lg border border-red-200 text-xs">
                    <span className="font-bold text-red-900 truncate">
                      {formAttachments[0].fileName} ({formAttachments[0].fileSize})
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewingPdfModal({
                        comm: {
                          id: 'preview-temp',
                          referenceNo: formReferenceNo,
                          title: formTitle,
                          type: formType,
                          priority: formPriority,
                          category: formCategory,
                          content: formContent,
                          targetAudience: formAudience,
                          status: formStatus,
                          publishDate: new Date().toISOString(),
                          attachments: formAttachments,
                          senderName: user?.name || 'Drawing & Disbursing Officer (DDO)',
                          senderDesignation: 'DDO / Establishment Officer',
                          senderDepartment: formDepartment,
                          senderOffice: 'Government of Odisha',
                          readByEmployeeIds: [],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        },
                        att: formAttachments[0]
                      })}
                      className="px-2.5 py-1 bg-red-600 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 cursor-pointer"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handleFinalSaveCommunication}
                className="px-6 py-2.5 bg-[#e67e22] hover:bg-[#d35400] text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>Confirm &amp; Send Communication</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
