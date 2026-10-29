import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Employee, User } from '../types/index';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function sanitizePayload(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const clean: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}

// Convert Firestore doc data to Employee object ensuring all aliases are present
export function mapDocToEmployee(data: any, id: string): Employee {
  return {
    id: data.id || `EMP-${id}`,
    employeeId: data.employeeId || id,
    employeeCode: data.employeeCode || data.employeeId || id,
    name: data.name || data.employeeName || 'Unknown Employee',
    fatherName: data.fatherName || 'N/A',
    motherName: data.motherName || 'N/A',
    dob: data.dob || data.dateOfBirth || '1990-01-01',
    gender: data.gender || 'MALE',
    mobile: data.mobile || data.mobileNumber || '+91 94370 00000',
    email: data.email || `${(data.employeeId || id).toLowerCase()}@hrmsodisha.gov.in`,
    designation: data.designation || 'Staff',
    cadre: data.cadre || 'Odisha State Civil Service',
    department: data.department || 'Panchayati Raj & Drinking Water Department',
    office: data.office || data.postingPlace || 'Government of Odisha, Bhubaneswar',
    district: data.district || 'Khordha',
    districtId: data.districtId,
    block: data.block || 'Bhubaneswar MC',
    blockId: data.blockId,
    gp: data.gp || data.gramPanchayat,
    gpId: data.gpId,
    village: data.village,
    villageId: data.villageId,
    dateOfJoining: data.dateOfJoining || data.joiningDate || new Date().toISOString().split('T')[0],
    employmentType: data.employmentType || 'PERMANENT',
    currentPosting: data.currentPosting || data.postingPlace || data.office || 'Main Office',
    postingStation: data.postingStation || data.postingPlace || 'Main Station',
    status: (data.status || (data.employeeStatus?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')) as any,
    panNumber: data.panNumber || 'ABCDE1234F',
    gpfNpsNo: data.gpfNpsNo || 'OR/NPS/2026/00000',
    payLevel: data.payLevel || 'Level-9',
    basicPay: Number(data.basicPay) || 44900,
    reportingOfficerId: data.reportingOfficerId || 'RO20001',
    reportingOfficerName: data.reportingOfficerName || 'Reporting Officer',
    ddoId: data.ddoId || 'EMP20267858',
    createdByDDO: data.createdByDDO || data.ddoId || 'EMP20267858',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
 * Fetch all employees from Firestore collection "employees"
 */
export async function getEmployeesFromFirestore(): Promise<Employee[]> {
  const path = 'employees';
  try {
    const snap = await getDocs(collection(db, path));
    const employees: Employee[] = [];
    snap.forEach((docSnap) => {
      employees.push(mapDocToEmployee(docSnap.data(), docSnap.id));
    });
    // Sort recently updated/created first
    employees.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    return employees;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Subscribe to real-time updates for employees
 */
export function subscribeEmployees(
  onData: (employees: Employee[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const path = 'employees';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list: Employee[] = [];
      snap.forEach((docSnap) => {
        list.push(mapDocToEmployee(docSnap.data(), docSnap.id));
      });
      list.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      onData(list);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Fetch single employee by ID from Firestore
 */
export async function getEmployeeByIdFromFirestore(employeeId: string): Promise<Employee | null> {
  const cleanId = employeeId.trim().toUpperCase();
  const path = `employees/${cleanId}`;
  try {
    const docRef = doc(db, 'employees', cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return mapDocToEmployee(snap.data(), snap.id);
    }

    // Try query by employeeId field if doc ID differs
    const q = query(collection(db, 'employees'), where('employeeId', '==', cleanId));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      const firstDoc = qSnap.docs[0];
      return mapDocToEmployee(firstDoc.data(), firstDoc.id);
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save new Employee directly to Firestore with full database fields
 */
export async function createEmployeeInFirestore(data: Partial<Employee> & { password?: string }): Promise<Employee> {
  const cleanId = (data.employeeId || `EMP${Math.floor(100000 + Math.random() * 900000)}`).trim().toUpperCase();
  const path = `employees/${cleanId}`;

  // 1. Uniqueness check
  const existing = await getEmployeeByIdFromFirestore(cleanId);
  if (existing) {
    throw new Error(`Employee ID ${cleanId} already exists in cloud database. Please choose a unique Employee ID.`);
  }

  const nowIso = new Date().toISOString();
  const employeeName = (data.name || (data as any).employeeName || '').trim();
  const fatherName = (data.fatherName || '').trim() || 'N/A';
  const motherName = (data.motherName || '').trim() || 'N/A';
  const dob = data.dob || (data as any).dateOfBirth || '1992-01-01';
  const gender = data.gender || 'MALE';
  const mobile = (data.mobile || (data as any).mobileNumber || '').trim() || '+91 94370 00000';
  const email = (data.email || `${cleanId.toLowerCase()}@hrmsodisha.gov.in`).trim();
  const designation = (data.designation || 'Junior Assistant').trim();
  const cadre = (data.cadre || 'Odisha State Civil Service').trim();
  const department = (data.department || 'Panchayati Raj & Drinking Water Department').trim();
  const office = (data.office || 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar').trim();
  const district = (data.district || 'Khordha').trim();
  const block = (data.block || 'Bhubaneswar MC').trim();
  const gp = data.gp || (data as any).gramPanchayat || '';
  const village = data.village || '';
  const dateOfJoining = data.dateOfJoining || (data as any).joiningDate || nowIso.split('T')[0];
  const currentPosting = data.currentPosting || (data as any).postingPlace || office;
  const status = data.status || 'ACTIVE';
  const employeeStatus = status === 'ACTIVE' ? 'Active' : 'Inactive';
  const ddoId = data.ddoId || data.createdByDDO || 'EMP20267858';

  const employeeDocPayload = {
    id: `EMP-${cleanId}`,
    employeeId: cleanId,
    employeeCode: cleanId,
    // Dual field compatibility
    name: employeeName,
    employeeName: employeeName,
    fatherName,
    motherName,
    dob,
    dateOfBirth: dob,
    gender,
    mobile,
    mobileNumber: mobile,
    email,
    designation,
    cadre,
    department,
    office,
    district,
    districtId: data.districtId || '',
    block,
    blockId: data.blockId || '',
    gp,
    gramPanchayat: gp,
    gpId: data.gpId || '',
    village,
    villageId: data.villageId || '',
    dateOfJoining,
    joiningDate: dateOfJoining,
    employmentType: data.employmentType || 'PERMANENT',
    currentPosting,
    postingPlace: currentPosting,
    postingStation: data.postingStation || currentPosting,
    status,
    employeeStatus,
    panNumber: data.panNumber || `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
    gpfNpsNo: data.gpfNpsNo || `OR/NPS/2026/${Math.floor(10000 + Math.random() * 90000)}`,
    payLevel: data.payLevel || 'Level-9',
    basicPay: Number(data.basicPay) || 44900,
    reportingOfficerId: data.reportingOfficerId || 'RO20001',
    reportingOfficerName: data.reportingOfficerName || 'Priyanka Mohanty',
    ddoId,
    createdByDDO: ddoId,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    // Save to Firestore employees collection
    await setDoc(doc(db, 'employees', cleanId), sanitizePayload(employeeDocPayload));

    // Also persist user record to users collection
    await setDoc(doc(db, 'users', cleanId), sanitizePayload({
      id: `USR-${cleanId}`,
      employeeId: cleanId,
      username: cleanId,
      role: 'EMPLOYEE',
      name: employeeName,
      designation,
      department,
      office,
      district,
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    return mapDocToEmployee(employeeDocPayload, cleanId);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update an existing Employee in Firestore
 */
export async function updateEmployeeInFirestore(
  employeeId: string,
  updates: Partial<Employee> & Record<string, any>
): Promise<Employee> {
  const cleanId = employeeId.trim().toUpperCase();
  const path = `employees/${cleanId}`;
  const nowIso = new Date().toISOString();

  try {
    const docRef = doc(db, 'employees', cleanId);
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      throw new Error(`Employee record ${cleanId} does not exist in database.`);
    }

    const payload: Record<string, any> = {
      ...updates,
      updatedAt: nowIso
    };

    if (updates.name) payload.employeeName = updates.name;
    if (updates.employeeName) payload.name = updates.employeeName;
    if (updates.dob) payload.dateOfBirth = updates.dob;
    if (updates.dateOfBirth) payload.dob = updates.dateOfBirth;
    if (updates.mobile) payload.mobileNumber = updates.mobile;
    if (updates.mobileNumber) payload.mobile = updates.mobileNumber;
    if (updates.currentPosting) payload.postingPlace = updates.currentPosting;
    if (updates.postingPlace) payload.currentPosting = updates.postingPlace;
    if (updates.status) {
      payload.employeeStatus = updates.status === 'ACTIVE' ? 'Active' : 'Inactive';
    }

    await updateDoc(docRef, sanitizePayload(payload));
    const freshSnap = await getDoc(docRef);
    return mapDocToEmployee(freshSnap.data(), cleanId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Soft delete / deactivate an Employee in Firestore (employeeStatus = "Inactive")
 */
export async function deactivateEmployeeInFirestore(employeeId: string): Promise<boolean> {
  const cleanId = employeeId.trim().toUpperCase();
  const path = `employees/${cleanId}`;
  const nowIso = new Date().toISOString();

  try {
    const docRef = doc(db, 'employees', cleanId);
    await updateDoc(docRef, {
      status: 'INACTIVE',
      employeeStatus: 'Inactive',
      updatedAt: nowIso
    });

    // Also update users collection if present
    const userDocRef = doc(db, 'users', cleanId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      await updateDoc(userDocRef, {
        status: 'INACTIVE',
        updatedAt: nowIso
      });
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Permanently delete employee record from Firestore if explicitly authorized
 */
export async function deleteEmployeeFromFirestore(employeeId: string): Promise<boolean> {
  const cleanId = employeeId.trim().toUpperCase();
  const path = `employees/${cleanId}`;

  try {
    await deleteDoc(doc(db, 'employees', cleanId));
    await deleteDoc(doc(db, 'users', cleanId)).catch(() => {});
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Initial Data Migration:
 * Checks if initial DDO and employees exist in Firestore, and seeds them from existing system records if missing.
 */
export async function migrateExistingDataToFirestore(): Promise<{ migratedCount: number }> {
  try {
    const snap = await getDocs(collection(db, 'employees'));
    if (!snap.empty && snap.size >= 5) {
      console.log(`Firestore already populated with ${snap.size} employee records.`);
      return { migratedCount: snap.size };
    }

    console.log('Seeding initial HRMS employee records into Firestore cloud database...');
    // Seed default DDO account in ddoUsers and users
    const nowIso = new Date().toISOString();
    await setDoc(doc(db, 'ddoUsers', 'EMP20267858'), {
      employeeId: 'EMP20267858',
      username: 'EMP20267858',
      name: 'Ranjan Kumar Patra',
      role: 'DDO',
      designation: 'Drawing & Disbursing Officer (DDO)',
      department: 'Panchayati Raj & Drinking Water Department',
      office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      district: 'Khordha',
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso
    }, { merge: true });

    await setDoc(doc(db, 'users', 'EMP20267858'), {
      employeeId: 'EMP20267858',
      username: 'EMP20267858',
      name: 'Ranjan Kumar Patra',
      role: 'DDO',
      designation: 'Drawing & Disbursing Officer (DDO)',
      department: 'Panchayati Raj & Drinking Water Department',
      office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      district: 'Khordha',
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso
    }, { merge: true });

    // Seed default initial employees
    const initialSeedEmployees = [
      {
        employeeId: 'EMP20267858',
        name: 'Ranjan Kumar Patra',
        fatherName: 'Prafulla Kumar Patra',
        motherName: 'Annapurna Patra',
        dob: '1988-06-15',
        gender: 'MALE',
        mobile: '+91 94370 12345',
        email: 'ranjankumarpatra72@gmail.com',
        designation: 'Drawing & Disbursing Officer (DDO)',
        cadre: 'Odisha Administrative Service (OAS)',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        block: 'Bhubaneswar MC',
        gp: 'Secretariat GP',
        village: 'Bhubaneswar City',
        dateOfJoining: '2016-04-01',
        employmentType: 'PERMANENT',
        currentPosting: 'PR&DW Department Head Office, Lok Seva Bhawan, Bhubaneswar',
        status: 'ACTIVE',
        employeeStatus: 'Active',
        panNumber: 'ABCDE7858F',
        gpfNpsNo: 'OR/NPS/2016/78580',
        payLevel: 'Level-14',
        basicPay: 88700,
        reportingOfficerName: 'Principal Secretary (PR&DW)',
        ddoId: 'EMP20267858',
        createdByDDO: 'EMP20267858',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        employeeId: 'EMP10001',
        name: 'Alok Kumar Mohanty',
        fatherName: 'Birendra Mohanty',
        motherName: 'Subhadra Mohanty',
        dob: '1985-05-12',
        gender: 'MALE',
        mobile: '+91 94370 23456',
        email: 'emp10001@hrmsodisha.gov.in',
        designation: 'Assistant Section Officer',
        cadre: 'Odisha Secretariat Service',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        block: 'Bhubaneswar MC',
        gp: 'Raghunathpur',
        village: 'Raghunathpur Village',
        dateOfJoining: '2015-08-10',
        employmentType: 'PERMANENT',
        currentPosting: 'PR&DW Department Section III, Bhubaneswar',
        status: 'ACTIVE',
        employeeStatus: 'Active',
        panNumber: 'BCDEF2345G',
        gpfNpsNo: 'OR/GPF/2015/10001',
        payLevel: 'Level-9',
        basicPay: 44900,
        reportingOfficerName: 'Priyanka Mohanty (RO)',
        ddoId: 'EMP20267858',
        createdByDDO: 'EMP20267858',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        employeeId: 'EMP10002',
        name: 'Smrutirekha Das',
        fatherName: 'Gopinath Das',
        motherName: 'Manjula Das',
        dob: '1990-11-20',
        gender: 'FEMALE',
        mobile: '+91 94371 34567',
        email: 'emp10002@hrmsodisha.gov.in',
        designation: 'Senior Assistant',
        cadre: 'Odisha State Civil Service',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Block Development Office, Balianta',
        district: 'Khordha',
        block: 'Balianta',
        gp: 'Balianta GP',
        village: 'Balianta Village',
        dateOfJoining: '2018-02-14',
        employmentType: 'PERMANENT',
        currentPosting: 'BDO Office Balianta',
        status: 'ACTIVE',
        employeeStatus: 'Active',
        panNumber: 'CDEFG3456H',
        gpfNpsNo: 'OR/NPS/2018/10002',
        payLevel: 'Level-9',
        basicPay: 46200,
        reportingOfficerName: 'Block Development Officer (BDO)',
        ddoId: 'EMP20267858',
        createdByDDO: 'EMP20267858',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        employeeId: 'EMP10003',
        name: 'Debashis Nayak',
        fatherName: 'Ramesh Nayak',
        motherName: 'Malati Nayak',
        dob: '1992-03-25',
        gender: 'MALE',
        mobile: '+91 94372 45678',
        email: 'emp10003@hrmsodisha.gov.in',
        designation: 'Junior Assistant',
        cadre: 'Odisha State Civil Service',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Block Development Office, Jatni',
        district: 'Khordha',
        block: 'Jatni',
        gp: 'Kudiary GP',
        village: 'Kudiary',
        dateOfJoining: '2021-09-01',
        employmentType: 'PERMANENT',
        currentPosting: 'BDO Office Jatni Establishment Wing',
        status: 'ACTIVE',
        employeeStatus: 'Active',
        panNumber: 'DEFGH4567I',
        gpfNpsNo: 'OR/NPS/2021/10003',
        payLevel: 'Level-7',
        basicPay: 35400,
        reportingOfficerName: 'Head Clerk, BDO Jatni',
        ddoId: 'EMP20267858',
        createdByDDO: 'EMP20267858',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        employeeId: 'EMP10004',
        name: 'Priyanka Senapati',
        fatherName: 'Jagannath Senapati',
        motherName: 'Hemalata Senapati',
        dob: '1989-07-18',
        gender: 'FEMALE',
        mobile: '+91 94373 56789',
        email: 'emp10004@hrmsodisha.gov.in',
        designation: 'Section Officer',
        cadre: 'Odisha Secretariat Service',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        block: 'Bhubaneswar MC',
        gp: 'Chandrasekharpur',
        village: 'CSP Village',
        dateOfJoining: '2014-06-15',
        employmentType: 'PERMANENT',
        currentPosting: 'PR&DW Department Audit Section, Bhubaneswar',
        status: 'ACTIVE',
        employeeStatus: 'Active',
        panNumber: 'EFGHI5678J',
        gpfNpsNo: 'OR/NPS/2014/10004',
        payLevel: 'Level-10',
        basicPay: 56100,
        reportingOfficerName: 'Under Secretary (PR&DW)',
        ddoId: 'EMP20267858',
        createdByDDO: 'EMP20267858',
        createdAt: nowIso,
        updatedAt: nowIso
      }
    ];

    let count = 0;
    for (const emp of initialSeedEmployees) {
      await setDoc(doc(db, 'employees', emp.employeeId), emp, { merge: true });
      await setDoc(doc(db, 'users', emp.employeeId), {
        id: `USR-${emp.employeeId}`,
        employeeId: emp.employeeId,
        username: emp.employeeId,
        role: emp.employeeId === 'EMP20267858' ? 'DDO' : 'EMPLOYEE',
        name: emp.name,
        designation: emp.designation,
        department: emp.department,
        office: emp.office,
        district: emp.district,
        status: 'ACTIVE',
        createdAt: nowIso,
        updatedAt: nowIso
      }, { merge: true });
      count++;
    }

    return { migratedCount: count };
  } catch (err) {
    console.warn('Initial migration notice:', err);
    return { migratedCount: 0 };
  }
}
