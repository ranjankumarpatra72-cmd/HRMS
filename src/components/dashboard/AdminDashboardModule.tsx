import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Search,
  Activity,
  Key,
  User,
  Building,
  MapPin,
  AlertCircle,
  BadgeCheck,
  Edit,
  Power,
  KeyRound,
  FileText,
  Upload,
  CheckCircle2,
  X,
  Building2,
  Briefcase,
  Database,
  Download,
  RefreshCw,
  Archive,
  RotateCcw,
  History,
  FileCheck,
  HardDrive,
  Mail
} from 'lucide-react';
import { Employee, AuditLog, LocationSelection, OfficeMaster, DatabaseBackupInfo } from '../../types/index';
import { OdishaLocationSelector } from '../common/OdishaLocationSelector';
import { CommunicationModule } from './CommunicationModule';
import {
  getEmployeesFromFirestore,
  createEmployeeInFirestore,
  updateEmployeeInFirestore,
  deactivateEmployeeInFirestore,
  subscribeEmployees,
  migrateExistingDataToFirestore
} from '../../services/firestoreService';

export const AdminDashboardModule: React.FC = () => {
  const { user, token, addToast, showProcessing, hideProcessing } = useAuth();
  const [activeTab, setActiveTab] = useState<'employees' | 'create_emp' | 'departments' | 'offices' | 'audit_logs' | 'database_backup' | 'communication'>('employees');
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'DEACTIVATED'>('ALL');
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [cloudStatus, setCloudStatus] = useState<'CONNECTED' | 'SYNCING' | 'ERROR'>('CONNECTED');

  // Database Backup State
  const [backupsList, setBackupsList] = useState<DatabaseBackupInfo[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [restoreConfirmFile, setRestoreConfirmFile] = useState<string | null>(null);

  // Modals state
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);
  const [empToResetPassword, setEmpToResetPassword] = useState<Employee | null>(null);
  const [newPasswordForReset, setNewPasswordForReset] = useState('Password123!');
  const [empToEdit, setEmpToEdit] = useState<Employee | null>(null);
  const [createdEmpSuccess, setCreatedEmpSuccess] = useState<{ employee: Employee; password?: string } | null>(null);

  const getAuthHeaders = () => {
    const currentToken = token || localStorage.getItem('hrms_demo_token');
    return {
      'Content-Type': 'application/json',
      ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
    };
  };

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editOffice, setEditOffice] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBasicPay, setEditBasicPay] = useState(0);
  const [editPayLevel, setEditPayLevel] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'DEACTIVATED' | 'SUSPENDED' | 'RETIRED'>('ACTIVE');

  // Form Error Banner
  const [formError, setFormError] = useState('');

  // Helper to generate fresh random ID
  const generateUniqueEmpId = () => `EMP${Math.floor(100000 + Math.random() * 900000)}`;

  // New Employee Form States - All Details
  const [newEmpId, setNewEmpId] = useState(generateUniqueEmpId());
  const [newPassword, setNewPassword] = useState('Password123!');
  const [role, setRole] = useState<'EMPLOYEE' | 'REPORTING_OFFICER' | 'DDO' | 'SUPER_ADMIN'>('EMPLOYEE');

  // Personal Details
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('1994-05-15');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [mobile, setMobile] = useState('+91 ');
  const [email, setEmail] = useState('');

  // Service Details
  const [designation, setDesignation] = useState('Assistant Section Officer');
  const [cadre, setCadre] = useState('Odisha State Civil Service');
  const [department, setDepartment] = useState('Panchayati Raj & Drinking Water Department');
  const [office, setOffice] = useState('Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar');
  const [district, setDistrict] = useState('Khordha');
  const [block, setBlock] = useState('Bhubaneswar MC');

  // Location Hierarchy Selection State
  const [empLocation, setEmpLocation] = useState<LocationSelection>({
    state: 'Odisha',
    districtId: 'DIST_KHO',
    districtName: 'Khordha',
    blockId: 'BLK_BBSR',
    blockName: 'Bhubaneswar MC',
    gpId: 'GP_RAG',
    gpName: 'Raghunathpur',
    villageId: 'VIL_RAG_VIL',
    villageName: 'Raghunathpur Village'
  });

  // Offices Master List State
  const [officesList, setOfficesList] = useState<OfficeMaster[]>([]);
  const [showAddOfficeModal, setShowAddOfficeModal] = useState(false);
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeCode, setNewOfficeCode] = useState('');
  const [newOfficeDept, setNewOfficeDept] = useState('Panchayati Raj & Drinking Water Department');
  const [newOfficePincode, setNewOfficePincode] = useState('751001');
  const [officeLocation, setOfficeLocation] = useState<LocationSelection>({
    state: 'Odisha',
    districtId: 'DIST_KHO',
    districtName: 'Khordha',
    blockId: 'BLK_BBSR',
    blockName: 'Bhubaneswar MC',
    gpId: 'GP_RAG',
    gpName: 'Raghunathpur',
    villageId: 'VIL_RAG_VIL',
    villageName: 'Raghunathpur Village'
  });
  const [dateOfJoining, setDateOfJoining] = useState('2022-01-10');
  const [employmentType, setEmploymentType] = useState<'PERMANENT' | 'CONTRACTUAL' | 'PROBATION'>('PERMANENT');

  // Financial & Salary Details
  const [payLevel, setPayLevel] = useState('Level-9');
  const [basicPay, setBasicPay] = useState(44900);
  const [panNumber, setPanNumber] = useState('');
  const [gpfNpsNo, setGpfNpsNo] = useState('');
  const [reportingOfficerName, setReportingOfficerName] = useState('Priyanka Mohanty (RO)');

  // File Upload Previews
  const [photoFileName, setPhotoFileName] = useState('');
  const [docFileName, setDocFileName] = useState('');

  const fetchBackupsList = async () => {
    try {
      const res = await fetch('/api/admin/database/backups-list', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setBackupsList(data.backups || []);
      }
    } catch (e) {
      console.error('Failed to fetch backups', e);
    }
  };

  const fetchAdminData = async () => {
    try {
      setIsCloudLoading(true);
      // Fetch directly from Firestore cloud database
      const cloudEmployees = await getEmployeesFromFirestore().catch(() => []);
      if (cloudEmployees && cloudEmployees.length > 0) {
        setEmployeesList(cloudEmployees);
        setCloudStatus('CONNECTED');
      }

      const headers = getAuthHeaders();
      const [empRes, logRes, offRes, bkpRes] = await Promise.all([
        fetch('/api/admin/employees', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
        fetch('/api/master/offices', { headers }),
        fetch('/api/admin/database/backups-list', { headers })
      ]);

      const empData = await empRes.json();
      const logData = await logRes.json();
      const offData = await offRes.json();
      const bkpData = await bkpRes.json();

      if (empData.success && empData.employees) {
        // Merge with cloud employees prioritizing cloud records
        if (!cloudEmployees || cloudEmployees.length === 0) {
          setEmployeesList(empData.employees);
        }
      }
      if (logData.success) setAuditLogs(logData.logs);
      if (offData.success) setOfficesList(offData.offices);
      if (bkpData.success) setBackupsList(bkpData.backups || []);
    } catch (e) {
      addToast('error', 'Error', 'Failed to load DDO workspace data.');
    } finally {
      setIsCloudLoading(false);
    }
  };

  useEffect(() => {
    setIsCloudLoading(true);
    // 1. Initial migration check
    migrateExistingDataToFirestore().catch((err) => console.warn('Migration note:', err));

    // 2. Real-time Firestore synchronization
    const unsubscribe = subscribeEmployees(
      (realtimeEmps) => {
        if (realtimeEmps && realtimeEmps.length > 0) {
          setEmployeesList(realtimeEmps);
          setCloudStatus('CONNECTED');
        }
        setIsCloudLoading(false);
      },
      (err) => {
        console.warn('Firestore real-time subscription status:', err);
        setIsCloudLoading(false);
      }
    );

    // 3. Load other administrative masters
    fetchAdminData();

    return () => {
      unsubscribe();
    };
  }, []);

  // Update email automatically when employee ID changes
  useEffect(() => {
    if (newEmpId) {
      setEmail(`${newEmpId.toLowerCase()}@hrmsodisha.gov.in`);
    }
  }, [newEmpId]);

  const resetForm = () => {
    setNewEmpId(generateUniqueEmpId());
    setNewPassword('Password123!');
    setRole('EMPLOYEE');
    setName('');
    setFatherName('');
    setMotherName('');
    setDob('1994-05-15');
    setGender('MALE');
    setMobile('+91 ');
    setDesignation('Assistant Section Officer');
    setCadre('Odisha State Civil Service');
    setDepartment('Panchayati Raj & Drinking Water Department');
    setOffice('Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar');
    setDistrict('Khordha');
    setBlock('Bhubaneswar MC');
    setDateOfJoining('2022-01-10');
    setEmploymentType('PERMANENT');
    setPayLevel('Level-9');
    setBasicPay(44900);
    setPanNumber('');
    setGpfNpsNo('');
    setReportingOfficerName('Priyanka Mohanty (RO)');
    setPhotoFileName('');
    setDocFileName('');
    setFormError('');
  };

  const handleCreateEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Full Employee Name is required.');
      return;
    }

    if (!newEmpId.trim()) {
      setFormError('Employee HRMS ID is required.');
      return;
    }

    const cleanEmpId = newEmpId.trim().toUpperCase();

    // Check unique employee ID
    const isDuplicate = employeesList.some(
      (emp) => emp.employeeId && emp.employeeId.trim().toUpperCase() === cleanEmpId
    );
    if (isDuplicate) {
      setFormError(`Employee ID ${cleanEmpId} already exists in database. Please enter a unique Employee ID.`);
      addToast('error', 'Duplicate ID', `Employee ID ${cleanEmpId} already exists in cloud database.`);
      return;
    }

    // Validate mobile number
    const mobileDigits = mobile.replace(/[^0-9]/g, '');
    if (mobileDigits.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      addToast('warning', 'Validation Error', 'Mobile number must have at least 10 digits.');
      return;
    }

    // Validate email
    if (email && !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      addToast('warning', 'Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (!newPassword.trim()) {
      setFormError('Initial Password is required.');
      return;
    }

    showProcessing('Saving employee...');
    setCloudStatus('SYNCING');

    try {
      // 1. Direct Cloud Database save to Firestore
      const newEmpPayload: Partial<Employee> = {
        employeeId: cleanEmpId,
        name: name.trim(),
        employeeName: name.trim(),
        fatherName: fatherName.trim() || 'N/A',
        motherName: motherName.trim() || 'N/A',
        dob,
        dateOfBirth: dob,
        gender,
        mobile: mobile.trim(),
        mobileNumber: mobile.trim(),
        email: email.trim(),
        designation: designation.trim(),
        cadre: cadre.trim(),
        department: department.trim(),
        office: office.trim(),
        district: empLocation.districtName || district,
        districtId: empLocation.districtId,
        block: empLocation.blockName || block,
        blockId: empLocation.blockId,
        gp: empLocation.gpName,
        gramPanchayat: empLocation.gpName,
        village: empLocation.villageName,
        dateOfJoining,
        joiningDate: dateOfJoining,
        employmentType,
        currentPosting: office.trim(),
        postingPlace: office.trim(),
        status: 'ACTIVE',
        employeeStatus: 'Active',
        payLevel,
        basicPay,
        panNumber,
        gpfNpsNo,
        reportingOfficerName,
        ddoId: user?.employeeId || 'EMP20267858',
        createdByDDO: user?.employeeId || 'EMP20267858'
      };

      const firestoreRecord = await createEmployeeInFirestore(newEmpPayload);

      // 2. Also register in backend server for authentication and session management
      try {
        await fetch('/api/admin/employees/create', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            employeeId: cleanEmpId,
            password: newPassword,
            role,
            name: name.trim(),
            fatherName: fatherName.trim(),
            motherName: motherName.trim(),
            dob,
            gender,
            mobile: mobile.trim(),
            email: email.trim(),
            designation: designation.trim(),
            cadre: cadre.trim(),
            department: department.trim(),
            office: office.trim(),
            district: empLocation.districtName || district,
            districtId: empLocation.districtId,
            block: empLocation.blockName || block,
            blockId: empLocation.blockId,
            gpName: empLocation.gpName,
            gpId: empLocation.gpId,
            villageName: empLocation.villageName,
            villageId: empLocation.villageId,
            dateOfJoining,
            employmentType,
            payLevel,
            basicPay,
            panNumber,
            gpfNpsNo,
            reportingOfficerName
          })
        });
      } catch (backendErr) {
        console.warn('Backend provisioning note:', backendErr);
      }

      hideProcessing();
      setCloudStatus('CONNECTED');
      addToast('success', 'Employee Saved', 'Employee successfully created and permanently saved.');
      setCreatedEmpSuccess({ employee: firestoreRecord, password: newPassword });
      setActiveTab('employees');
      resetForm();
      fetchAdminData();
    } catch (e: any) {
      hideProcessing();
      setCloudStatus('ERROR');
      const msg = e?.message || 'Unable to save employee data. Please try again.';
      setFormError(msg);
      addToast('error', 'Database Error', 'Unable to save employee data. Please try again.');
    }
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficeName.trim()) {
      addToast('error', 'Office Name Required', 'Please enter office name.');
      return;
    }

    showProcessing('Registering and Mapping Office...');
    try {
      const res = await fetch('/api/admin/master/office', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newOfficeName,
          code: newOfficeCode || `OFF_${Math.floor(100 + Math.random() * 900)}`,
          department: newOfficeDept,
          districtId: officeLocation.districtId,
          districtName: officeLocation.districtName,
          blockId: officeLocation.blockId,
          blockName: officeLocation.blockName,
          gpId: officeLocation.gpId,
          gpName: officeLocation.gpName,
          villageId: officeLocation.villageId,
          villageName: officeLocation.villageName,
          pincode: newOfficePincode
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Office Registered', data.message);
        setShowAddOfficeModal(false);
        setNewOfficeName('');
        setNewOfficeCode('');
        fetchAdminData();
      } else {
        addToast('error', 'Failed', data.message);
      }
    } catch (err) {
      hideProcessing();
      addToast('error', 'Error', 'Failed to save office.');
    }
  };

  const handleDeleteEmp = async () => {
    if (!empToDelete) return;
    showProcessing(`Safely deactivating employee ${empToDelete.name} (${empToDelete.employeeId})...`);

    try {
      // 1. Soft-delete / deactivate in Cloud Firestore
      await deactivateEmployeeInFirestore(empToDelete.employeeId);

      // 2. Sync with backend
      const res = await fetch(`/api/admin/employees/${empToDelete.employeeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      hideProcessing();

      addToast('success', 'Employee Deactivated Safely', `Employee ${empToDelete.name} (${empToDelete.employeeId}) has been safely deactivated. Records preserved in cloud database.`);
      setEmpToDelete(null);
      fetchAdminData();
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to deactivate employee.');
    }
  };

  const handleDownloadDatabaseBackup = () => {
    try {
      showProcessing('Generating database JSON backup...');
      fetch('/api/admin/database/backup', { headers: getAuthHeaders() })
        .then((res) => {
          if (!res.ok) throw new Error('Download failed');
          return res.blob();
        })
        .then((blob) => {
          hideProcessing();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `hrms_odisha_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          addToast('success', 'Backup Downloaded', 'Full HRMS database backup saved successfully.');
        })
        .catch((err) => {
          hideProcessing();
          addToast('error', 'Backup Failed', 'Could not download database JSON backup.');
        });
    } catch (e) {
      hideProcessing();
      addToast('error', 'Error', 'Failed to initiate database download.');
    }
  };

  const handleCreateManualSnapshot = async () => {
    setIsBackingUp(true);
    showProcessing('Creating database snapshot point...');
    try {
      const res = await fetch('/api/admin/database/backup-now', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ label: snapshotLabel || 'manual_snapshot' })
      });
      const data = await res.json();
      hideProcessing();
      setIsBackingUp(false);
      if (data.success) {
        addToast('success', 'Snapshot Created', `Database snapshot created: ${data.filename}`);
        setSnapshotLabel('');
        fetchBackupsList();
      } else {
        addToast('error', 'Backup Failed', data.message);
      }
    } catch (e) {
      hideProcessing();
      setIsBackingUp(false);
      addToast('error', 'Server Error', 'Failed to create backup snapshot.');
    }
  };

  const handleRestoreSnapshot = async (filename: string) => {
    showProcessing(`Restoring database from snapshot ${filename}...`);
    try {
      const res = await fetch('/api/admin/database/restore', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      hideProcessing();
      setRestoreConfirmFile(null);
      if (data.success) {
        addToast('success', 'Database Restored', data.message);
        fetchAdminData();
      } else {
        addToast('error', 'Restore Failed', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to restore database.');
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    showProcessing(`Updating employee status...`);
    try {
      const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      // 1. Direct Firestore update
      await updateEmployeeInFirestore(emp.employeeId, {
        status: newStatus as any,
        employeeStatus: newStatus === 'ACTIVE' ? 'Active' : 'Inactive'
      });

      // 2. Sync with backend
      await fetch(`/api/admin/employees/${emp.employeeId}/toggle-status`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      hideProcessing();

      addToast('success', 'Status Updated', `Employee status changed to ${newStatus}.`);
      fetchAdminData();
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to update employee status in cloud database.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empToResetPassword) return;

    if (!newPasswordForReset.trim() || newPasswordForReset.length < 6) {
      addToast('error', 'Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    showProcessing(`Resetting password for ${empToResetPassword.name}...`);
    try {
      const res = await fetch(`/api/admin/employees/${empToResetPassword.employeeId}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword: newPasswordForReset })
      });
      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Password Reset Successful', data.message);
        setEmpToResetPassword(null);
        fetchAdminData();
      } else {
        addToast('error', 'Reset Failed', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to reset password.');
    }
  };

  const openEditModal = (emp: Employee) => {
    setEmpToEdit(emp);
    setEditName(emp.name);
    setEditDesignation(emp.designation);
    setEditDepartment(emp.department);
    setEditOffice(emp.office);
    setEditDistrict(emp.district);
    setEditMobile(emp.mobile);
    setEditEmail(emp.email);
    setEditBasicPay(emp.basicPay);
    setEditPayLevel(emp.payLevel);
    setEditStatus(emp.status);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empToEdit) return;

    showProcessing('Updating employee...');
    try {
      // 1. Direct Cloud Database update
      await updateEmployeeInFirestore(empToEdit.employeeId, {
        name: editName.trim(),
        employeeName: editName.trim(),
        designation: editDesignation.trim(),
        department: editDepartment.trim(),
        office: editOffice.trim(),
        district: editDistrict.trim(),
        mobile: editMobile.trim(),
        mobileNumber: editMobile.trim(),
        email: editEmail.trim(),
        basicPay: Number(editBasicPay),
        payLevel: editPayLevel,
        status: editStatus,
        employeeStatus: editStatus === 'ACTIVE' ? 'Active' : 'Inactive'
      });

      // 2. Sync with backend
      await fetch(`/api/admin/employees/${empToEdit.employeeId}/edit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editName,
          designation: editDesignation,
          department: editDepartment,
          office: editOffice,
          district: editDistrict,
          mobile: editMobile,
          email: editEmail,
          basicPay: editBasicPay,
          payLevel: editPayLevel,
          status: editStatus
        })
      });
      hideProcessing();

      addToast('success', 'Employee Updated', 'Employee updated successfully.');
      setEmpToEdit(null);
      fetchAdminData();
    } catch (e) {
      hideProcessing();
      addToast('error', 'Update Failed', 'Unable to update employee in cloud database. Please try again.');
    }
  };

  const filteredEmployees = employeesList.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Extract unique departments & offices
  const uniqueDepartments = Array.from(new Set(employeesList.map((e) => e.department)));
  const uniqueOffices = Array.from(new Set(employeesList.map((e) => e.office)));

  return (
    <div className="space-y-6">
      {/* Top Banner / Tab Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-800">
              DDO Control Panel & Establishment Management
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-slate-500">
              Drawing & Disbursing Officer (DDO) portal for employee creation, status management, password resets, and establishment audit.
            </p>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className={`w-1.5 h-1.5 rounded-full ${cloudStatus === 'SYNCING' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
              Cloud Database: {cloudStatus === 'SYNCING' ? 'Syncing...' : 'Connected (Firestore)'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'employees'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Employee List ({employeesList.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('create_emp');
              setFormError('');
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'create_emp'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            + Create Employee
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'departments'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Departments ({uniqueDepartments.length})
          </button>

          <button
            onClick={() => setActiveTab('offices')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'offices'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Offices ({uniqueOffices.length})
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'audit_logs'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Audit Trail
          </button>

          <button
            onClick={() => {
              setActiveTab('database_backup');
              fetchBackupsList();
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'database_backup'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            Database & Backups
          </button>

          <button
            onClick={() => setActiveTab('communication')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'communication'
                ? 'bg-[#e67e22] text-white shadow-md'
                : 'bg-orange-50 text-orange-900 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            <Mail className="w-4 h-4 text-orange-600" />
            Communication Center
          </button>
        </div>
      </div>

      {/* TAB 1: EMPLOYEE MASTER LIST */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-sky-600" />
              Establishment Personnel Master List ({filteredEmployees.length})
            </h3>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-bold"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
                <option value="DEACTIVATED">Deactivated Only</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, HRMS ID, dept..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">HRMS ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Designation & Cadre</th>
                  <th className="p-3">Office & Department</th>
                  <th className="p-3">Pay Level & Basic</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">DDO Management Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.employeeId} className={`hover:bg-slate-50 ${emp.status === 'DEACTIVATED' ? 'bg-slate-50/60 opacity-80' : ''}`}>
                    <td className="p-3 font-mono font-bold text-sky-600">
                      <div>{emp.employeeId}</div>
                      {emp.createdByDDO && (
                        <div className="text-[9px] text-slate-400 font-sans font-normal">DDO Managed</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{emp.name}</div>
                      <div className="text-[10px] text-slate-400">{emp.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">{emp.designation}</div>
                      <div className="text-[10px] text-slate-400">{emp.cadre}</div>
                    </td>
                    <td className="p-3">
                      <div>{emp.office}</div>
                      <div className="text-[10px] text-slate-400">{emp.department}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono font-bold text-emerald-600">₹{emp.basicPay.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-400">{emp.payLevel}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded text-[10px] inline-flex items-center gap-1 ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : emp.status === 'DEACTIVATED'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Details */}
                        <button
                          onClick={() => openEditModal(emp)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold border border-slate-300 inline-flex items-center gap-1"
                          title="Edit Details"
                        >
                          <Edit className="w-3 h-3 text-sky-600" />
                          Edit
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setEmpToResetPassword(emp);
                            setNewPasswordForReset('Password123!');
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-bold border border-amber-200 inline-flex items-center gap-1"
                          title="Reset Login Password"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          Password
                        </button>

                        {/* Toggle Active / Inactive */}
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`px-2 py-1 rounded text-[11px] font-bold border inline-flex items-center gap-1 transition-colors ${
                            emp.status === 'ACTIVE'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                          title="Toggle Active / Inactive Status"
                        >
                          <Power className="w-3 h-3 text-slate-500" />
                          {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Delete Employee */}
                        {emp.employeeId !== user?.employeeId ? (
                          <button
                            onClick={() => setEmpToDelete(emp)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-bold border border-rose-200 inline-flex items-center gap-1"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold italic">DDO</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      {isCloudLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 text-sky-600 animate-spin" />
                          <span className="font-semibold text-slate-700">Loading employee data from cloud database...</span>
                        </div>
                      ) : (
                        <span>No matching employee records found in cloud database.</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE EMPLOYEE FORM */}
      {activeTab === 'create_emp' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 max-w-4xl mx-auto text-xs space-y-6">
          <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-600" />
              Create Employee ID & Initialize Service Record
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200"
            >
              Reset Form
            </button>
          </div>

          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="font-bold block text-sm">Form Submission Error</strong>
                <span>{formError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateEmp} className="space-y-6">
            {/* SECTION 1: LOGIN CREDENTIALS */}
            <div className="bg-sky-50 p-4 sm:p-5 rounded-2xl border border-sky-200 space-y-4">
              <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-sky-600" />
                1. HRMS Login Credentials & Access Role
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Employee HRMS ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEmpId}
                      onChange={(e) => setNewEmpId(e.target.value.toUpperCase())}
                      placeholder="e.g. EMP2026101"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-bold uppercase tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setNewEmpId(generateUniqueEmpId())}
                      className="px-2.5 py-1 bg-sky-600 text-white text-[11px] font-bold rounded-lg hover:bg-sky-700 shrink-0"
                      title="Generate New Unique ID"
                    >
                      Auto ID
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    This HRMS ID will be used as Employee Login Username.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Initial Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Set login password"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    This password will be used for Employee Login.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    System Access Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                  >
                    <option value="EMPLOYEE">Standard Employee</option>
                    <option value="REPORTING_OFFICER">Reporting Officer</option>
                    <option value="DDO">Drawing & Disbursing Officer (DDO)</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: PERSONAL INFORMATION */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-600" />
                2. Personal Profile Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Employee Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra Pradhan"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Krushna Chandra Pradhan"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="e.g. Annapurna Pradhan"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 94370 00000"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@hrmsodisha.gov.in"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: SERVICE & CADRE DETAILS */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-sky-600" />
                3. Service Cadre & Posting Establishment
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Designation Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Assistant Section Officer"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Service Cadre
                  </label>
                  <input
                    type="text"
                    value={cadre}
                    onChange={(e) => setCadre(e.target.value)}
                    placeholder="e.g. Odisha State Civil Service"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Panchayati Raj & Drinking Water Department"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Posting Office / Establishment
                  </label>
                  <input
                    type="text"
                    value={office}
                    onChange={(e) => setOffice(e.target.value)}
                    placeholder="Directorate Office / Collectorate / Block Office"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date of First Joining
                  </label>
                  <input
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Odisha Location Master Selection */}
              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-2">
                  Administrative Location Hierarchy (Odisha Master Data) <span className="text-rose-500">*</span>
                </label>
                <OdishaLocationSelector
                  idPrefix="create-emp-loc"
                  value={empLocation}
                  onChange={(sel) => {
                    setEmpLocation(sel);
                    if (sel.districtName) setDistrict(sel.districtName);
                    if (sel.blockName) setBlock(sel.blockName);
                  }}
                  required={true}
                  showMapPinBadge={true}
                  showValidationBanner={true}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Employment Nature
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                  >
                    <option value="PERMANENT">Permanent Regular Cadre</option>
                    <option value="CONTRACTUAL">Contractual Service</option>
                    <option value="PROBATION">Probationary Period</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Reporting Officer Name
                  </label>
                  <input
                    type="text"
                    value={reportingOfficerName}
                    onChange={(e) => setReportingOfficerName(e.target.value)}
                    placeholder="Priyanka Mohanty (RO)"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: FINANCIAL & PAY MATRIX */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-sky-600" />
                4. Pay Matrix & Statutory Identifiers
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pay Level
                  </label>
                  <select
                    value={payLevel}
                    onChange={(e) => setPayLevel(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-bold"
                  >
                    <option value="Level-7">Level-7 (₹35,400)</option>
                    <option value="Level-8">Level-8 (₹38,800)</option>
                    <option value="Level-9">Level-9 (₹44,900)</option>
                    <option value="Level-10">Level-10 (₹47,600)</option>
                    <option value="Level-11">Level-11 (₹53,100)</option>
                    <option value="Level-12">Level-12 (₹56,100)</option>
                    <option value="Level-13">Level-13 (₹67,700)</option>
                    <option value="Level-14">Level-14 (₹78,800)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Basic Pay Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={basicPay}
                    onChange={(e) => setBasicPay(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PAN Card Number
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    GPF / NPS Account No.
                  </label>
                  <input
                    type="text"
                    value={gpfNpsNo}
                    onChange={(e) => setGpfNpsNo(e.target.value)}
                    placeholder="OR/NPS/2026/10099"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: PROFILE PHOTO & ATTACHMENTS */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-sky-600" />
                5. Profile Photo & Joining Documents Upload
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Photo Upload */}
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center bg-white space-y-2">
                  <User className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    Employee Profile Photo
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPhotoFileName(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                    id="photo-upload-input"
                  />
                  <label
                    htmlFor="photo-upload-input"
                    className="inline-block px-3 py-1.5 bg-sky-50 text-sky-700 font-bold text-[11px] rounded-lg border border-sky-200 cursor-pointer hover:bg-sky-100"
                  >
                    Select Passport Photo
                  </label>
                  {photoFileName && (
                    <div className="text-[11px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{photoFileName}</span>
                    </div>
                  )}
                </div>

                {/* Joining Document Upload */}
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center bg-white space-y-2">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    Joining Memo / Appointment Order (PDF)
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDocFileName(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                    id="doc-upload-input"
                  />
                  <label
                    htmlFor="doc-upload-input"
                    className="inline-block px-3 py-1.5 bg-sky-50 text-sky-700 font-bold text-[11px] rounded-lg border border-sky-200 cursor-pointer hover:bg-sky-100"
                  >
                    Select Official Memo Document
                  </label>
                  {docFileName && (
                    <div className="text-[11px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{docFileName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              <span>Submit & Create Employee HRMS Account</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS MASTER */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              State Government Departments Directory
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueDepartments.map((dept, i) => {
              const count = employeesList.filter((e) => e.department === dept).length;
              return (
                <div
                  key={i}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 text-xs">{dept}</div>
                  <div className="text-[11px] text-slate-500">
                    Total Personnel: <strong className="text-sky-600 font-mono">{count} employees</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: OFFICES MASTER */}
      {activeTab === 'offices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-600" />
                Odisha Master Offices Directory & Location Mapping
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Establishments mapped to District, Block, GP, and Village administrative boundaries.
              </p>
            </div>
            <button
              onClick={() => setShowAddOfficeModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Building2 className="w-4 h-4" />
              <span>+ Register New Office</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officesList.map((off) => {
              const staffCount = employeesList.filter((e) => e.office === off.name || e.officeId === off.id).length;
              return (
                <div
                  key={off.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span>{off.name}</span>
                        <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                          {off.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Dept: {off.department}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full shrink-0">
                      {staffCount} Staff
                    </span>
                  </div>

                  {/* Administrative Boundary Path */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-[11px] space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Location Hierarchy
                    </div>
                    <div className="flex items-center gap-1 text-slate-700 font-medium flex-wrap">
                      <span className="text-sky-600 font-bold">Odisha</span>
                      <span>→</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold">
                        {off.districtName}
                      </span>
                      <span>→</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold">
                        {off.blockName}
                      </span>
                      {off.gpName && (
                        <>
                          <span>→</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                            {off.gpName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              System Transaction Audit Trail ({auditLogs.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-bold text-slate-800">{log.userEmployeeId || 'SYSTEM'}</td>
                    <td className="p-3 font-bold text-sky-600">{log.action}</td>
                    <td className="p-3 font-sans text-slate-600">{log.details}</td>
                    <td className="p-3 text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DATABASE PERSISTENCE, BACKUPS & RESTORE */}
      {activeTab === 'database_backup' && (
        <div className="space-y-6">
          {/* Storage & Durability Banner */}
          <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-700">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/80 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-600">
                <HardDrive className="w-3.5 h-3.5" />
                Permanent Cloud Disk Storage & Autonomous Backup Engine
              </div>
              <h3 className="text-lg font-bold">HRMS Persistent Database & Disaster Recovery</h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                All employee profiles, DDO-created accounts, service books, leaves, loans, and PAR histories are stored securely in durable JSON persistence (<code className="bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300 font-mono">hrms_demo_db.json</code>). Automated recovery snapshots are captured on server boots and administrative transactions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
              <button
                onClick={handleDownloadDatabaseBackup}
                className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                Download JSON Database
              </button>
            </div>
          </div>

          {/* Manual Snapshot Creation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Archive className="w-4 h-4 text-emerald-600" />
              Create Point-in-Time Database Snapshot
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Capture an immediate immutable snapshot of all currently enrolled employees, departments, and applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Snapshot label/note (e.g. pre_quarterly_audit, established_batch_2026)"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleCreateManualSnapshot}
                disabled={isBackingUp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                {isBackingUp ? 'Capturing...' : 'Capture Snapshot'}
              </button>
            </div>
          </div>

          {/* Snapshots History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-sky-600" />
                Available Database Backup Snapshots ({backupsList.length})
              </h4>
              <button
                onClick={fetchBackupsList}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh List
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Snapshot Filename</th>
                    <th className="p-3">Created Timestamp</th>
                    <th className="p-3">Employees Count</th>
                    <th className="p-3">Users Count</th>
                    <th className="p-3">File Size</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {backupsList.map((bkp) => (
                    <tr key={bkp.filename} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{bkp.filename}</td>
                      <td className="p-3 text-slate-500">{new Date(bkp.timestamp).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {bkp.employeeCount} Employees
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{bkp.userCount} Users</td>
                      <td className="p-3 text-slate-400 font-mono">{bkp.sizeFormatted}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setRestoreConfirmFile(bkp.filename)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-sans font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-700" />
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                  {backupsList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 font-sans">
                        No historical backup files found. Automated snapshots will be created during operations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: COMMUNICATION CENTER */}
      {activeTab === 'communication' && (
        <CommunicationModule />
      )}

      {/* MODAL 1: EDIT EMPLOYEE MODAL */}
      {empToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-4 h-4 text-sky-600" />
                Edit Record: {empToEdit.name} ({empToEdit.employeeId})
              </h3>
              <button
                onClick={() => setEmpToEdit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Office</label>
                  <input
                    type="text"
                    value={editOffice}
                    onChange={(e) => setEditOffice(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pay Level</label>
                  <input
                    type="text"
                    value={editPayLevel}
                    onChange={(e) => setEditPayLevel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Basic Pay (₹)</label>
                  <input
                    type="number"
                    value={editBasicPay}
                    onChange={(e) => setEditBasicPay(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="DEACTIVATED">DEACTIVATED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="RETIRED">RETIRED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEmpToEdit(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD MODAL */}
      {empToResetPassword && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Reset Employee Login Password</h3>
                <p className="text-xs text-slate-500">{empToResetPassword.name} ({empToResetPassword.employeeId})</p>
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPasswordForReset}
                  onChange={(e) => setNewPasswordForReset(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  The employee can immediately log in using this new password.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmpToResetPassword(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md"
                >
                  Update & Apply Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DEACTIVATE EMPLOYEE (SAFE SOFT-DELETE) MODAL */}
      {empToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Deactivate Employee</h3>
                <p className="text-xs text-slate-500">Permanent Record Retention Safeguard</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-slate-900">{empToDelete.name}</strong> (<span className="font-mono font-bold text-sky-600">{empToDelete.employeeId}</span>)?
            </p>
            <div className="text-[11px] text-slate-700 bg-slate-100 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" />
                Data Preservation Guarantee:
              </div>
              <p className="text-slate-600">
                The employee profile, past transfer records, and service book history are <strong>permanently retained</strong> in the database and will not be purged. Their login account will simply be switched to inactive.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmpToDelete(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEmp}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 shadow-md flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5" />
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: CREATE & MAP OFFICE MODAL */}
      {showAddOfficeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                Register New Office & Map Administrative Hierarchy
              </h3>
              <button
                onClick={() => setShowAddOfficeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Office / Establishment Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newOfficeName}
                    onChange={(e) => setNewOfficeName(e.target.value)}
                    placeholder="e.g. Block Development Office, Bijatala"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Office Establishment Code
                  </label>
                  <input
                    type="text"
                    value={newOfficeCode}
                    onChange={(e) => setNewOfficeCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BDO-BIJ-001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newOfficeDept}
                    onChange={(e) => setNewOfficeDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={newOfficePincode}
                    onChange={(e) => setNewOfficePincode(e.target.value)}
                    placeholder="751001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Odisha Master Location Selector */}
              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-2">
                  Map Location Boundary (District → Block → GP → Village)
                </label>
                <OdishaLocationSelector
                  idPrefix="add-office-loc"
                  value={officeLocation}
                  onChange={(sel) => setOfficeLocation(sel)}
                  required={true}
                  showMapPinBadge={true}
                  showValidationBanner={true}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddOfficeModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 shadow-md flex items-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  Save & Map Office
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EMPLOYEE CREATION SUCCESS POPUP */}
      {createdEmpSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-6 text-center relative">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold">Employee HRMS Account Created Successfully</h3>
              <p className="text-xs text-emerald-100 mt-1">
                Account provisioned with Active status and added to employee directory.
              </p>
            </div>

            {/* Details List */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Employee Name</span>
                  <span className="font-bold text-slate-900">{createdEmpSuccess.employee.name}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Employee HRMS ID</span>
                  <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 text-xs">
                    {createdEmpSuccess.employee.employeeId}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Designation</span>
                  <span className="font-semibold text-slate-800">{createdEmpSuccess.employee.designation}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[220px] truncate" title={createdEmpSuccess.employee.department}>
                    {createdEmpSuccess.employee.department}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Office</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[220px] truncate" title={createdEmpSuccess.employee.office}>
                    {createdEmpSuccess.employee.office}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Account Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                </div>

                {createdEmpSuccess.password && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500 font-medium">Initial Login Password</span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 text-xs">
                      {createdEmpSuccess.password}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCreatedEmpSuccess(null)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Done & View in Employee List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: RESTORE DATABASE SNAPSHOT CONFIRMATION MODAL */}
      {restoreConfirmFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Restore Database Snapshot</h3>
                <p className="text-xs text-slate-500 font-mono">{restoreConfirmFile}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to restore the entire HRMS database to the state captured in snapshot <strong className="text-slate-900 font-mono">{restoreConfirmFile}</strong>?
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                Automatic Safety Pre-Backup:
              </p>
              <p className="text-[11px] text-amber-800">
                A pre-restore safety snapshot will automatically be created first, guaranteeing no accidental data loss.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmFile(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRestoreSnapshot(restoreConfirmFile)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
