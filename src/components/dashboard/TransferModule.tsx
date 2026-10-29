import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  ArrowLeftRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  MapPin,
  Send,
  Upload,
  FileText,
  Paperclip,
  XCircle,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Building,
  AlertCircle,
  Undo2,
  FileCheck,
  Check,
  X,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  HelpCircle,
  Download,
  Save,
  Briefcase,
  Layers,
  History,
  FileEdit,
  RefreshCw
} from 'lucide-react';
import {
  TransferRecord,
  LocationSelection,
  TransferStatus,
  TransferTimelineItem,
  TransferDocument,
  TransferType,
  TransferApprovalStage,
  TransferHistoryRecord
} from '../../types/index';
import { OdishaLocationSelector } from '../common/OdishaLocationSelector';
import { TransferDocumentsSection } from './TransferDocumentsSection';
import { TransferPdfViewerModal } from './TransferPdfViewerModal';

export const TransferModule: React.FC = () => {
  const { employee, user, addToast, showProcessing, hideProcessing } = useAuth();

  // Navigation tab state: 'status' | 'apply' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'apply' | 'history'>('status');

  // History sub-tab state: 'applications' | 'past-postings'
  const [historyView, setHistoryView] = useState<'applications' | 'past-postings'>('applications');

  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [historyRecords, setHistoryRecords] = useState<TransferHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Transfer Record for Detail Modal
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Cancel Transfer Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [transferToCancel, setTransferToCancel] = useState<TransferRecord | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Quick PDF Preview State
  const [previewDoc, setPreviewDoc] = useState<{ transfer: TransferRecord; doc: TransferDocument } | null>(null);

  // DDO Action Modal / Form State
  const [showDdoActionModal, setShowDdoActionModal] = useState(false);
  const [ddoActionType, setDdoActionType] = useState<'UNDER_DDO_REVIEW' | 'FORWARDED_TO_COLLECTOR' | 'COLLECTOR_APPROVED' | 'APPROVED' | 'REJECTED' | 'RETURNED_FOR_CORRECTION' | 'ORDER_ISSUED' | 'RELIEVED' | 'JOINED'>('FORWARDED_TO_COLLECTOR');
  const [ddoRemarks, setDdoRemarks] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [joiningDate, setJoiningDate] = useState('');

  // History Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Apply Form State
  const [transferType, setTransferType] = useState<TransferType>('General Request');
  const [transferLocation, setTransferLocation] = useState<LocationSelection>({
    state: 'Odisha',
    districtId: 'DIST_MAY',
    districtName: 'Mayurbhanj',
    blockId: 'BLK_RAI',
    blockName: 'Rairangpur',
    gpId: '',
    gpName: '',
    villageId: '',
    villageName: ''
  });
  const [preferredOffice, setPreferredOffice] = useState('');
  const [reason, setReason] = useState('');
  const [employeeRemarks, setEmployeeRemarks] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);

  const isDDOOrAdmin = user?.role === 'DDO' || user?.role === 'SUPER_ADMIN' || user?.role === 'ESTABLISHMENT_OFFICER';

  // Fetch transfers & transfer history from API
  const fetchTransfers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = isDDOOrAdmin ? '/api/transfers' : `/api/transfers/${user.employeeId}`;
      const res = await apiFetch(endpoint);
      const data = await res.json();
      if (data.success) {
        setTransfers(data.transfers || []);
      }

      // Fetch service history records
      const histRes = await apiFetch('/api/transfers/history');
      const histData = await histRes.json();
      if (histData.success) {
        setHistoryRecords(histData.history || []);
      }
    } catch (e) {
      addToast('error', 'Error', 'Failed to load transfer records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [user]);

  // Handle File Upload for Apply Form
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFile(file);
      setDocName(file.name);
      addToast('info', 'Document Attached', `${file.name} attached for verification.`);
    }
  };

  // Save Draft Application
  const handleSaveDraft = async () => {
    if (!reason.trim()) {
      addToast('error', 'Reason Required', 'Please provide a preliminary reason before saving draft.');
      return;
    }

    showProcessing('Saving Transfer Application Draft...');
    try {
      const res = await apiFetch('/api/transfers/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: draftId || undefined,
          transferType,
          state: 'Odisha',
          preferredDistrict: transferLocation.districtName || 'Mayurbhanj',
          preferredBlock: transferLocation.blockName || 'Rairangpur',
          preferredOffice: preferredOffice.trim() || `${transferLocation.blockName || 'Rairangpur'} Block Office, ${transferLocation.districtName || 'Mayurbhanj'}`,
          reason: reason.trim(),
          supportingDocumentName: docName || undefined,
          employeeRemarks: employeeRemarks.trim() || undefined,
          documentUrl: docName ? `DRAFT_DOC_${Date.now()}_${docName}` : undefined
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        setDraftId(data.draft.id);
        addToast('success', 'Draft Saved', data.message || 'Transfer application draft saved successfully.');
        await fetchTransfers();
      } else {
        addToast('error', 'Save Failed', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to save draft application.');
    }
  };

  // Submit New Transfer Application (or submit existing draft)
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferLocation.districtName || !transferLocation.blockName) {
      addToast('error', 'Location Required', 'Please select both Target District and Block.');
      return;
    }
    if (!reason.trim()) {
      addToast('error', 'Reason Required', 'Please provide a valid justification for transfer.');
      return;
    }

    showProcessing('Submitting Transfer Application to Competent Authority...');
    try {
      const res = await apiFetch('/api/transfers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: draftId || undefined,
          transferType,
          state: 'Odisha',
          preferredDistrict: transferLocation.districtName,
          preferredBlock: transferLocation.blockName,
          preferredOffice: preferredOffice.trim() || `${transferLocation.blockName} Block Development Office, ${transferLocation.districtName}`,
          reason: reason.trim(),
          supportingDocumentName: docName || undefined,
          employeeRemarks: employeeRemarks.trim() || undefined,
          documentUrl: docName ? `DOC_${Date.now()}_${docName}` : undefined
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Application Submitted', data.message);
        setReason('');
        setEmployeeRemarks('');
        setPreferredOffice('');
        setDocFile(null);
        setDocName('');
        setDraftId(null);
        await fetchTransfers();
        setActiveSubTab('status');
      } else {
        addToast('error', 'Submission Failed', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to communicate with server.');
    }
  };

  // Load an existing draft or active application into the apply form
  const handleLoadDraft = (record: TransferRecord) => {
    setDraftId(record.id);
    setTransferType((record.transferType as TransferType) || 'General Request');
    setReason(record.reason || '');
    setEmployeeRemarks(record.employeeRemarks || '');
    setPreferredOffice(record.preferredOffice || '');
    setDocName(record.supportingDocumentName || record.documentUrl || '');
    setActiveSubTab('apply');
    addToast('info', 'Draft Loaded', `Editing transfer application draft ${record.requestNumber}`);
  };

  // Handle Cancel Transfer Request
  const handleConfirmCancel = async () => {
    if (!transferToCancel) return;
    if (!cancellationReason.trim()) {
      addToast('error', 'Reason Required', 'Please provide a cancellation reason.');
      return;
    }

    showProcessing('Cancelling Transfer Request...');
    try {
      const res = await apiFetch('/api/transfers/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId: transferToCancel.id,
          cancellationReason: cancellationReason.trim()
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Transfer Cancelled', data.message);
        setShowCancelModal(false);
        setTransferToCancel(null);
        setCancellationReason('');
        if (selectedTransfer?.id === transferToCancel.id) {
          setSelectedTransfer(data.transfer);
        }
        await fetchTransfers();
      } else {
        addToast('error', 'Cancellation Failed', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Unable to cancel transfer request.');
    }
  };

  // Handle DDO / Demo Status Updates
  const handleDdoStatusUpdate = async () => {
    if (!selectedTransfer) return;

    showProcessing(`Updating Transfer Request Status...`);
    try {
      const res = await apiFetch('/api/transfers/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId: selectedTransfer.id,
          status: ddoActionType,
          remarks: ddoRemarks,
          rejectionReason: ddoActionType === 'REJECTED' ? ddoRemarks : undefined,
          correctionRemarks: ddoActionType === 'RETURNED_FOR_CORRECTION' ? ddoRemarks : undefined,
          orderNumber: ddoActionType === 'ORDER_ISSUED' ? (orderNumber || `ORD-PRDW-2026-${Date.now().toString().slice(-4)}`) : undefined,
          orderDate: ddoActionType === 'ORDER_ISSUED' ? orderDate : undefined,
          joiningDate: ddoActionType === 'JOINED' ? joiningDate : undefined
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Status Updated', data.message);
        setShowDdoActionModal(false);
        setSelectedTransfer(data.transfer);
        setDdoRemarks('');
        await fetchTransfers();
      } else {
        addToast('error', 'Failed', data.message);
      }
    } catch (err) {
      hideProcessing();
      addToast('error', 'Server Error', 'Unable to update transfer status.');
    }
  };

  // Advance Demo Stage for easy testing of complete lifecycle
  const handleAdvanceDemoStage = async (transferId: string, nextStatus: string, stageTitle: string) => {
    showProcessing(`Advancing Workflow Stage: ${stageTitle}...`);
    try {
      const res = await apiFetch('/api/transfers/advance-demo-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId,
          nextStatus,
          remarks: `Workflow progressed to ${stageTitle} in HRMS Odisha portal.`,
          officerName: user?.name || 'Competent Authority',
          officerRole: user?.role || 'ESTABLISHMENT_OFFICER'
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Stage Advanced', data.message);
        if (selectedTransfer?.id === transferId) {
          setSelectedTransfer(data.transfer);
        }
        await fetchTransfers();
      } else {
        addToast('error', 'Action Failed', data.message);
      }
    } catch (err) {
      hideProcessing();
      addToast('error', 'Server Error', 'Unable to advance stage.');
    }
  };

  // Check if a transfer is eligible for cancellation
  const canCancelTransfer = (t: TransferRecord) => {
    if (user?.role === 'EMPLOYEE' && t.employeeId !== user.employeeId) return false;
    const nonCancellable = ['FORWARDED_TO_COLLECTOR', 'COLLECTOR_APPROVED', 'ORDER_ISSUED', 'RELIEVED', 'JOINED', 'CANCELLED', 'REJECTED'];
    return !nonCancellable.includes(t.status);
  };

  // Filter submitted transfers for History tab
  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      t.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.preferredDistrict.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.preferredBlock.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.transferType && t.transferType.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter service book past postings
  const filteredHistoryRecords = historyRecords.filter((h) => {
    return (
      h.transferOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.newOffice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.newDistrict.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.previousOffice.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Helpers for Status Pill Style
  const getStatusBadge = (status: TransferStatus | string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Draft Saved', bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' };
      case 'SUBMITTED':
        return { label: 'Submitted', bg: 'bg-sky-100 text-sky-800 border-sky-300', dot: 'bg-sky-500' };
      case 'UNDER_DDO_REVIEW':
        return { label: 'Under Verification', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', dot: 'bg-indigo-500' };
      case 'FORWARDED_TO_COLLECTOR':
      case 'PENDING_APPROVAL':
        return { label: 'Recommended to Collector', bg: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
      case 'COLLECTOR_APPROVED':
      case 'APPROVED':
        return { label: 'Sanctioned / Approved', bg: 'bg-teal-100 text-teal-800 border-teal-300', dot: 'bg-teal-500' };
      case 'ORDER_ISSUED':
        return { label: 'Transfer Order Issued', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
      case 'RELIEVED':
        return { label: 'Relieved from Office', bg: 'bg-cyan-100 text-cyan-800 border-cyan-300', dot: 'bg-cyan-500' };
      case 'JOINED':
        return { label: 'Joined at New Office', bg: 'bg-green-100 text-green-900 border-green-400', dot: 'bg-green-600' };
      case 'CANCELLED':
        return { label: 'Cancelled by Employee', bg: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' };
      case 'REJECTED':
        return { label: 'Rejected by Authority', bg: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' };
      case 'RETURNED_FOR_CORRECTION':
        return { label: 'Returned for Correction', bg: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-500' };
    }
  };

  // Get stage index for progress bar
  const getStageIndex = (status: TransferStatus | string) => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'SUBMITTED': return 1;
      case 'UNDER_DDO_REVIEW': return 2;
      case 'FORWARDED_TO_COLLECTOR':
      case 'PENDING_APPROVAL': return 3;
      case 'COLLECTOR_APPROVED':
      case 'APPROVED': return 4;
      case 'ORDER_ISSUED': return 5;
      case 'RELIEVED': return 6;
      case 'JOINED': return 7;
      default: return 1;
    }
  };

  // Transfer Types List
  const transferTypesList: TransferType[] = [
    'General Request',
    'Mutual Transfer',
    'Medical Grounds',
    'Spouse Grounds',
    'Compassionate Grounds',
    'Administrative Grounds',
    'Home District Preference'
  ];

  // Latest active or submitted transfer
  const nonDraftTransfers = transfers.filter((t) => t.status !== 'DRAFT');
  const latestTransfer = nonDraftTransfers.length > 0 ? nonDraftTransfers[0] : (transfers.length > 0 ? transfers[0] : null);

  // Workflow Stages List (6 distinct official steps)
  const workflowStages = [
    { step: 1, key: 'SUBMITTED', title: '1. Online Application', role: 'Employee' },
    { step: 2, key: 'UNDER_DDO_REVIEW', title: '2. Establishment Scrutiny', role: 'Establishment / DDO' },
    { step: 3, key: 'FORWARDED_TO_COLLECTOR', title: '3. BDO Recommendation', role: 'Reporting Officer / BDO' },
    { step: 4, key: 'COLLECTOR_APPROVED', title: '4. Sanction & Approval', role: 'Collector / DM' },
    { step: 5, key: 'ORDER_ISSUED', title: '5. Transfer Order', role: 'Sanctioning Authority' },
    { step: 6, key: 'RELIEVED', title: '6. Relieving Order', role: 'Current DDO' },
    { step: 7, key: 'JOINED', title: '7. Joining Report', role: 'New Office DDO' }
  ];

  return (
    <div className="space-y-5 select-none font-sans">
      {/* 1. TOP DEDICATED EMPLOYEE TRANSFER PROFILE & STATUS HEADER CARD */}
      <div className="bg-white rounded-xl border border-[#b5cee6] shadow-xs overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#1777b7] via-[#208acf] to-[#12689f] text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 border border-white/30 flex items-center justify-center text-white shadow-xs shrink-0">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide uppercase drop-shadow-xs">
                  Transfer Module & Posting Management
                </h2>
                <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  HRMS Odisha
                </span>
              </div>
              <p className="text-xs text-white/90 font-medium">
                Panchayati Raj & Drinking Water Department • Government of Odisha
              </p>
            </div>
          </div>

          {/* Prominent Quick Actions Header Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('apply')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer transform active:scale-95 shrink-0"
              id="btn-prominent-apply-transfer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply for Transfer</span>
            </button>

            <button
              type="button"
              onClick={() => fetchTransfers()}
              className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-lg border border-white/20 transition-all cursor-pointer"
              title="Refresh Transfer Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 9-Point Mandatory Profile Card (Employee Name, ID, Designation, Department, Current Office, District, Block, Current Posting, Transfer Status) */}
        <div className="p-4 bg-gradient-to-b from-[#f8fafc] to-[#eef4f9] border-b border-[#cbdff2]">
          <div className="text-xs font-bold text-[#1e3a8a] uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#1e3a8a]" />
              Employee Posting & Transfer Status Profile
            </span>
            <span className="text-[11px] text-slate-500 font-medium lowercase">
              verified as of {new Date().toLocaleDateString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Employee Name */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                1. Employee Name
              </span>
              <span className="font-extrabold text-slate-800 text-sm truncate block mt-0.5">
                {employee?.name || user?.name || 'Smitarani Mohapatra'}
              </span>
            </div>

            {/* 2. Employee ID */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                2. Employee ID
              </span>
              <span className="font-mono font-extrabold text-teal-700 text-sm block mt-0.5">
                {employee?.employeeId || user?.employeeId || 'EMP-90214'}
              </span>
            </div>

            {/* 3. Designation */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                3. Designation
              </span>
              <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate">
                {employee?.designation || 'Senior Executive Assistant'}
              </span>
            </div>

            {/* 4. Department */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                4. Department
              </span>
              <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate">
                {employee?.department || 'Panchayati Raj & Drinking Water Department'}
              </span>
            </div>

            {/* 5. Current Office */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                5. Current Office
              </span>
              <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate">
                {employee?.office || 'Block Development Office, Rairangpur, Mayurbhanj'}
              </span>
            </div>

            {/* 6. Current District */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                6. Current District
              </span>
              <span className="font-bold text-slate-800 text-xs block mt-0.5">
                {employee?.district || 'Mayurbhanj'}
              </span>
            </div>

            {/* 7. Current Block */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                7. Current Block
              </span>
              <span className="font-bold text-slate-800 text-xs block mt-0.5">
                {employee?.block || 'Rairangpur'}
              </span>
            </div>

            {/* 8. Current Posting */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                8. Current Posting
              </span>
              <span className="font-bold text-slate-800 text-xs block mt-0.5">
                {employee?.postingStation || 'Establishment Branch - I'}
              </span>
            </div>

            {/* 9. Current Transfer Status */}
            <div className="bg-white p-2.5 rounded-lg border border-teal-300 shadow-2xs sm:col-span-2 md:col-span-3 lg:col-span-3 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  9. Current Transfer Status
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-extrabold text-xs border ${latestTransfer ? getStatusBadge(latestTransfer.status).bg : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                    <span className={`w-2 h-2 rounded-full ${latestTransfer ? getStatusBadge(latestTransfer.status).dot : 'bg-slate-400'}`}></span>
                    {latestTransfer ? getStatusBadge(latestTransfer.status).label : 'No Active Transfer Request'}
                  </span>
                  {latestTransfer && (
                    <span className="font-mono text-xs font-bold text-slate-600">
                      [{latestTransfer.requestNumber}]
                    </span>
                  )}
                </div>
              </div>

              {latestTransfer && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('status');
                  }}
                  className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Timeline</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 p-2 bg-white border-t border-slate-200 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('status')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'status'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            id="tab-current-transfer-status"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Current Transfer Status</span>
            {latestTransfer && (
              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full font-mono">
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('apply')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'apply'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            id="tab-apply-transfer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for Transfer</span>
            {draftId && (
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                Draft
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            id="tab-transfer-history"
          >
            <Clock className="w-4 h-4" />
            <span>Transfer History & Past Postings</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {transfers.length + historyRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: APPLY FOR TRANSFER APPLICATION FORM */}
      {/* ========================================================================= */}
      {activeSubTab === 'apply' && (
        <div className="bg-white rounded-xl border border-[#b5cee6] shadow-xs p-5 sm:p-6 space-y-6">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-[#1e3a8a] flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-teal-600" />
                <span>Online Transfer & Posting Application Form</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill the transfer preferences, ground type, and reason. All applications are officially logged and forwarded to the DDO.
              </p>
            </div>

            {draftId && (
              <div className="px-3 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Editing Draft Application ({draftId})</span>
              </div>
            )}
          </div>

          <form onSubmit={handleApplySubmit} className="space-y-5 text-xs max-w-4xl">
            {/* Auto-populated Current Employee Details Banner */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Applicant Information (Auto-populated from HRMS Service Record)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">Name:</span>
                  <strong className="text-slate-800">{employee?.name || user?.name || 'Smitarani Mohapatra'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">HRMS ID:</span>
                  <strong className="text-teal-700 font-mono">{employee?.employeeId || user?.employeeId || 'EMP-90214'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Designation:</span>
                  <strong className="text-slate-800">{employee?.designation || 'Senior Assistant'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Department:</span>
                  <strong className="text-slate-800">{employee?.department || 'PR & DW Dept'}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Current Office:</span>
                  <strong className="text-slate-800">{employee?.office || 'Block Development Office, Rairangpur'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Current District:</span>
                  <strong className="text-slate-800">{employee?.district || 'Mayurbhanj'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Block:</span>
                  <strong className="text-slate-800">{employee?.block || 'Rairangpur'}</strong>
                </div>
              </div>
            </div>

            {/* Transfer Type Selection */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                Select Transfer Type / Ground <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {transferTypesList.map((tType) => (
                  <button
                    key={tType}
                    type="button"
                    onClick={() => setTransferType(tType)}
                    className={`p-2.5 rounded-lg border text-left font-bold text-xs transition-all flex items-center justify-between cursor-pointer ${
                      transferType === tType
                        ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-2xs ring-1 ring-teal-500'
                        : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{tType}</span>
                    {transferType === tType && <Check className="w-4 h-4 text-teal-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Hierarchy: State -> District -> Block */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-800 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Select Target Posting Location in Odisha (State → District → Block) <span className="text-red-500">*</span></span>
              </label>

              <OdishaLocationSelector
                idPrefix="main-apply-transfer-loc"
                value={transferLocation}
                onChange={(sel) => setTransferLocation(sel)}
                required={true}
                showMapPinBadge={true}
                showValidationBanner={true}
                hideGpAndVillage={true}
              />

              {/* Preferred Office / Posting Detail */}
              <div className="pt-2">
                <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                  Preferred Office / Station Name (Optional)
                </label>
                <input
                  type="text"
                  value={preferredOffice}
                  onChange={(e) => setPreferredOffice(e.target.value)}
                  placeholder={`e.g. ${transferLocation.blockName || 'Bhubaneswar MC'} Block Office / DRDA Cell`}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Reason for Transfer */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[11px] tracking-wider">
                Reason / Detailed Justification for Transfer <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide complete justification (e.g. Completion of mandatory tenure of 3+ years in KBK/Tribal belt, spouse working in District headquarters, medical hardship certificate enclosed, caring for elderly parents)..."
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              ></textarea>
            </div>

            {/* Supporting Document Upload (Optional) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[11px] tracking-wider">
                Supporting Document Attachment (Optional)
              </label>
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-slate-800 font-bold text-xs block truncate">
                      {docName ? docName : 'Upload Medical / Spouse / Tenure Certificate (PDF, DOCX, JPG)'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Max file size: 5MB. Files are verified by Establishment Desk during scrutiny.
                    </span>
                  </div>
                </div>
                <label className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg cursor-pointer text-xs shrink-0 shadow-2xs transition-colors flex items-center justify-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Browse Document</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Employee Remarks */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[11px] tracking-wider">
                Additional Remarks / Special Accommodation Notes (Optional)
              </label>
              <input
                type="text"
                value={employeeRemarks}
                onChange={(e) => setEmployeeRemarks(e.target.value)}
                placeholder="Any special remarks for the DDO / Collector..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Submit & Save Draft Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 border border-slate-300 text-xs"
                id="btn-save-transfer-draft"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Save as Draft</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('status')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer text-xs transform active:scale-95"
                  id="btn-submit-transfer-application"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Application to DDO</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CURRENT TRANSFER STATUS & TIMELINE */}
      {/* ========================================================================= */}
      {activeSubTab === 'status' && (
        <div className="space-y-5">
          {!latestTransfer ? (
            <div className="bg-white rounded-xl border border-[#b5cee6] shadow-xs p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-200">
                <ArrowLeftRight className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">No Active Transfer Request</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You currently have no pending or active transfer application under review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('apply')}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Apply for Transfer Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Active Transfer Request Card */}
              <div className="bg-white rounded-xl border border-[#b5cee6] shadow-xs p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Transfer Request:
                      </span>
                      <span className="font-mono font-extrabold text-teal-800 text-base bg-teal-50 px-3 py-0.5 rounded-lg border border-teal-200">
                        {latestTransfer.requestNumber}
                      </span>
                      {latestTransfer.transferType && (
                        <span className="text-[10px] bg-slate-100 border border-slate-300 font-bold px-2 py-0.5 rounded-full text-slate-700">
                          {latestTransfer.transferType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted on: <span className="font-semibold text-slate-700">{latestTransfer.submissionDate || new Date(latestTransfer.createdAt).toLocaleDateString()}</span> • Target: <span className="font-bold text-teal-800">{latestTransfer.preferredDistrict} ({latestTransfer.preferredBlock})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full font-extrabold text-xs border ${getStatusBadge(latestTransfer.status).bg}`}>
                      {getStatusBadge(latestTransfer.status).label}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTransfer(latestTransfer);
                        setShowDetailModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>

                    {latestTransfer.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleLoadDraft(latestTransfer)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <FileEdit className="w-4 h-4" />
                        <span>Resume Draft</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Location Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Current Office & Posting
                    </span>
                    <p className="font-extrabold text-slate-800 text-sm">{latestTransfer.currentOffice}</p>
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <span>District: <strong>{latestTransfer.currentDistrict}</strong></span>
                      {latestTransfer.currentBlock && <span>| Block: <strong>{latestTransfer.currentBlock}</strong></span>}
                    </div>
                  </div>

                  <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                      Requested Transfer Location
                    </span>
                    <p className="font-extrabold text-teal-900 text-sm">{latestTransfer.preferredOffice || `${latestTransfer.preferredBlock} Block Office`}</p>
                    <div className="flex items-center gap-2 text-teal-800 font-medium">
                      <span>State: <strong>{latestTransfer.state}</strong></span>
                      <span>| District: <strong>{latestTransfer.preferredDistrict}</strong></span>
                      <span>| Block: <strong>{latestTransfer.preferredBlock}</strong></span>
                    </div>
                  </div>
                </div>

                {/* VISUAL STAGE PROGRESS STEPPER */}
                <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Approval & Workflow Stages
                    </h4>
                    <span className="text-[11px] text-teal-800 font-bold bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200">
                      Current: {latestTransfer.currentStage || latestTransfer.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
                    {workflowStages.map((stage) => {
                      const currentStep = getStageIndex(latestTransfer.status);
                      const isCompleted = currentStep > stage.step || latestTransfer.status === 'JOINED';
                      const isCurrent = currentStep === stage.step;
                      const isRejected = latestTransfer.status === 'REJECTED';
                      const isCancelled = latestTransfer.status === 'CANCELLED';

                      return (
                        <div
                          key={stage.key}
                          className={`p-2.5 rounded-xl border text-[11px] flex flex-col items-center justify-between gap-1.5 transition-all ${
                            isCancelled
                              ? 'bg-slate-100 border-slate-300 opacity-60 text-slate-500'
                              : isRejected
                              ? 'bg-red-50 border-red-200 text-red-800'
                              : isCompleted
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                              : isCurrent
                              ? 'bg-teal-700 border-teal-800 text-white font-extrabold shadow-sm ring-2 ring-teal-300'
                              : 'bg-white border-slate-200 text-slate-400 font-medium'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              isCurrent
                                ? 'bg-white text-teal-800'
                                : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : stage.step}
                          </div>
                          <span className="leading-tight">{stage.title}</span>
                          <span className="text-[9px] opacity-80 block truncate w-full">{stage.role}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Workflow Simulation Controls for testing end-to-end flow */}
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <span className="font-bold text-teal-900">Workflow Stage Simulator</span>
                      <p className="text-[11px] text-teal-700">Simulate official actions and advance through approval stages:</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {latestTransfer.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceDemoStage(latestTransfer.id, 'UNDER_DDO_REVIEW', 'Establishment Verification')}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                      >
                        Start Verification
                      </button>
                    )}
                    {latestTransfer.status === 'UNDER_DDO_REVIEW' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceDemoStage(latestTransfer.id, 'FORWARDED_TO_COLLECTOR', 'BDO Recommendation')}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                      >
                        Recommend to Collector
                      </button>
                    )}
                    {latestTransfer.status === 'FORWARDED_TO_COLLECTOR' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceDemoStage(latestTransfer.id, 'COLLECTOR_APPROVED', 'Collector Sanction')}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                      >
                        Approve (Collector)
                      </button>
                    )}
                    {latestTransfer.status === 'COLLECTOR_APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceDemoStage(latestTransfer.id, 'ORDER_ISSUED', 'Transfer Order Issued')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                      >
                        Issue Transfer Order
                      </button>
                    )}
                    {latestTransfer.status === 'ORDER_ISSUED' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceDemoStage(latestTransfer.id, 'RELIEVED', 'Relieved from Current Office')}
                        className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                      >
                        Mark Relieved
                      </button>
                    )}
                    {latestTransfer.status === 'RELIEVED' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceDemoStage(latestTransfer.id, 'JOINED', 'Joined at Transferred Office')}
                        className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                      >
                        Mark Joined
                      </button>
                    )}
                  </div>
                </div>

                {/* Cancel Request Button */}
                {canCancelTransfer(latestTransfer) && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Need to withdraw your transfer request before sanction?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTransferToCancel(latestTransfer);
                        setShowCancelModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Request</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Official Transfer Documents & Order PDFs Section */}
              <TransferDocumentsSection
                transfer={latestTransfer}
                isDDOOrAdmin={isDDOOrAdmin}
                onTransferUpdated={async (updated) => {
                  setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                  if (selectedTransfer?.id === updated.id) {
                    setSelectedTransfer(updated);
                  }
                  await fetchTransfers();
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: TRANSFER HISTORY & SERVICE BOOK PAST POSTINGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-xl border border-[#b5cee6] shadow-xs p-5 sm:p-6 space-y-5">
          {/* Header & Sub-view Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#1e3a8a] flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                <span>Transfer Records & Historical Postings</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                View submitted transfer applications and historical service book posting records.
              </p>
            </div>

            {/* Sub-view Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setHistoryView('applications')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  historyView === 'applications'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Submitted Applications ({transfers.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryView('past-postings')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  historyView === 'past-postings'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Service Postings History ({historyRecords.length})
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Request ID, Office, District, Reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {historyView === 'applications' && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_DDO_REVIEW">Under DDO Review</option>
                  <option value="FORWARDED_TO_COLLECTOR">Forwarded to Collector</option>
                  <option value="APPROVED">Sanctioned / Approved</option>
                  <option value="ORDER_ISSUED">Order Issued</option>
                  <option value="RELIEVED">Relieved</option>
                  <option value="JOINED">Joined</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            )}
          </div>

          {/* SUB-VIEW 1: SUBMITTED APPLICATIONS */}
          {historyView === 'applications' && (
            <div>
              {filteredTransfers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700">No Transfer Applications Found</h4>
                  <p className="text-slate-500 text-xs">
                    {transfers.length === 0 ? 'You have not submitted any transfer applications yet.' : 'No requests match the search filter.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Request ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Current Location</th>
                        <th className="p-3">Requested Location</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-800">
                      {filteredTransfers.map((t) => {
                        const badge = getStatusBadge(t.status);
                        return (
                          <tr key={t.id} className="hover:bg-teal-50/30 transition-colors">
                            <td className="p-3 font-mono font-bold text-teal-800">
                              {t.requestNumber}
                            </td>
                            <td className="p-3">
                              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                                {t.transferType || 'General'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 whitespace-nowrap">
                              {t.submissionDate || new Date(t.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold block">{t.currentDistrict}</span>
                              <span className="text-[11px] text-slate-500">{t.currentBlock || 'Block office'}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-teal-800 block">{t.preferredDistrict}</span>
                              <span className="text-[11px] text-teal-600 font-semibold">{t.preferredBlock}</span>
                            </td>
                            <td className="p-3 max-w-xs truncate text-slate-600" title={t.reason}>
                              {t.reason}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTransfer(t);
                                  setShowDetailModal(true);
                                }}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-md border border-teal-200 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>
                              {t.status === 'DRAFT' && (
                                <button
                                  type="button"
                                  onClick={() => handleLoadDraft(t)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-md border border-amber-300 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 2: SERVICE BOOK PAST POSTINGS HISTORY */}
          {historyView === 'past-postings' && (
            <div>
              {filteredHistoryRecords.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700">No Past Postings Found</h4>
                  <p className="text-slate-500 text-xs">No service book transfer records match your query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Order Number</th>
                        <th className="p-3">Order Date</th>
                        <th className="p-3">Previous Office</th>
                        <th className="p-3">Transferred New Office</th>
                        <th className="p-3">Authority</th>
                        <th className="p-3">Relieved Date</th>
                        <th className="p-3">Joining Date</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-800">
                      {filteredHistoryRecords.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-teal-800">
                            {h.transferOrderNumber}
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            {h.orderDate || h.transferDate}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold block">{h.previousOffice}</span>
                            <span className="text-[11px] text-slate-500">{h.previousDistrict}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-teal-800 block">{h.newOffice}</span>
                            <span className="text-[11px] text-teal-600 font-semibold">{h.newDistrict}</span>
                          </td>
                          <td className="p-3 text-slate-700">
                            {h.transferAuthority}
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            {h.relievingDate || '—'}
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            {h.joiningDate || '—'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {h.transferStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: COMPLETE TRANSFER RECORD DETAILS */}
      {/* ========================================================================= */}
      {showDetailModal && selectedTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-teal-800 text-base bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                  {selectedTransfer.requestNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedTransfer.status).bg}`}>
                  {getStatusBadge(selectedTransfer.status).label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Information */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Applicant Information</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Name:</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">HRMS ID:</span>
                  <span className="font-mono font-bold text-teal-700">{selectedTransfer.employeeId}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Designation:</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.designation || 'Senior Assistant'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Department:</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.department || 'PR & DW Department'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] block">Current Office:</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.currentOffice}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Current District:</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.currentDistrict}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Current Block:</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.currentBlock || 'Block office'}</span>
                </div>
              </div>
            </div>

            {/* Transfer Preferences & Justification */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Requested Transfer Details</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 text-[10px] block">Transfer Type:</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.transferType || 'General Request'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Requested District:</span>
                  <span className="font-bold text-teal-800">{selectedTransfer.preferredDistrict}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Requested Block:</span>
                  <span className="font-bold text-teal-800">{selectedTransfer.preferredBlock}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] block">Preferred Office:</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.preferredOffice || 'Block Office'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Submission Date:</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.submissionDate || new Date(selectedTransfer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Reason for Transfer:</span>
                <p className="font-medium text-slate-800">{selectedTransfer.reason}</p>
              </div>

              {/* Supporting Document */}
              {selectedTransfer.supportingDocumentName && (
                <div className="p-2.5 bg-teal-50 rounded-lg border border-teal-200 text-teal-900 font-bold flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-teal-600" />
                  <span>Supporting Attachment: {selectedTransfer.supportingDocumentName}</span>
                </div>
              )}
            </div>

            {/* Official Documents Section */}
            <TransferDocumentsSection
              transfer={selectedTransfer}
              isDDOOrAdmin={isDDOOrAdmin}
              onTransferUpdated={async (updated) => {
                setSelectedTransfer(updated);
                setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                await fetchTransfers();
              }}
            />

            {/* Action History & Timeline */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Official Action History Log</span>
              </h4>

              {(!selectedTransfer.timeline || selectedTransfer.timeline.length === 0) ? (
                <p className="text-slate-400 italic">No timeline events logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedTransfer.timeline.map((item, idx) => (
                    <div key={item.id || idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{item.action}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">{item.status}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{item.remarks}</p>
                      </div>
                      <div className="text-right text-[11px] text-slate-500 shrink-0">
                        <span className="font-bold text-slate-700 block">{item.user}</span>
                        <span>{item.date} {item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CANCEL TRANSFER CONFIRMATION */}
      {/* ========================================================================= */}
      {showCancelModal && transferToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Cancel Transfer Application</h3>
                <p className="text-xs text-slate-500 font-mono font-bold">{transferToCancel.requestNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Are you sure you want to withdraw this transfer application? This action will cancel the verification process.
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                Reason for Withdrawal <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Reason for withdrawing..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                required
              ></textarea>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setTransferToCancel(null);
                  setCancellationReason('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK PREVIEW PDF MODAL */}
      {/* ========================================================================= */}
      {previewDoc && (
        <TransferPdfViewerModal
          transfer={previewDoc.transfer}
          document={previewDoc.doc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
