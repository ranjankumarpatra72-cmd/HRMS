import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDatabase, loadDatabase, createBackupSnapshot, getAvailableBackups, restoreFromBackup } from './server/db';
import { saveEmployeeToCloud, getEmployeesFromCloud, updateEmployeeInCloud } from './server/firestore';
import { UserRole, User, Employee, AuditLog, RequestStatus, LeaveRequest, SalaryRecord, Loan, TransferRecord, TransferDocument, LPCRecord, JoiningReport, EParReport, Grievance, DatabaseBackupInfo, CommunicationItem, CommunicationAttachment } from './src/types/index';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'hrms-odisha-demo-secret-key-2026';

loadDatabase();

// Sync from Cloud Firestore on startup
async function syncFromCloudFirestore() {
  try {
    const cloudEmployees = await getEmployeesFromCloud();
    if (cloudEmployees && cloudEmployees.length > 0) {
      const db = getDb();
      for (const cloudEmp of cloudEmployees) {
        if (!cloudEmp.employeeId) continue;
        const cleanId = cloudEmp.employeeId.trim().toUpperCase();
        const idx = db.employees.findIndex((e) => e.employeeId && e.employeeId.toUpperCase() === cleanId);
        if (idx >= 0) {
          db.employees[idx] = { ...db.employees[idx], ...cloudEmp };
        } else {
          db.employees.unshift(cloudEmp);
        }
      }
      saveDatabase();
      console.log(`Successfully synced ${cloudEmployees.length} employees from Firestore cloud database.`);
    }
  } catch (err) {
    console.error('Error syncing from Cloud Firestore on boot:', err);
  }
}
syncFromCloudFirestore();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Helper for Audit Logging
function logAudit(
  userId: string,
  username: string,
  role: UserRole,
  action: string,
  moduleName: string,
  recordId: string,
  details: string,
  ip = '127.0.0.1'
) {
  const db = getDb();
  const log: AuditLog = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    username,
    role,
    action,
    module: moduleName,
    recordId,
    timestamp: new Date().toISOString(),
    ipAddress: ip,
    details
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) db.auditLogs = db.auditLogs.slice(0, 500);
  saveDatabase();
}

// Helper to artificial delay for real server response behavior
const simulateServerLatency = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// Auth Middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    employeeId: string;
    username: string;
    role: UserRole;
    name: string;
  };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (authHeader || undefined);
  const token = bearerToken || req.cookies?.hrms_token || (req.headers['x-auth-token'] as string);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Session expired or invalid token. Please log in.' });
  }
}

function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Unauthorized action. Required role: ${roles.join(' or ')}. Your role: ${req.user?.role || 'None'}`
      });
    }
    next();
  };
}

// CAPTCHA Generator endpoint
let currentCaptchas: Record<string, string> = {};

app.get('/api/auth/captcha', async (req: Request, res: Response) => {
  await simulateServerLatency(150);
  const captchaId = `cap_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let captchaText = '';
  for (let i = 0; i < 5; i++) {
    captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  currentCaptchas[captchaId] = captchaText;
  res.json({ success: true, captchaId, captchaCode: captchaText });
});

// LOGIN Endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  await simulateServerLatency(300);
  const { username, password, captchaId, captchaInput } = req.body;

  if (!username || !username.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Invalid Employee ID or Password.' });
  }

  // Verify Captcha if supplied
  if (captchaId && currentCaptchas[captchaId]) {
    const expected = currentCaptchas[captchaId];
    delete currentCaptchas[captchaId];
    if (captchaInput?.trim().toUpperCase() !== expected.toUpperCase()) {
      return res.status(400).json({ success: false, message: 'Invalid Security Code / CAPTCHA.' });
    }
  }

  const db = getDb();
  const cleanUsername = username.trim().toUpperCase();

  // Find user by username or employeeId case-insensitively
  const user = db.users.find(
    (u) =>
      (u.username && u.username.trim().toUpperCase() === cleanUsername) ||
      (u.employeeId && u.employeeId.trim().toUpperCase() === cleanUsername)
  );

  if (!user) {
    logAudit('GUEST', username, 'EMPLOYEE', 'LOGIN_FAILED', 'AUTH', username, 'Invalid Employee ID', req.ip);
    return res.status(401).json({ success: false, message: 'Invalid Employee ID or Password.' });
  }

  // Verify active status
  if (user.status && user.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      message: `Account status is ${user.status}. Please contact your DDO for assistance.`
    });
  }

  // Find auth record
  let auth = db.userAuth.find(
    (a) =>
      (a.username && a.username.trim().toUpperCase() === cleanUsername) ||
      (a.username && user.username && a.username.trim().toUpperCase() === user.username.trim().toUpperCase()) ||
      (a.username && user.employeeId && a.username.trim().toUpperCase() === user.employeeId.trim().toUpperCase())
  );

  if (!auth) {
    logAudit('GUEST', username, user.role, 'LOGIN_FAILED', 'AUTH', username, 'Auth record missing', req.ip);
    return res.status(401).json({ success: false, message: 'Invalid Employee ID or Password.' });
  }

  if (auth.lockUntil && auth.lockUntil > Date.now()) {
    const remainingMins = Math.ceil((auth.lockUntil - Date.now()) / 60000);
    return res.status(423).json({
      success: false,
      message: `Account temporarily locked due to failed attempts. Try again in ${remainingMins} minutes.`
    });
  }

  const cleanPwd = (password || '').trim();
  let match = bcrypt.compareSync(password, auth.passwordHash);
  if (!match && cleanPwd !== password) {
    match = bcrypt.compareSync(cleanPwd, auth.passwordHash);
  }

  if (!match) {
    auth.failedAttempts = (auth.failedAttempts || 0) + 1;
    if (auth.failedAttempts >= 5) {
      auth.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
    }
    saveDatabase();
    logAudit(user.id, user.username, user.role, 'LOGIN_FAILED', 'AUTH', user.id, 'Wrong password attempt', req.ip);
    return res.status(401).json({ success: false, message: 'Invalid Employee ID or Password.' });
  }

  // Reset lock & failed attempts
  auth.failedAttempts = 0;
  auth.lockUntil = null;
  saveDatabase();

  const token = jwt.sign(
    {
      id: user.id,
      employeeId: user.employeeId || user.username,
      username: user.username || user.employeeId,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.cookie('hrms_token', token, {
    httpOnly: true,
    secure: false, // development Cloud Run container
    sameSite: 'lax',
    maxAge: 8 * 3600 * 1000
  });

  logAudit(user.id, user.username, user.role, 'LOGIN_SUCCESS', 'AUTH', user.id, 'User authenticated successfully', req.ip);

  res.json({
    success: true,
    message: 'Authentication successful. Redirecting to Dashboard...',
    token,
    user
  });
});

// DEMO OTP LOGIN
app.post('/api/auth/demo-otp', async (req: Request, res: Response) => {
  await simulateServerLatency(300);
  const { username, otp } = req.body;
  if (!username || !otp) {
    return res.status(400).json({ success: false, message: 'User ID and OTP are required.' });
  }

  if (otp !== '123456' && otp !== '888888') {
    return res.status(400).json({ success: false, message: 'Invalid Demo OTP. Use 123456 or 888888 for testing.' });
  }

  const db = getDb();
  const cleanUsername = username.trim().toUpperCase();
  const user = db.users.find(
    (u) =>
      u.username.toUpperCase() === cleanUsername ||
      (u.employeeId && u.employeeId.toUpperCase() === cleanUsername)
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'User ID not found in database.' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      employeeId: user.employeeId || user.username,
      username: user.username,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.cookie('hrms_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 8 * 3600 * 1000 });
  logAudit(user.id, user.username, user.role, 'LOGIN_SUCCESS_OTP', 'AUTH', user.id, 'Authenticated via Demo OTP', req.ip);

  res.json({ success: true, message: 'Demo OTP Verified.', token, user });
});

// QUICK DEMO USER SWITCH (for demo application testing)
app.post('/api/auth/switch-demo-user', async (req: Request, res: Response) => {
  await simulateServerLatency(200);
  const { employeeId } = req.body;
  const db = getDb();
  const cleanEmpId = (employeeId || '').trim().toUpperCase();
  const user = db.users.find(
    (u) =>
      u.employeeId.toUpperCase() === cleanEmpId ||
      u.username.toUpperCase() === cleanEmpId
  );
  if (!user) {
    return res.status(404).json({ success: false, message: 'Demo account not found.' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      employeeId: user.employeeId || user.username,
      username: user.username,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.cookie('hrms_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 8 * 3600 * 1000 });
  logAudit(user.id, user.username, user.role, 'DEMO_USER_SWITCH', 'AUTH', user.id, `Switched persona to ${user.name}`, req.ip);

  res.json({ success: true, message: `Switched to role: ${user.role} (${user.name})`, token, user });
});

// GET CURRENT USER PROFILE
app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDb();
  let user = db.users.find((u) => u.id === req.user?.id);
  if (!user && req.user?.username) {
    user = db.users.find(
      (u) =>
        u.username.toUpperCase() === req.user?.username.toUpperCase() ||
        (u.employeeId && u.employeeId.toUpperCase() === req.user?.username.toUpperCase())
    );
  }
  if (!user && req.user?.employeeId) {
    user = db.users.find((u) => u.employeeId.toUpperCase() === req.user?.employeeId.toUpperCase());
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'User record not found.' });
  }

  let employee = db.employees.find(
    (e) => e.employeeId.toUpperCase() === (user?.employeeId || req.user?.employeeId || '').toUpperCase()
  );

  if (!employee && user) {
    employee = {
      id: user.id,
      employeeId: user.employeeId || user.username,
      name: user.name,
      fatherName: 'N/A',
      motherName: 'N/A',
      dob: '1990-01-01',
      gender: 'MALE',
      mobile: '+91 94370 00000',
      email: `${(user.employeeId || user.username).toLowerCase()}@hrmsodisha.gov.in`,
      designation: user.designation || 'Employee',
      cadre: 'Odisha Government Service',
      department: user.department || 'Panchayati Raj & Drinking Water Department',
      office: user.office || 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      district: user.district || 'Khordha',
      block: 'Bhubaneswar MC',
      dateOfJoining: '2020-01-01',
      employmentType: 'PERMANENT',
      currentPosting: user.office || 'Bhubaneswar',
      status: (user.status as any) || 'ACTIVE',
      panNumber: 'ABCDE1234F',
      gpfNpsNo: 'OR/NPS/2026/10001',
      payLevel: 'Level-9',
      basicPay: 44900,
      reportingOfficerId: 'RO20001',
      reportingOfficerName: 'Priyanka Mohanty',
      ddoId: 'EMP20267858'
    };
  }

  res.json({
    success: true,
    user,
    employee
  });
});

// LOGOUT
app.post('/api/auth/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user) {
    logAudit(req.user.id, req.user.username, req.user.role, 'LOGOUT', 'AUTH', req.user.id, 'User logged out', req.ip);
  }
  res.clearCookie('hrms_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// CHANGE PASSWORD (for logged-in user)
app.post('/api/auth/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
  }
  if (newPassword.trim().length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  const db = getDb();
  const username = req.user!.username;
  const empId = req.user!.employeeId;

  const authRecord = db.userAuth.find(
    (a) =>
      a.username.toUpperCase() === username.toUpperCase() ||
      a.username.toUpperCase() === empId.toUpperCase()
  );

  if (!authRecord) {
    return res.status(404).json({ success: false, message: 'User credentials record not found.' });
  }

  const match = bcrypt.compareSync(currentPassword, authRecord.passwordHash);
  if (!match) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  authRecord.passwordHash = bcrypt.hashSync(newPassword.trim(), 10);
  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'PASSWORD_CHANGED_SELF',
    'AUTH',
    req.user!.id,
    'User changed their password',
    req.ip
  );

  res.json({ success: true, message: 'Password changed successfully.' });
});

// EMPLOYEE PROFILE API
app.get('/api/profile/:employeeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const empId = req.params.employeeId || req.user?.employeeId;
  const db = getDb();
  const employee = db.employees.find((e) => e.employeeId === empId);

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee profile not found.' });
  }

  res.json({ success: true, employee });
});

// PROFILE CORRECTION REQUEST
app.post('/api/profile/correction-request', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const { fieldName, currentValue, requestedValue, reason } = req.body;
  if (!fieldName || !requestedValue || !reason) {
    return res.status(400).json({ success: false, message: 'All correction fields are required.' });
  }

  const db = getDb();
  const correction = {
    id: `CORR-${Date.now()}`,
    employeeId: req.user!.employeeId,
    employeeName: req.user!.name,
    fieldName,
    currentValue: currentValue || 'N/A',
    requestedValue,
    reason,
    status: 'PENDING' as const,
    createdAt: new Date().toISOString()
  };

  db.correctionRequests.unshift(correction);
  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'PROFILE_CORRECTION_REQUESTED',
    'PROFILE',
    correction.id,
    `Requested edit for ${fieldName}`,
    req.ip
  );

  res.json({
    success: true,
    message: 'Correction request submitted to Establishment Officer for review.',
    correction
  });
});

