import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle,
  ShieldCheck,
  Building,
  Calendar,
  User,
  ExternalLink,
  Award,
  Layers
} from 'lucide-react';
import { TransferRecord, TransferDocument } from '../../types/index';
import { downloadTransferPdfFile } from '../../utils/transferPdfGenerator';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface TransferPdfViewerModalProps {
  transfer: TransferRecord;
  document: TransferDocument;
  onClose: () => void;
}

export const TransferPdfViewerModal: React.FC<TransferPdfViewerModalProps> = ({
  transfer,
  document: doc,
  onClose
}) => {
  const { addToast } = useAuth();
  const [zoomLevel, setZoomLevel] = useState(100);
  const [hasLoggedView, setHasLoggedView] = useState(false);

  // Log view action on open
  useEffect(() => {
    if (!hasLoggedView) {
      apiFetch(`/api/transfers/${transfer.id}/documents/${doc.id}/audit-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'VIEW' })
      }).catch((err) => console.error('View audit log error:', err));
      setHasLoggedView(true);
    }
  }, [transfer.id, doc.id, hasLoggedView]);

  const handleDownload = async () => {
    try {
      // Trigger download
      downloadTransferPdfFile(transfer, doc);

      // Audit download action
      await apiFetch(`/api/transfers/${transfer.id}/documents/${doc.id}/audit-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'DOWNLOAD' })
      });

      addToast('success', 'PDF Downloaded', `Saved ${doc.fileName || doc.documentType + '.pdf'} to your device.`);
    } catch (e) {
      addToast('error', 'Download Failed', 'Could not generate downloadable PDF file.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 160));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 70));
  const resetZoom = () => setZoomLevel(100);

  const orderNum = doc.orderNumber || transfer.orderNumber || 'ORD-PRDW-2026/1185';
  const orderDate = doc.orderDate || transfer.orderDate || '2026-08-18';
  const docType = doc.documentType || 'Transfer Order';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
        {/* PDF Top Bar Toolbar */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{doc.documentTitle || `${docType} – ${transfer.employeeName}`}</span>
                <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                  v{doc.version || 1}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Order No: <span className="font-mono text-slate-300 font-semibold">{orderNum}</span> | Ref: <span className="font-mono text-slate-300">{transfer.requestNumber}</span>
              </p>
            </div>
          </div>

          {/* Zoom and Action Controls */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs text-slate-300">
              <button
                onClick={zoomOut}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetZoom}
                className="px-2 py-1 hover:bg-slate-700 rounded text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={zoomIn}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Print</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Canvas / Document View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/60 flex justify-center">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
            className="bg-white text-slate-800 w-full max-w-[800px] min-h-[1050px] p-8 sm:p-12 rounded-sm shadow-2xl border border-slate-300 flex flex-col justify-between relative select-text print:m-0 print:p-6 print:border-none print:shadow-none"
          >
            {/* Government Seal & Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <span className="text-8xl font-black rotate-[-30deg] tracking-widest text-slate-900 uppercase">
                GOVT OF ODISHA
              </span>
            </div>

            {/* TOP LETTERHEAD */}
            <div className="space-y-4">
              {docType === 'Approval Order' ? (
                /* Block Office Letterhead for BDO Recommendation */
                <div className="text-center border-b-2 border-teal-800 pb-4 relative">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full border-2 border-teal-800 flex items-center justify-center bg-teal-50 text-teal-900 font-extrabold text-xs shadow-xs">
                    <Building className="w-6 h-6 text-teal-800" />
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-wide uppercase">
                    Office of the Block Development Officer
                  </h1>
                  <h2 className="text-xs sm:text-sm font-extrabold text-teal-900 tracking-wider uppercase mt-0.5">
                    {(transfer.currentBlock || 'Bijatala').toUpperCase()} BLOCK, {(transfer.currentDistrict || 'MAYURBHANJ').toUpperCase()}, ODISHA
                  </h2>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    At/Po: {transfer.currentBlock || 'Bijatala'}, Dist: {transfer.currentDistrict || 'Mayurbhanj'}, Odisha, Pin: 757048
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Email: bdo.{(transfer.currentBlock || 'bijatala').toLowerCase().replace(/\s+/g, '')}@odisha.gov.in | Portal: hrmsodisha.gov.in
                  </p>
                </div>
              ) : (
                /* State Govt / Collector Letterhead */
                <div className="text-center border-b-2 border-teal-800 pb-4 relative">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full border-2 border-teal-800 flex items-center justify-center bg-teal-50 text-teal-900 font-extrabold text-xs shadow-xs">
                    <ShieldCheck className="w-6 h-6 text-teal-800" />
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-wide uppercase">
                    Government of Odisha
                  </h1>
                  <h2 className="text-xs sm:text-sm font-extrabold text-teal-900 tracking-wider uppercase mt-0.5">
                    Panchayati Raj & Drinking Water Department
                  </h2>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    Lok Seva Bhawan, Bhubaneswar - 751001, Odisha
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Email: prsec.od@nic.in | Portal: hrmsodisha.gov.in | Phone: 0674-2391234
                  </p>
                </div>
              )}

              {/* Order Classification Banner */}
              <div className="text-center py-2 bg-teal-50/70 rounded-lg border border-teal-200">
                <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-teal-900">
                  {docType === 'Approval Order'
                    ? 'TRANSFER APPLICATION – FORWARDING / RECOMMENDATION LETTER'
                    : docType === 'Relieving Order'
                    ? 'OFFICIAL RELIEVING ORDER'
                    : docType === 'Joining Order'
                    ? 'JOINING ACCEPTANCE ORDER'
                    : 'OFFICIAL TRANSFER & POSTING ORDER'}
                </span>
              </div>

              {/* Order Number & Meta Bar */}
              <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700 py-1 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-slate-500 font-normal">
                    {docType === 'Approval Order' ? 'Letter No: ' : 'Order No: '}
                  </span>
                  <strong className="font-mono text-slate-900">{orderNum}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-normal">Date: </span>
                  <strong className="text-slate-900">{orderDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-normal">Request ID: </span>
                  <strong className="font-mono text-teal-800">{transfer.requestNumber}</strong>
                </div>
              </div>

              {docType === 'Approval Order' ? (
                /* BDO Forwarding & Recommendation Body Format */
                <div className="space-y-4 pt-1">
                  {/* Addressee */}
                  <div className="text-xs space-y-0.5 text-slate-800 font-serif">
                    <p className="font-bold text-slate-900 font-sans">To,</p>
                    <p className="pl-4 font-semibold">The District Collector,</p>
                    <p className="pl-4">{transfer.currentDistrict || 'Mayurbhanj'}, Odisha.</p>
                    <p className="pl-4 font-bold text-teal-800 font-sans text-[11px]">(Through Proper Channel)</p>
                  </div>

                  {/* Subject */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-900 font-bold leading-snug">
                    Subject: Forwarding of Transfer Application of Smt./Shri {transfer.employeeName}, {transfer.designation || 'Panchayat Executive Officer'}, for consideration of transfer to {transfer.preferredBlock || 'Kaptipada'} Block, {transfer.preferredDistrict || 'Mayurbhanj'} District.
                  </div>

                  {/* Salutation & Body Paragraphs */}
                  <div className="space-y-3 text-xs leading-relaxed text-slate-800 font-serif text-justify">
                    <p className="font-bold font-sans">Sir/Madam,</p>
                    <p>
                      I am to forward herewith the transfer application of <strong>Smt./Shri {transfer.employeeName}</strong>, {transfer.designation || 'Panchayat Executive Officer (PEO)'} (HRMS ID: <strong>{transfer.employeeId}</strong>), presently posted at <strong>{transfer.currentOffice || (transfer.currentBlock + ' Gram Panchayat')} under {transfer.currentBlock || 'Bijatala'} Block, {transfer.currentDistrict || 'Mayurbhanj'} District</strong>, requesting transfer to <strong>{transfer.preferredBlock || 'Kaptipada'} Block, {transfer.preferredDistrict || 'Mayurbhanj'} District</strong>.
                    </p>
                    <p>
                      The application has been examined at this office and the request of the applicant is hereby recommended/forwarded for consideration by the competent authority.
                    </p>
                    <p>
                      It is therefore requested that the transfer application may kindly be considered by the <strong>District Collector, {transfer.currentDistrict || 'Mayurbhanj'}</strong>, and necessary orders may be issued as deemed appropriate under the applicable rules and administrative requirements.
                    </p>
                    <p className="italic text-slate-600">
                      This forwarding/recommendation shall not be treated as the final transfer order. The final decision regarding the transfer shall rest with the competent authority.
                    </p>
                  </div>

                  {/* DDO / BDO Recommendation Box */}
                  <div className="p-3 bg-teal-50/90 rounded-xl border border-teal-300 text-xs space-y-1">
                    <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-teal-800">
                      DDO / BDO Recommendation:
                    </h5>
                    <p className="text-slate-900 font-medium italic">
                      "Recommended and forwarded to the District Collector, {transfer.currentDistrict || 'Mayurbhanj'} for consideration and necessary orders."
                    </p>
                  </div>

                  <p className="text-xs text-right pr-6 font-serif pt-1">Yours faithfully,</p>
                </div>
              ) : (
                /* Default Standard View with Particulars Box */
                <>
                  {/* SECTION 1: APPLICANT PARTICULARS */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-teal-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>1. Officer & Posting Particulars</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">Employee Name: </span>
                        <strong className="text-slate-900">{transfer.employeeName || 'LAXMI NAIK'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">HRMS Employee ID: </span>
                        <strong className="font-mono text-teal-800">{transfer.employeeId || '91206224'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Designation: </span>
                        <strong className="text-slate-900">{transfer.designation || 'Panchayat Executive Officer (PEO)'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Department: </span>
                        <strong className="text-slate-900">{transfer.department || 'Panchayati Raj & Drinking Water Dept'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Present Posting: </span>
                        <strong className="text-slate-900">{transfer.currentOffice}, {transfer.currentDistrict}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Transferred / Posted To: </span>
                        <strong className="text-teal-900">{transfer.preferredOffice || transfer.preferredBlock + ' Block Office'}, {transfer.preferredDistrict}</strong>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: OFFICIAL ORDER BODY */}
                  <div className="space-y-3 text-xs leading-relaxed text-slate-800 font-serif text-justify pt-2">
                    <h4 className="font-sans font-extrabold uppercase text-[10px] tracking-wider text-teal-800">
                      2. Order Notification
                    </h4>

                    {docType === 'Relieving Order' ? (
                      <>
                        <p>
                          In pursuance of Government Transfer Order No. <strong>{orderNum}</strong> dated <strong>{orderDate}</strong>, <strong>Smt. {transfer.employeeName}</strong>, {transfer.designation || 'Panchayat Executive Officer'}, HRMS ID: <strong>{transfer.employeeId}</strong>, is hereby relieved of her duties from <strong>{transfer.currentOffice}</strong> with effect from <strong>{orderDate} (Afternoon)</strong>.
                        </p>
                        <p>
                          The officer is instructed to hand over physical and electronic charges to the nominated relieving charge officer and report for duty at <strong>{transfer.preferredDistrict} ({transfer.preferredBlock} Block)</strong> within admissible joining time.
                        </p>
                      </>
                    ) : docType === 'Joining Order' ? (
                      <>
                        <p>
                          In compliance with Transfer Order No. <strong>{orderNum}</strong>, <strong>Smt. {transfer.employeeName}</strong>, {transfer.designation || 'Panchayat Executive Officer'}, HRMS ID: <strong>{transfer.employeeId}</strong>, having reported for duty at <strong>{transfer.preferredOffice || transfer.preferredBlock + ' Block Office, ' + transfer.preferredDistrict}</strong> on <strong>{orderDate} (Forenoon)</strong>, her joining report is hereby accepted.
                        </p>
                        <p>
                          She is taken on the strength of this establishment with effect from the said date and time.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          In exercise of the powers conferred by the Government of Odisha Service Rules and Departmental Guidelines, <strong>Smt. {transfer.employeeName}</strong>, {transfer.designation || 'Panchayat Executive Officer (PEO)'}, HRMS ID: <strong>{transfer.employeeId}</strong>, presently stationed at <strong>{transfer.currentOffice}, District {transfer.currentDistrict}</strong>, is hereby transferred and posted as Panchayat Executive Officer under <strong>{transfer.preferredOffice || transfer.preferredBlock + ' Block Office, ' + transfer.preferredDistrict}</strong> against an existing vacancy with immediate effect.
                        </p>
                        <p>
                          The transfer is ordered in the interest of public service and administrative convenience upon recommendation of the Block Development Officer, {transfer.currentBlock || 'Bijatala'} Block and approval of the District Collector, {transfer.currentDistrict || 'Mayurbhanj'}. The incumbent officer shall be relieved immediately by the local Drawing & Disbursing Officer to enable her to join at the new place of posting within 7 (seven) working days from the date of release.
                        </p>
                        <p>
                          The Last Pay Certificate (LPC) and digitized Service Book shall be transmitted electronically via the Odisha HRMS portal to the receiving DDO.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Directives */}
                  <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">Directives & Compliance:</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-[10.5px]">
                      <li>Handover of physical and digital records must be logged into HRMS before departure.</li>
                      <li>Joining time as admissible under the Odisha Service Code is granted.</li>
                      <li>Failure to join within the stipulated period shall be treated as unauthorized absence.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* BOTTOM SECTION: SIGNATURE & MEMO DISTRIBUTION */}
            <div className="pt-6 border-t border-slate-200 mt-6 space-y-4">
              {docType === 'Approval Order' ? (
                /* Physical BDO Signature & Official Stamp Space */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                    {/* Office Stamp / Seal Box */}
                    <div className="w-52 h-20 rounded-lg border-2 border-dashed border-slate-400 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">OFFICE SEAL / STAMP</span>
                      <span className="text-[9px] text-slate-400">(Place official physical seal here)</span>
                    </div>

                    {/* BDO Physical Signature */}
                    <div className="text-right space-y-1">
                      <p className="text-xs text-slate-400 font-mono">Signature: __________________________</p>
                      <p className="font-bold text-slate-900 text-xs">Block Development Officer</p>
                      <p className="text-[11px] text-slate-600">{transfer.currentBlock || 'Bijatala'} Block, {transfer.currentDistrict || 'Mayurbhanj'}</p>
                    </div>
                  </div>

                  {/* Memo distribution */}
                  <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-800">Memo No: {orderNum}/BDO-{(transfer.currentBlock || 'BIJ').substring(0, 3).toUpperCase()}, Date: {orderDate}</p>
                    <p className="text-slate-500">Copy forwarded for kind information to:</p>
                    <p>1. Smt./Shri {transfer.employeeName}, {transfer.designation || 'PEO'} for information.</p>
                    <p>2. Collector & District Magistrate, {transfer.currentDistrict || 'Mayurbhanj'} for kind favour of information and necessary action.</p>
                    <p>3. Block Development Officer, {transfer.preferredBlock || 'Kaptipada'} Block, {transfer.preferredDistrict || 'Mayurbhanj'}.</p>
                    <p>4. Office Guard File / HRMS Electronic Records.</p>
                  </div>
                </div>
              ) : (
                /* State Digital Signature Block */
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Memo Copy Forwarded To */}
                  <div className="text-[10px] text-slate-600 space-y-1 max-w-sm">
                    <p className="font-bold text-slate-800">Memo No: {orderNum}/PRDW, Date: {orderDate}</p>
                    <p className="text-slate-500">Copy forwarded for information and necessary action to:</p>
                    <p>1. Smt. {transfer.employeeName} (Officer concerned)</p>
                    <p>2. Collector & District Magistrate, {transfer.currentDistrict} / {transfer.preferredDistrict}</p>
                    <p>3. Block Development Officer, {transfer.currentBlock || transfer.currentDistrict}</p>
                    <p>4. Block Development Officer, {transfer.preferredBlock || transfer.preferredDistrict}</p>
                    <p>5. Office Guard File / HRMS Odisha Electronic Repository</p>
                  </div>

                  {/* Official Digital Signature Box */}
                  <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-300 text-right min-w-[240px] space-y-1">
                    <div className="flex items-center justify-end gap-1 text-teal-700 font-extrabold text-[10px] uppercase">
                      <Award className="w-3.5 h-3.5" />
                      <span>Digitally Signed & Authenticated</span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{doc.uploadedBy || 'Competent Authority / District Collector'}</p>
                    <p className="text-[10px] text-slate-600">District Administration, {transfer.currentDistrict}</p>
                    <p className="text-[10px] text-slate-500">Government of Odisha</p>
                    <p className="text-[9px] font-mono text-teal-800 font-semibold">{orderDate} 12:19:00 IST</p>
                  </div>
                </div>
              )}

              {/* Bottom Security Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>HRMS Odisha Verification Hash: {doc.id}</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Document Status: <strong className="text-white">{doc.documentStatus}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Size: <strong className="text-slate-300">{doc.fileSize || '195 KB'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Official PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer border border-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
