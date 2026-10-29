import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  BookOpen,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Award,
  Briefcase,
  GraduationCap,
  Users,
  MapPin,
  TrendingUp,
  FileCheck,
  FileText,
  Building,
  CreditCard,
  UserCheck,
  Layers,
  ChevronRight,
  ExternalLink,
  Search,
  Check
} from 'lucide-react';
import { ServiceBook } from '../../types/index';
import { OdishaEmblem } from '../common/OdishaEmblem';
import { CmgiLogo } from '../common/CmgiLogo';
import { generateOfficialServiceBookPDF } from '../../utils/generateServiceBookPDF';

export const ServiceBookModule: React.FC = () => {
  const { employee, addToast } = useAuth();
  const [serviceBook, setServiceBook] = useState<ServiceBook | null>(null);
  const [viewMode, setViewMode] = useState<'book' | 'sections'>('book');
  const [activeSection, setActiveSection] = useState<string>('page1');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!employee) return;
    const fetchServiceBook = async () => {
      try {
        setIsLoading(true);
        const res = await apiFetch(`/api/service-book/${employee.employeeId}`);
        const data = await res.json();
        if (data.success && data.serviceBook) {
          setServiceBook(data.serviceBook);
        }
      } catch (e) {
        addToast('error', 'Error', 'Failed to load Digital Service Book.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchServiceBook();
  }, [employee]);

  if (isLoading || !serviceBook || !employee) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm my-6">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Accessing Digital Service Book Ledger</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Retrieving authenticated official service records, chronological entries, and leave register...
        </p>
      </div>
    );
  }

  const sections = [
    { id: 'page1', name: 'Page 1: Front Cover & IDs', icon: FileText, pageNum: 1 },
    { id: 'page2', name: 'Page 2: Official Divider', icon: Layers, pageNum: 2 },
    { id: 'page3', name: 'Page 3: Bio-Data & Family', icon: Users, pageNum: 3 },
    { id: 'page4', name: 'Page 4: Chronological Entries', icon: Briefcase, pageNum: 4 },
    { id: 'page5', name: 'Page 5: Earned Leave Account', icon: Calendar, pageNum: 5 },
    { id: 'qualifications', name: 'Educational Qualifications', icon: GraduationCap },
    { id: 'postings', name: 'Posting & Transfers', icon: MapPin },
    { id: 'promotions', name: 'Cadre Promotions', icon: Award },
    { id: 'increments', name: 'Annual Increments', icon: TrendingUp },
    { id: 'trainings', name: 'In-Service Training', icon: Calendar },
    { id: 'nominations', name: 'Family Nominations', icon: ShieldCheck },
    { id: 'retirement', name: 'Superannuation & Pension', icon: FileCheck }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      generateOfficialServiceBookPDF(employee, serviceBook);
      addToast('success', 'PDF Generated', `Official 5-Page Service Book for ${employee.name} (${employee.employeeId}) downloaded.`);
    } catch (err) {
      console.error('PDF export failed:', err);
      addToast('error', 'Download Failed', 'Could not generate PDF. Please try again.');
    }
  };

  const p = serviceBook.personalDetails || ({} as any);
  const totalEntries = (serviceBook.officialEntries || []).length;
  const totalPostings = (serviceBook.postingHistory || []).length;
  const totalPromotions = (serviceBook.promotionHistory || []).length;
  const totalIncrements = (serviceBook.incrementHistory || []).length;
  const currentLeaveBalance = serviceBook.earnedLeaveAccount && serviceBook.earnedLeaveAccount.length > 0
    ? serviceBook.earnedLeaveAccount[serviceBook.earnedLeaveAccount.length - 1].balanceLeave
    : 110;

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900 shadow-xl print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <OdishaEmblem size={52} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                  HRMS Odisha Official e-Service Book
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Authenticated Digital Record
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
                {(serviceBook.employeeName || employee.name).toUpperCase()}
                <span className="text-xs font-mono font-normal text-indigo-200 bg-white/10 px-2 py-0.5 rounded-md">
                  ID: {employee.employeeId}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {employee.designation} • {employee.department} • {employee.office}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-white/10 p-1 rounded-xl border border-white/15 flex items-center gap-1">
              <button
                onClick={() => setViewMode('book')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'book'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                5-Page Book View
              </button>
              <button
                onClick={() => setViewMode('sections')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'sections'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Tabbed Sections
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              title="Print current view"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2"
              title="Download exact 5-page Government of Odisha Service Book PDF"
            >
              <Download className="w-4 h-4" />
              Download 5-Page PDF
            </button>
          </div>
        </div>

        {/* Quick Meta Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">PRAN / GPF</span>
            <span className="font-mono font-bold text-amber-300 truncate block mt-0.5">
              {serviceBook.pranNo || employee.gpfNpsNo || 'N/A'}
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">DATE OF JOINING</span>
            <span className="font-mono font-bold text-white block mt-0.5">
              {serviceBook.dateOfEntryGovtService || employee.dateOfJoining}
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">SUPERANNUATION</span>
            <span className="font-mono font-bold text-sky-300 block mt-0.5">
              {serviceBook.retirementDetails?.superannuationDate || '2048-05-31'}
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">OFFICIAL ENTRIES</span>
            <span className="font-mono font-bold text-emerald-400 block mt-0.5">
              {totalEntries} Recorded
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">EL BALANCE</span>
            <span className="font-mono font-bold text-amber-300 block mt-0.5">
              {currentLeaveBalance} Days
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">CADRE / STATUS</span>
            <span className="font-bold text-white truncate block mt-0.5">
              PERMANENT
            </span>
          </div>
        </div>
      </div>

      {/* Mode 1: 5-PAGE OFFICIAL CONTINUOUS BOOK VIEW */}
      {viewMode === 'book' && (
        <div className="space-y-8">
          {/* Quick Page Jump Nav */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-2 overflow-x-auto print:hidden">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Jump to Page:</span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((pg) => (
                <a
                  key={pg}
                  href={`#page-${pg}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                >
                  Page {pg}
                </a>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* PAGE 1: COVER PAGE (HRMS-SB-01) */}
          {/* ======================================================== */}
          <div
            id="page-1"
            className="bg-[#FFFDF9] text-slate-900 p-8 sm:p-12 rounded-3xl border-4 border-slate-800 shadow-2xl relative font-serif max-w-4xl mx-auto print:border-2 print:shadow-none print:p-6"
          >
            {/* Page Header Stamp */}
            <div className="flex items-center justify-between border-b-2 border-red-900 pb-3 mb-6 text-xs text-slate-500 uppercase tracking-wider font-sans font-bold">
              <span className="text-red-900">HRMS-SB-01</span>
              <span>GOVERNMENT OF ODISHA • HRMS e-SERVICE BOOK</span>
              <span className="text-red-800 font-mono">CONFIDENTIAL</span>
            </div>

            {/* Official Header with Seal */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-4">
                <OdishaEmblem size={68} />
                <CmgiLogo size={58} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-red-900 uppercase">
                Government of Odisha
              </h1>
              <h2 className="text-sm sm:text-base font-bold text-blue-900 uppercase font-sans">
                Centre for Modernizing Government Initiative (CMGI)
              </h2>
              <p className="text-xs text-slate-600 font-sans">
                General Administration & Public Grievance Department
              </p>
            </div>

            {/* Service Book Title Banner */}
            <div className="my-8 text-center bg-amber-100/70 border-2 border-amber-700 py-3 px-6 rounded-xl shadow-xs">
              <h3 className="text-xl sm:text-2xl font-black text-red-950 uppercase tracking-widest">
                Digital e-Service Book
              </h3>
              <p className="text-xs text-amber-900 font-sans font-semibold mt-0.5">
                (Statutory Service Record Ledger under Rule 123 of Odisha Service Code)
              </p>
            </div>

            {/* Photo and Bio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start font-sans">
              {/* Photo Box */}
              <div className="order-2 md:order-1 flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-slate-300 rounded-xl text-center">
                <div className="w-32 h-36 border-2 border-dashed border-slate-400 bg-slate-100 flex flex-col items-center justify-center rounded-lg text-slate-400 text-[11px] p-2 text-center">
                  <UserCheck className="w-8 h-8 mb-1 text-slate-500" />
                  <span className="font-bold text-slate-600">AFFIX PASSPORT SIZE PHOTOGRAPH</span>
                  <span className="text-[9px] text-slate-400 mt-1">ATTESTED BY DDO</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                  DDO CODE: {employee.ddoId || 'DDO30001'}
                </p>
              </div>

              {/* Cover Details Table */}
              <div className="order-1 md:order-2 md:col-span-2 space-y-2 text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-slate-300">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700 w-1/3">HRMS EMPLOYEE ID</th>
                        <td className="p-2 font-mono font-black text-red-900 text-sm">{employee.employeeId}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">EMPLOYEE NAME</th>
                        <td className="p-2 font-bold text-slate-900 text-sm">{(serviceBook.employeeName || employee.name).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">DESIGNATION</th>
                        <td className="p-2 font-semibold text-slate-800">{employee.designation.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">CADRE / SERVICE</th>
                        <td className="p-2 font-semibold text-slate-800">{(employee.cadre || 'Odisha Subordinate Service').toUpperCase()}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">DEPARTMENT</th>
                        <td className="p-2 text-slate-800">{employee.department.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">CURRENT OFFICE</th>
                        <td className="p-2 text-slate-800">{employee.office.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">PRAN NO. (NPS)</th>
                        <td className="p-2 font-mono font-bold text-slate-900">{serviceBook.pranNo || employee.gpfNpsNo || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">GPF NO.</th>
                        <td className="p-2 font-mono text-slate-700">{serviceBook.gpfNo || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">DATE OF BIRTH</th>
                        <td className="p-2 font-medium text-slate-900">{serviceBook.dobWords || employee.dob}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">DATE OF ENTRY (GOVT)</th>
                        <td className="p-2 font-bold text-slate-900">{serviceBook.dateOfEntryGovtService || employee.dateOfJoining}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">DATE OF SUPERANNUATION</th>
                        <td className="p-2 font-mono font-bold text-blue-900">{serviceBook.retirementDetails?.superannuationDate || '2048-05-31'}</td>
                      </tr>
                      <tr>
                        <th className="p-2 bg-slate-100 font-bold text-slate-700">HOME DISTRICT</th>
                        <td className="p-2 font-semibold text-slate-900">{(employee.district || 'Khordha').toUpperCase()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-300 rounded-xl text-xs font-sans text-slate-700 leading-relaxed">
              <p className="font-bold text-blue-900 mb-1">
                CERTIFICATE OF VERIFICATION AND OPENING OF SERVICE BOOK:
              </p>
              <p>
                Certified that the entries made in this Digital Service Book have been verified with original matriculation certificates, appointment orders, medical certificates, and office registers. All entries recorded herein are true and verified as per Rule 123 of the Odisha Service Code.
              </p>
            </div>

            {/* Signature Block */}
            <div className="mt-12 pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs font-sans">
              <div>
                <p className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-800">
                  Signature / Left Thumb Impression of Employee
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Date: .......................................</p>
              </div>
              <div className="text-right">
                <p className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-800">
                  Signature & Seal of Attesting Officer / DDO
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Date & Official Seal: .......................................</p>
              </div>
            </div>

            {/* Page Footer */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between font-sans">
              <span>Page 1 of 5</span>
              <span>HRMS Odisha Portal • Verified e-Document</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PAGE 2: FIRST PAGE DIVIDER (HRMS-SB-02) */}
          {/* ======================================================== */}
          <div
            id="page-2"
            className="bg-[#FFFDF9] text-slate-900 p-8 sm:p-12 rounded-3xl border-4 border-slate-800 shadow-2xl relative font-serif max-w-4xl mx-auto print:border-2 print:shadow-none print:p-6"
          >
            <div className="flex items-center justify-between border-b-2 border-red-900 pb-3 mb-8 text-xs text-slate-500 uppercase tracking-wider font-sans font-bold">
              <span className="text-red-900">HRMS-SB-02</span>
              <span>GOVERNMENT OF ODISHA • HRMS e-SERVICE BOOK</span>
              <span className="text-red-800 font-mono">CONFIDENTIAL</span>
            </div>

            <div className="text-center space-y-3 py-6">
              <div className="flex justify-center">
                <OdishaEmblem size={74} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-red-900 uppercase tracking-wider">
                Government of Odisha
              </h1>
              <h2 className="text-sm font-bold text-blue-900 uppercase font-sans">
                Finance Department / GA & PG Department
              </h2>

              <div className="my-10 bg-amber-100 border-2 border-amber-700 py-6 px-8 rounded-2xl max-w-xl mx-auto">
                <h3 className="text-2xl font-black text-red-950 uppercase tracking-widest">
                  First Page of the Service Book
                </h3>
                <p className="text-xs text-amber-950 font-sans font-semibold mt-2">
                  (To be maintained under Rule 123 of Odisha Service Code)
                </p>
              </div>
            </div>

            {/* Statutory Guidelines Box */}
            <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6 font-sans text-xs space-y-3">
              <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                Statutory Instructions for Custody and Maintenance of Service Book:
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-slate-700 leading-relaxed">
                <li>
                  The Service Book must be maintained in duplicate or verified digital electronic mode for every Government servant from the date of initial appointment.
                </li>
                <li>
                  The Head of Office shall record annual certificate of verification of service in respect of each employee after verifying pay bills and acquaintance rolls.
                </li>
                <li>
                  At a fixed time in June every year, the Service Book shall be shown to the Government servant who shall affix signature in token of having verified entries.
                </li>
                <li>
                  No alteration or erasure in the Date of Birth once recorded shall be made without prior approval of the Competent Administrative Authority.
                </li>
                <li>
                  In case of transfer, the Service Book accompanied by LPC (Last Pay Certificate) shall be transmitted directly to the new Head of Office within 7 days.
                </li>
                <li>
                  All sanctions of leave, promotions, increments, suspensions, and training must be contemporaneously entered and attested by the DDO/Establishment Officer.
                </li>
                <li>
                  Nominations for DCRG, NPS/GPF, and GIS must be countersigned and kept attached to this ledger securely.
                </li>
              </ol>
            </div>

            <div className="mt-12 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between font-sans">
              <span>Page 2 of 5</span>
              <span>HRMS Odisha Portal • Rule 123 OSC Guidelines</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PAGE 3: BIO-DATA & FAMILY PARTICULARS (HRMS-SB-03) */}
          {/* ======================================================== */}
          <div
            id="page-3"
            className="bg-[#FFFDF9] text-slate-900 p-8 sm:p-12 rounded-3xl border-4 border-slate-800 shadow-2xl relative font-sans max-w-4xl mx-auto print:border-2 print:shadow-none print:p-6 space-y-6"
          >
            <div className="flex items-center justify-between border-b-2 border-red-900 pb-3 text-xs text-slate-500 uppercase tracking-wider font-bold">
              <span className="text-red-900">HRMS-SB-03</span>
              <span>PART - I : EMPLOYEE BIO-DATA & PARTICULARS</span>
              <span className="text-red-800 font-mono">CONFIDENTIAL</span>
            </div>

            {/* Bio-Data Grid Table */}
            <div className="overflow-x-auto border-2 border-slate-300 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <tbody className="divide-y divide-slate-300">
                  <tr className="divide-x divide-slate-300">
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700 w-1/4">1. Full Name of Govt Servant</th>
                    <td className="p-2.5 font-bold text-slate-900 uppercase">{(serviceBook.employeeName || employee.name).toUpperCase()}</td>
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700 w-1/4">8. Marital Status</th>
                    <td className="p-2.5 font-bold text-slate-900">{p.maritalStatus || 'MARRIED'}</td>
                  </tr>
                  <tr className="divide-x divide-slate-300">
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">2. Father's Name</th>
                    <td className="p-2.5 font-semibold text-slate-800">{(p.fatherName || employee.fatherName || 'N/A').toUpperCase()}</td>
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">9. Blood Group</th>
                    <td className="p-2.5 font-bold text-red-900">{p.bloodGroup || 'O+'}</td>
                  </tr>
                  <tr className="divide-x divide-slate-300">
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">3. Home Town / District</th>
                    <td className="p-2.5 font-semibold text-slate-800">{(serviceBook.declarationOfHomeTown || employee.district || 'N/A').toUpperCase()}</td>
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">10. Height (cm)</th>
                    <td className="p-2.5 font-semibold text-slate-800">{p.heightCm || 168} cm</td>
                  </tr>
                  <tr className="divide-x divide-slate-300">
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">4. Date of Birth (Christian Era)</th>
                    <td className="p-2.5 text-slate-900">{serviceBook.dobWords || employee.dob}</td>
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">11. Identification Marks</th>
                    <td className="p-2.5 text-slate-800">{p.identificationMark || 'N/A'}</td>
                  </tr>
                  <tr className="divide-x divide-slate-300">
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">5. Date of Entry into Govt Service</th>
                    <td className="p-2.5 text-slate-900">{serviceBook.dateOfEntryGovtServiceWords || employee.dateOfJoining}</td>
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">12. Social Category</th>
                    <td className="p-2.5 font-bold text-blue-900">{serviceBook.category || 'GENERAL'}</td>
                  </tr>
                  <tr className="divide-x divide-slate-300">
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">6. Initial Joining Post & Office</th>
                    <td className="p-2.5 text-slate-800">{serviceBook.initialJoiningPost || employee.designation}, {serviceBook.initialJoiningOffice || employee.office}</td>
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">13. Mobile / Phone</th>
                    <td className="p-2.5 font-mono text-slate-800">{serviceBook.cellPhone || employee.mobile}</td>
                  </tr>
                  <tr className="divide-x divide-slate-300">
                    <th className="p-2.5 bg-slate-100 font-bold text-slate-700">7. Permanent Home Address</th>
                    <td colSpan={3} className="p-2.5 text-slate-800">{p.permanentAddress || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Identity Documents Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Identity Documents & Proofs
              </h4>
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-blue-900 text-white font-bold">
                    <tr>
                      <th className="p-2 w-12 text-center">Sl</th>
                      <th className="p-2">Document Type</th>
                      <th className="p-2">Document Number</th>
                      <th className="p-2">Place of Issue</th>
                      <th className="p-2">Date of Issue</th>
                      <th className="p-2">Date of Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(serviceBook.identityDocuments || [
                      { type: 'PAN CARD', number: employee.panNumber || 'ABCPS1234F', placeOfIssue: 'Income Tax Dept', dateOfIssue: '10-JAN-2012', dateOfExpiry: 'N/A' },
                      { type: 'AADHAAR CARD', number: 'xxxxxxxx5821', placeOfIssue: 'UIDAI', dateOfIssue: '15-MAR-2014', dateOfExpiry: 'N/A' }
                    ]).map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono">{i + 1}</td>
                        <td className="p-2 font-bold text-slate-800">{d.type}</td>
                        <td className="p-2 font-mono font-bold text-blue-950">{d.number}</td>
                        <td className="p-2">{d.placeOfIssue || 'N/A'}</td>
                        <td className="p-2 font-mono">{d.dateOfIssue || 'N/A'}</td>
                        <td className="p-2 font-mono">{d.dateOfExpiry || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Family Members Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Family Members Record
              </h4>
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-blue-900 text-white font-bold">
                    <tr>
                      <th className="p-2 w-12 text-center">Sl</th>
                      <th className="p-2">Relationship</th>
                      <th className="p-2">Member Name</th>
                      <th className="p-2 text-center">Alive</th>
                      <th className="p-2">Date of Birth</th>
                      <th className="p-2">Marital Status</th>
                      <th className="p-2 text-center">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(serviceBook.familyMembers || [
                      { relationType: 'FATHER', name: employee.fatherName || 'Late Father', isAlive: false, dob: '04-JAN-1956', maritalStatus: 'MARRIED', age: 65 },
                      { relationType: 'MOTHER', name: employee.motherName || 'Mother', isAlive: true, dob: '12-AUG-1962', maritalStatus: 'WIDOW', age: 64 }
                    ]).map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono">{i + 1}</td>
                        <td className="p-2 font-bold text-slate-800">{f.relationType}</td>
                        <td className="p-2 font-semibold text-slate-900">{f.name}</td>
                        <td className="p-2 text-center font-bold">
                          {f.isAlive === true || f.isAlive === 'true' || f.isAlive === 'YES' ? (
                            <span className="text-emerald-700">YES</span>
                          ) : (
                            <span className="text-slate-400">NO</span>
                          )}
                        </td>
                        <td className="p-2 font-mono">{f.dob || 'N/A'}</td>
                        <td className="p-2">{f.maritalStatus || 'N/A'}</td>
                        <td className="p-2 text-center font-mono">{f.age || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nominations Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Family Nominations (NPS / Gratuity / GIS)
              </h4>
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-blue-900 text-white font-bold">
                    <tr>
                      <th className="p-2 w-12 text-center">Sl</th>
                      <th className="p-2">Relationship</th>
                      <th className="p-2">Nominee Name</th>
                      <th className="p-2 text-center">Alive</th>
                      <th className="p-2 text-right">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(serviceBook.nomineesTable || (serviceBook.nominations || []).map(n => ({
                      relationType: n.relation?.toUpperCase(),
                      name: n.nomineeName,
                      isAlive: 'YES',
                      sharePercent: n.sharePercent
                    }))).map((n: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono">{i + 1}</td>
                        <td className="p-2 font-bold text-slate-800">{n.relationType || n.relation || 'N/A'}</td>
                        <td className="p-2 font-semibold text-slate-900">{n.name || n.nomineeName || 'N/A'}</td>
                        <td className="p-2 text-center font-bold text-emerald-700">YES</td>
                        <td className="p-2 text-right font-mono font-bold text-blue-900">{n.sharePercent || 100}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between font-sans">
              <span>Page 3 of 5</span>
              <span>HRMS Odisha Portal • Bio-Data Ledger</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PAGE 4: CHRONOLOGICAL SERVICE BOOK ENTRIES (HRMS-SB-04) */}
          {/* ======================================================== */}
          <div
            id="page-4"
            className="bg-[#FFFDF9] text-slate-900 p-8 sm:p-12 rounded-3xl border-4 border-slate-800 shadow-2xl relative font-sans max-w-4xl mx-auto print:border-2 print:shadow-none print:p-6 space-y-6"
          >
            <div className="flex items-center justify-between border-b-2 border-red-900 pb-3 text-xs text-slate-500 uppercase tracking-wider font-bold">
              <span className="text-red-900">HRMS-SB-04</span>
              <span>PART - II : CHRONOLOGICAL SERVICE BOOK ENTRIES</span>
              <span className="text-red-800 font-mono">CONFIDENTIAL</span>
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-blue-950 uppercase tracking-wider">
                Ledger of Postings, Relieve, Joining, Promotions, Increments & Disciplinary Orders
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every event authenticated with respective Government order number and attesting authority
              </p>
            </div>

            {/* Official Entries Ledger Table */}
            <div className="overflow-x-auto border-2 border-slate-300 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-blue-900 text-white font-bold">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Sl</th>
                    <th className="p-2.5 w-32">Post / Cadre Scale</th>
                    <th className="p-2.5 w-24">Pay (Rs.)</th>
                    <th className="p-2.5 w-24">W.E.F.</th>
                    <th className="p-2.5">Events / Government Orders Particulars</th>
                    <th className="p-2.5 w-28 text-center">Attestation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(serviceBook.officialEntries && serviceBook.officialEntries.length > 0
                    ? serviceBook.officialEntries
                    : [
                        {
                          entryType: 'JOINING' as const,
                          postCadreScale: employee.designation.toUpperCase(),
                          pay: `Rs. ${employee.basicPay}/- (${employee.payLevel || 'Level-9'})`,
                          wef: employee.dateOfJoining,
                          entryText: `JOINED AS ${employee.designation.toUpperCase()} IN ${employee.office.toUpperCase()} ON ${employee.dateOfJoining} (FN).`,
                          noteText: `ENTRY TAKEN ON ${employee.dateOfJoining}`,
                          entryDate: employee.dateOfJoining,
                          orderNumber: `ESTT/GOVT/${employee.dateOfJoining?.slice(0, 4)}/1102`,
                          orderDate: employee.dateOfJoining
                        }
                      ]
                  ).map((entry, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/50 transition-colors align-top">
                      <td className="p-2.5 text-center font-mono font-bold text-slate-600 bg-slate-50">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{entry.postCadreScale || employee.designation.toUpperCase()}</td>
                      <td className="p-2.5 font-mono text-slate-800">{entry.pay || `Rs. ${employee.basicPay}/-`}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-900">{entry.wef || 'N/A'}</td>
                      <td className="p-2.5 space-y-1.5">
                        <p className="text-slate-800 leading-relaxed font-serif text-[11.5px]">
                          {entry.entryText}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono pt-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                            {entry.noteText || `ENTRY TAKEN ON ${entry.entryDate || ''}`}
                          </span>
                          {entry.orderNumber && (
                            <span className="text-blue-800">
                              Order: <strong className="text-slate-900">{entry.orderNumber}</strong> dt. {entry.orderDate || ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-center bg-slate-50/70">
                        <span className="text-[10px] text-emerald-800 font-bold block">Verified</span>
                        <span className="text-[9px] text-slate-400 italic block font-mono mt-0.5">SD/- DDO</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between font-sans">
              <span>Page 4 of 5</span>
              <span>HRMS Odisha Portal • Official Entries Ledger</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PAGE 5: EARNED LEAVE ACCOUNT REGISTER (HRMS-SB-05) */}
          {/* ======================================================== */}
          <div
            id="page-5"
            className="bg-[#FFFDF9] text-slate-900 p-8 sm:p-12 rounded-3xl border-4 border-slate-800 shadow-2xl relative font-sans max-w-4xl mx-auto print:border-2 print:shadow-none print:p-6 space-y-6"
          >
            <div className="flex items-center justify-between border-b-2 border-red-900 pb-3 text-xs text-slate-500 uppercase tracking-wider font-bold">
              <span className="text-red-900">HRMS-SB-05</span>
              <span>PART - III : EARNED LEAVE ACCOUNT REGISTER</span>
              <span className="text-red-800 font-mono">CONFIDENTIAL</span>
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-blue-950 uppercase tracking-wider">
                Earned Leave (EL) Credit & Availment Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Maintained under Rule 152-160 of the Odisha Leave Rules / Odisha Service Code
              </p>
            </div>

            {/* Leave Account Table */}
            <div className="overflow-x-auto border-2 border-slate-300 rounded-xl">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-blue-900 text-white font-bold">
                  <tr>
                    <th rowSpan={2} className="p-2 border-r border-blue-800 w-36 text-left">Duty Period (From - To)</th>
                    <th colSpan={5} className="p-1.5 border-b border-r border-blue-800">Leave Credit</th>
                    <th colSpan={2} className="p-1.5 border-b border-r border-blue-800">Leave Availed</th>
                    <th rowSpan={2} className="p-2 border-r border-blue-800 w-20">Balance at Credit</th>
                    <th rowSpan={2} className="p-2 w-24">Attestation</th>
                  </tr>
                  <tr className="bg-blue-950 text-[11px]">
                    <th className="p-1.5 border-r border-blue-800 w-12">Months</th>
                    <th className="p-1.5 border-r border-blue-800 w-12">Credit</th>
                    <th className="p-1.5 border-r border-blue-800 w-12">EOL</th>
                    <th className="p-1.5 border-r border-blue-800 w-12">Deducted</th>
                    <th className="p-1.5 border-r border-blue-800 w-12">Total</th>
                    <th className="p-1.5 border-r border-blue-800">Period</th>
                    <th className="p-1.5 border-r border-blue-800 w-10">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(serviceBook.earnedLeaveAccount && serviceBook.earnedLeaveAccount.length > 0
                    ? serviceBook.earnedLeaveAccount
                    : [
                        {
                          periodFrom: '01-JAN-2025',
                          periodTo: '30-JUN-2025',
                          completedMonths: 6,
                          leaveCreditDays: 15,
                          eolAvailed: 0,
                          elDeducted: 0,
                          balanceReturnFromLeave: 120,
                          availedFrom: undefined,
                          availedTo: undefined,
                          availedTotal: 0,
                          balanceLeave: 120
                        }
                      ]
                  ).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 font-mono">
                      <td className="p-2 text-left font-bold text-slate-800 border-r border-slate-200">{r.periodFrom} to {r.periodTo}</td>
                      <td className="p-2 border-r border-slate-200">{r.completedMonths}</td>
                      <td className="p-2 border-r border-slate-200 text-emerald-700 font-bold">+{r.leaveCreditDays}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-400">{r.eolAvailed}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-400">{r.elDeducted}</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-800 bg-slate-50">{r.balanceReturnFromLeave}</td>
                      <td className="p-2 border-r border-slate-200 text-[11px] font-sans">
                        {r.availedFrom ? `${r.availedFrom} to ${r.availedTo}` : <span className="text-slate-400 font-mono">NIL</span>}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-bold text-red-800">{r.availedTotal}</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-blue-900 bg-amber-50">{r.balanceLeave}</td>
                      <td className="p-2 text-[10px] text-slate-500 font-sans italic">Attested (SD/-)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Annual Reconciliation Certificate */}
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-xs font-sans text-slate-700 leading-relaxed">
              <p className="font-bold text-blue-900 mb-1">
                ANNUAL VERIFICATION & RECONCILIATION CERTIFICATE:
              </p>
              <p>
                Certified that the leave account has been reconciled with attendance sheets, casual leave registers, and sanction orders for the period ending 31st March. The balance standing at credit has been duly verified and found correct.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-300 flex justify-between font-bold text-[11px] text-slate-800">
                <span>Signature of Dealing Assistant: ............................</span>
                <span>Signature & Seal of DDO / Head of Office: ............................</span>
              </div>
            </div>

            <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between font-sans">
              <span>Page 5 of 5</span>
              <span>HRMS Odisha Portal • Earned Leave Ledger</span>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: TABBED SECTION VIEW */}
      {viewMode === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Nav */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1 print:hidden h-fit">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
              Service Book Sections
            </p>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{sec.name}</span>
                  </div>
                  {sec.pageNum && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      Pg {sec.pageNum}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section Content Display */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-md min-h-[500px]">
            {activeSection === 'page1' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Page 1: Front Cover & Key Identifiers
                  </h3>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    HRMS-SB-01
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div><span className="text-slate-400 font-semibold">Employee ID:</span> <span className="font-bold font-mono text-red-700">{employee.employeeId}</span></div>
                  <div><span className="text-slate-400 font-semibold">Employee Name:</span> <span className="font-bold text-slate-900">{(serviceBook.employeeName || employee.name).toUpperCase()}</span></div>
                  <div><span className="text-slate-400 font-semibold">Designation:</span> <span className="font-bold text-slate-800">{employee.designation}</span></div>
                  <div><span className="text-slate-400 font-semibold">Cadre:</span> <span className="font-bold text-slate-800">{employee.cadre || 'Odisha Subordinate Service'}</span></div>
                  <div><span className="text-slate-400 font-semibold">PRAN No.:</span> <span className="font-mono font-bold text-slate-800">{serviceBook.pranNo || employee.gpfNpsNo || 'N/A'}</span></div>
                  <div><span className="text-slate-400 font-semibold">GPF No.:</span> <span className="font-mono text-slate-800">{serviceBook.gpfNo || 'N/A'}</span></div>
                  <div><span className="text-slate-400 font-semibold">Date of Joining (Govt):</span> <span className="font-mono font-bold text-slate-800">{serviceBook.dateOfEntryGovtService || employee.dateOfJoining}</span></div>
                  <div><span className="text-slate-400 font-semibold">Superannuation Date:</span> <span className="font-mono font-bold text-blue-800">{serviceBook.retirementDetails?.superannuationDate || '2048-05-31'}</span></div>
                  <div className="md:col-span-2"><span className="text-slate-400 font-semibold">Office:</span> <span className="font-bold text-slate-800">{employee.office}</span></div>
                </div>
              </div>
            )}

            {activeSection === 'page2' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Page 2: Official Divider & Statutory Guidelines
                  </h3>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    HRMS-SB-02
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
                  <p className="font-bold text-blue-900">Statutory Rules for Custody under Rule 123 OSC:</p>
                  <p className="text-slate-600">The Service Book is an official authenticated ledger of Government service. All entries of appointment, promotions, pay increments, leave account, and nominations are legally binding.</p>
                </div>
              </div>
            )}

            {activeSection === 'page3' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Page 3: Bio-Data, Identifiers & Family Record
                  </h3>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    HRMS-SB-03
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div><span className="text-slate-400 font-semibold">Blood Group:</span> <span className="font-bold text-slate-800">{p.bloodGroup}</span></div>
                  <div><span className="text-slate-400 font-semibold">Height:</span> <span className="font-bold text-slate-800">{p.heightCm} cm</span></div>
                  <div><span className="text-slate-400 font-semibold">Identification Mark:</span> <span className="font-bold text-slate-800">{p.identificationMark}</span></div>
                  <div><span className="text-slate-400 font-semibold">Marital Status:</span> <span className="font-bold text-slate-800">{p.maritalStatus}</span></div>
                  <div className="md:col-span-2"><span className="text-slate-400 font-semibold">Permanent Address:</span> <span className="font-bold text-slate-800">{p.permanentAddress}</span></div>
                </div>
              </div>
            )}

            {activeSection === 'page4' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Page 4: Chronological Service Book Entries
                  </h3>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    HRMS-SB-04
                  </span>
                </div>
                <div className="space-y-2">
                  {(serviceBook.officialEntries || []).map((e, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between items-center font-bold text-slate-900 mb-1">
                        <span className="text-indigo-700">{e.entryType}</span>
                        <span className="font-mono text-slate-500">{e.wef}</span>
                      </div>
                      <p className="text-slate-700">{e.entryText}</p>
                      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{e.noteText}</span>
                        <span>Order: {e.orderNumber} ({e.orderDate})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'page5' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Page 5: Earned Leave Account Register
                  </h3>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    HRMS-SB-05
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700">
                        <th className="p-2">Period</th>
                        <th className="p-2 text-center">Months</th>
                        <th className="p-2 text-center">Credit</th>
                        <th className="p-2 text-center">Availed</th>
                        <th className="p-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(serviceBook.earnedLeaveAccount || []).map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 font-mono font-bold">{r.periodFrom} to {r.periodTo}</td>
                          <td className="p-2 text-center font-mono">{r.completedMonths}</td>
                          <td className="p-2 text-center font-mono text-emerald-700 font-bold">+{r.leaveCreditDays}</td>
                          <td className="p-2 text-center font-mono text-red-700">{r.availedTotal}</td>
                          <td className="p-2 text-right font-mono font-bold text-blue-900">{r.balanceLeave}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === 'qualifications' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Educational & Professional Qualifications
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5">Degree / Certificate</th>
                        <th className="p-2.5">Institution / Board</th>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5">Division / Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {serviceBook.qualifications.map((q, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-800">{q.degree}</td>
                          <td className="p-2.5">{q.institution}</td>
                          <td className="p-2.5 font-mono">{q.year}</td>
                          <td className="p-2.5 text-emerald-600 font-semibold">{q.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === 'postings' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Posting & Transfer History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5">Office & District</th>
                        <th className="p-2.5">Designation</th>
                        <th className="p-2.5">Start Date</th>
                        <th className="p-2.5">End Date</th>
                        <th className="p-2.5">Order Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {serviceBook.postingHistory.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-800">{p.office}, {p.district}</td>
                          <td className="p-2.5 text-sky-700 font-semibold">{p.designation}</td>
                          <td className="p-2.5 font-mono">{p.startDate}</td>
                          <td className="p-2.5 font-mono">{p.endDate}</td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-500">{p.orderNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === 'promotions' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Cadre Promotion History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5">Previous Post</th>
                        <th className="p-2.5">Promoted Designation</th>
                        <th className="p-2.5">Pay Level</th>
                        <th className="p-2.5">Effective Date</th>
                        <th className="p-2.5">Order Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {serviceBook.promotionHistory.map((pr, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-slate-600">{pr.oldDesignation}</td>
                          <td className="p-2.5 font-bold text-emerald-600">{pr.newDesignation}</td>
                          <td className="p-2.5 font-semibold">{pr.payLevel}</td>
                          <td className="p-2.5 font-mono">{pr.effectiveDate}</td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-500">{pr.orderNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === 'increments' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Annual Increment History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5">Previous Basic</th>
                        <th className="p-2.5">Increment Amt</th>
                        <th className="p-2.5">Revised Basic Pay</th>
                        <th className="p-2.5">Effective Date</th>
                        <th className="p-2.5">Order Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {serviceBook.incrementHistory.map((inc, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono">₹{inc.currentBasic.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 font-mono text-emerald-600 font-semibold">+₹{inc.incrementAmount.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">₹{inc.revisedBasic.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 font-mono">{inc.effectiveDate}</td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-500">{inc.orderRef}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === 'trainings' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  In-Service Training Programs
                </h3>
                <div className="space-y-2">
                  {serviceBook.trainingHistory.map((t, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <h4 className="font-bold text-slate-800">{t.title}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">{t.institute}</p>
                      <p className="text-sky-600 font-mono text-[10px] mt-1">{t.fromDate} to {t.toDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'nominations' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Family & Pension Nominations
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5">Nomination Type</th>
                        <th className="p-2.5">Nominee Name</th>
                        <th className="p-2.5">Relationship</th>
                        <th className="p-2.5">Share %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {serviceBook.nominations.map((n, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-indigo-600">{n.type}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{n.nomineeName}</td>
                          <td className="p-2.5">{n.relation}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-600">{n.sharePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === 'retirement' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  Superannuation & Pension Scheme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div><span className="text-slate-400 font-semibold">Date of Superannuation:</span> <span className="font-bold text-slate-800">{serviceBook.retirementDetails?.superannuationDate || '2048-05-31'}</span></div>
                  <div><span className="text-slate-400 font-semibold">Pension Scheme:</span> <span className="font-bold text-slate-800">{serviceBook.retirementDetails?.pensionType || 'National Pension System (NPS)'}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