// SERVICE BOOK API
app.get('/api/service-book/:employeeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(350);
  const empId = req.params.employeeId || req.user?.employeeId;
  const db = getDb();
  const employee = db.employees.find((e) => e.employeeId === empId);

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee record not found for this ID.' });
  }

  let serviceBook = db.serviceBooks[empId];

  if (!serviceBook) {
    // Generate default official 5-page service book for this employee
    serviceBook = {
      employeeId: employee.employeeId,
      employeeName: employee.name.toUpperCase(),
      pranNo: employee.gpfNpsNo || `OR/NPS/${employee.dateOfJoining?.slice(0, 4)}/${employee.employeeId}`,
      gpfNo: employee.gpfNpsNo || `OR/GPF/${employee.employeeId}`,
      gisNo: `GIS-OD-${employee.dateOfJoining?.slice(0, 4)}-${employee.employeeId}`,
      dobWords: `${employee.dob || '01-JAN-1990'} (Date of birth as per matriculation certificate)`,
      dateOfEntryGovtService: employee.dateOfJoining || '2015-01-01',
      dateOfEntryGovtServiceWords: `${employee.dateOfJoining || '2015-01-01'} FORE NOON`,
      dateOfEntryServiceBookCreated: employee.dateOfJoining || '2015-01-01',
      dateOfEntryServiceBookCreatedWords: `${employee.dateOfJoining || '2015-01-01'} (Initial verification completed)`,
      initialJoiningOffice: employee.office || 'Panchayati Raj & Drinking Water Department',
      initialJoiningPost: employee.designation || 'Assistant',
      declarationOfHomeTown: `${employee.district?.toUpperCase() || 'KHORDHA'}, ODISHA`,
      category: 'GENERAL',
      cellPhone: employee.mobile?.replace(/[^0-9]/g, '') || '9437012345',
      isReservationCategory: false,
      isRehabilitationScheme: false,
      personalDetails: {
        bloodGroup: 'B Positive (B+)',
        heightCm: 168,
        identificationMark: 'A small mole on forehead / right arm.',
        permanentAddress: `${employee.office}, ${employee.district}, Odisha`,
        maritalStatus: 'MARRIED',
        fatherName: employee.fatherName?.toUpperCase() || 'N/A',
        fatherResidence: `${employee.district}, Odisha`
      },
      identityDocuments: [
        { type: 'PAN', number: employee.panNumber || 'ABCPS1234F', placeOfIssue: 'Income Tax Dept', dateOfIssue: '10-JAN-2012', dateOfExpiry: 'N/A' },
        { type: 'AADHAAR', number: 'xxxxxxxx5821', placeOfIssue: 'UIDAI', dateOfIssue: '15-MAR-2014', dateOfExpiry: 'N/A' }
      ],
      familyMembers: [
        { relationType: 'FATHER', name: employee.fatherName || 'Father', isAlive: true, dob: '1955-01-01', maritalStatus: 'MARRIED', age: 70 },
        { relationType: 'MOTHER', name: employee.motherName || 'Mother', isAlive: true, dob: '1960-01-01', maritalStatus: 'MARRIED', age: 65 }
      ],
      nomineesTable: [
        { relationType: 'MOTHER', name: employee.motherName || 'Nominee', isAlive: true, dob: '1960-01-01', maritalStatus: 'MARRIED', age: 65, sharePercent: 100 }
      ],
      qualifications: [
        { degree: 'Bachelor of Arts / Science', institution: 'Utkal University, Bhubaneswar', year: 2012, grade: '1st Class' },
        { degree: 'Higher Secondary School Certificate (+2)', institution: 'CHSE Odisha', year: 2009, grade: '1st Class' },
        { degree: 'High School Certificate (10th HSC)', institution: 'BSE Odisha', year: 2007, grade: '1st Class' }
      ],
      postingHistory: [
        { office: employee.office, district: employee.district, designation: employee.designation, startDate: employee.dateOfJoining, endDate: 'Present', orderNo: `GOVT-OD/${employee.dateOfJoining?.slice(0, 4)}/901` }
      ],
      promotionHistory: [],
      incrementHistory: [
        { currentBasic: (employee.basicPay || 44900) - 1300, incrementAmount: 1300, revisedBasic: employee.basicPay || 44900, effectiveDate: '2025-07-01', orderRef: 'INC-2025/892' }
      ],
      trainingHistory: [
        { title: 'e-Governance & Digital Administration', institute: 'GOPABANDHU ACADEMY OF ADMINISTRATION, BBSR', fromDate: '2023-05-10', toDate: '2023-05-15' }
      ],
      nominations: [
        { type: 'NPS', nomineeName: employee.motherName || 'Nominee', relation: 'Mother', sharePercent: 100 }
      ],
      retirementDetails: {
        superannuationDate: '2048-05-31',
        pensionType: 'National Pension System (NPS)'
      },
      officialEntries: [
        {
          entryType: 'JOINING',
          postCadreScale: employee.designation?.toUpperCase() || 'SENIOR ASSISTANT',
          pay: `Rs. ${employee.basicPay || 44900}/- (${employee.payLevel || 'Level-9'})`,
          wef: employee.dateOfJoining || '2015-07-15',
          entryText: `JOINED AS ${employee.designation?.toUpperCase()} IN ${employee.office?.toUpperCase()} ON ${employee.dateOfJoining} (FN).`,
          noteText: `ENTRY TAKEN ON ${employee.dateOfJoining}`,
          entryDate: employee.dateOfJoining,
          orderNumber: `GOVT-OD/${employee.dateOfJoining?.slice(0, 4)}/901`,
          orderDate: employee.dateOfJoining
        }
      ],
      earnedLeaveAccount: [
        { periodFrom: '01-JAN-2025', periodTo: '30-JUN-2025', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 120, availedFrom: undefined, availedTo: undefined, availedTotal: 0, balanceLeave: 120 }
      ]
    };
    db.serviceBooks[empId] = serviceBook;
    saveDatabase();
  }

  res.json({ success: true, employee, serviceBook });
});

// LEAVE BALANCES & REQUESTS
app.get('/api/leave/balances/:employeeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const empId = req.params.employeeId || req.user?.employeeId;
  const db = getDb();
  const balances = db.leaveBalances[empId] || [
    { leaveType: 'CASUAL', openingBalance: 15, used: 0, pending: 0, available: 15 },
    { leaveType: 'EARNED', openingBalance: 120, used: 0, pending: 0, available: 120 },
    { leaveType: 'MEDICAL', openingBalance: 20, used: 0, pending: 0, available: 20 },
    { leaveType: 'MATERNITY', openingBalance: 0, used: 0, pending: 0, available: 0 },
    { leaveType: 'PATERNITY', openingBalance: 15, used: 0, pending: 0, available: 15 },
    { leaveType: 'SPECIAL', openingBalance: 10, used: 0, pending: 0, available: 10 }
  ];

  res.json({ success: true, balances });
});

app.get('/api/leave/requests/:employeeId?', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const db = getDb();
  const empId = req.params.employeeId;

  let list = db.leaveRequests;
  // If standard employee or filtered by empId
  if (req.user?.role === 'EMPLOYEE' || empId) {
    const targetId = empId || req.user?.employeeId;
    list = list.filter((r) => r.employeeId === targetId);
  } else if (req.user?.role === 'REPORTING_OFFICER') {
    // Show requests where officer is reporting officer or employee
    list = list.filter((r) => r.reportingOfficerId === req.user?.employeeId || r.employeeId === req.user?.employeeId);
  }

  res.json({ success: true, requests: list });
});

app.post('/api/leave/apply', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(500);
  const { leaveType, startDate, endDate, totalDays, reason, addressDuringLeave } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, message: 'Please fill in all mandatory leave details.' });
  }

  const db = getDb();
  const employee = db.employees.find((e) => e.employeeId === req.user?.employeeId);

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee record not found.' });
  }

  // Check balance
  const userBalances = db.leaveBalances[employee.employeeId] || [];
  const balanceItem = userBalances.find((b) => b.leaveType === leaveType);
  if (balanceItem && balanceItem.available < totalDays) {
    return res.status(400).json({
      success: false,
      message: `Insufficient leave balance! Available: ${balanceItem.available} days, Requested: ${totalDays} days.`
    });
  }

  const reqNum = `LR-2026-${String(db.leaveRequests.length + 1).padStart(5, '0')}`;
  const newLeave: LeaveRequest = {
    id: `LV-${Date.now()}`,
    requestNumber: reqNum,
    employeeId: employee.employeeId,
    employeeName: employee.name,
    designation: employee.designation,
    department: employee.department,
    leaveType,
    startDate,
    endDate,
    totalDays: Number(totalDays),
    reason,
    addressDuringLeave: addressDuringLeave || 'N/A',
    status: 'PENDING',
    reportingOfficerId: employee.reportingOfficerId,
    reportingOfficerName: employee.reportingOfficerName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.leaveRequests.unshift(newLeave);

  // Update pending balance
  if (balanceItem) {
    balanceItem.pending += Number(totalDays);
    balanceItem.available -= Number(totalDays);
  }

  // Add notification for Reporting Officer
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    employeeId: employee.reportingOfficerId,
    title: 'New Leave Request Received',
    message: `${employee.name} (${employee.designation}) applied for ${totalDays} days ${leaveType} leave.`,
    type: 'LEAVE',
    isRead: false,
    createdAt: new Date().toISOString(),
    link: '/leave'
  });

  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'LEAVE_SUBMITTED',
    'LEAVE',
    newLeave.id,
    `Applied ${totalDays} days ${leaveType} leave (${reqNum})`,
    req.ip
  );

  res.json({
    success: true,
    message: `Leave application ${reqNum} submitted successfully to Reporting Officer.`,
    leave: newLeave
  });
});

app.post('/api/leave/approve', authenticateToken, requireRoles('REPORTING_OFFICER', 'ESTABLISHMENT_OFFICER', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(500);
  const { requestId, status, remarks } = req.body;

  if (!requestId || !['APPROVED', 'REJECTED', 'RETURNED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid approval request.' });
  }

  const db = getDb();
  const leave = db.leaveRequests.find((r) => r.id === requestId);
  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave request not found.' });
  }

  leave.status = status as RequestStatus;
  leave.officerRemarks = remarks || `Leave ${status.toLowerCase()} by ${req.user?.name}`;
  leave.updatedAt = new Date().toISOString();

  // Update balances
  const userBalances = db.leaveBalances[leave.employeeId];
  if (userBalances) {
    const b = userBalances.find((item) => item.leaveType === leave.leaveType);
    if (b) {
      b.pending = Math.max(0, b.pending - leave.totalDays);
      if (status === 'APPROVED') {
        b.used += leave.totalDays;
      } else {
        // Restore available
        b.available += leave.totalDays;
      }
    }
  }

  // Notify employee
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    employeeId: leave.employeeId,
    title: `Leave Application ${status}`,
    message: `Your leave application ${leave.requestNumber} has been ${status}. Remarks: ${remarks || 'None'}`,
    type: 'LEAVE',
    isRead: false,
    createdAt: new Date().toISOString(),
    link: '/leave'
  });

  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    `LEAVE_${status}`,
    'LEAVE',
    leave.id,
    `Marked leave ${leave.requestNumber} as ${status}`,
    req.ip
  );

  res.json({
    success: true,
    message: `Leave request ${leave.requestNumber} successfully ${status.toLowerCase()}.`,
    leave
  });
});

// SALARY & PAYSLIP API
app.get('/api/salary/list/:employeeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const empId = req.params.employeeId || req.user?.employeeId;
  const db = getDb();
  const records = db.salaryRecords.filter((s) => s.employeeId === empId);

  res.json({ success: true, records });
});

app.get('/api/salary/payslip/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const db = getDb();
  const payslip = db.salaryRecords.find((s) => s.id === req.params.id);
  const employee = payslip ? db.employees.find((e) => e.employeeId === payslip.employeeId) : null;

  if (!payslip || !employee) {
    return res.status(404).json({ success: false, message: 'Payslip record not found.' });
  }

  res.json({ success: true, payslip, employee });
});

app.post('/api/salary/process', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(800);
  const { month, year } = req.body;

  if (!month || !year) {
    return res.status(400).json({ success: false, message: 'Month and Year are required for salary processing.' });
  }

  const db = getDb();
  let createdCount = 0;

  db.employees.forEach((emp) => {
    const existing = db.salaryRecords.find((s) => s.employeeId === emp.employeeId && s.month === Number(month) && s.year === Number(year));
    if (!existing) {
      const da = Math.round(emp.basicPay * 0.5);
      const hra = Math.round(emp.basicPay * 0.2);
      const gross = emp.basicPay + da + hra + 500 + 1000;
      const nps = Math.round((emp.basicPay + da) * 0.1);
      const ptax = 200;
      const itax = 4500;
      const loanRec = 2500;
      const gis = 400;
      const totalDed = nps + ptax + itax + loanRec + gis;
      const net = gross - totalDed;

      const record: SalaryRecord = {
        id: `SAL-${year}-${String(month).padStart(2, '0')}-${emp.employeeId}`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        month: Number(month),
        year: Number(year),
        payLevel: emp.payLevel,
        basicPay: emp.basicPay,
        da,
        hra,
        medicalAllowance: 500,
        specialAllowance: 1000,
        grossSalary: gross,
        npsContribution: nps,
        professionalTax: ptax,
        incomeTax: itax,
        loanRecovery: loanRec,
        gis,
        totalDeductions: totalDed,
        netPay: net,
        paymentStatus: 'PAID',
        paymentDate: `${year}-${String(month).padStart(2, '0')}-28`
      };

      db.salaryRecords.unshift(record);
      createdCount++;

      // Notify
      db.notifications.unshift({
        id: `NOTIF-${Date.now()}-${emp.employeeId}`,
        employeeId: emp.employeeId,
        title: 'Payslip Generated',
        message: `Salary for month ${month}/${year} has been processed. Net Pay: ₹${net.toLocaleString('en-IN')}`,
        type: 'SALARY',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/salary'
      });
    }
  });

  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'SALARY_PROCESSED',
    'SALARY',
    `SAL-${year}-${month}`,
    `Batch salary generated for ${createdCount} employees (${month}/${year})`,
    req.ip
  );

  res.json({
    success: true,
    message: `Batch salary calculation completed for ${createdCount} employees for month ${month}/${year}.`
  });
});

// LOAN MODULE
app.get('/api/loans/:employeeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const empId = req.params.employeeId || req.user?.employeeId;
  const db = getDb();
  const loans = db.loans.filter((l) => l.employeeId === empId);

  res.json({ success: true, loans });
});

app.post('/api/loans/apply', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(500);
  const { loanType, amount, installment } = req.body;

  if (!loanType || !amount) {
    return res.status(400).json({ success: false, message: 'Loan type and amount are required.' });
  }

  const db = getDb();
  const newLoan: Loan = {
    id: `LOAN-${Date.now()}`,
    employeeId: req.user!.employeeId,
    loanType,
    sanctionNo: `SANCT-DHE/2026/${Math.floor(100 + Math.random() * 900)}`,
    sanctionDate: new Date().toISOString().split('T')[0],
    originalAmount: Number(amount),
    monthlyInstallment: Number(installment) || Math.round(Number(amount) / 36),
    recoveredAmount: 0,
    outstandingAmount: Number(amount),
    status: 'PENDING'
  };

  db.loans.unshift(newLoan);
  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'LOAN_APPLIED',
    'LOAN',
    newLoan.id,
    `Applied for ${loanType} loan of ₹${amount}`,
    req.ip
  );

  res.json({ success: true, message: 'Loan application submitted for DDO sanction.', loan: newLoan });
});

// TRANSFER & POSTING API
app.get('/api/transfers/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const db = getDb();
  let history = db.transferHistory || [];
  if (req.user?.role === 'EMPLOYEE') {
    history = history.filter((h) => h.employeeId === req.user?.employeeId);
  }
  res.json({ success: true, history });
});

app.get('/api/transfers/:employeeId?', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const db = getDb();
  const empId = req.params.employeeId;

  let transfers = [...db.transfers];
  // Employee Privacy Enforcement: Employees can ONLY view their own transfer requests
  if (req.user?.role === 'EMPLOYEE') {
    transfers = transfers.filter((t) => t.employeeId === req.user?.employeeId);
  } else if (empId) {
    transfers = transfers.filter((t) => t.employeeId === empId);
  }

  // Attach documents to each transfer record
  const enrichedTransfers = transfers.map((t) => ({
    ...t,
    documents: (db.transferDocuments || []).filter((d) => d.transferId === t.id)
  }));

  res.json({ success: true, transfers: enrichedTransfers });
});

app.post('/api/transfers/save-draft', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(350);
  const {
    draftId,
    transferType = 'General Request',
    preferredDistrict,
    preferredBlock,
    preferredOffice,
    reason,
    supportingDocumentName,
    employeeRemarks
  } = req.body;

  const db = getDb();
  const emp = db.employees.find((e) => e.employeeId === req.user?.employeeId);
  const nowIso = new Date().toISOString();
  const nowDate = nowIso.split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  let existingIndex = -1;
  if (draftId) {
    existingIndex = db.transfers.findIndex((t) => t.id === draftId && t.employeeId === req.user?.employeeId);
  }

  let draftRecord: TransferRecord;

  if (existingIndex >= 0) {
    draftRecord = {
      ...db.transfers[existingIndex],
      transferType,
      preferredDistrict: preferredDistrict || '',
      preferredBlock: preferredBlock || '',
      preferredOffice: preferredOffice || '',
      reason: reason || '',
      supportingDocumentName: supportingDocumentName || db.transfers[existingIndex].supportingDocumentName,
      employeeRemarks: employeeRemarks || '',
      updatedAt: nowIso
    };
    db.transfers[existingIndex] = draftRecord;
  } else {
    const currentYear = new Date().getFullYear();
    const draftNum = `TR-DRAFT-${currentYear}-${String(db.transfers.length + 1).padStart(4, '0')}`;
    draftRecord = {
      id: `TR-DRAFT-${Date.now()}`,
      requestNumber: draftNum,
      employeeId: req.user!.employeeId,
      employeeName: req.user!.name,
      designation: emp?.designation || 'Senior Assistant',
      department: emp?.department || 'Panchayati Raj & Drinking Water Department',
      currentOffice: emp?.office || 'Panchayati Raj & Drinking Water Department, Bhubaneswar',
      currentDistrict: emp?.district || 'Khordha',
      currentBlock: emp?.block || 'Bhubaneswar MC',
      currentPosting: emp?.postingStation || 'Main Branch',
      transferType,
      state: 'Odisha',
      preferredOffice: preferredOffice || '',
      preferredDistrict: preferredDistrict || '',
      preferredBlock: preferredBlock || '',
      reason: reason || '',
      supportingDocumentName: supportingDocumentName || undefined,
      employeeRemarks: employeeRemarks || '',
      status: 'DRAFT',
      currentStage: 'Draft Application Saved',
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        {
          id: `TL-${Date.now()}`,
          action: 'Transfer Application Draft Saved',
          date: nowDate,
          time: nowTime,
          user: req.user!.name,
          role: req.user!.role,
          remarks: 'Saved draft in HRMS portal for subsequent review and submission',
          status: 'DRAFT'
        }
      ]
    };
    db.transfers.unshift(draftRecord);
  }

  saveDatabase();
  res.json({ success: true, message: 'Transfer application saved as draft successfully.', draft: draftRecord });
});

