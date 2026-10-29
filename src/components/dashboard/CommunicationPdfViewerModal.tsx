import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Building,
  Calendar,
  User,
  CheckCircle,
  Eye,
  ExternalLink
} from 'lucide-react';
import { CommunicationItem, CommunicationAttachment } from '../../types/index';
import { downloadCommunicationPdfFile, getCommunicationPdfDataUrl } from '../../utils/communicationPdfGenerator';
import { OdishaSealLogo } from '../login/OdishaSealLogo';

interface CommunicationPdfViewerModalProps {
  comm: CommunicationItem;
  attachment?: CommunicationAttachment;
  onClose: () => void;
}

export const CommunicationPdfViewerModal: React.FC<CommunicationPdfViewerModalProps> = ({
  comm,
  attachment,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'DOCUMENT' | 'PDF_VIEWER'>('PDF_VIEWER');

  const activeAtt: CommunicationAttachment = attachment || (comm.attachments && comm.attachments.length > 0 ? comm.attachments[0] : {
    id: 'att-default',
    fileName: `${comm.referenceNo.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
    fileSize: '450 KB',
    fileType: 'application/pdf'
  });

  const pdfDataUrl = getCommunicationPdfDataUrl(comm, activeAtt);

  const handleDownload = () => {
    downloadCommunicationPdfFile(comm, activeAtt);
  };

  const handlePrint = () => {
    window.print();
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 160));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 75));
  const resetZoom = () => setZoomLevel(100);

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden my-auto">
        
        {/* PDF Top Bar Toolbar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">
                  {activeAtt.fileName}
                </h3>
                <span className="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30 font-bold shrink-0">
                  PDF • {activeAtt.fileSize}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Ref: <span className="font-mono text-slate-300 font-semibold">{comm.referenceNo}</span> • Sender: <span className="text-slate-300 font-medium">{comm.senderName} ({comm.senderDesignation})</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* View Switcher */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setViewMode('PDF_VIEWER')}
                className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors cursor-pointer ${
                  viewMode === 'PDF_VIEWER' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                PDF View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('DOCUMENT')}
                className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors cursor-pointer ${
                  viewMode === 'DOCUMENT' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Letterhead
              </button>
            </div>

            {/* Zoom Controls */}
            {viewMode === 'DOCUMENT' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={zoomOut}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="px-1.5 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
                  title="Reset Zoom"
                >
                  {zoomLevel}%
                </button>
                <button
                  type="button"
                  onClick={zoomIn}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-[#e67e22] hover:bg-[#d35400] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-900/90 flex justify-center p-3 sm:p-6 min-h-[60vh] max-h-[78vh]">
          {viewMode === 'PDF_VIEWER' ? (
            <div className="w-full h-full min-h-[65vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col">
              <iframe
                src={pdfDataUrl}
                title={activeAtt.fileName}
                className="w-full h-full min-h-[65vh] border-0 rounded-xl"
              />
            </div>
          ) : (
            /* High Fidelity Official Letterhead Document View */
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-200 space-y-6 transition-transform duration-100 font-sans"
            >
              {/* State Seal & Letterhead */}
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <div className="w-14 h-14 mx-auto mb-1">
                  <OdishaSealLogo className="w-full h-full" />
                </div>
                <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">
                  GOVERNMENT OF ODISHA
                </h2>
                <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                  {comm.senderDepartment || 'PANCHAYATI RAJ & DRINKING WATER DEPARTMENT'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {comm.senderOffice || 'Lok Seva Bhawan, Bhubaneswar, Odisha – 751001'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Official Communication Portal • https://hrmsodisha.gov.in
                </p>
              </div>

              {/* Order Heading & Meta */}
              <div className="space-y-2">
                <div className="text-center">
                  <span className="inline-block bg-sky-100 text-sky-900 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                    OFFICIAL {comm.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 gap-1">
                  <span><strong>Memo No:</strong> <span className="text-sky-900 font-bold">{comm.referenceNo}</span></span>
                  <span><strong>Dated:</strong> {new Date(comm.publishDate || comm.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-900 block">To,</span>
                {comm.targetAudience === 'INDIVIDUAL' && comm.targetEmployees && comm.targetEmployees.length > 0 ? (
                  <div className="pl-4 space-y-1">
                    {comm.targetEmployees.map((emp, i) => (
                      <div key={emp.employeeId} className="bg-slate-50/80 p-2 rounded border border-slate-200">
                        <div className="font-bold text-slate-900">{i + 1}. {emp.name} (HRMS ID: {emp.employeeId})</div>
                        <div className="text-[11px] text-slate-600">{emp.designation}, {emp.department}</div>
                        {emp.office && <div className="text-[10px] text-slate-500">{emp.office}</div>}
                      </div>
                    ))}
                  </div>
                ) : comm.targetAudience === 'INDIVIDUAL' && comm.targetEmployeeIds && comm.targetEmployeeIds.length > 0 ? (
                  <div className="pl-4 space-y-1">
                    {comm.targetEmployeeIds.map((empId, i) => (
                      <div key={empId} className="font-semibold text-slate-800">
                        {i + 1}. Employee HRMS ID: {empId}
                      </div>
                    ))}
                  </div>
                ) : comm.targetAudience === 'DEPARTMENT' ? (
                  <div className="pl-4 font-semibold text-slate-800">
                    All Officers &amp; Staff of {comm.targetDepartment || comm.senderDepartment}
                  </div>
                ) : (
                  <div className="pl-4 font-semibold text-slate-800">
                    All State Government Employees / Establishment Offices
                  </div>
                )}
              </div>

              {/* Subject */}
              <div className="bg-slate-100/70 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block text-[11px] uppercase text-slate-500 mb-0.5">Subject:</span>
                <p className="font-bold text-slate-900 text-sm">
                  {comm.title}
                </p>
              </div>

              {/* Message Content */}
              <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-3">
                {comm.content}
              </div>

              {/* Action Box if mandated */}
              {comm.actionRequired && (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span>Mandatory Employee Action Required</span>
                  </div>
                  <div className="text-amber-800 text-[11px]">
                    Compliance Deadline: <strong>{comm.actionDeadline || 'Immediate'}</strong> | Linked HRMS Module: <strong>{comm.actionLinkTab?.toUpperCase() || 'e-PAR / Service Book'}</strong>
                  </div>
                </div>
              )}

              {/* Attached PDF info */}
              {activeAtt && (
                <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-lg text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-700 shrink-0" />
                    <div>
                      <span className="font-bold text-sky-950 block">Official PDF Attachment Enclosure</span>
                      <span className="text-[11px] text-sky-800">{activeAtt.fileName} ({activeAtt.fileSize})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end border-t border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Digitally Authenticated HRMS Document</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Certificate ID: {comm.id}
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="text-[10px] text-slate-400 italic">Digitally Signed &amp; Dispatched By</div>
                  <div className="font-bold text-slate-900 text-sm">{comm.senderName}</div>
                  <div className="text-xs text-slate-600 font-medium">{comm.senderDesignation}</div>
                  <div className="text-[11px] text-slate-500">{comm.senderDepartment}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PDF Footer Bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>HRMS Odisha Official Electronic Communication Dispatch</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer"
            >
              Direct Download ({activeAtt.fileName})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
