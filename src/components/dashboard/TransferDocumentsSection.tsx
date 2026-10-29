import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Upload,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  History,
  Calendar,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TransferRecord, TransferDocument, TransferDocumentType } from '../../types/index';
import { TransferPdfViewerModal } from './TransferPdfViewerModal';
import { TransferDocumentUploadModal } from './TransferDocumentUploadModal';
import { downloadTransferPdfFile } from '../../utils/transferPdfGenerator';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface TransferDocumentsSectionProps {
  transfer: TransferRecord;
  isDDOOrAdmin?: boolean;
  onTransferUpdated?: (updated: TransferRecord) => void;
}

export const TransferDocumentsSection: React.FC<TransferDocumentsSectionProps> = ({
  transfer,
  isDDOOrAdmin = false,
  onTransferUpdated
}) => {
  const { addToast } = useAuth();
  const [selectedDocForView, setSelectedDocForView] = useState<TransferDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<TransferDocumentType>('Transfer Order');
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const docs = transfer.documents || [];
  const currentDocs = docs.filter((d) => d.isCurrentVersion !== false);

  // Helper to find current doc by type
  const getDocByType = (type: TransferDocumentType): TransferDocument | undefined => {
    return currentDocs.find((d) => d.documentType === type);
  };

  const handleDownload = async (doc: TransferDocument) => {
    try {
      downloadTransferPdfFile(transfer, doc);
      await apiFetch(`/api/transfers/${transfer.id}/documents/${doc.id}/audit-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'DOWNLOAD' })
      });
      addToast('success', 'PDF Downloaded', `Downloaded ${doc.fileName || doc.documentType + '.pdf'}`);
    } catch (err) {
      addToast('error', 'Download Error', 'Could not download document.');
    }
  };

  const openUploadModal = (type: TransferDocumentType) => {
    setUploadDocType(type);
    setShowUploadModal(true);
  };

  const requiredOrderTypes: {
    type: TransferDocumentType;
    title: string;
    description: string;
    requiredStage: string;
    issuingOffice: string;
  }[] = [
    {
      type: 'Approval Order',
      title: 'BDO Forwarding / Recommendation Letter',
      description: 'Official recommendation and forwarding letter issued by the Block Development Officer to the District Collector.',
      requiredStage: 'FORWARDED_TO_COLLECTOR',
      issuingOffice: `${transfer.currentBlock || 'Current'} Block Office`
    },
    {
      type: 'Transfer Order',
      title: 'Final Transfer & Posting Order',
      description: 'Official transfer notification sanctioned and issued by the District Collector / Competent Authority.',
      requiredStage: 'ORDER_ISSUED',
      issuingOffice: 'District Administration / Competent Authority'
    },
    {
      type: 'Relieving Order',
      title: 'Relieving & Charge Release Order',
      description: 'Relieving certificate and charge handover confirmation from current Block Office.',
      requiredStage: 'RELIEVED',
      issuingOffice: `${transfer.currentBlock || 'Current'} Block Office`
    },
    {
      type: 'Joining Order',
      title: 'Joining Acceptance Order',
      description: 'Formal acceptance of duty report at new office destination.',
      requiredStage: 'JOINED',
      issuingOffice: `${transfer.preferredBlock || 'New'} Block Office`
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span>Official Transfer Documents & Orders</span>
              <span className="text-[11px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">
                {currentDocs.length} Active Document{currentDocs.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              BDO forwarding letter, Collector transfer orders, relieving certificates, and joining reports.
            </p>
          </div>
        </div>

        {/* DDO Quick Upload Button */}
        {isDDOOrAdmin && (
          <button
            onClick={() => openUploadModal('Transfer Order')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Official Document</span>
          </button>
        )}
      </div>

      {/* Competent Authority Workflow Notice */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-0.5">
          <p className="font-bold text-slate-800">
            Competent Authority Workflow Rule
          </p>
          <p className="text-slate-600">
            The BDO/DDO recommendation is a <strong>forwarding letter</strong> to the District Collector, {transfer.currentDistrict || 'Mayurbhanj'}. It does not constitute final transfer approval. Only the <strong>District Collector</strong> has the authority to sanction and issue the final Transfer Order.
          </p>
        </div>
      </div>

      {/* Grid of 4 Key Official Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredOrderTypes.map((item) => {
          const doc = getDocByType(item.type);
          const isAvailable = !!doc;

          return (
            <div
              key={item.type}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                isAvailable
                  ? 'bg-gradient-to-br from-white to-teal-50/40 border-teal-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isAvailable
                          ? 'bg-teal-100 text-teal-800 border border-teal-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isAvailable ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Available (v{doc.version || 1})
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300 inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      Pending Issuance
                    </span>
                  )}
                </div>

                {/* Metadata when available */}
                {isAvailable ? (
                  <div className="p-3 bg-white/90 rounded-xl border border-teal-100/80 text-[11px] grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Order / Ref No</span>
                      <strong className="font-mono text-teal-900">{doc.orderNumber || transfer.orderNumber || 'ORD-PRDW-2026/1185'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Order Date</span>
                      <strong className="text-slate-800">{doc.orderDate || transfer.orderDate || '2026-08-18'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Issued By</span>
                      <span className="font-medium text-slate-700 truncate block">{doc.uploadedBy || 'DDO / Est. Officer'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">File Format & Size</span>
                      <span className="font-mono text-slate-700">{doc.fileSize || '195 KB'} (PDF)</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/60 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 italic">
                    This document will be generated and uploaded by the Competent Authority once the request reaches the <strong className="text-slate-700">{item.requiredStage}</strong> stage.
                  </div>
                )}
              </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80">
                {isAvailable ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedDocForView(doc)}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View PDF</span>
                    </button>

                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 font-medium">Document not yet available</div>
                )}

                {/* DDO upload / replace action */}
                {isDDOOrAdmin && (
                  <button
                    onClick={() => openUploadModal(item.type)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isAvailable ? 'Replace / Update' : 'Upload Order'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Version History Collapsible Table */}
      {docs.length > 0 && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <span>Document Version History & Audit Log</span>
              <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {docs.length} total versions
              </span>
            </div>
            {showVersionHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showVersionHistory && (
            <div className="overflow-x-auto p-4 bg-white border-t border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Version</th>
                    <th className="p-3">Document Title</th>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Uploaded By</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-teal-700">
                        v{doc.version || 1}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800">{doc.documentTitle || doc.documentType}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{doc.fileName}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {doc.orderNumber || '—'}
                      </td>
                      <td className="p-3 text-slate-600">
                        {doc.uploadedBy || 'DDO'}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {doc.isCurrentVersion !== false ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Current Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Replaced / Archived
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => setSelectedDocForView(doc)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg border border-teal-200 text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedDocForView && (
        <TransferPdfViewerModal
          transfer={transfer}
          document={selectedDocForView}
          onClose={() => setSelectedDocForView(null)}
        />
      )}

      {/* Document Upload Modal (For DDO/Admin) */}
      {showUploadModal && (
        <TransferDocumentUploadModal
          transfer={transfer}
          initialType={uploadDocType}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(updated) => {
            if (onTransferUpdated) {
              onTransferUpdated(updated);
            }
          }}
        />
      )}
    </div>
  );
};