app.post('/api/transfers/apply', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(500);
  const {
    draftId,
    transferType = 'General Request',
    state = 'Odisha',
    preferredDistrict,
    preferredBlock,
    preferredOffice,
    reason,
    supportingDocumentName,
    employeeRemarks,
    documentUrl
  } = req.body;

  if (!preferredDistrict || !preferredBlock || !reason) {
    return res.status(400).json({ success: false, message: 'District, Block, and Reason for transfer are required.' });
  }

  const db = getDb();
  const emp = db.employees.find((e) => e.employeeId === req.user?.employeeId);

  // Generate unique Transfer Request ID (e.g. TR-2026-000001)
  const currentYear = new Date().getFullYear();
  let seq = db.transfers.filter((t) => !t.requestNumber.startsWith('TR-DRAFT')).length + 1;
  let reqNum = `TR-${currentYear}-${String(seq).padStart(6, '0')}`;
  while (db.transfers.some((t) => t.requestNumber === reqNum)) {
    seq++;
    reqNum = `TR-${currentYear}-${String(seq).padStart(6, '0')}`;
  }

  const nowIso = new Date().toISOString();
  const nowDate = nowIso.split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const initialTimeline = [
    {
      id: `TL-${Date.now()}-1`,
      action: 'Transfer Application Submitted',
      date: nowDate,
      time: nowTime,
      user: req.user!.name,
      role: req.user!.role,
      remarks: 'Submitted transfer request via Employee Portal',
      status: 'SUBMITTED'
    }
  ];

  const approvalStages = [
    {
      stageNumber: 1,
      stageName: 'Employee Submission',
      authorityRole: 'Employee (Self)',
      authorityName: req.user!.name,
      status: 'COMPLETED' as const,
      actionDate: nowDate,
      actionTime: nowTime,
      remarks: 'Application submitted successfully.'
    },
    {
      stageNumber: 2,
      stageName: 'Establishment Verification',
      authorityRole: 'Establishment Officer',
      authorityName: 'Smitarani Panda',
      status: 'CURRENT' as const,
      remarks: 'Pending verification of service tenure, cadre vacancy & records.'
    },
    {
      stageNumber: 3,
      stageName: 'Reporting Officer Recommendation',
      authorityRole: 'Section Officer / RO',
      authorityName: 'Priyanka Mohanty',
      status: 'PENDING' as const,
      remarks: 'Pending performance appraisal & recommendation.'
    },
    {
      stageNumber: 4,
      stageName: 'DDO Endorsement & Scrutiny',
      authorityRole: 'Drawing & Disbursing Officer',
      authorityName: 'Subhash Chandra Senapati',
      status: 'PENDING' as const,
      remarks: 'Pending administrative endorsement.'
    },
    {
      stageNumber: 5,
      stageName: 'Competent Sanctioning Authority',
      authorityRole: 'District Collector / Director PR',
      authorityName: 'District / Departmental Head',
      status: 'PENDING' as const,
      remarks: 'Pending final sanction order.'
    },
    {
      stageNumber: 6,
      stageName: 'Transfer Order Generation',
      authorityRole: 'Establishment Issuing Authority',
      authorityName: 'Government Cadre Cell',
      status: 'PENDING' as const,
      remarks: 'Order will be issued upon approval.'
    }
  ];

  // If converting from draft, remove or replace draft record
  if (draftId) {
    const draftIndex = db.transfers.findIndex((t) => t.id === draftId && t.employeeId === req.user?.employeeId);
    if (draftIndex >= 0) {
      db.transfers.splice(draftIndex, 1);
    }
  }

  const transfer: TransferRecord = {
    id: `TR-${Date.now()}`,
    requestNumber: reqNum,
    employeeId: req.user!.employeeId,
    employeeName: req.user!.name,
    designation: emp?.designation || 'Senior Assistant',
    department: emp?.department || 'Panchayati Raj & Drinking Water Department',
    currentOffice: emp?.office || 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
    currentDistrict: emp?.district || 'Khordha',
    currentBlock: emp?.block || 'Bhubaneswar MC',
    currentPosting: emp?.postingStation || 'Accounts Branch - I',
    transferType,
    state: state || 'Odisha',
    preferredOffice: preferredOffice || `${preferredBlock} Block Office, ${preferredDistrict}`,
    preferredDistrict,
    preferredBlock,
    reason: reason.trim(),
    supportingDocumentName: supportingDocumentName || undefined,
    employeeRemarks: employeeRemarks || undefined,
    submissionDate: nowDate,
    documentUrl: documentUrl || undefined,
    status: 'SUBMITTED',
    currentStage: 'Under Verification at Establishment Desk',
    createdAt: nowIso,
    updatedAt: nowIso,
    timeline: initialTimeline,
    approvalStages
  };

  db.transfers.unshift(transfer);

  // System Notification for Employee
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}-EMP`,
    employeeId: req.user!.employeeId,
    title: 'Transfer Application Submitted',
    message: `Your transfer request ${reqNum} to ${preferredDistrict} (${preferredBlock}) has been submitted successfully.`,
    type: 'TRANSFER',
    isRead: false,
    createdAt: nowIso,
    link: '/transfers'
  });

  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'TRANSFER_APPLIED',
    'TRANSFER',
    transfer.id,
    `Submitted transfer application ${reqNum} to ${preferredDistrict} > ${preferredBlock}`,
    req.ip
  );

  res.json({ success: true, message: `Transfer request ${reqNum} submitted to DDO for verification.`, transfer });
});

app.post('/api/transfers/advance-demo-stage', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER', 'REPORTING_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const { transferId, nextStatus, remarks, officerRole, officerName } = req.body;

  if (!transferId || !nextStatus) {
    return res.status(400).json({ success: false, message: 'Transfer ID and Target Status are required.' });
  }

  const db = getDb();
  const transfer = db.transfers.find((t) => t.id === transferId);

  if (!transfer) {
    return res.status(404).json({ success: false, message: 'Transfer record not found.' });
  }

  const nowIso = new Date().toISOString();
  const nowDate = nowIso.split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const actingName = officerName || req.user!.name;
  const actingRole = officerRole || req.user!.role;

  transfer.status = nextStatus;
  transfer.updatedAt = nowIso;

  if (!transfer.timeline) transfer.timeline = [];
  if (!transfer.approvalStages) transfer.approvalStages = [];

  let stageTitle = '';
  let notificationTitle = '';
  let notificationMessage = '';

  switch (nextStatus) {
    case 'UNDER_DDO_REVIEW':
      stageTitle = 'Under Verification / Scrutiny';
      transfer.currentStage = 'Pending at DDO for Recommendation';
      notificationTitle = 'Transfer Application Under Verification';
      notificationMessage = `Your transfer request ${transfer.requestNumber} is under scrutiny by Establishment Branch / DDO.`;
      break;

    case 'APPROVED':
      stageTitle = 'Application Approved by Competent Authority';
      transfer.currentStage = 'Approved – Transfer Order in Preparation';
      transfer.transferAuthority = 'District Magistrate & Collector, Mayurbhanj';
      notificationTitle = 'Transfer Application Approved';
      notificationMessage = `Your transfer request ${transfer.requestNumber} to ${transfer.preferredDistrict} (${transfer.preferredBlock}) has been APPROVED.`;
      break;

    case 'ORDER_ISSUED': {
      stageTitle = 'Official Transfer Order Issued';
      transfer.currentStage = 'Transfer Order Issued';
      const orderSeq = Math.floor(1000 + Math.random() * 9000);
      const generatedOrderNum = `ORD-PRDW/${new Date().getFullYear()}/${orderSeq}`;
      transfer.orderNumber = transfer.orderNumber || generatedOrderNum;
      transfer.orderDate = transfer.orderDate || nowDate;
      transfer.transferAuthority = transfer.transferAuthority || 'Special Secretary to Government, PR & DW Department';
      notificationTitle = 'Transfer Order Generated';
      notificationMessage = `Transfer Order ${transfer.orderNumber} has been issued. You may now download your order copy.`;

      // Auto-create document in transferDocuments
      const docId = `DOC-TR-${Date.now()}`;
      if (!db.transferDocuments) db.transferDocuments = [];
      if (!db.transferDocuments.some((d) => d.transferId === transfer.id && d.documentType === 'Transfer Order')) {
        db.transferDocuments.push({
          id: docId,
          transferId: transfer.id,
          employeeId: transfer.employeeId,
          documentType: 'Transfer Order',
          documentTitle: `Government Transfer Order – ${transfer.requestNumber}`,
          fileName: `Transfer_Order_${transfer.requestNumber}.pdf`,
          fileSize: '342 KB',
          mimeType: 'application/pdf',
          orderNumber: transfer.orderNumber,
          orderDate: transfer.orderDate,
          uploadedBy: actingName,
          uploaderRole: actingRole,
          uploadedAt: nowIso,
          documentStatus: 'Available',
          remarks: 'Official Government Sanction Order issued under seal of Competent Authority.',
          version: 1,
          isCurrentVersion: true,
          createdAt: nowIso,
          updatedAt: nowIso
        });
      }
      break;
    }

    case 'JOINED': {
      stageTitle = 'Transfer Process Completed & Joined';
      transfer.currentStage = 'Completed – Employee Joined at New Station';
      transfer.joiningDate = nowDate;
      notificationTitle = 'Transfer Joined Successfully';
      notificationMessage = `Joining at new station ${transfer.preferredOffice || transfer.preferredBlock} recorded successfully in HRMS.`;

      // Also append to transferHistory if not already there
      if (!db.transferHistory) db.transferHistory = [];
      if (!db.transferHistory.some((h) => h.transferOrderNumber === transfer.orderNumber)) {
        db.transferHistory.unshift({
          id: `TH-${Date.now()}`,
          employeeId: transfer.employeeId,
          employeeName: transfer.employeeName,
          designation: transfer.designation,
          previousOffice: transfer.currentOffice,
          previousDistrict: transfer.currentDistrict,
          previousBlock: transfer.currentBlock,
          newOffice: transfer.preferredOffice || `${transfer.preferredBlock} Office, ${transfer.preferredDistrict}`,
          newDistrict: transfer.preferredDistrict,
          newBlock: transfer.preferredBlock,
          transferDate: nowDate,
          orderDate: transfer.orderDate || nowDate,
          transferOrderNumber: transfer.orderNumber || `ORD-PRDW/2026/${Math.floor(1000 + Math.random() * 9000)}`,
          transferStatus: 'COMPLETED',
          transferAuthority: transfer.transferAuthority || 'Competent Authority, Govt of Odisha',
          transferType: transfer.transferType || 'General Request',
          joiningDate: nowDate,
          remarks: 'Transferred and joined new posting successfully.'
        });
      }
      break;
    }

    case 'REJECTED':
      stageTitle = 'Transfer Application Rejected';
      transfer.currentStage = 'Rejected by Sanctioning Authority';
      transfer.rejectionReason = remarks || 'Cadre constraint: Administrative feasibility / no vacancy at requested station.';
      notificationTitle = 'Transfer Request Not Sanctioned';
      notificationMessage = `Your transfer request ${transfer.requestNumber} could not be sanctioned at this time.`;
      break;

    case 'RETURNED_FOR_CORRECTION':
      stageTitle = 'Returned for Correction';
      transfer.currentStage = 'Returned to Employee for Clarification';
      transfer.correctionRemarks = remarks || 'Please upload valid documentary proof / medical certificate.';
      notificationTitle = 'Transfer Request Clarification Needed';
      notificationMessage = `Establishment branch has requested clarification on ${transfer.requestNumber}.`;
      break;

    default:
      stageTitle = `Status updated to ${nextStatus}`;
      transfer.currentStage = nextStatus;
  }

  transfer.timeline.push({
    id: `TL-${Date.now()}`,
    action: stageTitle,
    date: nowDate,
    time: nowTime,
    user: actingName,
    role: actingRole,
    remarks: remarks || `Advanced application stage to ${nextStatus}`,
    status: nextStatus
  });

  if (notificationTitle) {
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}-ADV`,
      employeeId: transfer.employeeId,
      title: notificationTitle,
      message: notificationMessage,
      type: 'TRANSFER',
      isRead: false,
      createdAt: nowIso,
      link: '/transfers'
    });
  }

  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'TRANSFER_STAGE_ADVANCED',
    'TRANSFER',
    transfer.id,
    `Stage changed to ${nextStatus} for ${transfer.requestNumber}`,
    req.ip
  );

  res.json({ success: true, message: `Application stage updated to ${nextStatus}.`, transfer });
});

app.post('/api/transfers/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const { transferId, cancellationReason } = req.body;

  if (!transferId || !cancellationReason) {
    return res.status(400).json({ success: false, message: 'Transfer ID and Cancellation Reason are required.' });
  }

  const db = getDb();
  const transfer = db.transfers.find((t) => t.id === transferId);

  if (!transfer) {
    return res.status(404).json({ success: false, message: 'Transfer request not found.' });
  }

  // Employee Privacy Check: Must be owner or DDO/Admin
  if (req.user?.role === 'EMPLOYEE' && transfer.employeeId !== req.user?.employeeId) {
    return res.status(403).json({ success: false, message: 'Access Denied – You can only cancel your own transfer request.' });
  }

  // Check if transfer is at an irreversible stage
  const nonCancellableStatuses = ['ORDER_ISSUED', 'RELIEVED', 'JOINED', 'CANCELLED', 'REJECTED'];
  if (nonCancellableStatuses.includes(transfer.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel transfer request at stage '${transfer.status}'. Cancellation is not permitted at or after order issuance.`
    });
  }

  const nowIso = new Date().toISOString();
  const nowDate = nowIso.split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  transfer.status = 'CANCELLED';
  transfer.currentStage = 'Cancelled by Employee';
  transfer.cancelledDate = nowIso;
  transfer.cancellationReason = cancellationReason.trim();
  transfer.cancelledBy = req.user!.name;
  transfer.updatedAt = nowIso;

  if (!transfer.timeline) transfer.timeline = [];
  transfer.timeline.push({
    id: `TL-${Date.now()}`,
    action: 'Transfer Application Cancelled',
    date: nowDate,
    time: nowTime,
    user: req.user!.name,
    role: req.user!.role,
    remarks: cancellationReason.trim(),
    status: 'CANCELLED'
  });

  // System Notification for Employee
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}-CANCEL`,
    employeeId: transfer.employeeId,
    title: 'Transfer Application Cancelled',
    message: `Your transfer request ${transfer.requestNumber} has been cancelled successfully.`,
    type: 'SYSTEM',
    isRead: false,
    createdAt: nowIso,
    link: '/transfers'
  });

  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'TRANSFER_CANCELLED',
    'TRANSFER',
    transfer.id,
    `Cancelled transfer request ${transfer.requestNumber}. Reason: ${cancellationReason}`,
    req.ip
  );

  res.json({ success: true, message: `Transfer request ${transfer.requestNumber} cancelled.`, transfer });
});

