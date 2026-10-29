import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let config: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load firebase-applet-config.json in server', e);
}

const app = getApps().length === 0 && config ? initializeApp(config) : (getApps().length > 0 ? getApp() : null);
export const serverFirestore = app && config ? getFirestore(app, config.firestoreDatabaseId) : null;

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

export async function saveEmployeeToCloud(employeeData: any): Promise<boolean> {
  if (!serverFirestore) return false;
  try {
    const cleanId = (employeeData.employeeId || '').trim().toUpperCase();
    if (!cleanId) return false;
    const docRef = doc(serverFirestore, 'employees', cleanId);
    
    const empPayload = sanitizePayload({
      ...employeeData,
      employeeId: cleanId,
      employeeName: employeeData.name || employeeData.employeeName || 'Unknown Employee',
      name: employeeData.name || employeeData.employeeName || 'Unknown Employee',
      dateOfBirth: employeeData.dob || employeeData.dateOfBirth || '1990-01-01',
      dob: employeeData.dob || employeeData.dateOfBirth || '1990-01-01',
      mobileNumber: employeeData.mobile || employeeData.mobileNumber || '+91 94370 00000',
      mobile: employeeData.mobile || employeeData.mobileNumber || '+91 94370 00000',
      email: employeeData.email || `${cleanId.toLowerCase()}@hrmsodisha.gov.in`,
      designation: employeeData.designation || 'Staff',
      department: employeeData.department || 'Panchayati Raj & Drinking Water Department',
      office: employeeData.office || 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      district: employeeData.district || 'Khordha',
      block: employeeData.block || 'Bhubaneswar MC',
      gramPanchayat: employeeData.gp || employeeData.gramPanchayat || '',
      village: employeeData.village || '',
      joiningDate: employeeData.dateOfJoining || employeeData.joiningDate || new Date().toISOString().split('T')[0],
      dateOfJoining: employeeData.dateOfJoining || employeeData.joiningDate || new Date().toISOString().split('T')[0],
      postingPlace: employeeData.currentPosting || employeeData.postingPlace || employeeData.office || '',
      currentPosting: employeeData.currentPosting || employeeData.postingPlace || employeeData.office || '',
      status: employeeData.status || 'ACTIVE',
      employeeStatus: employeeData.status === 'ACTIVE' ? 'Active' : 'Inactive',
      ddoId: employeeData.ddoId || 'EMP20267858',
      createdAt: employeeData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await setDoc(docRef, empPayload, { merge: true });

    // Also update users collection
    const userDocRef = doc(serverFirestore, 'users', cleanId);
    const userPayload = sanitizePayload({
      id: `USR-${cleanId}`,
      employeeId: cleanId,
      username: cleanId,
      name: empPayload.name,
      designation: empPayload.designation,
      department: empPayload.department,
      office: empPayload.office,
      district: empPayload.district,
      role: employeeData.role || 'EMPLOYEE',
      status: empPayload.status || 'ACTIVE',
      updatedAt: new Date().toISOString()
    });
    await setDoc(userDocRef, userPayload, { merge: true });

    return true;
  } catch (err) {
    console.error('Cloud Firestore server write error:', err);
    return false;
  }
}

export async function getEmployeesFromCloud(): Promise<any[]> {
  if (!serverFirestore) return [];
  try {
    const snap = await getDocs(collection(serverFirestore, 'employees'));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    return list;
  } catch (err) {
    console.error('Cloud Firestore server read error:', err);
    return [];
  }
}

export async function updateEmployeeInCloud(employeeId: string, updates: any): Promise<boolean> {
  if (!serverFirestore) return false;
  try {
    const cleanId = employeeId.trim().toUpperCase();
    const docRef = doc(serverFirestore, 'employees', cleanId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('Cloud Firestore server update error:', err);
    return false;
  }
}
