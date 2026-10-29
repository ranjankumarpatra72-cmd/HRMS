import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  User,
  ShieldCheck,
  Edit,
  Download,
  History,
  AlertCircle,
  FileText,
  CheckCircle2,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';

export const ProfileModule: React.FC = () => {
  const { employee, user, addToast } = useAuth();
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [fieldName, setFieldName] = useState('mobile');
  const [requestedValue, setRequestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!employee) return null;

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedValue || !reason) {
      addToast('error', 'Incomplete Form', 'Please enter requested value and reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentValueMap: Record<string, string> = {
        mobile: employee.mobile,
        email: employee.email,
        panNumber: employee.panNumber,
        fatherName: employee.fatherName,
        currentPosting: employee.currentPosting
      };

      const res = await apiFetch('/api/profile/correction-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName,
          currentValue: currentValueMap[fieldName] || 'N/A',
          requestedValue,
          reason
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast('success', 'Request Created', data.message);
        setShowCorrectionModal(false);
        setRequestedValue('');
        setReason('');
      } else {
        addToast('error', 'Submission Failed', data.message);
      }
    } catch (e) {
      addToast('error', 'Error', 'Failed to communicate with server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadProfilePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PANCHAYATI RAJ & DRINKING WATER DEPARTMENT', 14, 20);
    doc.setFontSize(11);
    doc.text('Government of Odisha, Bhubaneswar - Employee Profile Summary', 14, 27);

    doc.setFontSize(12);
    doc.text(`Employee ID: ${employee.employeeId}`, 14, 40);
    doc.text(`Full Name: ${employee.name}`, 14, 48);
    doc.text(`Designation: ${employee.designation}`, 14, 56);
    doc.text(`Department: ${employee.department}`, 14, 64);
    doc.text(`Office: ${employee.office}`, 14, 72);
    doc.text(`District: ${employee.district}`, 14, 80);
    doc.text(`Date of Joining: ${employee.dateOfJoining}`, 14, 88);
    doc.text(`Basic Pay: Rs ${employee.basicPay}`, 14, 96);
    doc.text(`PAN Number: ${employee.panNumber}`, 14, 104);
    doc.text(`GPF/NPS No: ${employee.gpfNpsNo}`, 14, 112);

    doc.save(`Profile_${employee.employeeId}.pdf`);
    addToast('success', 'PDF Downloaded', `Profile_${employee.employeeId}.pdf saved.`);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-800">
              Employee Official Profile
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master HRMS service record and employment credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            Request Correction
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-3.5 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            View History
          </button>

          <button
            onClick={downloadProfilePDF}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Personal & Service Particulars
          </h3>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Record Verified
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Employee ID</span>
            <p className="font-bold text-slate-800 text-sm font-mono">{employee.employeeId}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Full Name</span>
            <p className="font-bold text-slate-800 text-sm">{employee.name}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Father / Guardian Name</span>
            <p className="font-bold text-slate-800">{employee.fatherName}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Date of Birth</span>
            <p className="font-bold text-slate-800">{employee.dob}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Gender</span>
            <p className="font-bold text-slate-800">{employee.gender}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Registered Mobile</span>
            <p className="font-bold text-slate-800 font-mono">{employee.mobile}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Email Address</span>
            <p className="font-bold text-slate-800 font-mono">{employee.email}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Designation</span>
            <p className="font-bold text-sky-700 text-sm">{employee.designation}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Cadre</span>
            <p className="font-bold text-slate-800">{employee.cadre}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Department</span>
            <p className="font-bold text-slate-800">{employee.department}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Office Name</span>
            <p className="font-bold text-slate-800">{employee.office}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">District & Block</span>
            <p className="font-bold text-slate-800">{employee.district}, {employee.block}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Date of Joining</span>
            <p className="font-bold text-slate-800">{employee.dateOfJoining}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Employment Type</span>
            <p className="font-bold text-slate-800">{employee.employmentType}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Current Posting Branch</span>
            <p className="font-bold text-slate-800">{employee.currentPosting}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">PAN & GPF/NPS</span>
            <p className="font-bold text-slate-800 font-mono">{employee.panNumber} / {employee.gpfNpsNo}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Reporting Officer</span>
            <p className="font-bold text-slate-800">{employee.reportingOfficerName}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Service Status</span>
            <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[11px]">
              {employee.status}
            </span>
          </div>
        </div>
      </div>

      {/* Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-500" />
                Request Profile Correction
              </h3>
              <button onClick={() => setShowCorrectionModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4 leading-relaxed">
              Protected employment information cannot be edited directly. Submission will generate an official correction request to Establishment Officer for review.
            </p>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Field to Correct
                </label>
                <select
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="mobile">Registered Mobile Number</option>
                  <option value="email">Official Email Address</option>
                  <option value="panNumber">PAN Card Number</option>
                  <option value="fatherName">Father/Guardian Name</option>
                  <option value="currentPosting">Current Posting Branch</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Requested New Value
                </label>
                <input
                  type="text"
                  value={requestedValue}
                  onChange={(e) => setRequestedValue(e.target.value)}
                  placeholder="Enter corrected value"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason & Justification
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide supporting document reference or explanation..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Submit Correction Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-sky-500" />
                Profile Audit & Modification History
              </h3>
              <button onClick={() => setShowHistoryModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs max-h-60 overflow-y-auto pr-1">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Initial Master Profile Verified</span>
                  <span className="text-[10px] text-slate-400 font-mono">2014-07-15</span>
                </div>
                <p className="text-slate-500 text-[11px] mt-1">Verified during initial appointment and service book creation.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Cadre Promotion Updated</span>
                  <span className="text-[10px] text-slate-400 font-mono">2018-10-01</span>
                </div>
                <p className="text-slate-500 text-[11px] mt-1">Designation upgraded to Senior Assistant under DHE Order 8890.</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