app.post('/api/transfers/update-status', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const {
    transferId,
    status,
    stage,
    remarks,
    rejectionReason,
    correctionRemarks,
    orderNumber,
    orderDate,
    joiningDate
  } = req.body;

  if (!transferId || !status) {
    return res.status(400).json({ success: false, message: 'Transfer ID and Status are required.' });
  }

  const db = getDb();
  const transfer = db.transfers.find((t) => t.id === transferId);
  if (!transfer) {
    return res.status(404).json({ success: false, message: 'Transfer request not found.' });
  }

  const nowIso = new Date().toISOString();
  const nowDate = nowIso.split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  transfer.status = status;
  transfer.updatedAt = nowIso;
  transfer.processedBy = `${req.user!.name} (${req.user!.role})`;

  if (stage) transfer.currentStage = stage;
  else {
    switch (status) {
      case 'SUBMITTED':
        transfer.currentStage = 'Submitted';
        break;
      case 'UNDER_DDO_REVIEW':
        transfer.currentStage = 'Under DDO Review';
        break;
      case 'FORWARDED_TO_COLLECTOR':
        transfer.currentStage = 'Recommended & Forwarded to Collector';
        break;
      case 'COLLECTOR_APPROVED':
        transfer.currentStage = 'Approved by Collector';
        break;
      case 'PENDING_APPROVAL':
        transfer.currentStage = 'Pending Approval';
        break;
      case 'APPROVED':
        transfer.currentStage = 'Recommended & Forwarded by BDO';
        break;
      case 'REJECTED':
        transfer.currentStage = 'Rejected';
        break;
      case 'RETURNED_FOR_CORRECTION':
        transfer.currentStage = 'Returned for Correction';
        break;
      case 'ORDER_ISSUED':
        transfer.currentStage = 'Transfer Order Issued';
        break;
      case 'RELIEVED':
        transfer.currentStage = 'Relieved from Current Office';
        break;
      case 'JOINED':
        transfer.currentStage = 'Joined at New Office';
        break;
      default:
        transfer.currentStage = status;
    }
  }

  if (remarks) transfer.remarks = remarks.trim();
  if (rejectionReason) transfer.rejectionReason = rejectionReason.trim();
  if (correctionRemarks) transfer.correctionRemarks = correctionRemarks.trim();
  if (orderNumber) transfer.orderNumber = orderNumber;
  if (orderDate) transfer.orderDate = orderDate;
  if (joiningDate) transfer.joiningDate = joiningDate;

  // Append timeline log
  if (!transfer.timeline) transfer.timeline = [];
  const actionText =
    status === 'FORWARDED_TO_COLLECTOR' ? `Recommended & Forwarded to District Collector, ${transfer.currentDistrict || 'Mayurbhanj'}` :
    status === 'COLLECTOR_APPROVED' ? `Transfer Sanctioned & Approved by District Collector, ${transfer.currentDistrict || 'Mayurbhanj'}` :
    status === 'APPROVED' ? `Recommended & Forwarded by BDO, ${transfer.currentBlock || 'Bijatala'}` :
    status === 'REJECTED' ? 'Transfer Request Rejected' :
    status === 'RETURNED_FOR_CORRECTION' ? 'Returned for Correction' :
    status === 'ORDER_ISSUED' ? `Transfer Order Issued (${orderNumber || transfer.orderNumber || 'ORD-PRDW-2026/1185'})` :
    status === 'RELIEVED' ? 'Employee Relieved from Duty' :
    status === 'JOINED' ? 'Joined at New Office' :
    `Status Updated to ${status}`;

  const remarkText = remarks || rejectionReason || correctionRemarks || `Status updated by ${req.user!.role}`;

  transfer.timeline.push({
    id: `TL-${Date.now()}`,
    action: actionText,
    date: nowDate,
    time: nowTime,
    user: req.user!.name,
    role: req.user!.role,
    remarks: remarkText,
    status: status
  });

  // Create System Notification for Employee
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}-UPD`,
    employeeId: transfer.employeeId,
    title: `Transfer Request ${status}`,
    message: `Your transfer request ${transfer.requestNumber} status has been updated to '${transfer.currentStage}'. ${remarkText ? 'Remarks: ' + remarkText : ''}`,
    type: 'SYSTEM',
    isRead: false,
    createdAt: nowIso,
    link: '/transfers'
  });

  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'TRANSFER_STATUS_UPDATED',
    'TRANSFER',
    transfer.id,
    `Updated transfer ${transfer.requestNumber} status to ${status}. Stage: ${transfer.currentStage}`,
    req.ip
  );

  res.json({ success: true, message: `Transfer request status updated to ${status}.`, transfer });
});

// ==================== TRANSFER DOCUMENTS API ====================

// Get documents for a specific transfer
app.get('/api/transfers/:transferId/documents', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const { transferId } = req.params;
  const db = getDb();
  const transfer = db.transfers.find((t) => t.id === transferId);

  if (!transfer) {
    return res.status(404).json({ success: false, message: 'Transfer request not found.' });
  }

  // Employee Privacy Check: Employees can only view documents for their own transfer
  if (req.user?.role === 'EMPLOYEE' && transfer.employeeId !== req.user?.employeeId) {
    return res.status(403).json({ success: false, message: 'Access Denied – You can only view documents for your own transfer request.' });
  }

  const documents = (db.transferDocuments || []).filter((d) => d.transferId === transferId);

  res.json({
    success: true,
    transferId,
    transferRequestNumber: transfer.requestNumber,
    documents
  });
});

// Upload a transfer document (DDO / Admin only)
app.post('/api/transfers/:transferId/documents/upload', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(500);
  const { transferId } = req.params;
  const {
    documentType,
    documentTitle,
    fileName,
    fileData,
    fileSize = '180 KB',
    orderNumber,
    orderDate,
    remarks
  } = req.body;

  if (!documentType || !fileName) {
    return res.status(400).json({ success: false, message: 'Document Type and File Name are required.' });
  }

  const validTypes = ['Approval Order', 'Transfer Order', 'Relieving Order', 'Joining Order', 'Other Supporting Document'];
  if (!validTypes.includes(documentType)) {
    return res.status(400).json({ success: false, message: `Invalid document type. Allowed types: ${validTypes.join(', ')}` });
  }

  const db = getDb();
  const transfer = db.transfers.find((t) => t.id === transferId);
  if (!transfer) {
    return res.status(404).json({ success: false, message: 'Transfer request not found.' });
  }

  if (!db.transferDocuments) {
    db.transferDocuments = [];
  }

  // Check versioning for this specific documentType on this transfer
  const existingDocsOfType = db.transferDocuments.filter(
    (d) => d.transferId === transferId && d.documentType === documentType
  );

  let nextVersion = 1;
  if (existingDocsOfType.length > 0) {
    // Determine maximum version number
    const maxVer = Math.max(...existingDocsOfType.map((d) => d.version || 1));
    nextVersion = maxVer + 1;

    // Mark previous current version as 'Replaced' and isCurrentVersion = false
    existingDocsOfType.forEach((d) => {
      if (d.isCurrentVersion) {
        d.isCurrentVersion = false;
        d.documentStatus = 'Replaced';
        d.updatedAt = new Date().toISOString();
      }
    });
  }

  const nowIso = new Date().toISOString();
  const nowDate = nowIso.split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const effectiveOrderNumber = orderNumber || (documentType === 'Transfer Order' ? (transfer.orderNumber || `ORD-PRDW-2026/${Math.floor(1000 + Math.random() * 9000)}`) : undefined);
  const effectiveOrderDate = orderDate || (documentType === 'Transfer Order' ? (transfer.orderDate || nowDate) : undefined);

  const docId = `DOC-${transfer.id}-${documentType.replace(/[^a-zA-Z0-9]/g, '')}-v${nextVersion}-${Date.now()}`;
  const newDocument: TransferDocument = {
    id: docId,
    transferId: transfer.id,
    employeeId: transfer.employeeId,
    documentType: documentType as any,
    documentTitle: documentTitle || `${documentType} – ${transfer.employeeName}`,
    fileName: fileName || `${documentType.replace(/\s+/g, '_')}_v${nextVersion}.pdf`,
    fileData: fileData || undefined,
    fileSize: fileSize || '195 KB',
    mimeType: 'application/pdf',
    orderNumber: effectiveOrderNumber,
    orderDate: effectiveOrderDate,
    uploadedBy: `${req.user!.name} (${req.user!.role})`,
    uploaderRole: req.user!.role,
    uploadedAt: nowIso,
    documentStatus: 'Available',
    remarks: remarks || `Official ${documentType} (v${nextVersion}) uploaded by ${req.user!.role}`,
    version: nextVersion,
    isCurrentVersion: true,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  db.transferDocuments.unshift(newDocument);

  // If orderNumber or orderDate was provided or it's a Transfer Order, update the transfer record
  if (effectiveOrderNumber) {
    transfer.orderNumber = effectiveOrderNumber;
  }
  if (effectiveOrderDate) {
    transfer.orderDate = effectiveOrderDate;
  }
  transfer.updatedAt = nowIso;

  // Append timeline entry
  if (!transfer.timeline) transfer.timeline = [];
  transfer.timeline.push({
    id: `TL-DOC-${Date.now()}`,
    action: `Document Uploaded: ${documentType} (v${nextVersion})`,
    date: nowDate,
    time: nowTime,
    user: req.user!.name,
    role: req.user!.role,
    remarks: remarks || `Uploaded official ${documentType} (File: ${newDocument.fileName})`,
    status: transfer.status
  });

  // Employee Notification
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}-DOC`,
    employeeId: transfer.employeeId,
    title: `Transfer Document Uploaded (${documentType})`,
    message: `Official ${documentType} (Version ${nextVersion}) has been uploaded for your transfer request ${transfer.requestNumber}. You can view and download it now.`,
    type: 'SYSTEM',
    isRead: false,
    createdAt: nowIso,
    link: '/transfers'
  });

  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'DOCUMENT_UPLOADED',
    'TRANSFER_DOCUMENT',
    newDocument.id,
    `${req.user!.role} uploaded ${documentType} (v${nextVersion}, ${newDocument.fileName}) for transfer ${transfer.requestNumber}`,
    req.ip
  );

  res.json({
    success: true,
    message: `${documentType} PDF (Version ${nextVersion}) uploaded successfully.`,
    document: newDocument,
    transfer
  });
});

// Audit document action (view or download)
app.post('/api/transfers/:transferId/documents/:documentId/audit-action', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { transferId, documentId } = req.params;
  const { actionType } = req.body; // 'VIEW' | 'DOWNLOAD'

  const db = getDb();
  const transfer = db.transfers.find((t) => t.id === transferId);
  const doc = (db.transferDocuments || []).find((d) => d.id === documentId);

  if (!transfer || !doc) {
    return res.status(404).json({ success: false, message: 'Document or Transfer record not found.' });
  }

  // Employee privacy check
  if (req.user?.role === 'EMPLOYEE' && transfer.employeeId !== req.user?.employeeId) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const logAction = actionType === 'DOWNLOAD' ? 'DOCUMENT_DOWNLOADED' : 'DOCUMENT_VIEWED';
  const verb = actionType === 'DOWNLOAD' ? 'downloaded' : 'viewed';

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    logAction,
    'TRANSFER_DOCUMENT',
    doc.id,
    `${req.user!.role} ${req.user!.name} (${req.user!.username}) ${verb} ${doc.documentType} (v${doc.version}, ${doc.fileName}) for transfer ${transfer.requestNumber}`,
    req.ip
  );

  res.json({ success: true, message: `Document ${verb} action logged.` });
});

// LPC API
app.get('/api/lpc/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const db = getDb();
  let list = db.lpcRecords;
  if (req.user?.role === 'EMPLOYEE') {
    list = list.filter((l) => l.employeeId === req.user?.employeeId);
  }

  res.json({ success: true, records: list });
});

app.post('/api/lpc/generate', authenticateToken, requireRoles('DDO', 'ESTABLISHMENT_OFFICER', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(600);
  const { employeeId, newOffice, relievingDate, lastSalaryMonth, remarks } = req.body;

  const db = getDb();
  const emp = db.employees.find((e) => e.employeeId === employeeId);
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee ID not found.' });
  }

  const lpcNum = `LPC-DHE-2026-${String(db.lpcRecords.length + 1).padStart(4, '0')}`;
  const lpc: LPCRecord = {
    id: `LPC-${Date.now()}`,
    lpcNumber: lpcNum,
    employeeId: emp.employeeId,
    employeeName: emp.name,
    designation: emp.designation,
    department: emp.department,
    previousOffice: emp.office,
    newOffice: newOffice || 'Transferred Office',
    relievingDate: relievingDate || new Date().toISOString().split('T')[0],
    lastSalaryMonth: lastSalaryMonth || 'June 2026',
    basicPay: emp.basicPay,
    allowances: Math.round(emp.basicPay * 0.7),
    deductions: 14335,
    recoveries: 0,
    pendingDues: 0,
    status: 'FORWARDED',
    remarks: remarks || 'Last pay certificate issued upon transfer.',
    createdBy: req.user!.name,
    createdAt: new Date().toISOString()
  };

  db.lpcRecords.unshift(lpc);
  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'LPC_GENERATED',
    'LPC',
    lpc.id,
    `Generated LPC ${lpcNum} for ${emp.name}`,
    req.ip
  );

  res.json({ success: true, message: `Last Pay Certificate ${lpcNum} generated successfully.`, lpc });
});

app.post('/api/lpc/approve', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const { lpcId } = req.body;
  const db = getDb();
  const lpc = db.lpcRecords.find((l) => l.id === lpcId);
  if (!lpc) {
    return res.status(404).json({ success: false, message: 'LPC record not found.' });
  }

  lpc.status = 'APPROVED';
  lpc.approvedBy = req.user!.name;
  saveDatabase();

  logAudit(req.user!.id, req.user!.username, req.user!.role, 'LPC_APPROVED', 'LPC', lpc.id, `Approved LPC ${lpc.lpcNumber}`, req.ip);

  res.json({ success: true, message: `LPC ${lpc.lpcNumber} approved by DDO.`, lpc });
});

// JOINING MODULE API
app.get('/api/joining/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const db = getDb();
  let list = db.joiningReports;
  if (req.user?.role === 'EMPLOYEE') {
    list = list.filter((j) => j.employeeId === req.user?.employeeId);
  }
  res.json({ success: true, reports: list });
});

app.post('/api/joining/submit', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(500);
  const { postingOrderNumber, postingOrderDate, placeOfPosting, joiningDate, joiningTime, remarks } = req.body;

  if (!postingOrderNumber || !placeOfPosting || !joiningDate) {
    return res.status(400).json({ success: false, message: 'Posting order number, place, and date are required.' });
  }

  const db = getDb();
  const emp = db.employees.find((e) => e.employeeId === req.user?.employeeId);

  const reportNum = `JR-2026-${String(db.joiningReports.length + 100).padStart(5, '0')}`;
  const report: JoiningReport = {
    id: `JR-${Date.now()}`,
    reportNumber: reportNum,
    employeeId: req.user!.employeeId,
    employeeName: req.user!.name,
    designation: emp?.designation || 'Senior Assistant',
    department: emp?.department || 'Panchayati Raj & Drinking Water Department',
    postingOrderNumber,
    postingOrderDate,
    placeOfPosting,
    joiningDate,
    joiningTime: joiningTime || 'FORENOON',
    remarks: remarks || 'Submitted joining report.',
    status: 'SUBMITTED',
    createdAt: new Date().toISOString()
  };

  db.joiningReports.unshift(report);
  saveDatabase();

  logAudit(req.user!.id, req.user!.username, req.user!.role, 'JOINING_SUBMITTED', 'JOINING', report.id, `Submitted Joining Report ${reportNum}`, req.ip);

  res.json({ success: true, message: `Joining Report ${reportNum} submitted successfully.`, report });
});

// e-PAR MODULE API
app.get('/api/epar/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const db = getDb();
  let list = db.eParReports;
  if (req.user?.role === 'EMPLOYEE') {
    list = list.filter((p) => p.employeeId === req.user?.employeeId);
  }
  res.json({ success: true, reports: list });
});

app.post('/api/epar/submit', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(500);
  const { period, selfAppraisal } = req.body;

  if (!period || !selfAppraisal) {
    return res.status(400).json({ success: false, message: 'Reporting period and self appraisal text are required.' });
  }

  const db = getDb();
  const emp = db.employees.find((e) => e.employeeId === req.user?.employeeId);

  const report: EParReport = {
    id: `EPAR-${Date.now()}`,
    employeeId: req.user!.employeeId,
    employeeName: req.user!.name,
    designation: emp?.designation || 'Senior Assistant',
    department: emp?.department || 'Panchayati Raj & Drinking Water Department',
    period,
    reportingOfficerName: emp?.reportingOfficerName || 'Priyanka Mohanty',
    reviewingOfficerName: 'Smitarani Panda',
    acceptingAuthorityName: 'Director, Panchayati Raj & Drinking Water Department',
    selfAppraisal,
    status: 'SUBMITTED',
    createdAt: new Date().toISOString()
  };

  db.eParReports.unshift(report);
  saveDatabase();

  logAudit(req.user!.id, req.user!.username, req.user!.role, 'EPAR_SUBMITTED', 'EPAR', report.id, `Submitted e-PAR for period ${period}`, req.ip);

  res.json({ success: true, message: 'Self-Appraisal submitted to Reporting Officer.', report });
});

// GRIEVANCES API
app.get('/api/grievances/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const db = getDb();
  let list = db.grievanceRecords;
  if (req.user?.role === 'EMPLOYEE') {
    list = list.filter((g) => g.employeeId === req.user?.employeeId);
  }
  res.json({ success: true, grievances: list });
});

app.post('/api/grievances/create', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(450);
  const { category, subject, description, priority } = req.body;

  if (!category || !subject || !description) {
    return res.status(400).json({ success: false, message: 'Category, subject, and description are mandatory.' });
  }

  const db = getDb();
  const trackingNum = `REQ-2026-${String(db.grievanceRecords.length + 1).padStart(6, '0')}`;

  const grievance: Grievance = {
    id: `GRV-${Date.now()}`,
    grievanceNumber: trackingNum,
    employeeId: req.user!.employeeId,
    employeeName: req.user!.name,
    category,
    subject,
    description,
    priority: priority || 'MEDIUM',
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.grievanceRecords.unshift(grievance);
  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'GRIEVANCE_CREATED',
    'GRIEVANCE',
    grievance.id,
    `Registered grievance ${trackingNum}`,
    req.ip
  );

  res.json({ success: true, message: `Grievance registered with Application No: ${trackingNum}`, grievance });
});

// NOTIFICATIONS API
app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const list = db.notifications.filter((n) => n.employeeId === req.user?.employeeId || n.employeeId === 'ALL');
  const unreadCount = list.filter((n) => !n.isRead).length;

  res.json({ success: true, notifications: list, unreadCount });
});

app.post('/api/notifications/mark-read', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.notifications.forEach((n) => {
    if (n.employeeId === req.user?.employeeId || n.employeeId === 'ALL') n.isRead = true;
  });
  saveDatabase();
  res.json({ success: true });
});

// ==========================================
// COMMUNICATIONS & OFFICIAL NOTICES API (ADMIN <-> EMPLOYEE SYNC)
// ==========================================

// ==========================================
// E-COMMUNICATIONS & DDO NOTICES APIS
// ==========================================

// Validate and upload PDF Attachment for Communications
app.post('/api/communications/upload-pdf', authenticateToken, requireRoles('ESTABLISHMENT_OFFICER', 'DDO', 'SUPER_ADMIN', 'REPORTING_OFFICER', 'DEPT_ADMIN', 'DISTRICT_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const { fileName, fileData, fileSize } = req.body;

  if (!fileName || !fileData) {
    return res.status(400).json({ success: false, message: 'PDF File name and file data are required.' });
  }

  // 1. Strict PDF File Extension Validation
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file format! Only authentic PDF (.pdf) documents are permitted. Executables, images, ZIP archives, and scripts are strictly prohibited.'
    });
  }

  // 2. Strict MIME / Base64 Header Validation
  const isPdfMime = fileData.startsWith('data:application/pdf;base64,') || fileData.startsWith('data:application/x-pdf;base64,') || fileData.startsWith('JVBERi0'); // '%PDF-' in base64
  if (!isPdfMime && !fileData.includes('application/pdf')) {
    return res.status(400).json({
      success: false,
      message: 'File content verification failed: Uploaded file is not a valid PDF document.'
    });
  }

  // 3. File Size Validation (Max 15MB)
  const maxBytes = 15 * 1024 * 1024; // 15 MB
  let approximateBytes = 0;
  if (typeof fileSize === 'number') {
    approximateBytes = fileSize;
  } else {
    // Calculate base64 length in bytes
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    approximateBytes = Math.ceil((base64Data.length * 3) / 4);
  }

  if (approximateBytes > maxBytes) {
    return res.status(400).json({
      success: false,
      message: `File size (${(approximateBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 15 MB.`
    });
  }

  // Format readable size
  const formattedSize = approximateBytes > 1024 * 1024
    ? `${(approximateBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.max(1, Math.round(approximateBytes / 1024))} KB`;

  const cleanFileName = fileName.replace(/[^\w\s.-]/gi, '_');
  const attId = `ATT-PDF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const attachment: CommunicationAttachment = {
    id: attId,
    fileName: cleanFileName,
    fileSize: formattedSize,
    fileType: 'application/pdf',
    fileData: fileData.startsWith('data:') ? fileData : `data:application/pdf;base64,${fileData}`,
    downloadName: cleanFileName,
    uploadedAt: new Date().toISOString()
  };

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'UPLOAD_COMMUNICATION_PDF',
    'COMMUNICATION',
    attId,
    `Uploaded official PDF attachment "${cleanFileName}" (${formattedSize})`,
    req.ip
  );

  res.json({
    success: true,
    message: 'PDF attachment uploaded and validated successfully.',
    attachment
  });
});

// Get list of communications
app.get('/api/communications', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(150);
  const db = getDb();
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const isAdmin = ['DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER', 'REPORTING_OFFICER', 'DEPT_ADMIN', 'DISTRICT_ADMIN'].includes(user.role);

  db.communications = db.communications || [];

  let commList = [...db.communications];

  if (!isAdmin) {
    // Recipient Employee View: Strictly return communications targeted to this employee
    const currentEmp = db.employees.find(e => e.employeeId === user.employeeId);
    commList = db.communications.filter((c) => {
      if (c.status !== 'PUBLISHED') return false;
      
      // If individual target, strictly check if employeeId is in targetEmployeeIds
      if (c.targetAudience === 'INDIVIDUAL') {
        return Array.isArray(c.targetEmployeeIds) && c.targetEmployeeIds.includes(user.employeeId);
      }
      
      // If department target
      if (c.targetAudience === 'DEPARTMENT') {
        return Boolean(currentEmp && c.targetDepartment && currentEmp.department.toLowerCase().includes(c.targetDepartment.toLowerCase()));
      }
      
      // If office target
      if (c.targetAudience === 'OFFICE') {
        return Boolean(currentEmp && c.targetOffice && currentEmp.office.toLowerCase().includes(c.targetOffice.toLowerCase()));
      }
      
      // If designation target
      if (c.targetAudience === 'DESIGNATION') {
        return Boolean(currentEmp && c.targetDesignation && currentEmp.designation.toLowerCase().includes(c.targetDesignation.toLowerCase()));
      }
      
      // If general broadcast to all employees
      if (c.targetAudience === 'ALL_EMPLOYEES' || !c.targetAudience) {
        return true;
      }
      
      // Fallback: check if targetEmployeeIds explicitly includes this employee
      if (Array.isArray(c.targetEmployeeIds) && c.targetEmployeeIds.length > 0) {
        return c.targetEmployeeIds.includes(user.employeeId);
      }
      
      return false;
    });
  }

  // Sort newest first
  commList.sort((a, b) => new Date(b.publishDate || b.createdAt).getTime() - new Date(a.publishDate || a.createdAt).getTime());

  // Attach isRead flag for current employee
  const enrichedList = commList.map((c) => ({
    ...c,
    isRead: (c.readByEmployeeIds || []).includes(user.employeeId)
  }));

  const unreadCount = enrichedList.filter((c) => !c.isRead && c.status === 'PUBLISHED').length;

  res.json({
    success: true,
    communications: enrichedList,
    totalCount: enrichedList.length,
    unreadCount
  });
});

// Get single communication details
app.get('/api/communications/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  db.communications = db.communications || [];
  const comm = db.communications.find(c => c.id === req.params.id);
  if (!comm) {
    return res.status(404).json({ success: false, message: 'Communication notice not found.' });
  }

  const isAdmin = ['DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER', 'REPORTING_OFFICER', 'DEPT_ADMIN', 'DISTRICT_ADMIN'].includes(user.role);

  // Authorization Check for Employee
  if (!isAdmin) {
    if (comm.targetAudience === 'INDIVIDUAL' && (!comm.targetEmployeeIds || !comm.targetEmployeeIds.includes(user.employeeId))) {
      return res.status(403).json({ success: false, message: 'Access denied: This communication is addressed to another employee.' });
    }
  }

  const isRead = (comm.readByEmployeeIds || []).includes(user.employeeId);

  res.json({
    success: true,
    communication: {
      ...comm,
      isRead
    }
  });
});

// Stream or download authentic PDF attachment with authentication check
app.get('/api/communications/:commId/pdf/:attId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { commId, attId } = req.params;
  const db = getDb();
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  db.communications = db.communications || [];
  const comm = db.communications.find(c => c.id === commId);
  if (!comm) {
    return res.status(404).json({ success: false, message: 'Communication record not found.' });
  }

  const isAdmin = ['DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER', 'REPORTING_OFFICER', 'DEPT_ADMIN', 'DISTRICT_ADMIN'].includes(user.role);
  if (!isAdmin && comm.targetAudience === 'INDIVIDUAL' && (!comm.targetEmployeeIds || !comm.targetEmployeeIds.includes(user.employeeId))) {
    return res.status(403).json({ success: false, message: 'Unauthorized to view this attachment.' });
  }

  const att = (comm.attachments || []).find(a => a.id === attId);
  if (!att) {
    return res.status(404).json({ success: false, message: 'PDF Attachment not found.' });
  }

  if (att.fileData && att.fileData.includes('base64,')) {
    const base64Data = att.fileData.split('base64,')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${att.fileName || 'Document.pdf'}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  }

  res.json({ success: true, attachment: att });
});

// Mark single communication as read by employee
app.post('/api/communications/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  db.communications = db.communications || [];
  const comm = db.communications.find(c => c.id === req.params.id);
  if (!comm) {
    return res.status(404).json({ success: false, message: 'Communication notice not found.' });
  }

  comm.readByEmployeeIds = comm.readByEmployeeIds || [];
  if (!comm.readByEmployeeIds.includes(user.employeeId)) {
    comm.readByEmployeeIds.push(user.employeeId);
    saveDatabase();
  }

  res.json({ success: true, message: 'Marked as read.' });
});

// Mark all communications as read for employee
app.post('/api/communications/mark-all-read', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  db.communications = db.communications || [];
  db.communications.forEach(comm => {
    comm.readByEmployeeIds = comm.readByEmployeeIds || [];
    if (!comm.readByEmployeeIds.includes(user.employeeId)) {
      comm.readByEmployeeIds.push(user.employeeId);
    }
  });
  saveDatabase();

  res.json({ success: true, message: 'All communications marked as read.' });
});

// ADMIN: Create & publish / draft communication
app.post('/api/admin/communications/create', authenticateToken, requireRoles('ESTABLISHMENT_OFFICER', 'DDO', 'SUPER_ADMIN', 'REPORTING_OFFICER', 'DEPT_ADMIN', 'DISTRICT_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const db = getDb();
  const user = req.user!;
  const {
    title,
    referenceNo,
    type,
    priority,
    category,
    content,
    summary,
    targetAudience = 'INDIVIDUAL',
    targetDepartment,
    targetOffice,
    targetDesignation,
    targetEmployeeIds = [],
    status = 'PUBLISHED',
    publishDate,
    expiryDate,
    actionRequired,
    actionDeadline,
    actionType,
    actionLinkTab,
    attachments = []
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Communication title / subject is required.' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Communication message text is required.' });
  }

  // VERY IMPORTANT: Validate selected employee when audience is INDIVIDUAL
  if (targetAudience === 'INDIVIDUAL' && (!Array.isArray(targetEmployeeIds) || targetEmployeeIds.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Please select at least one employee recipient for this communication.'
    });
  }

  // Resolve target employees metadata for display in history
  const targetEmployeesSummary: any[] = [];
  if (Array.isArray(targetEmployeeIds) && targetEmployeeIds.length > 0) {
    targetEmployeeIds.forEach(empId => {
      const emp = db.employees.find(e => e.employeeId === empId);
      if (emp) {
        targetEmployeesSummary.push({
          employeeId: emp.employeeId,
          name: emp.name,
          designation: emp.designation,
          department: emp.department,
          office: emp.office
        });
      } else {
        targetEmployeesSummary.push({
          employeeId: empId,
          name: empId,
          designation: 'State Employee',
          department: 'Government of Odisha'
        });
      }
    });
  }

  const generatedRef = referenceNo?.trim() || `OD-EST/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  // Find sender employee details for official signature
  const senderEmp = db.employees.find(e => e.employeeId === user.employeeId);

  const newComm: CommunicationItem = {
    id: `COMM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    referenceNo: generatedRef,
    title: title.trim(),
    type: type || 'OFFICE_ORDER',
    priority: priority || 'NORMAL',
    category: category || 'Establishment Communication',
    content: content.trim(),
    summary: summary || title.trim().slice(0, 120),
    targetAudience: targetAudience || 'INDIVIDUAL',
    targetDepartment: targetDepartment || (targetAudience === 'DEPARTMENT' ? senderEmp?.department : undefined),
    targetOffice: targetOffice || (targetAudience === 'OFFICE' ? senderEmp?.office : undefined),
    targetDesignation,
    targetEmployeeIds: Array.isArray(targetEmployeeIds) ? targetEmployeeIds : [],
    targetEmployees: targetEmployeesSummary,
    status: status as any,
    publishDate: publishDate || now,
    expiryDate,
    actionRequired: Boolean(actionRequired),
    actionDeadline,
    actionType,
    actionLinkTab,
    attachments: Array.isArray(attachments) ? attachments : [],
    senderId: user.employeeId || user.id,
    senderName: senderEmp?.name || user.name || 'Drawing & Disbursing Officer (DDO)',
    senderDesignation: senderEmp?.designation || 'DDO / Establishment Officer',
    senderDepartment: senderEmp?.department || 'Panchayati Raj & Drinking Water Department',
    senderOffice: senderEmp?.office || 'Government of Odisha',
    readByEmployeeIds: [],
    createdAt: now,
    updatedAt: now
  };

  db.communications = db.communications || [];
  db.communications.unshift(newComm);

  // Dispatch notifications specifically to the targeted recipient(s) if published
  if (status === 'PUBLISHED') {
    const hasPdf = newComm.attachments && newComm.attachments.length > 0;
    const pdfName = hasPdf ? newComm.attachments[0].fileName : '';

    if (newComm.targetAudience === 'INDIVIDUAL' && newComm.targetEmployeeIds && newComm.targetEmployeeIds.length > 0) {
      // Send ONLY to the selected employees
      newComm.targetEmployeeIds.forEach(empId => {
        db.notifications.unshift({
          id: `NOTIF-COMM-${Date.now()}-${empId}`,
          employeeId: empId,
          title: `Official Intimation from DDO: ${newComm.title}`,
          message: `Ref: ${newComm.referenceNo} – ${newComm.summary || newComm.title}${hasPdf ? ` [Attached PDF: ${pdfName}]` : ''}`,
          type: 'SYSTEM',
          isRead: false,
          createdAt: now,
          link: 'communication'
        });
      });
    } else if (newComm.targetAudience === 'ALL_EMPLOYEES') {
      db.notifications.unshift({
        id: `NOTIF-COMM-${Date.now()}`,
        employeeId: 'ALL',
        title: `Official Notice: ${newComm.title}`,
        message: `Ref: ${newComm.referenceNo} – ${newComm.summary || newComm.title}${hasPdf ? ` [Attached PDF: ${pdfName}]` : ''}`,
        type: 'SYSTEM',
        isRead: false,
        createdAt: now,
        link: 'communication'
      });
    } else if (newComm.targetAudience === 'DEPARTMENT' && newComm.targetDepartment) {
      const deptEmployees = db.employees.filter(e => e.department.toLowerCase().includes(newComm.targetDepartment!.toLowerCase()));
      deptEmployees.forEach(emp => {
        db.notifications.unshift({
          id: `NOTIF-COMM-${Date.now()}-${emp.employeeId}`,
          employeeId: emp.employeeId,
          title: `Departmental Order: ${newComm.title}`,
          message: `Ref: ${newComm.referenceNo} – ${newComm.summary || newComm.title}${hasPdf ? ` [Attached PDF: ${pdfName}]` : ''}`,
          type: 'SYSTEM',
          isRead: false,
          createdAt: now,
          link: 'communication'
        });
      });
    }
  }

  logAudit(
    user.id,
    user.username,
    user.role,
    'CREATE_COMMUNICATION',
    'COMMUNICATION',
    newComm.id,
    `Created & ${status} communication Ref: ${newComm.referenceNo} - "${newComm.title}" targeted to ${newComm.targetAudience === 'INDIVIDUAL' ? `${newComm.targetEmployeeIds?.length || 0} selected employee(s)` : newComm.targetAudience}`,
    req.ip
  );

  saveDatabase();

  const recipientCount = newComm.targetEmployeeIds?.length || 1;
  const successMsg = newComm.targetAudience === 'INDIVIDUAL'
    ? `Communication successfully sent to ${recipientCount} selected employee${recipientCount > 1 ? 's' : ''}${newComm.attachments?.length ? ' with PDF attachment' : ''}.`
    : `Communication "${newComm.title}" ${status === 'PUBLISHED' ? 'published successfully' : 'saved as draft'}.`;

  res.json({
    success: true,
    message: successMsg,
    communication: newComm
  });
});

// ADMIN: Update existing communication
app.put('/api/admin/communications/:id', authenticateToken, requireRoles('ESTABLISHMENT_OFFICER', 'DDO', 'SUPER_ADMIN', 'REPORTING_OFFICER', 'DEPT_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const db = getDb();
  const user = req.user!;
  const commId = req.params.id;

  db.communications = db.communications || [];
  const commIndex = db.communications.findIndex(c => c.id === commId);
  if (commIndex === -1) {
    return res.status(404).json({ success: false, message: 'Communication not found.' });
  }

  const existing = db.communications[commIndex];
  const {
    title,
    referenceNo,
    type,
    priority,
    category,
    content,
    summary,
    targetAudience,
    targetDepartment,
    targetOffice,
    targetDesignation,
    targetEmployeeIds,
    status,
    publishDate,
    expiryDate,
    actionRequired,
    actionDeadline,
    actionType,
    actionLinkTab,
    attachments
  } = req.body;

  db.communications[commIndex] = {
    ...existing,
    ...(title ? { title: title.trim() } : {}),
    ...(referenceNo ? { referenceNo: referenceNo.trim() } : {}),
    ...(type ? { type } : {}),
    ...(priority ? { priority } : {}),
    ...(category ? { category } : {}),
    ...(content ? { content: content.trim() } : {}),
    ...(summary !== undefined ? { summary } : {}),
    ...(targetAudience ? { targetAudience } : {}),
    ...(targetDepartment !== undefined ? { targetDepartment } : {}),
    ...(targetOffice !== undefined ? { targetOffice } : {}),
    ...(targetDesignation !== undefined ? { targetDesignation } : {}),
    ...(targetEmployeeIds !== undefined ? { targetEmployeeIds } : {}),
    ...(status ? { status } : {}),
    ...(publishDate ? { publishDate } : {}),
    ...(expiryDate !== undefined ? { expiryDate } : {}),
    ...(actionRequired !== undefined ? { actionRequired: Boolean(actionRequired) } : {}),
    ...(actionDeadline !== undefined ? { actionDeadline } : {}),
    ...(actionType !== undefined ? { actionType } : {}),
    ...(actionLinkTab !== undefined ? { actionLinkTab } : {}),
    ...(attachments !== undefined ? { attachments } : {}),
    updatedAt: new Date().toISOString()
  };

  logAudit(
    user.id,
    user.username,
    user.role,
    'UPDATE_COMMUNICATION',
    'COMMUNICATION',
    commId,
    `Updated communication Ref: ${db.communications[commIndex].referenceNo} - "${db.communications[commIndex].title}"`,
    req.ip
  );

  saveDatabase();

  res.json({
    success: true,
    message: 'Communication updated successfully.',
    communication: db.communications[commIndex]
  });
});

// ADMIN: Delete communication
app.delete('/api/admin/communications/:id', authenticateToken, requireRoles('ESTABLISHMENT_OFFICER', 'DDO', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const db = getDb();
  const user = req.user!;
  const commId = req.params.id;

  db.communications = db.communications || [];
  const comm = db.communications.find(c => c.id === commId);
  if (!comm) {
    return res.status(404).json({ success: false, message: 'Communication not found.' });
  }

  db.communications = db.communications.filter(c => c.id !== commId);

  logAudit(
    user.id,
    user.username,
    user.role,
    'DELETE_COMMUNICATION',
    'COMMUNICATION',
    commId,
    `Deleted communication Ref: ${comm.referenceNo} - "${comm.title}"`,
    req.ip
  );

  saveDatabase();

  res.json({ success: true, message: 'Communication deleted successfully.' });
});

// ADMIN & DDO ENDPOINTS
app.get('/api/admin/employees', authenticateToken, requireRoles('ESTABLISHMENT_OFFICER', 'DDO', 'DISTRICT_ADMIN', 'DEPT_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(250);
  const db = getDb();
  try {
    const cloudEmployees = await getEmployeesFromCloud();
    if (cloudEmployees && cloudEmployees.length > 0) {
      for (const cloudEmp of cloudEmployees) {
        if (!cloudEmp.employeeId) continue;
        const cleanId = cloudEmp.employeeId.trim().toUpperCase();
        const idx = db.employees.findIndex((e) => e.employeeId && e.employeeId.toUpperCase() === cleanId);
        if (idx >= 0) {
          db.employees[idx] = { ...db.employees[idx], ...cloudEmp };
        } else {
          db.employees.unshift(cloudEmp);
        }
      }
    }
  } catch (err) {
    console.error('Cloud fetch on get employees:', err);
  }
  res.json({ success: true, employees: db.employees });
});

app.post('/api/admin/employees/create', authenticateToken, requireRoles('ESTABLISHMENT_OFFICER', 'DDO', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const {
    name,
    fatherName,
    motherName,
    dob,
    gender,
    mobile,
    email,
    designation,
    cadre,
    department,
    office,
    district,
    block,
    dateOfJoining,
    employmentType,
    payLevel,
    basicPay,
    panNumber,
    gpfNpsNo,
    reportingOfficerName,
    role,
    employeeId: customEmpId,
    password: customPassword
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Full Name is required.' });
  }

  const db = getDb();

  // Check or generate HRMS ID
  let newEmpId = customEmpId?.trim().toUpperCase();
  if (!newEmpId) {
    newEmpId = `EMP${Math.floor(100000 + Math.random() * 900000)}`;
  } else {
    const existingUser = db.users.find(
      (u) =>
        (u.username && u.username.trim().toUpperCase() === newEmpId) ||
        (u.employeeId && u.employeeId.trim().toUpperCase() === newEmpId)
    );
    if (existingUser) {
      return res.status(400).json({ success: false, message: `HRMS ID ${newEmpId} already exists in database. Please use a unique ID.` });
    }
  }

  const nowIso = new Date().toISOString();
  const newEmp: Employee = {
    id: `EMP-${Date.now()}`,
    employeeId: newEmpId,
    employeeCode: newEmpId,
    name: name.trim(),
    fatherName: fatherName?.trim() || 'N/A',
    motherName: motherName?.trim() || 'N/A',
    dob: dob || '1992-01-01',
    gender: gender || 'MALE',
    mobile: mobile?.trim() || '+91 94370 00000',
    email: email?.trim() || `${newEmpId.toLowerCase()}@hrmsodisha.gov.in`,
    designation: designation?.trim() || 'Junior Assistant',
    cadre: cadre?.trim() || 'Odisha State Civil Service',
    department: department?.trim() || 'Panchayati Raj & Drinking Water Department',
    office: office?.trim() || 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
    district: district?.trim() || 'Khordha',
    districtId: req.body.districtId,
    block: block?.trim() || 'Bhubaneswar MC',
    blockId: req.body.blockId,
    gp: req.body.gpName || req.body.gp,
    gpId: req.body.gpId,
    village: req.body.villageName || req.body.village,
    villageId: req.body.villageId,
    dateOfJoining: dateOfJoining || new Date().toISOString().split('T')[0],
    employmentType: (employmentType === 'CONTRACTUAL' || employmentType === 'PROBATION' ? employmentType : 'PERMANENT') as 'PERMANENT' | 'CONTRACTUAL' | 'PROBATION',
    currentPosting: office?.trim() || 'Main Branch',
    status: 'ACTIVE' as const,
    panNumber: panNumber?.trim() || `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
    gpfNpsNo: gpfNpsNo?.trim() || `OR/NPS/2026/${Math.floor(10000 + Math.random() * 90000)}`,
    payLevel: payLevel || 'Level-9',
    basicPay: Number(basicPay) || 44900,
    reportingOfficerId: 'RO20001',
    reportingOfficerName: reportingOfficerName?.trim() || 'Priyanka Mohanty',
    ddoId: req.user?.employeeId || 'EMP20267858',
    createdByDDO: req.user?.employeeId || 'EMP20267858',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  const existingEmpIdx = db.employees.findIndex((e) => e.employeeId && e.employeeId.trim().toUpperCase() === newEmpId);
  if (existingEmpIdx >= 0) {
    db.employees[existingEmpIdx] = newEmp;
  } else {
    db.employees.unshift(newEmp);
  }

  // Add user auth
  const pwdToUse = customPassword?.trim() || 'Password123!';
  const pwdHash = bcrypt.hashSync(pwdToUse, 10);

  const existingUserIdx = db.users.findIndex(
    (u) =>
      (u.username && u.username.trim().toUpperCase() === newEmpId) ||
      (u.employeeId && u.employeeId.trim().toUpperCase() === newEmpId)
  );
  const newUserObj: User = {
    id: existingUserIdx >= 0 ? db.users[existingUserIdx].id : `USR-${Date.now()}`,
    employeeId: newEmpId,
    username: newEmpId,
    role: (role || 'EMPLOYEE') as UserRole,
    name: newEmp.name,
    designation: newEmp.designation,
    department: newEmp.department,
    office: newEmp.office,
    district: newEmp.district,
    status: 'ACTIVE'
  };

  if (existingUserIdx >= 0) {
    db.users[existingUserIdx] = newUserObj;
  } else {
    db.users.push(newUserObj);
  }

  const existingAuthIdx = db.userAuth.findIndex(
    (a) => a.username && a.username.trim().toUpperCase() === newEmpId
  );
  const newAuthObj = {
    username: newEmpId,
    passwordHash: pwdHash,
    failedAttempts: 0,
    lockUntil: null
  };

  if (existingAuthIdx >= 0) {
    db.userAuth[existingAuthIdx] = newAuthObj;
  } else {
    db.userAuth.push(newAuthObj);
  }

  // Seed default leave balances
  db.leaveBalances[newEmpId] = [
    { leaveType: 'CASUAL', openingBalance: 15, used: 0, pending: 0, available: 15 },
    { leaveType: 'EARNED', openingBalance: 120, used: 0, pending: 0, available: 120 },
    { leaveType: 'MEDICAL', openingBalance: 20, used: 0, pending: 0, available: 20 },
    { leaveType: 'MATERNITY', openingBalance: 0, used: 0, pending: 0, available: 0 },
    { leaveType: 'PATERNITY', openingBalance: 15, used: 0, pending: 0, available: 15 },
    { leaveType: 'SPECIAL', openingBalance: 10, used: 0, pending: 0, available: 10 }
  ];

  // Seed Service Book
  db.serviceBooks[newEmpId] = {
    employeeId: newEmpId,
    personalDetails: {
      bloodGroup: 'O+',
      heightCm: 170,
      identificationMark: 'N/A',
      permanentAddress: `District: ${newEmp.district}, Odisha`,
      maritalStatus: 'MARRIED'
    },
    qualifications: [
      { degree: 'Bachelor Degree', institution: 'Utkal University', year: 2014, grade: '1st Class' }
    ],
    postingHistory: [
      { office: newEmp.office, district: newEmp.district, designation: newEmp.designation, startDate: newEmp.dateOfJoining, endDate: 'Present', orderNo: `ORD-${Math.floor(1000 + Math.random() * 9000)}` }
    ],
    promotionHistory: [],
    incrementHistory: [],
    trainingHistory: [],
    nominations: [
      { type: 'NPS', nomineeName: newEmp.fatherName || 'Nominee', relation: 'Father', sharePercent: 100 }
    ],
    retirementDetails: {
      superannuationDate: `${Number((newEmp.dob || '1990').split('-')[0]) + 60}-12-31`,
      pensionType: 'National Pension System (NPS)'
    }
  };

  // Seed Initial Salary Record
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const da = Math.round(newEmp.basicPay * 0.5);
  const hra = Math.round(newEmp.basicPay * 0.2);
  const gross = newEmp.basicPay + da + hra + 500 + 1000;
  const nps = Math.round((newEmp.basicPay + da) * 0.1);
  const ptax = 200;
  const itax = 4500;
  const loanRec = 0;
  const gis = 400;
  const totalDed = nps + ptax + itax + loanRec + gis;
  const net = gross - totalDed;

  const initialSalaryRecord: SalaryRecord = {
    id: `SAL-${currentYear}-${String(currentMonth).padStart(2, '0')}-${newEmpId}`,
    employeeId: newEmpId,
    employeeName: newEmp.name,
    month: currentMonth,
    year: currentYear,
    payLevel: newEmp.payLevel,
    basicPay: newEmp.basicPay,
    da,
    hra,
    medicalAllowance: 500,
    specialAllowance: 1000,
    grossSalary: gross,
    npsContribution: nps,
    professionalTax: ptax,
    incomeTax: itax,
    loanRecovery: loanRec,
    gis: gis,
    totalDeductions: totalDed,
    netPay: net,
    paymentStatus: 'PAID',
    paymentDate: new Date().toISOString().split('T')[0]
  };
  db.salaryRecords.push(initialSalaryRecord);

  // System Notification for Employee
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    employeeId: newEmpId,
    title: 'e-HRMS Employee Account Activated',
    message: `Welcome ${newEmp.name}! Your Employee HRMS account (${newEmpId}) has been successfully created and activated by your DDO.`,
    type: 'SYSTEM',
    isRead: false,
    createdAt: new Date().toISOString(),
    link: '/profile'
  });

  saveDatabase();
  createBackupSnapshot(`emp_create_${newEmpId}`);

  // Persist permanently to Cloud Firestore
  saveEmployeeToCloud(newEmp).catch((err) => console.error('Cloud Firestore save error:', err));

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'EMPLOYEE_CREATED',
    'ADMIN',
    newEmpId,
    `Created employee ${name} (${newEmpId}) permanently in HRMS database.`,
    req.ip
  );

  res.json({
    success: true,
    message: 'Employee HRMS Account Created Successfully with permanent persistence.',
    employee: newEmp
  });
});

// Soft Delete / Deactivate Employee (Permanent data preservation)
app.delete('/api/admin/employees/:employeeId', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const { employeeId } = req.params;
  const db = getDb();

  if (req.user?.employeeId === employeeId) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own active DDO login account.' });
  }

  const emp = db.employees.find((e) => e.employeeId === employeeId);
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee record not found in database.' });
  }

  const nowIso = new Date().toISOString();
  emp.status = 'DEACTIVATED';
  emp.updatedAt = nowIso;
  emp.updatedBy = req.user?.name || req.user?.employeeId || 'DDO';

  const userRecord = db.users.find((u) => u.employeeId === employeeId || u.username === employeeId);
  if (userRecord) {
    userRecord.status = 'INACTIVE';
  }

  saveDatabase();
  createBackupSnapshot(`emp_deactivate_${employeeId}`);

  // Persist deactivation status to Cloud Firestore
  updateEmployeeInCloud(employeeId, { status: 'DEACTIVATED', employeeStatus: 'Inactive' }).catch((err) =>
    console.error('Cloud Firestore deactivate error:', err)
  );

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'EMPLOYEE_DEACTIVATED',
    'ADMIN',
    employeeId,
    `Safely deactivated employee ${emp.name} (${employeeId}) – all historical service books and transfer records preserved.`,
    req.ip
  );

  res.json({
    success: true,
    message: `Employee ${emp.name} (${employeeId}) has been safely deactivated. All service records, leave history, and transfer documents remain permanently preserved in the HRMS database.`,
    employee: emp
  });
});

// Update Employee Status endpoint (ACTIVE, INACTIVE, DEACTIVATED, SUSPENDED, RETIRED)
app.post('/api/admin/employees/:employeeId/status', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const { employeeId } = req.params;
  const { status, remarks } = req.body;

  const validStatuses = ['ACTIVE', 'INACTIVE', 'DEACTIVATED', 'SUSPENDED', 'RETIRED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
  }

  const db = getDb();
  const emp = db.employees.find((e) => e.employeeId === employeeId);
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee record not found.' });
  }

  const nowIso = new Date().toISOString();
  const prevStatus = emp.status;
  emp.status = status;
  emp.updatedAt = nowIso;
  emp.updatedBy = req.user?.name || req.user?.employeeId || 'DDO';

  const userRecord = db.users.find((u) => u.employeeId === employeeId || u.username === employeeId);
  if (userRecord) {
    userRecord.status = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
  }

  saveDatabase();
  createBackupSnapshot(`emp_status_${employeeId}_${status}`);

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'EMPLOYEE_STATUS_UPDATED',
    'ADMIN',
    employeeId,
    `Status changed from ${prevStatus} to ${status} for ${emp.name} (${employeeId}). ${remarks || ''}`,
    req.ip
  );

  res.json({
    success: true,
    message: `Status for ${emp.name} (${employeeId}) changed to ${status}.`,
    status,
    employee: emp
  });
});

// ==================== DATABASE BACKUP & RECOVERY APIS ====================

// 1. Download Current Database JSON Backup
app.get('/api/admin/database/backup', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `hrms_odisha_backup_${timestamp}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(db, null, 2));
});

// 2. List Available Automated Snapshots
app.get('/api/admin/database/backups-list', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  const backups = getAvailableBackups();
  res.json({
    success: true,
    totalBackups: backups.length,
    backups
  });
});

// 3. Create Immediate Manual Backup Point
app.post('/api/admin/database/backup-now', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const { label } = req.body;
  const filename = createBackupSnapshot(label ? label.trim().replace(/[^a-zA-Z0-9_-]/g, '') : 'ddo_manual_backup');

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'DATABASE_BACKUP_CREATED',
    'DATABASE',
    filename,
    `Manual database snapshot created by ${req.user!.name}`,
    req.ip
  );

  res.json({
    success: true,
    message: 'Manual database snapshot created successfully.',
    filename
  });
});

// 4. Restore Database from a Snapshot
app.post('/api/admin/database/restore', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(600);
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ success: false, message: 'Snapshot filename is required.' });
  }

  const success = restoreFromBackup(filename);
  if (!success) {
    return res.status(500).json({ success: false, message: 'Failed to restore database from snapshot. File may be corrupted or invalid.' });
  }

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'DATABASE_RESTORED',
    'DATABASE',
    filename,
    `Database restored from snapshot ${filename} by ${req.user!.name}`,
    req.ip
  );

  res.json({
    success: true,
    message: `Database successfully restored from snapshot ${filename}.`,
    employeeCount: getDb().employees.length
  });
});

app.get('/api/admin/pending-approvals', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(350);
  const db = getDb();
  const pendingLeaves = db.leaveRequests.filter((l) => l.status === 'PENDING');
  const pendingTransfers = db.transfers.filter((t) => t.status === 'SUBMITTED' || t.status === 'UNDER_DDO_REVIEW' || t.status === 'PENDING_APPROVAL');
  const pendingLPCs = db.lpcRecords.filter((l) => l.status === 'FORWARDED');
  const pendingGrievances = db.grievanceRecords.filter((g) => g.status === 'SUBMITTED' || g.status === 'UNDER_PROCESS');

  res.json({
    success: true,
    pendingLeaves,
    pendingTransfers,
    pendingLPCs,
    pendingGrievances
  });
});

app.get('/api/admin/audit-logs', authenticateToken, requireRoles('SUPER_ADMIN', 'DISTRICT_ADMIN', 'DEPT_ADMIN', 'DDO', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const db = getDb();
  res.json({ success: true, logs: db.auditLogs });
});

// Reset Password by DDO
app.post('/api/admin/employees/:employeeId/reset-password', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const { employeeId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  const db = getDb();
  const authRecord = db.userAuth.find(a => a.username.toUpperCase() === employeeId.toUpperCase());
  if (!authRecord) {
    return res.status(404).json({ success: false, message: 'Employee auth record not found.' });
  }

  const newHash = bcrypt.hashSync(newPassword.trim(), 10);
  authRecord.passwordHash = newHash;
  authRecord.failedAttempts = 0;
  authRecord.lockUntil = null;

  saveDatabase();

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'PASSWORD_RESET_BY_DDO',
    'ADMIN',
    employeeId,
    `Reset password for employee ${employeeId}`,
    req.ip
  );

  res.json({ success: true, message: `Password for employee ${employeeId} has been reset successfully. They can now log in with the new password.` });
});

// Toggle Employee Status (Active / Inactive)
app.post('/api/admin/employees/:employeeId/toggle-status', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const { employeeId } = req.params;
  const db = getDb();

  const emp = db.employees.find(e => e.employeeId === employeeId);
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee record not found.' });
  }

  const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  emp.status = newStatus;

  const usr = db.users.find(u => u.employeeId === employeeId || u.username === employeeId);
  if (usr) {
    usr.status = newStatus;
  }

  saveDatabase();

  // Sync status to Cloud Firestore
  updateEmployeeInCloud(employeeId, {
    status: newStatus,
    employeeStatus: newStatus === 'ACTIVE' ? 'Active' : 'Inactive'
  }).catch((err) => console.error('Cloud Firestore toggle-status error:', err));

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'EMPLOYEE_STATUS_CHANGED',
    'ADMIN',
    employeeId,
    `Changed status of employee ${emp.name} (${employeeId}) to ${newStatus}`,
    req.ip
  );

  res.json({ success: true, message: `Employee status changed to ${newStatus}.`, status: newStatus });
});

// Edit Employee Record
app.post('/api/admin/employees/:employeeId/edit', authenticateToken, requireRoles('DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER'), async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const { employeeId } = req.params;
  const updates = req.body;
  const db = getDb();

  const emp = db.employees.find(e => e.employeeId === employeeId);
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee record not found.' });
  }

  // Update employee details
  if (updates.name) emp.name = updates.name.trim();
  if (updates.designation) emp.designation = updates.designation.trim();
  if (updates.department) emp.department = updates.department.trim();
  if (updates.office) emp.office = updates.office.trim();
  if (updates.district) emp.district = updates.district.trim();
  if (updates.mobile) emp.mobile = updates.mobile.trim();
  if (updates.email) emp.email = updates.email.trim();
  if (updates.basicPay) emp.basicPay = Number(updates.basicPay);
  if (updates.payLevel) emp.payLevel = updates.payLevel;
  if (updates.status) emp.status = updates.status;

  // Sync user record
  const usr = db.users.find(u => u.employeeId === employeeId || u.username === employeeId);
  if (usr) {
    if (updates.name) usr.name = updates.name.trim();
    if (updates.designation) usr.designation = updates.designation.trim();
    if (updates.department) usr.department = updates.department.trim();
    if (updates.office) usr.office = updates.office.trim();
    if (updates.district) usr.district = updates.district.trim();
    if (updates.status) usr.status = updates.status;
  }

  saveDatabase();

  // Persist edits to Cloud Firestore
  updateEmployeeInCloud(employeeId, {
    name: emp.name,
    designation: emp.designation,
    department: emp.department,
    office: emp.office,
    district: emp.district,
    mobile: emp.mobile,
    email: emp.email,
    basicPay: emp.basicPay,
    payLevel: emp.payLevel,
    status: emp.status,
    employeeStatus: emp.status === 'ACTIVE' ? 'Active' : 'Inactive'
  }).catch((err) => console.error('Cloud Firestore edit sync error:', err));

  logAudit(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'EMPLOYEE_UPDATED',
    'ADMIN',
    employeeId,
    `Updated details for employee ${emp.name} (${employeeId})`,
    req.ip
  );

  res.json({ success: true, message: `Employee details for ${emp.name} updated successfully.`, employee: emp });
});

// GLOBAL SEARCH API
const handleGlobalSearch = async (req: AuthRequest, res: Response) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  if (!query) return res.json({ success: true, results: [] });

  const db = getDb();
  const results = db.employees.filter(
    (e) =>
      e.name.toLowerCase().includes(query) ||
      e.employeeId.toLowerCase().includes(query) ||
      e.designation.toLowerCase().includes(query) ||
      e.office.toLowerCase().includes(query) ||
      e.district.toLowerCase().includes(query)
  );

  res.json({ success: true, results });
};

app.get('/api/search', authenticateToken, handleGlobalSearch);
app.get('/api/search/employees', authenticateToken, handleGlobalSearch);

// FILE UPLOAD SIMULATION API
app.post('/api/upload', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(400);
  const { fileName, fileType, size } = req.body;

  if (size && size > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit.' });
  }

  const allowedTypes = ['pdf', 'png', 'jpg', 'jpeg'];
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (ext && !allowedTypes.includes(ext)) {
    return res.status(400).json({ success: false, message: 'Invalid file format! Allowed: PDF, PNG, JPG.' });
  }

  const secureFileName = `DOC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext || 'pdf'}`;
  const mockUrl = `/uploads/${secureFileName}`;

  res.json({ success: true, url: mockUrl, fileName: secureFileName, message: 'Attachment uploaded successfully.' });
});

// REPORTS API
app.get('/api/reports/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  await simulateServerLatency(300);
  const db = getDb();

  const totalEmployees = db.employees.length;
  const activeLeaves = db.leaveRequests.filter((l) => l.status === 'APPROVED').length;
  const pendingLeaves = db.leaveRequests.filter((l) => l.status === 'PENDING').length;
  const totalSalaryPayout = db.salaryRecords.reduce((acc, curr) => acc + curr.netPay, 0);

  res.json({
    success: true,
    totalEmployees,
    activeLeaves,
    pendingLeaves,
    totalSalaryPayout,
    departmentsCount: 8,
    districtsCount: db.districts?.length || 30
  });
});

// ==================== ODISHA MASTER DATA ENDPOINTS ====================

// 1. Get Districts
app.get('/api/master/districts', async (req: Request, res: Response) => {
  const db = getDb();
  const districts = [...(db.districts || [])].sort((a, b) => a.name.localeCompare(b.name));
  res.json({ success: true, districts });
});

// 2. Get Blocks (by District ID or name)
app.get('/api/master/blocks', async (req: Request, res: Response) => {
  const { districtId, districtName } = req.query;
  const db = getDb();
  let blocks = db.blocks || [];
  
  let targetDistId = districtId as string;
  if (!targetDistId && districtName) {
    const d = db.districts.find(x => x.name.toLowerCase() === (districtName as string).toLowerCase());
    if (d) targetDistId = d.id;
  }

  if (targetDistId) {
    blocks = blocks.filter(b => b.districtId === targetDistId);
  }
  blocks = [...blocks].sort((a, b) => a.name.localeCompare(b.name));
  res.json({ success: true, blocks });
});

// 3. Get Gram Panchayats (by Block ID or name)
app.get('/api/master/gps', async (req: Request, res: Response) => {
  const { blockId, blockName } = req.query;
  const db = getDb();
  let gps = db.gramPanchayats || [];

  let targetBlockId = blockId as string;
  if (!targetBlockId && blockName) {
    const b = db.blocks.find(x => x.name.toLowerCase() === (blockName as string).toLowerCase());
    if (b) targetBlockId = b.id;
  }

  if (targetBlockId) {
    gps = gps.filter(g => g.blockId === targetBlockId);
  }
  gps = [...gps].sort((a, b) => a.name.localeCompare(b.name));
  res.json({ success: true, gps });
});

// 4. Get Villages (by GP ID or name)
app.get('/api/master/villages', async (req: Request, res: Response) => {
  const { gpId, gpName } = req.query;
  const db = getDb();
  let villages = db.villages || [];

  let targetGpId = gpId as string;
  if (!targetGpId && gpName) {
    const g = db.gramPanchayats.find(x => x.name.toLowerCase() === (gpName as string).toLowerCase());
    if (g) targetGpId = g.id;
  }

  if (targetGpId) {
    villages = villages.filter(v => v.gpId === targetGpId);
  }
  villages = [...villages].sort((a, b) => a.name.localeCompare(b.name));
  res.json({ success: true, villages });
});

// 5. Get Offices Mapping with Administrative Hierarchy
app.get('/api/master/offices', async (req: Request, res: Response) => {
  const db = getDb();
  const offices = db.officesMaster || [];
  res.json({ success: true, offices });
});

// 6. Validate Location Hierarchy Combination
app.post('/api/master/validate-hierarchy', async (req: Request, res: Response) => {
  const { districtId, blockId, gpId, villageId, districtName, blockName, gpName, villageName } = req.body;
  const db = getDb();
  const errors: string[] = [];

  const district = db.districts.find(d => d.id === districtId || d.name.toLowerCase() === (districtName || '').toLowerCase() || d.name.toLowerCase() === (districtId || '').toLowerCase());
  if (!district && (districtId || districtName)) {
    errors.push(`Selected District '${districtName || districtId}' does not exist in master data.`);
  }

  let block = null;
  if (blockId || blockName) {
    block = db.blocks.find(b => b.id === blockId || b.name.toLowerCase() === (blockName || '').toLowerCase() || b.name.toLowerCase() === (blockId || '').toLowerCase());
    if (!block) {
      errors.push(`Selected Block '${blockName || blockId}' does not exist in master data.`);
    } else if (district && block.districtId !== district.id) {
      errors.push(`Selected Block '${block.name}' does not belong to District '${district.name}'.`);
    }
  }

  let gp = null;
  if (gpId || gpName) {
    gp = db.gramPanchayats.find(g => g.id === gpId || g.name.toLowerCase() === (gpName || '').toLowerCase() || g.name.toLowerCase() === (gpId || '').toLowerCase());
    if (!gp) {
      errors.push(`Selected Gram Panchayat '${gpName || gpId}' does not exist in master data.`);
    } else if (block && gp.blockId !== block.id) {
      errors.push(`Selected Gram Panchayat '${gp.name}' does not belong to Block '${block.name}'.`);
    }
  }

  let village = null;
  if (villageId || villageName) {
    village = db.villages.find(v => v.id === villageId || v.name.toLowerCase() === (villageName || '').toLowerCase() || v.name.toLowerCase() === (villageId || '').toLowerCase());
    if (!village) {
      errors.push(`Selected Village '${villageName || villageId}' does not exist in master data.`);
    } else if (gp && village.gpId !== gp.id) {
      errors.push(`Selected Village '${village.name}' does not belong to Gram Panchayat '${gp.name}'.`);
    }
  }

  const isValid = errors.length === 0;

  res.json({
    success: isValid,
    valid: isValid,
    errors,
    hierarchy: {
      state: 'Odisha',
      districtId: district?.id || '',
      districtName: district?.name || '',
      blockId: block?.id || '',
      blockName: block?.name || '',
      gpId: gp?.id || '',
      gpName: gp?.name || '',
      villageId: village?.id || '',
      villageName: village?.name || ''
    }
  });
});

// 7. Dynamic Admin Master Data Add/Update Endpoints
app.post('/api/admin/master/district', authenticateToken, requireRoles('SUPER_ADMIN', 'DDO'), async (req: AuthRequest, res: Response) => {
  const { name, code, headquarter } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'District name is required.' });
  const db = getDb();
  const id = `DIST_${name.substring(0, 3).toUpperCase()}_${Date.now()}`;
  const newDistrict = { id, code: code || name.substring(0, 3).toUpperCase(), name, headquarter: headquarter || name, stateId: 'STATE_ODI' };
  db.districts.push(newDistrict);
  saveDatabase();
  logAudit(req.user!.id, req.user!.username, req.user!.role, 'ADD_DISTRICT', 'MASTER_DATA', id, `Added district ${name}`, req.ip);
  res.json({ success: true, message: `District '${name}' added to master database.`, district: newDistrict });
});

app.post('/api/admin/master/block', authenticateToken, requireRoles('SUPER_ADMIN', 'DDO'), async (req: AuthRequest, res: Response) => {
  const { districtId, name, code } = req.body;
  if (!districtId || !name) return res.status(400).json({ success: false, message: 'District ID and Block name are required.' });
  const db = getDb();
  const id = `BLK_${name.substring(0, 3).toUpperCase()}_${Date.now()}`;
  const newBlock = { id, code: code || name.substring(0, 3).toUpperCase(), districtId, name };
  db.blocks.push(newBlock);
  saveDatabase();
  logAudit(req.user!.id, req.user!.username, req.user!.role, 'ADD_BLOCK', 'MASTER_DATA', id, `Added block ${name}`, req.ip);
  res.json({ success: true, message: `Block '${name}' added to master database.`, block: newBlock });
});

app.post('/api/admin/master/gp', authenticateToken, requireRoles('SUPER_ADMIN', 'DDO'), async (req: AuthRequest, res: Response) => {
  const { blockId, name, code } = req.body;
  if (!blockId || !name) return res.status(400).json({ success: false, message: 'Block ID and GP name are required.' });
  const db = getDb();
  const id = `GP_${name.substring(0, 3).toUpperCase()}_${Date.now()}`;
  const newGp = { id, code: code || name.substring(0, 3).toUpperCase(), blockId, name };
  db.gramPanchayats.push(newGp);
  saveDatabase();
  logAudit(req.user!.id, req.user!.username, req.user!.role, 'ADD_GP', 'MASTER_DATA', id, `Added GP ${name}`, req.ip);
  res.json({ success: true, message: `Gram Panchayat '${name}' added to master database.`, gp: newGp });
});

app.post('/api/admin/master/village', authenticateToken, requireRoles('SUPER_ADMIN', 'DDO'), async (req: AuthRequest, res: Response) => {
  const { gpId, name, code, pincode } = req.body;
  if (!gpId || !name) return res.status(400).json({ success: false, message: 'GP ID and Village name are required.' });
  const db = getDb();
  const id = `VIL_${name.substring(0, 3).toUpperCase()}_${Date.now()}`;
  const newVillage = { id, code: code || name.substring(0, 3).toUpperCase(), gpId, name, pincode };
  db.villages.push(newVillage);
  saveDatabase();
  logAudit(req.user!.id, req.user!.username, req.user!.role, 'ADD_VILLAGE', 'MASTER_DATA', id, `Added village ${name}`, req.ip);
  res.json({ success: true, message: `Village '${name}' added to master database.`, village: newVillage });
});

app.post('/api/admin/master/office', authenticateToken, requireRoles('SUPER_ADMIN', 'DDO'), async (req: AuthRequest, res: Response) => {
  const { name, code, department, districtId, blockId, gpId, villageId, pincode } = req.body;
  if (!name || !department || !districtId || !blockId) {
    return res.status(400).json({ success: false, message: 'Office Name, Department, District, and Block are required.' });
  }
  const db = getDb();
  const dist = db.districts.find(d => d.id === districtId);
  const blk = db.blocks.find(b => b.id === blockId);
  const gp = db.gramPanchayats.find(g => g.id === gpId);
  const vil = db.villages.find(v => v.id === villageId);

  const id = `OFF_${Date.now()}`;
  const newOffice = {
    id,
    code: code || `OFF-${Date.now().toString().slice(-4)}`,
    name,
    department,
    state: 'Odisha',
    districtId,
    districtName: dist?.name || '',
    blockId,
    blockName: blk?.name || '',
    gpId: gpId || '',
    gpName: gp?.name || '',
    villageId: villageId || '',
    villageName: vil?.name || '',
    pincode
  };
  db.officesMaster.push(newOffice);
  saveDatabase();
  logAudit(req.user!.id, req.user!.username, req.user!.role, 'ADD_OFFICE', 'MASTER_DATA', id, `Added Office ${name}`, req.ip);
  res.json({ success: true, message: `Office '${name}' added to master mapping.`, office: newOffice });
});

// ==========================================
// 8. UNIFIED E-DOCUMENTS REPOSITORY ENDPOINTS
// ==========================================
app.get('/api/documents/:employeeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { employeeId } = req.params;
  const db = getDb();
  const emp = db.employees.find(e => e.employeeId === employeeId);
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });

  // Gather transfer documents
  const transferDocs = (db.transferDocuments || []).filter(d => d.employeeId === employeeId).map(d => ({
    id: d.id,
    title: d.documentTitle || d.documentType,
    category: 'TRANSFER' as const,
    orderNumber: d.orderNumber || d.transferId,
    orderDate: d.orderDate || d.uploadedAt?.split('T')[0],
    fileName: d.fileName,
    fileSize: d.fileSize || '320 KB',
    uploadedAt: d.uploadedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    uploadedBy: d.uploadedBy || 'Establishment Officer',
    status: 'VERIFIED' as const,
    description: d.remarks || `${d.documentType} issued for HRMS transfer workflow.`,
    fileData: d.fileData
  }));

  // Build standard verified documents
  const baseDocs = [
    {
      id: `DOC-APT-${emp.employeeId}`,
      title: 'Official Initial Appointment & Posting Order',
      category: 'APPOINTMENT' as const,
      orderNumber: `PR-EST-${emp.dateOfJoining?.split('-')[0] || '2020'}/4192`,
      orderDate: emp.dateOfJoining || '2020-07-15',
      fileName: 'Appointment_Order_OdishaGovt.pdf',
      fileSize: '412 KB',
      uploadedAt: emp.dateOfJoining || '2020-07-15',
      uploadedBy: 'Establishment Officer',
      status: 'VERIFIED' as const,
      description: `Official regular appointment order under ${emp.department}, ${emp.office}.`
    },
    {
      id: `DOC-SB-${emp.employeeId}`,
      title: 'e-HRMS Verified Digital Service Book Extract',
      category: 'SERVICE_RECORD' as const,
      orderNumber: `SB-${emp.employeeId}-2026`,
      orderDate: '2026-01-10',
      fileName: 'Verified_ServiceBook_Summary.pdf',
      fileSize: '620 KB',
      uploadedAt: '2026-01-10',
      uploadedBy: 'DDO Officer',
      status: 'VERIFIED' as const,
      description: `Digitally certified service record for ${emp.name} (${emp.employeeId}) with pay fixation.`
    },
    {
      id: `DOC-F16-${emp.employeeId}`,
      title: 'Annual Income Tax Form-16 (FY 2025-26)',
      category: 'FINANCE_TAX' as const,
      orderNumber: 'IT-TDS-2025-26',
      orderDate: '2026-01-31',
      fileName: 'Form16_TDS_Certificate.pdf',
      fileSize: '320 KB',
      uploadedAt: '2026-02-01',
      uploadedBy: 'Accounts Section / DDO',
      status: 'VERIFIED' as const,
      description: 'Certificate under Section 203 of the Income-Tax Act, 1961 for salary disbursement.'
    },
    {
      id: `DOC-GIS-${emp.employeeId}`,
      title: 'Group Insurance Scheme (GIS) Passbook Certificate',
      category: 'FINANCE_TAX' as const,
      orderNumber: `GIS-OD-${emp.employeeId}`,
      orderDate: '2025-11-20',
      fileName: 'GIS_Passbook_Endorsement.pdf',
      fileSize: '245 KB',
      uploadedAt: '2025-11-20',
      uploadedBy: 'Finance Officer',
      status: 'VERIFIED' as const,
      description: 'State government GIS policy record with cumulative savings credit balance.'
    },
    {
      id: `DOC-KYC-${emp.employeeId}`,
      title: 'Government Identity & Aadhaar/PAN Verification Record',
      category: 'IDENTITY' as const,
      orderNumber: `KYC-${emp.panNumber || 'ODGovt'}`,
      orderDate: '2021-03-12',
      fileName: 'Employee_Identity_KYC.pdf',
      fileSize: '190 KB',
      uploadedAt: '2021-03-12',
      uploadedBy: 'Self / HRMS Verification',
      status: 'VERIFIED' as const,
      description: 'Official identity and biometric records registered in the HRMS Odisha database.'
    }
  ];

  // Custom user-uploaded docs
  const customDocs = ((db as any).customDocuments || []).filter((d: any) => d.employeeId === employeeId);

  const allDocuments = [...customDocs, ...transferDocs, ...baseDocs];
  res.json({ success: true, documents: allDocuments });
});

app.post('/api/documents/upload', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { employeeId, title, category, orderNumber, orderDate, description, fileName, fileSize, fileData, uploadedBy } = req.body;
  if (!employeeId || !title) {
    return res.status(400).json({ success: false, message: 'Employee ID and Title are required.' });
  }

  const db = getDb();
  if (!(db as any).customDocuments) {
    (db as any).customDocuments = [];
  }

  const docId = `DOC-${Date.now()}`;
  const newDoc = {
    id: docId,
    employeeId,
    title,
    category: category || 'SERVICE_RECORD',
    orderNumber: orderNumber || `OD-${Date.now().toString().slice(-4)}`,
    orderDate: orderDate || new Date().toISOString().split('T')[0],
    description: description || '',
    fileName: fileName || 'Uploaded_Document.pdf',
    fileSize: fileSize || '280 KB',
    fileData: fileData || '',
    uploadedAt: new Date().toISOString().split('T')[0],
    uploadedBy: uploadedBy || req.user?.name || 'Employee',
    status: 'VERIFIED'
  };

  (db as any).customDocuments.unshift(newDoc);
  saveDatabase();
  logAudit(req.user!.id, req.user!.username, req.user!.role, 'UPLOAD_DOCUMENT', 'E_VAULT', docId, `Uploaded document ${title}`, req.ip);

  res.json({ success: true, message: 'Document uploaded successfully to e-Vault.', document: newDoc });
});

// ==========================================
// 9. UNIFIED APPLICATION HISTORY ENDPOINT
// ==========================================
app.get('/api/applications/history/:employeeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { employeeId } = req.params;
  const db = getDb();

  const applications: any[] = [];

  // 1. Transfers
  (db.transfers || []).filter(t => t.employeeId === employeeId).forEach(t => {
    applications.push({
      id: `APP-${t.id}`,
      appNumber: t.requestNumber || t.id,
      type: 'TRANSFER',
      typeName: 'Transfer & Posting Application',
      subject: `Transfer request to ${t.preferredDistrict || 'Preferred District'} on ${t.transferType || 'General Grounds'}`,
      submittedOn: t.submissionDate || t.createdAt?.split('T')[0] || '10-Feb-2026',
      status: t.status.replace(/_/g, ' '),
      statusType: ['APPROVED', 'ORDER_ISSUED', 'RELIEVED', 'JOINED'].includes(t.status)
        ? 'APPROVED'
        : t.status === 'REJECTED'
        ? 'REJECTED'
        : 'PENDING',
      currentAuthority: 'DDO / Establishment Officer',
      remarks: t.remarks || 'Application under departmental verification.',
      targetModule: 'transfers'
    });
  });

  // 2. Leaves
  (db.leaveRequests || []).filter(l => l.employeeId === employeeId).forEach(l => {
    applications.push({
      id: `APP-${l.id}`,
      appNumber: l.requestNumber || l.id,
      type: 'LEAVE',
      typeName: `${l.leaveType} Leave Application (${l.totalDays} Days)`,
      subject: `${l.reason || 'Leave requested'} (${l.startDate} to ${l.endDate})`,
      submittedOn: l.createdAt?.split('T')[0] || '02-Feb-2026',
      status: l.status,
      statusType: l.status === 'APPROVED' ? 'APPROVED' : l.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
      currentAuthority: l.reportingOfficerName || 'DDO Officer',
      remarks: l.officerRemarks || 'Leave ledger balance verified.',
      targetModule: 'leave'
    });
  });

  // 3. Loans
  (db.loans || []).filter(ln => ln.employeeId === employeeId).forEach(ln => {
    applications.push({
      id: `APP-${ln.id}`,
      appNumber: ln.sanctionNo || ln.id,
      type: 'LOAN',
      typeName: ln.loanType.replace(/_/g, ' '),
      subject: `Government advance sanction of ₹${ln.originalAmount?.toLocaleString('en-IN')}`,
      submittedOn: ln.sanctionDate || '14-Aug-2023',
      status: ln.status,
      statusType: ln.status === 'ACTIVE' || ln.status === 'CLOSED' ? 'APPROVED' : 'PENDING',
      currentAuthority: 'Directorate of PR & DW',
      remarks: `Monthly recovery: ₹${ln.monthlyInstallment?.toLocaleString('en-IN')}`,
      targetModule: 'loans'
    });
  });

  // 4. Grievances
  (db.grievanceRecords || []).filter(g => g.employeeId === employeeId).forEach(g => {
    applications.push({
      id: `APP-${g.id}`,
      appNumber: g.grievanceNumber || g.id,
      type: 'GRIEVANCE',
      typeName: `Grievance: ${g.category}`,
      subject: g.subject || g.description?.slice(0, 80) || 'HRMS Help Desk Ticket',
      submittedOn: g.createdAt?.split('T')[0] || '04-Dec-2025',
      status: g.status,
      statusType: g.status === 'RESOLVED' ? 'COMPLETED' : g.status === 'REJECTED' ? 'REJECTED' : 'PROCESSING',
      currentAuthority: 'DDO Help Desk',
      remarks: g.resolutionRemarks || 'Under process by support officer.',
      targetModule: 'grievances'
    });
  });

  // 5. PAR
  (db.eParReports || []).filter(p => p.employeeId === employeeId).forEach(p => {
    applications.push({
      id: `APP-${p.id}`,
      appNumber: `PAR-${p.period || '2025-26'}-${p.employeeId}`,
      type: 'EPAR',
      typeName: `Annual Property Statement (${p.period || '2025-26'})`,
      subject: `Performance appraisal return for ${p.period || '2025-26'}`,
      submittedOn: p.createdAt?.split('T')[0] || '15-Jan-2026',
      status: p.status,
      statusType: p.status === 'ACCEPTED' ? 'APPROVED' : 'PENDING',
      currentAuthority: p.reportingOfficerName || 'Reviewing Authority',
      remarks: `Appraisal Rating: ${p.performanceRating || 'Under Review'}`,
      targetModule: 'epar'
    });
  });

  res.json({ success: true, applications });
});


// START SERVER FUNCTION WITH VITE MIDDLEWARE
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Demo e-HRMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
