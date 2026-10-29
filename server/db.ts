import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Employee,
  ServiceBook,
  LeaveTypeBalance,
  LeaveRequest,
  SalaryRecord,
  Loan,
  TransferRecord,
  TransferDocument,
  TransferHistoryRecord,
  LPCRecord,
  JoiningReport,
  EParReport,
  Grievance,
  NotificationItem,
  CorrectionRequest,
  AuditLog,
  DistrictMaster,
  BlockMaster,
  GramPanchayatMaster,
  VillageMaster,
  OfficeMaster,
  DatabaseBackupInfo,
  CommunicationItem
} from '../src/types/index';

const DB_FILE = path.join(process.cwd(), 'hrms_demo_db.json');
const DB_BAK = path.join(process.cwd(), 'hrms_demo_db.json.bak');
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  try {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create backups directory:', e);
  }
}

export interface DatabaseSchema {
  users: User[];
  userAuth: { username: string; passwordHash: string; failedAttempts: number; lockUntil: number | null }[];
  employees: Employee[];
  serviceBooks: Record<string, ServiceBook>;
  leaveBalances: Record<string, LeaveTypeBalance[]>;
  leaveRequests: LeaveRequest[];
  salaryRecords: SalaryRecord[];
  loans: Loan[];
  transfers: TransferRecord[];
  transferHistory: TransferHistoryRecord[];
  transferDocuments: TransferDocument[];
  lpcRecords: LPCRecord[];
  joiningReports: JoiningReport[];
  eParReports: EParReport[];
  grievanceRecords: Grievance[];
  notifications: NotificationItem[];
  communications: CommunicationItem[];
  correctionRequests: CorrectionRequest[];
  auditLogs: AuditLog[];
  districts: DistrictMaster[];
  blocks: BlockMaster[];
  gramPanchayats: GramPanchayatMaster[];
  villages: VillageMaster[];
  officesMaster: OfficeMaster[];
}

let db: DatabaseSchema = {
  users: [],
  userAuth: [],
  employees: [],
  serviceBooks: {},
  leaveBalances: {},
  leaveRequests: [],
  salaryRecords: [],
  loans: [],
  transfers: [],
  transferHistory: [],
  transferDocuments: [],
  lpcRecords: [],
  joiningReports: [],
  eParReports: [],
  grievanceRecords: [],
  notifications: [],
  communications: [],
  correctionRequests: [],
  auditLogs: [],
  districts: [],
  blocks: [],
  gramPanchayats: [],
  villages: [],
  officesMaster: []
};

const defaultDistricts: DistrictMaster[] = [
  { id: 'DIST_MAY', code: 'MAY', name: 'Mayurbhanj', headquarter: 'Baripada', stateId: 'STATE_ODI' },
  { id: 'DIST_KHO', code: 'KHO', name: 'Khordha', headquarter: 'Bhubaneswar', stateId: 'STATE_ODI' },
  { id: 'DIST_CUT', code: 'CUT', name: 'Cuttack', headquarter: 'Cuttack', stateId: 'STATE_ODI' },
  { id: 'DIST_GAN', code: 'GAN', name: 'Ganjam', headquarter: 'Chhatrapur', stateId: 'STATE_ODI' },
  { id: 'DIST_SUN', code: 'SUN', name: 'Sundargarh', headquarter: 'Sundargarh', stateId: 'STATE_ODI' },
  { id: 'DIST_SAM', code: 'SAM', name: 'Sambalpur', headquarter: 'Sambalpur', stateId: 'STATE_ODI' },
  { id: 'DIST_PUR', code: 'PUR', name: 'Puri', headquarter: 'Puri', stateId: 'STATE_ODI' },
  { id: 'DIST_BAL', code: 'BAL', name: 'Balasore', headquarter: 'Balasore', stateId: 'STATE_ODI' },
  { id: 'DIST_KAL', code: 'KAL', name: 'Kalahandi', headquarter: 'Bhawanipatna', stateId: 'STATE_ODI' },
  { id: 'DIST_KOR', code: 'KOR', name: 'Koraput', headquarter: 'Koraput', stateId: 'STATE_ODI' },
  { id: 'DIST_ANG', code: 'ANG', name: 'Angul', headquarter: 'Angul', stateId: 'STATE_ODI' },
  { id: 'DIST_JAS', code: 'JAS', name: 'Jharsuguda', headquarter: 'Jharsuguda', stateId: 'STATE_ODI' },
];

const defaultBlocks: BlockMaster[] = [
  // Mayurbhanj (26 Blocks)
  { id: 'BLK_BAH', code: 'BAH', districtId: 'DIST_MAY', name: 'Bahalda' },
  { id: 'BLK_BNG', code: 'BNG', districtId: 'DIST_MAY', name: 'Bangriposi' },
  { id: 'BLK_BAR', code: 'BAR', districtId: 'DIST_MAY', name: 'Baripada' },
  { id: 'BLK_BAD', code: 'BAD', districtId: 'DIST_MAY', name: 'Badasahi' },
  { id: 'BLK_BET', code: 'BET', districtId: 'DIST_MAY', name: 'Betnoti' },
  { id: 'BLK_BIJ', code: 'BIJ', districtId: 'DIST_MAY', name: 'Bijatala' },
  { id: 'BLK_BIS', code: 'BIS', districtId: 'DIST_MAY', name: 'Bisoi' },
  { id: 'BLK_GOP', code: 'GOP', districtId: 'DIST_MAY', name: 'Gopabandhunagar' },
  { id: 'BLK_JAM', code: 'JAM', districtId: 'DIST_MAY', name: 'Jamda' },
  { id: 'BLK_JAS', code: 'JAS', districtId: 'DIST_MAY', name: 'Jashipur' },
  { id: 'BLK_KAP', code: 'KAP', districtId: 'DIST_MAY', name: 'Kaptipada' },
  { id: 'BLK_KAR', code: 'KAR', districtId: 'DIST_MAY', name: 'Karanjia' },
  { id: 'BLK_KHU', code: 'KHU', districtId: 'DIST_MAY', name: 'Khunta' },
  { id: 'BLK_KUL', code: 'KUL', districtId: 'DIST_MAY', name: 'Kuliana' },
  { id: 'BLK_KUS', code: 'KUS', districtId: 'DIST_MAY', name: 'Kusumi' },
  { id: 'BLK_MOR', code: 'MOR', districtId: 'DIST_MAY', name: 'Morada' },
  { id: 'BLK_RAI', code: 'RAI', districtId: 'DIST_MAY', name: 'Rairangpur' },
  { id: 'BLK_RAR', code: 'RAR', districtId: 'DIST_MAY', name: 'Raruan' },
  { id: 'BLK_RAS', code: 'RAS', districtId: 'DIST_MAY', name: 'Rasgovindpur' },
  { id: 'BLK_SAM', code: 'SAM', districtId: 'DIST_MAY', name: 'Samakhunta' },
  { id: 'BLK_SAR', code: 'SAR', districtId: 'DIST_MAY', name: 'Saraskana' },
  { id: 'BLK_SUK', code: 'SUK', districtId: 'DIST_MAY', name: 'Sukruli' },
  { id: 'BLK_SUL', code: 'SUL', districtId: 'DIST_MAY', name: 'Suliapada' },
  { id: 'BLK_THA', code: 'THA', districtId: 'DIST_MAY', name: 'Thakurmunda' },
  { id: 'BLK_TIR', code: 'TIR', districtId: 'DIST_MAY', name: 'Tiring' },
  { id: 'BLK_UDA', code: 'UDA', districtId: 'DIST_MAY', name: 'Udala' },

  // Khordha
  { id: 'BLK_BBSR', code: 'BBSR', districtId: 'DIST_KHO', name: 'Bhubaneswar MC' },
  { id: 'BLK_JAT', code: 'JAT', districtId: 'DIST_KHO', name: 'Jatni' },
  { id: 'BLK_KHO', code: 'KHO', districtId: 'DIST_KHO', name: 'Khordha Sadar' },
  { id: 'BLK_BAN', code: 'BAN', districtId: 'DIST_KHO', name: 'Banapur' },
  { id: 'BLK_BALI', code: 'BALI', districtId: 'DIST_KHO', name: 'Balianta' },

  // Cuttack
  { id: 'BLK_CTS', code: 'CTS', districtId: 'DIST_CUT', name: 'Cuttack Sadar' },
  { id: 'BLK_BNK', code: 'BNK', districtId: 'DIST_CUT', name: 'Banki' },
  { id: 'BLK_SLP', code: 'SLP', districtId: 'DIST_CUT', name: 'Salepur' },
  { id: 'BLK_CDW', code: 'CDW', districtId: 'DIST_CUT', name: 'Choudwar' },

  // Ganjam
  { id: 'BLK_BER', code: 'BER', districtId: 'DIST_GAN', name: 'Berhampur MC' },
  { id: 'BLK_CHP', code: 'CHP', districtId: 'DIST_GAN', name: 'Chhatrapur' },
  { id: 'BLK_BHN', code: 'BHN', districtId: 'DIST_GAN', name: 'Bhanjanagar' },

  // Sundargarh
  { id: 'BLK_RKL', code: 'RKL', districtId: 'DIST_SUN', name: 'Rourkela MC' },
  { id: 'BLK_SNG', code: 'SNG', districtId: 'DIST_SUN', name: 'Sundargarh Sadar' },

  // Sambalpur
  { id: 'BLK_SBP', code: 'SBP', districtId: 'DIST_SAM', name: 'Sambalpur MC' },
  { id: 'BLK_RNG', code: 'RNG', districtId: 'DIST_SAM', name: 'Rengali' },

  // Puri
  { id: 'BLK_PRS', code: 'PRS', districtId: 'DIST_PUR', name: 'Puri Sadar' },
  { id: 'BLK_KNK', code: 'KNK', districtId: 'DIST_PUR', name: 'Konark' },
];

const defaultGps: GramPanchayatMaster[] = [
  // Under Bijatala (Mayurbhanj)
  { id: 'GP_CHD', code: 'GP_CHD', blockId: 'BLK_BIJ', name: 'Chadheipahadi' },
  { id: 'GP_BIJ', code: 'GP_BIJ', blockId: 'BLK_BIJ', name: 'Bijatala GP' },
  { id: 'GP_LUH', code: 'GP_LUH', blockId: 'BLK_BIJ', name: 'Luhashila' },
  { id: 'GP_RAIH', code: 'GP_RAIH', blockId: 'BLK_BIJ', name: 'Raihari' },

  // Under Baripada (Mayurbhanj)
  { id: 'GP_BAR', code: 'GP_BAR', blockId: 'BLK_BAR', name: 'Baripada GP' },
  { id: 'GP_LAX', code: 'GP_LAX', blockId: 'BLK_BAR', name: 'Laxmiposi' },
  { id: 'GP_SNK', code: 'GP_SNK', blockId: 'BLK_BAR', name: 'Sankhabhanga' },

  // Under Rairangpur
  { id: 'GP_RRG', code: 'GP_RRG', blockId: 'BLK_RAI', name: 'Rairangpur GP' },

  // Under Bhubaneswar MC (Khordha)
  { id: 'GP_RAG', code: 'GP_RAG', blockId: 'BLK_BBSR', name: 'Raghunathpur' },
  { id: 'GP_CND', code: 'GP_CND', blockId: 'BLK_BBSR', name: 'Chandaka' },
  { id: 'GP_PAT', code: 'GP_PAT', blockId: 'BLK_BBSR', name: 'Patia GP' },
  { id: 'GP_MND', code: 'GP_MND', blockId: 'BLK_BBSR', name: 'Mendhasal' },

  // Under Jatni (Khordha)
  { id: 'GP_JTN', code: 'GP_JTN', blockId: 'BLK_JAT', name: 'Jatni GP' },
  { id: 'GP_KNJ', code: 'GP_KNJ', blockId: 'BLK_JAT', name: 'Kunjuri' },
  { id: 'GP_JNL', code: 'GP_JNL', blockId: 'BLK_JAT', name: 'Janla' },

  // Under Khordha Sadar
  { id: 'GP_GRJ', code: 'GP_GRJ', blockId: 'BLK_KHO', name: 'Gurujanga' },
  { id: 'GP_PLA', code: 'GP_PLA', blockId: 'BLK_KHO', name: 'Palla' },

  // Under Cuttack Sadar
  { id: 'GP_FTM', code: 'GP_FTM', blockId: 'BLK_CTS', name: '42 Mouza' },
  { id: 'GP_BDY', code: 'GP_BDY', blockId: 'BLK_CTS', name: 'Bidyadharpur' },

  // Under Berhampur MC
  { id: 'GP_LNJ', code: 'GP_LNJ', blockId: 'BLK_BER', name: 'Lanjipalli GP' },

  // Under Rourkela MC
  { id: 'GP_BSR', code: 'GP_BSR', blockId: 'BLK_RKL', name: 'Bisra' },
  { id: 'GP_PNP', code: 'GP_PNP', blockId: 'BLK_RKL', name: 'Panposh GP' },
];

const defaultVillages: VillageMaster[] = [
  // Under Chadheipahadi (Bijatala, Mayurbhanj)
  { id: 'VIL_CHD_VIL', code: '757048_1', gpId: 'GP_CHD', name: 'Chadheipahadi Village', pincode: '757048' },
  { id: 'VIL_HAT', code: '757048_2', gpId: 'GP_CHD', name: 'Hatibari', pincode: '757048' },
  { id: 'VIL_JAM', code: '757048_3', gpId: 'GP_CHD', name: 'Jamuguda', pincode: '757048' },

  // Under Bijatala GP
  { id: 'VIL_BIJ_VIL', code: '757048_4', gpId: 'GP_BIJ', name: 'Bijatala Village', pincode: '757048' },
  { id: 'VIL_MHL', code: '757048_5', gpId: 'GP_BIJ', name: 'Mahulpani', pincode: '757048' },

  // Under Baripada GP
  { id: 'VIL_BAR_VIL', code: '757001_1', gpId: 'GP_BAR', name: 'Baripada Town Village', pincode: '757001' },
  { id: 'VIL_TAK', code: '757001_2', gpId: 'GP_BAR', name: 'Takatpur', pincode: '757003' },

  // Under Raghunathpur (Bhubaneswar MC)
  { id: 'VIL_RAG_VIL', code: '751024_1', gpId: 'GP_RAG', name: 'Raghunathpur Village', pincode: '751024' },
  { id: 'VIL_NDN', code: '751024_2', gpId: 'GP_RAG', name: 'Nandan Kanan Mouza', pincode: '751024' },
  { id: 'VIL_KLR', code: '751024_3', gpId: 'GP_RAG', name: 'Kalarahanga', pincode: '751024' },

  // Under Chandaka (Bhubaneswar MC)
  { id: 'VIL_CND_VIL', code: '751024_4', gpId: 'GP_CND', name: 'Chandaka Village', pincode: '751024' },
  { id: 'VIL_DSP', code: '751024_5', gpId: 'GP_CND', name: 'Daspur', pincode: '751024' },

  // Under Gurujanga (Khordha Sadar)
  { id: 'VIL_GRJ_VIL', code: '752055_1', gpId: 'GP_GRJ', name: 'Gurujanga Village', pincode: '752055' },
  { id: 'VIL_MKP', code: '752055_2', gpId: 'GP_GRJ', name: 'Mukundaprasad', pincode: '752055' },

  // Under 42 Mouza (Cuttack Sadar)
  { id: 'VIL_BNT', code: '753011_1', gpId: 'GP_FTM', name: 'Bentakar', pincode: '753011' },
  { id: 'VIL_NPT', code: '753011_2', gpId: 'GP_FTM', name: 'Nuapatna', pincode: '753011' },

  // Under Bidyadharpur (Cuttack Sadar)
  { id: 'VIL_BDY_VIL', code: '753006_1', gpId: 'GP_BDY', name: 'Bidyadharpur Village', pincode: '753006' },

  // Under Lanjipalli (Berhampur MC)
  { id: 'VIL_LNJ_VIL', code: '760008_1', gpId: 'GP_LNJ', name: 'Lanjipalli Village', pincode: '760008' },
  { id: 'VIL_ABP', code: '760008_2', gpId: 'GP_LNJ', name: 'Ambapua', pincode: '760010' },

  // Under Panposh (Rourkela MC)
  { id: 'VIL_PNP_VIL', code: '769004_1', gpId: 'GP_PNP', name: 'Panposh Village', pincode: '769004' },
];

const defaultOfficesMaster: OfficeMaster[] = [
  {
    id: 'OFF_DHE',
    code: 'OFF-PRDW-01',
    name: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
    department: 'Panchayati Raj & Drinking Water Department',
    state: 'Odisha',
    districtId: 'DIST_KHO',
    districtName: 'Khordha',
    blockId: 'BLK_BBSR',
    blockName: 'Bhubaneswar MC',
    gpId: 'GP_RAG',
    gpName: 'Raghunathpur',
    villageId: 'VIL_RAG_VIL',
    villageName: 'Raghunathpur Village',
    pincode: '751024'
  },
  {
    id: 'OFF_SDC',
    code: 'OFF-SDC-02',
    name: 'State Data Centre, Bhubaneswar',
    department: 'General Administration & Public Grievance Department',
    state: 'Odisha',
    districtId: 'DIST_KHO',
    districtName: 'Khordha',
    blockId: 'BLK_BBSR',
    blockName: 'Bhubaneswar MC',
    gpId: 'GP_CND',
    gpName: 'Chandaka',
    villageId: 'VIL_CND_VIL',
    villageName: 'Chandaka Village',
    pincode: '751024'
  },
  {
    id: 'OFF_MSC',
    code: 'OFF-MSC-03',
    name: 'Maharaja Sriram Chandra Bhanja Deo University, Baripada',
    department: 'Panchayati Raj & Drinking Water Department',
    state: 'Odisha',
    districtId: 'DIST_MAY',
    districtName: 'Mayurbhanj',
    blockId: 'BLK_BAR',
    blockName: 'Baripada',
    gpId: 'GP_BAR',
    gpName: 'Baripada GP',
    villageId: 'VIL_TAK',
    villageName: 'Takatpur',
    pincode: '757003'
  },
  {
    id: 'OFF_BDO_BIJ',
    code: 'OFF-BDO-04',
    name: 'Block Development Office, Bijatala',
    department: 'Panchayati Raj & Drinking Water Department',
    state: 'Odisha',
    districtId: 'DIST_MAY',
    districtName: 'Mayurbhanj',
    blockId: 'BLK_BIJ',
    blockName: 'Bijatala',
    gpId: 'GP_CHD',
    gpName: 'Chadheipahadi',
    villageId: 'VIL_CHD_VIL',
    villageName: 'Chadheipahadi Village',
    pincode: '757048'
  },
  {
    id: 'OFF_SCB',
    code: 'OFF-SCB-05',
    name: 'SCB Medical College & Hospital, Cuttack',
    department: 'Health & Family Welfare Department',
    state: 'Odisha',
    districtId: 'DIST_CUT',
    districtName: 'Cuttack',
    blockId: 'BLK_CTS',
    blockName: 'Cuttack Sadar',
    gpId: 'GP_BDY',
    gpName: 'Bidyadharpur',
    villageId: 'VIL_BDY_VIL',
    villageName: 'Bidyadharpur Village',
    pincode: '753006'
  }
];

export function ensureMasterData() {
  let changed = false;
  if (!db.districts || db.districts.length === 0) {
    db.districts = defaultDistricts;
    changed = true;
  }
  if (!db.blocks || db.blocks.length === 0) {
    db.blocks = defaultBlocks;
    changed = true;
  } else {
    // Ensure all default blocks exist
    defaultBlocks.forEach((defBlk) => {
      const exists = db.blocks.some((b) => b.id === defBlk.id || (b.districtId === defBlk.districtId && b.name.toLowerCase() === defBlk.name.toLowerCase()));
      if (!exists) {
        db.blocks.push(defBlk);
        changed = true;
      }
    });
  }
  if (!db.gramPanchayats || db.gramPanchayats.length === 0) {
    db.gramPanchayats = defaultGps;
    changed = true;
  }
  if (!db.villages || db.villages.length === 0) {
    db.villages = defaultVillages;
    changed = true;
  }
  if (!db.officesMaster || db.officesMaster.length === 0) {
    db.officesMaster = defaultOfficesMaster;
    changed = true;
  }
  if (changed) {
    saveDatabase();
  }
}

export function ensureServiceBooks(): void {
  let changed = false;

  // 1. Ensure Miss Puspita Mohakud in Users & Auth
  const puspitaUserExists = (db.users || []).some(u => u.employeeId === '91206228' || u.username === '91206228');
  if (!puspitaUserExists) {
    db.users.push({
      id: 'USR-91206228',
      employeeId: '91206228',
      username: '91206228',
      role: 'EMPLOYEE',
      name: 'Miss Puspita Mohakud',
      designation: 'Panchayat Executive Officer / VLW',
      department: 'Panchayati Raj & Drinking Water Department',
      office: 'Panchayat Samiti, Kusumi, Mayurbhanj',
      district: 'Mayurbhanj',
      status: 'ACTIVE'
    });
    const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
    db.userAuth.push({
      username: '91206228',
      passwordHash: defaultPasswordHash,
      failedAttempts: 0,
      lockUntil: null
    });
    changed = true;
  }

  // 2. Ensure Miss Puspita Mohakud in Employees
  const puspitaEmpExists = (db.employees || []).some(e => e.employeeId === '91206228');
  if (!puspitaEmpExists) {
    db.employees.push({
      id: 'EMP-91206228',
      employeeId: '91206228',
      name: 'Miss Puspita Mohakud',
      fatherName: 'Late Karunakar Mohakud',
      motherName: 'Sabitri Mohakud',
      dob: '1991-09-16',
      gender: 'FEMALE',
      mobile: '+91 76829 27215',
      email: 'puspita.mohakud.demo@hrmsodisha.demo',
      designation: 'Panchayat Executive Officer / VLW',
      cadre: 'Odisha Panchayat Executive Service',
      department: 'Panchayati Raj & Drinking Water Department',
      office: 'Panchayat Samiti, Kusumi, Mayurbhanj',
      district: 'Mayurbhanj',
      block: 'Kusumi',
      dateOfJoining: '2015-12-10',
      employmentType: 'PERMANENT',
      currentPosting: 'Panchayat Samiti, Kusumi',
      status: 'ACTIVE',
      panNumber: 'BZPPM4719M',
      gpfNpsNo: '110205519221',
      payLevel: 'Level-0',
      basicPay: 9000,
      reportingOfficerId: 'RO20001',
      reportingOfficerName: 'Priyanka Mohanty',
      ddoId: 'DDO30001'
    });
    changed = true;
  }

  // 3. Ensure ServiceBooks Record for 91206228 (Miss Puspita Mohakud)
  if (!db.serviceBooks) {
    db.serviceBooks = {};
  }

  db.serviceBooks['91206228'] = {
    employeeId: '91206228',
    employeeName: 'MISS PUSPITA MOHAKUD',
    pranNo: '110205519221',
    gpfNo: '110205519221',
    gisNo: '',
    dobWords: '16-SEP-1991( Sixteenth September Nineteen hundred Ninety One)',
    dateOfEntryGovtService: '01-APR-2020',
    dateOfEntryGovtServiceWords: '01-APR-2020( First April Two thousand Twenty) FORE NOON',
    dateOfEntryServiceBookCreated: '10-DEC-2015',
    dateOfEntryServiceBookCreatedWords: '10-DEC-2015( Tenth December Two thousand Fifteen)',
    initialJoiningOffice: 'Panchayat Samiti, Bijatala',
    initialJoiningPost: 'Village Level Worker (VLW)',
    declarationOfHomeTown: 'RAIRANGPUR',
    category: 'ST',
    cellPhone: '7682927215',
    isReservationCategory: true,
    reservationCategoryName: 'ST',
    isRehabilitationScheme: false,
    personalDetails: {
      bloodGroup: 'B Positive (B+)',
      heightCm: 158.0,
      identificationMark: 'A BLACK MOLE ON RIGHT SIDE OF FACE.',
      permanentAddress: 'BLOCK-BAHALDA,PO-RAIRANGPUR,PS-RAIRANGPUR,DIST-MAYURBHANJ,STATE-ODISHA,PIN-757043',
      maritalStatus: 'UNMARRIED',
      fatherName: 'LATE KARUNAKAR MOHAKUD',
      fatherResidence: 'BLOCK-BAHALDA,PO-RAIRANGPUR,PS-RAIRANGPUR,DIST-MAYURBHANJ,STATE-ODISHA,PIN-757043'
    },
    identityDocuments: [
      { type: 'ELECTION/VOTER ID CARD', number: 'SPA0653006', placeOfIssue: 'Rairangpur', dateOfIssue: '15-MAY-2010', dateOfExpiry: 'N/A' },
      { type: 'PAN', number: 'BZPPM4719M', placeOfIssue: 'Income Tax Dept', dateOfIssue: '12-AUG-2012', dateOfExpiry: 'N/A' },
      { type: 'AADHAAR', number: 'xxxxxxxx7694', placeOfIssue: 'UIDAI', dateOfIssue: '20-NOV-2013', dateOfExpiry: 'N/A' }
    ],
    familyMembers: [
      { relationType: 'FATHER', name: 'LATE KARUNAKAR MOHAKUD', isAlive: false, dob: '10-MAY-1960', maritalStatus: 'MARRIED', age: 60 },
      { relationType: 'MOTHER', name: 'SABITRI MOHAKUD', isAlive: true, dob: '14-AUG-1965', maritalStatus: 'WIDOW', age: 61 }
    ],
    nomineesTable: [
      { relationType: 'MOTHER', name: 'SABITRI MOHAKUD', isAlive: true, dob: '14-AUG-1965', maritalStatus: 'WIDOW', age: 61, sharePercent: 100 }
    ],
    qualifications: [
      { degree: 'Bachelor of Arts (+3 Arts)', institution: 'Rairangpur College, Mayurbhanj', year: 2012, grade: '1st Class' },
      { degree: 'Higher Secondary (+2 Arts)', institution: 'Council of Higher Secondary Education, Odisha', year: 2009, grade: '1st Class' },
      { degree: 'High School Certificate (HSC 10th)', institution: 'Board of Secondary Education, Odisha', year: 2007, grade: '1st Class' }
    ],
    postingHistory: [
      { office: 'Panchayat Samiti, Bijatala', district: 'Mayurbhanj', designation: 'Village Level Worker', startDate: '2015-12-10', endDate: '2022-05-31', orderNo: 'ESTT/2015/889' },
      { office: 'Panchayat Samiti, Bisoi', district: 'Mayurbhanj', designation: 'Panchayat Executive Officer', startDate: '2022-06-03', endDate: '2022-08-31', orderNo: '1392/ESTT' },
      { office: 'Panchayat Samiti, Kusumi', district: 'Mayurbhanj', designation: 'Village Level Worker', startDate: '2022-09-07', endDate: 'Present', orderNo: '1928/ESTT' }
    ],
    promotionHistory: [
      { oldDesignation: 'Village Level Worker', newDesignation: 'Panchayat Executive Officer', orderNumber: '1392/ESTT DATED 21-MAY-2022', effectiveDate: '2022-06-01', payLevel: 'Level-0' }
    ],
    incrementHistory: [
      { currentBasic: 9000, incrementAmount: 300, revisedBasic: 9300, effectiveDate: '2023-06-01', orderRef: 'INC-2023/110' },
      { currentBasic: 9300, incrementAmount: 300, revisedBasic: 9600, effectiveDate: '2024-06-01', orderRef: 'INC-2024/245' }
    ],
    trainingHistory: [
      { title: 'Induction Training for Panchayat Executive Officers', institute: 'State Institute for Rural Development (SIRD & PR), Bhubaneswar', fromDate: '2021-02-15', toDate: '2021-02-28' },
      { title: 'Gram Panchayat Development Plan (GPDP) & e-GramSwaraj', institute: 'Extension Training Centre (ETC), Keonjhar', fromDate: '2022-11-14', toDate: '2022-11-19' }
    ],
    nominations: [
      { type: 'NPS', nomineeName: 'SABITRI MOHAKUD', relation: 'Mother', sharePercent: 100 },
      { type: 'GIS', nomineeName: 'SABITRI MOHAKUD', relation: 'Mother', sharePercent: 100 }
    ],
    retirementDetails: {
      superannuationDate: '30-SEP-2051',
      pensionType: 'National Pension System (NPS)'
    },
    officialEntries: [
      {
        entryType: 'TRANSFER & POSTING',
        postCadreScale: '',
        pay: '',
        wef: '',
        entryText: 'TRANSFERED AND POSTED AS PANCHAYAT EXECUTIVE OFFICER, PANCHAYAT SAMITI, BISOI VIDE COLLECTOR & DISTRICT MAGISTRATE, DISTRICT COLLECTORATE, BARIPADA NOTIFICATION/ OFFICE ORDER NO. 1392/ESTT DATED 21-MAY-2022.SHE IS ALLOWED TO DRAW PAY @ RS. 9000/- PM IN CELL OF LEVEL 0 PM WEF 1-JUN-2022 (FN).',
        noteText: 'ENTRY TAKEN ON 08-JAN-2026',
        entryDate: '08-JAN-2026',
        orderNumber: '1392/ESTT',
        orderDate: '21-MAY-2022'
      },
      {
        entryType: 'RELIEVE',
        postCadreScale: '',
        pay: '',
        wef: '',
        entryText: 'IN PURSUANCE OF COLLECTOR & DISTRICT MAGISTRATE, DISTRICT COLLECTORATE, BARIPADA NOTIFICATION NO. 1392/ESTT DATED 21-MAY-2022, RELIEVED FROM VILLAGE LEVEL WORKER,PANCHAYAT SAMITI,BIJATALA ON 31-MAY-2022(AN) VIDE ORDER NO. 2118 DATED 31-MAY-2022.',
        noteText: 'ENTRY TAKEN ON 08-JAN-2026',
        entryDate: '08-JAN-2026',
        orderNumber: '2118',
        orderDate: '31-MAY-2022'
      },
      {
        entryType: 'JOINING',
        postCadreScale: 'PANCHAYAT EXECUTIVE OFFICER',
        pay: '',
        wef: '03-JUN-2022',
        entryText: 'IN PURSUANCE OF COLLECTOR & DISTRICT MAGISTRATE, DISTRICT COLLECTORATE, BARIPADA NOTIFICATION NO. 1392/ESTT DATED 21-MAY-2022, JOINED AS PANCHAYAT EXECUTIVE OFFICER, PANCHAYAT SAMITI, BISOI ON 03-JUN-2022(FN) VIDE ORDER NO. 1993 DATED 03-JUN-2022.',
        noteText: 'ENTRY TAKEN ON 15-APR-2026',
        entryDate: '15-APR-2026',
        orderNumber: '1993',
        orderDate: '03-JUN-2022'
      },
      {
        entryType: 'TRANSFER & POSTING',
        postCadreScale: '',
        pay: '',
        wef: '',
        entryText: 'TRANSFERED AND POSTED AS PANCHAYAT EXECUTIVE OFFICER, PANCHAYAT SAMITI, KUSUMI VIDE NOTIFICATION/ OFFICE ORDER NO. 1928 DATED 30-AUG-2022.SHE IS ALLOWED TO DRAW PAY @ RS. 9000/- PM IN CELL OF LEVEL 0 PM WEF 1-JUN-2022 (FN).',
        noteText: 'ENTRY TAKEN ON 15-APR-2026',
        entryDate: '15-APR-2026',
        orderNumber: '1928',
        orderDate: '30-AUG-2022'
      },
      {
        entryType: 'RELIEVE',
        postCadreScale: '',
        pay: '',
        wef: '',
        entryText: 'IN PURSUANCE OF NOTIFICATION NO. 1928 DATED 30-AUG-2022, RELIEVED FROM PANCHAYAT EXECUTIVE OFFICER, PANCHAYAT SAMITI, BISOI ON 31-AUG-2022(AN) VIDE ORDER NO. 2915 DATED 30-AUG-2022.',
        noteText: 'ENTRY TAKEN ON 15-APR-2026',
        entryDate: '15-APR-2026',
        orderNumber: '2915',
        orderDate: '30-AUG-2022'
      },
      {
        entryType: 'JOINING',
        postCadreScale: 'V.L.W.',
        pay: '',
        wef: '07-SEP-2022',
        entryText: 'IN PURSUANCE OF NOTIFICATION NO. 1928 DATED 30-AUG-2022, JOINED AS V.L.W, PANCHAYAT SAMITI, KUSUMI ON 07-SEP-2022(FN) VIDE ORDER NO. 2016 DATED 09-SEP-2022.',
        noteText: 'ENTRY TAKEN ON 16-APR-2026',
        entryDate: '16-APR-2026',
        orderNumber: '2016',
        orderDate: '09-SEP-2022'
      },
      {
        entryType: 'SUSPENSION',
        postCadreScale: '',
        pay: '',
        wef: '',
        entryText: 'PLACED UNDER SUSPENSION WEF 4-APR-2025, FN VIDE COLLECTOR AND DISTRICT MAGISTRATE,DISTRICT COLLECTORATE,NULL NOTIFICATION/ OFFICE ORDER NO. 625 DATED 4-APR-2025. SHE IS ALLOWED TO DRAW SUSPENSION ALLOWANCE OF RS.4500/-. HER HEAD QUARTER IS FIXED AT SUB-COLLECTOR, SUB-DIVISION, BAMANGHATY, RAIRANGPUR DURING THE PERIOD OF HER SUSPENSION.',
        noteText: 'ENTRY TAKEN ON 16-APR-2026',
        entryDate: '16-APR-2026',
        orderNumber: '625',
        orderDate: '04-APR-2025'
      }
    ],
    earnedLeaveAccount: [
      { periodFrom: '01-APR-2020', periodTo: '30-JUN-2020', completedMonths: 3, leaveCreditDays: 8, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 8, availedFrom: undefined, availedTo: undefined, availedTotal: 0, balanceLeave: 8 },
      { periodFrom: '01-JUL-2020', periodTo: '31-DEC-2020', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 23, availedFrom: '10-OCT-2020', availedTo: '15-OCT-2020', availedTotal: 6, balanceLeave: 17 },
      { periodFrom: '01-JAN-2021', periodTo: '30-JUN-2021', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 32, availedFrom: undefined, availedTo: undefined, availedTotal: 0, balanceLeave: 32 },
      { periodFrom: '01-JUL-2021', periodTo: '31-DEC-2021', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 47, availedFrom: '12-NOV-2021', availedTo: '16-NOV-2021', availedTotal: 5, balanceLeave: 42 },
      { periodFrom: '01-JAN-2022', periodTo: '30-JUN-2022', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 57, availedFrom: '04-MAY-2022', availedTo: '08-MAY-2022', availedTotal: 5, balanceLeave: 52 },
      { periodFrom: '01-JUL-2022', periodTo: '31-DEC-2022', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 67, availedFrom: undefined, availedTo: undefined, availedTotal: 0, balanceLeave: 67 }
    ]
  };

  // 4. Upgrade EMP10001 (Rajesh Kumar Sahoo) with full 5-page structure
  db.serviceBooks['EMP10001'] = {
    employeeId: 'EMP10001',
    employeeName: 'RAJESH KUMAR SAHOO',
    pranNo: 'OR/NPS/2014/99120',
    gpfNo: 'OR/NPS/2014/99120',
    gisNo: 'GIS-OD-1994-EMP10001',
    dobWords: '14-MAY-1988( Fourteenth May Nineteen hundred Eighty Eight)',
    dateOfEntryGovtService: '15-JUL-2014',
    dateOfEntryGovtServiceWords: '15-JUL-2014( Fifteenth July Two thousand Fourteen) FORE NOON',
    dateOfEntryServiceBookCreated: '15-JUL-2014',
    dateOfEntryServiceBookCreatedWords: '15-JUL-2014( Fifteenth July Two thousand Fourteen)',
    initialJoiningOffice: 'District Education Office, Cuttack',
    initialJoiningPost: 'Junior Assistant',
    declarationOfHomeTown: 'NIMAPADA, PURI',
    category: 'SEBC',
    cellPhone: '9437012345',
    isReservationCategory: true,
    reservationCategoryName: 'SEBC',
    isRehabilitationScheme: false,
    personalDetails: {
      bloodGroup: 'B Positive (B+)',
      heightCm: 172,
      identificationMark: 'Small mole on right forearm',
      permanentAddress: 'At/PO: Srirampur, PS: Nimapada, Dist: Puri, Pin: 752106',
      maritalStatus: 'MARRIED',
      fatherName: 'LATE BIPIN BIHARI SAHOO',
      fatherResidence: 'At/PO: Srirampur, PS: Nimapada, Dist: Puri, Pin: 752106'
    },
    identityDocuments: [
      { type: 'ELECTION/VOTER ID CARD', number: 'OR/14/098/281902', placeOfIssue: 'Nimapada, Puri', dateOfIssue: '10-JAN-2009', dateOfExpiry: 'N/A' },
      { type: 'PAN', number: 'ABCPS1234F', placeOfIssue: 'Income Tax Dept', dateOfIssue: '05-FEB-2011', dateOfExpiry: 'N/A' },
      { type: 'AADHAAR', number: 'xxxxxxxx4912', placeOfIssue: 'UIDAI', dateOfIssue: '18-AUG-2012', dateOfExpiry: 'N/A' }
    ],
    familyMembers: [
      { relationType: 'FATHER', name: 'LATE BIPIN BIHARI SAHOO', isAlive: false, dob: '04-JAN-1956', maritalStatus: 'MARRIED', age: 65 },
      { relationType: 'MOTHER', name: 'ANNAPURNA SAHOO', isAlive: true, dob: '12-AUG-1962', maritalStatus: 'WIDOW', age: 64 },
      { relationType: 'SPOUSE', name: 'SUJATA SAHOO', isAlive: true, dob: '08-MAR-1992', maritalStatus: 'MARRIED', age: 34 }
    ],
    nomineesTable: [
      { relationType: 'SPOUSE', name: 'SUJATA SAHOO', isAlive: true, dob: '08-MAR-1992', maritalStatus: 'MARRIED', age: 34, sharePercent: 100 }
    ],
    qualifications: [
      { degree: 'Master of Arts (Public Administration)', institution: 'Utkal University, Vani Vihar', year: 2011, grade: '1st Class' },
      { degree: 'Bachelor of Arts (Economics Hons)', institution: 'BFP Autonomous College, Puri', year: 2009, grade: '1st Class' }
    ],
    postingHistory: [
      { office: 'District Education Office, Cuttack', district: 'Cuttack', designation: 'Junior Assistant', startDate: '2014-07-15', endDate: '2018-09-30', orderNo: 'DEO-CTC/2014/1102' },
      { office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar', district: 'Khordha', designation: 'Senior Assistant', startDate: '2018-10-01', endDate: 'Present', orderNo: 'PRDW-BBSR/2018/8890' }
    ],
    promotionHistory: [
      { oldDesignation: 'Junior Assistant', newDesignation: 'Senior Assistant', orderNumber: 'PRDW/PROMO/2018/441', effectiveDate: '2018-10-01', payLevel: 'Level-9' }
    ],
    incrementHistory: [
      { currentBasic: 42300, incrementAmount: 1300, revisedBasic: 43600, effectiveDate: '2024-07-01', orderRef: 'INC-2024/771' },
      { currentBasic: 43600, incrementAmount: 1300, revisedBasic: 44900, effectiveDate: '2025-07-01', orderRef: 'INC-2025/892' }
    ],
    trainingHistory: [
      { title: 'e-Governance & Digital Office Workflows', institute: 'GOPABANDHU ACADEMY OF ADMINISTRATION, BBSR', fromDate: '2022-04-10', toDate: '2022-04-15' },
      { title: 'Financial Management & HRMS Administration', institute: 'MADHUSUDAN DAS REGIONAL ACADEMY OF FINANCIAL MANAGEMENT', fromDate: '2023-11-06', toDate: '2023-11-10' }
    ],
    nominations: [
      { type: 'NPS', nomineeName: 'Sujata Sahoo', relation: 'Spouse', sharePercent: 100 },
      { type: 'GIS', nomineeName: 'Sujata Sahoo', relation: 'Spouse', sharePercent: 100 }
    ],
    retirementDetails: {
      superannuationDate: '2048-05-31',
      pensionType: 'National Pension System (NPS)'
    },
    officialEntries: [
      {
        entryType: 'JOINING',
        postCadreScale: 'JUNIOR ASSISTANT',
        pay: 'Rs. 19,900/- (Level-4)',
        wef: '15-JUL-2014',
        entryText: 'JOINED AS JUNIOR ASSISTANT IN DISTRICT EDUCATION OFFICE, CUTTACK IN PURSUANCE OF OSSC RECRUITMENT ORDER NO. 1102 DATED 10-JUL-2014 (FN).',
        noteText: 'ENTRY TAKEN ON 15-JUL-2014',
        entryDate: '15-JUL-2014',
        orderNumber: 'DEO-CTC/2014/1102',
        orderDate: '10-JUL-2014'
      },
      {
        entryType: 'PROMOTION',
        postCadreScale: 'SENIOR ASSISTANT',
        pay: 'Rs. 35,400/- (Level-9)',
        wef: '01-OCT-2018',
        entryText: 'PROMOTED TO THE POST OF SENIOR ASSISTANT VIDE GOVERNMENT OF ODISHA, PANCHAYATI RAJ & DRINKING WATER DEPARTMENT NOTIFICATION NO. 441 DATED 25-SEP-2018.',
        noteText: 'ENTRY TAKEN ON 01-OCT-2018',
        entryDate: '01-OCT-2018',
        orderNumber: 'PRDW/PROMO/2018/441',
        orderDate: '25-SEP-2018'
      },
      {
        entryType: 'TRANSFER & POSTING',
        postCadreScale: 'SENIOR ASSISTANT',
        pay: 'Rs. 44,900/- (Level-9)',
        wef: '01-OCT-2018',
        entryText: 'TRANSFERRED AND POSTED TO PANCHAYATI RAJ & DRINKING WATER DEPARTMENT, BBSR HEADQUARTERS VIDE OFFICE ORDER NO. PRDW-BBSR/2018/8890.',
        noteText: 'ENTRY TAKEN ON 01-OCT-2018',
        entryDate: '01-OCT-2018',
        orderNumber: 'PRDW-BBSR/2018/8890',
        orderDate: '28-SEP-2018'
      },
      {
        entryType: 'INCREMENT',
        postCadreScale: 'SENIOR ASSISTANT',
        pay: 'Rs. 44,900/- (Cell-7, Level-9)',
        wef: '01-JUL-2025',
        entryText: 'ANNUAL INCREMENT SANCTIONED REVISING BASIC PAY FROM RS. 43,600/- TO RS. 44,900/- PM WEF 01-JUL-2025 VIDE DDO ORDER NO. INC-2025/892.',
        noteText: 'ENTRY TAKEN ON 05-JUL-2025',
        entryDate: '05-JUL-2025',
        orderNumber: 'INC-2025/892',
        orderDate: '01-JUL-2025'
      }
    ],
    earnedLeaveAccount: [
      { periodFrom: '01-JAN-2024', periodTo: '30-JUN-2024', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 95, availedFrom: '10-FEB-2024', availedTo: '15-FEB-2024', availedTotal: 6, balanceLeave: 89 },
      { periodFrom: '01-JUL-2024', periodTo: '31-DEC-2024', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 104, availedFrom: undefined, availedTo: undefined, availedTotal: 0, balanceLeave: 104 },
      { periodFrom: '01-JAN-2025', periodTo: '30-JUN-2025', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 119, availedFrom: '02-MAY-2025', availedTo: '06-MAY-2025', availedTotal: 5, balanceLeave: 114 },
      { periodFrom: '01-JUL-2025', periodTo: '31-DEC-2025', completedMonths: 6, leaveCreditDays: 15, eolAvailed: 0, elDeducted: 0, balanceReturnFromLeave: 129, availedFrom: undefined, availedTo: undefined, availedTotal: 0, balanceLeave: 129 }
    ]
  };

  saveDatabase();
}

function seedDatabase() {
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
  const adminPasswordHash = bcrypt.hashSync('Admin123!', 10);

  if (!db.users || db.users.length === 0) {
    db.users = [
      {
        id: 'USR-10001',
        employeeId: 'EMP10001',
        username: 'EMP10001',
        role: 'EMPLOYEE',
        name: 'Rajesh Kumar Sahoo',
        designation: 'Senior Assistant',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        status: 'ACTIVE'
      },
      {
        id: 'USR-20001',
        employeeId: 'RO20001',
        username: 'RO20001',
        role: 'REPORTING_OFFICER',
        name: 'Priyanka Mohanty',
        designation: 'Section Officer & Reporting Authority',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        status: 'ACTIVE'
      },
      {
        id: 'USR-30001',
        employeeId: 'DDO30001',
        username: 'DDO30001',
        role: 'DDO',
        name: 'Subhash Chandra Senapati',
        designation: 'Accounts Officer / DDO',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        status: 'ACTIVE'
      },
      {
        id: 'USR-40001',
        employeeId: 'EO40001',
        username: 'EO40001',
        role: 'ESTABLISHMENT_OFFICER',
        name: 'Smitarani Panda',
        designation: 'Establishment Officer',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        status: 'ACTIVE'
      },
      {
        id: 'USR-99999',
        employeeId: 'ADMIN999',
        username: 'ADMIN999',
        role: 'SUPER_ADMIN',
        name: 'Ramesh Chandra Pradhan',
        designation: 'System Administrator',
        department: 'General Administration & Public Grievance Department',
        office: 'State Data Centre, Bhubaneswar',
        district: 'Khordha',
        status: 'ACTIVE'
      }
    ];
  }

  if (!db.userAuth || db.userAuth.length === 0) {
    db.userAuth = [
      { username: 'EMP10001', passwordHash: defaultPasswordHash, failedAttempts: 0, lockUntil: null },
      { username: 'RO20001', passwordHash: defaultPasswordHash, failedAttempts: 0, lockUntil: null },
      { username: 'DDO30001', passwordHash: defaultPasswordHash, failedAttempts: 0, lockUntil: null },
      { username: 'EO40001', passwordHash: defaultPasswordHash, failedAttempts: 0, lockUntil: null },
      { username: 'ADMIN999', passwordHash: adminPasswordHash, failedAttempts: 0, lockUntil: null }
    ];
  }

  if (!db.employees || db.employees.length === 0) {
    db.employees = [
      {
        id: 'EMP-10001',
        employeeId: 'EMP10001',
        name: 'Rajesh Kumar Sahoo',
        fatherName: 'Late Bipin Bihari Sahoo',
        motherName: 'Annapurna Sahoo',
        dob: '1988-05-14',
        gender: 'MALE',
        mobile: '+91 94370 12345',
        email: 'rajesh.sahoo.demo@hrmsodisha.demo',
        designation: 'Senior Assistant',
        cadre: 'Odisha Subordinate Secretariat Service',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        block: 'Bhubaneswar MC',
        dateOfJoining: '2014-07-15',
        employmentType: 'PERMANENT',
        currentPosting: 'Accounts Branch - I',
        status: 'ACTIVE',
        panNumber: 'ABCPS1234F',
        gpfNpsNo: 'OR/NPS/2014/99120',
        payLevel: 'Level-9',
        basicPay: 44900,
        reportingOfficerId: 'RO20001',
        reportingOfficerName: 'Priyanka Mohanty',
        ddoId: 'DDO30001'
      },
      {
        id: 'EMP-20001',
        employeeId: 'RO20001',
        name: 'Priyanka Mohanty',
        fatherName: 'Kishore Chandra Mohanty',
        motherName: 'Subhadra Mohanty',
        dob: '1982-11-20',
        gender: 'FEMALE',
        mobile: '+91 98610 98765',
        email: 'priyanka.mohanty.demo@hrmsodisha.demo',
        designation: 'Section Officer & Reporting Authority',
        cadre: 'Odisha Secretariat Service',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        block: 'Bhubaneswar MC',
        dateOfJoining: '2009-03-01',
        employmentType: 'PERMANENT',
        currentPosting: 'Administration Section',
        status: 'ACTIVE',
        panNumber: 'PKMPS5678K',
        gpfNpsNo: 'OR/NPS/2009/44312',
        payLevel: 'Level-12',
        basicPay: 67700,
        reportingOfficerId: 'EO40001',
        reportingOfficerName: 'Smitarani Panda',
        ddoId: 'DDO30001'
      },
      {
        id: 'EMP-30001',
        employeeId: 'DDO30001',
        name: 'Subhash Chandra Senapati',
        fatherName: 'Baidyanath Senapati',
        motherName: 'Minati Senapati',
        dob: '1979-02-10',
        gender: 'MALE',
        mobile: '+91 94371 44556',
        email: 'subhash.senapati.demo@hrmsodisha.demo',
        designation: 'Accounts Officer / DDO',
        cadre: 'Odisha Finance Service',
        department: 'Panchayati Raj & Drinking Water Department',
        office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        district: 'Khordha',
        block: 'Bhubaneswar MC',
        dateOfJoining: '2006-08-10',
        employmentType: 'PERMANENT',
        currentPosting: 'Bills & Accounts Wing',
        status: 'ACTIVE',
        panNumber: 'SCSPS8899M',
        gpfNpsNo: 'OR/GPF/2006/11098',
        payLevel: 'Level-14',
        basicPay: 88700,
        reportingOfficerId: 'ADMIN999',
        reportingOfficerName: 'Ramesh Chandra Pradhan',
        ddoId: 'DDO30001'
      }
    ];
  }

  db.serviceBooks['EMP10001'] = {
    employeeId: 'EMP10001',
    personalDetails: {
      bloodGroup: 'B Positive (B+)',
      heightCm: 172,
      identificationMark: 'Small mole on right forearm',
      permanentAddress: 'At/PO: Srirampur, PS: Nimapada, Dist: Puri, Pin: 752106',
      maritalStatus: 'MARRIED'
    },
    qualifications: [
      { degree: 'Master of Arts (Public Administration)', institution: 'Utkal University, Vani Vihar', year: 2011, grade: '1st Class' },
      { degree: 'Bachelor of Arts (Economics Hons)', institution: 'BFP Autonomous College, Puri', year: 2009, grade: '1st Class' }
    ],
    postingHistory: [
      { office: 'District Education Office, Cuttack', district: 'Cuttack', designation: 'Junior Assistant', startDate: '2014-07-15', endDate: '2018-09-30', orderNo: 'DEO-CTC/2014/1102' },
      { office: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar', district: 'Khordha', designation: 'Senior Assistant', startDate: '2018-10-01', endDate: 'Present', orderNo: 'PRDW-BBSR/2018/8890' }
    ],
    promotionHistory: [
      { oldDesignation: 'Junior Assistant', newDesignation: 'Senior Assistant', orderNumber: 'PRDW/PROMO/2018/441', effectiveDate: '2018-10-01', payLevel: 'Level-9' }
    ],
    incrementHistory: [
      { currentBasic: 42300, incrementAmount: 1300, revisedBasic: 43600, effectiveDate: '2024-07-01', orderRef: 'INC-2024/771' },
      { currentBasic: 43600, incrementAmount: 1300, revisedBasic: 44900, effectiveDate: '2025-07-01', orderRef: 'INC-2025/892' }
    ],
    trainingHistory: [
      { title: 'e-Governance & Digital Office Workflows', institute: 'GOPABANDHU ACADEMY OF ADMINISTRATION, BBSR', fromDate: '2022-04-10', toDate: '2022-04-15' },
      { title: 'Financial Management & HRMS Administration', institute: 'MADHUSUDAN DAS REGIONAL ACADEMY OF FINANCIAL MANAGEMENT', fromDate: '2023-11-06', toDate: '2023-11-10' }
    ],
    nominations: [
      { type: 'NPS', nomineeName: 'Sujata Sahoo', relation: 'Spouse', sharePercent: 100 },
      { type: 'GIS', nomineeName: 'Sujata Sahoo', relation: 'Spouse', sharePercent: 100 }
    ],
    retirementDetails: {
      superannuationDate: '2048-05-31',
      pensionType: 'National Pension System (NPS)'
    }
  };

  db.leaveBalances['EMP10001'] = [
    { leaveType: 'CASUAL', openingBalance: 15, used: 4, pending: 2, available: 9 },
    { leaveType: 'EARNED', openingBalance: 120, used: 10, pending: 0, available: 110 },
    { leaveType: 'MEDICAL', openingBalance: 20, used: 0, pending: 0, available: 20 },
    { leaveType: 'MATERNITY', openingBalance: 0, used: 0, pending: 0, available: 0 },
    { leaveType: 'PATERNITY', openingBalance: 15, used: 0, pending: 0, available: 15 },
    { leaveType: 'SPECIAL', openingBalance: 10, used: 1, pending: 0, available: 9 }
  ];

  db.leaveRequests = [
    {
      id: 'LV-2026-001',
      requestNumber: 'LR-2026-00001',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      designation: 'Senior Assistant',
      department: 'Panchayati Raj & Drinking Water Department',
      leaveType: 'CASUAL',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      totalDays: 2,
      reason: 'Family ritual function at native place Srirampur, Puri.',
      addressDuringLeave: 'At/PO: Srirampur, PS: Nimapada, Dist: Puri, Pin: 752106',
      status: 'PENDING',
      reportingOfficerId: 'RO20001',
      reportingOfficerName: 'Priyanka Mohanty',
      createdAt: '2026-07-25T10:15:00Z',
      updatedAt: '2026-07-25T10:15:00Z'
    },
    {
      id: 'LV-2026-002',
      requestNumber: 'LR-2026-00002',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      designation: 'Senior Assistant',
      department: 'Panchayati Raj & Drinking Water Department',
      leaveType: 'CASUAL',
      startDate: '2026-05-10',
      endDate: '2026-05-12',
      totalDays: 3,
      reason: 'Medical checkup of mother in AIIMS Bhubaneswar.',
      addressDuringLeave: 'Plot 402, Saheed Nagar, Bhubaneswar',
      status: 'APPROVED',
      reportingOfficerId: 'RO20001',
      reportingOfficerName: 'Priyanka Mohanty',
      officerRemarks: 'Sanctioned Casual Leave for 3 days.',
      createdAt: '2026-05-01T09:00:00Z',
      updatedAt: '2026-05-02T11:30:00Z'
    }
  ];

  db.salaryRecords = [
    {
      id: 'SAL-2026-06',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      month: 6,
      year: 2026,
      payLevel: 'Level-9',
      basicPay: 44900,
      da: 22450, // 50%
      hra: 8980,  // 20%
      medicalAllowance: 500,
      specialAllowance: 1000,
      grossSalary: 77830,
      npsContribution: 6735, // 10% basic+DA
      professionalTax: 200,
      incomeTax: 4500,
      loanRecovery: 2500,
      gis: 400,
      totalDeductions: 14335,
      netPay: 63495,
      paymentStatus: 'PAID',
      paymentDate: '2026-06-30'
    },
    {
      id: 'SAL-2026-05',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      month: 5,
      year: 2026,
      payLevel: 'Level-9',
      basicPay: 44900,
      da: 22450,
      hra: 8980,
      medicalAllowance: 500,
      specialAllowance: 1000,
      grossSalary: 77830,
      npsContribution: 6735,
      professionalTax: 200,
      incomeTax: 4500,
      loanRecovery: 2500,
      gis: 400,
      totalDeductions: 14335,
      netPay: 63495,
      paymentStatus: 'PAID',
      paymentDate: '2026-05-31'
    }
  ];

  db.loans = [
    {
      id: 'LOAN-001',
      employeeId: 'EMP10001',
      loanType: 'HOUSE_BUILDING',
      sanctionNo: 'HBA-PRDW/2023/104',
      sanctionDate: '2023-03-15',
      originalAmount: 500000,
      monthlyInstallment: 2500,
      recoveredAmount: 100000,
      outstandingAmount: 400000,
      status: 'ACTIVE'
    }
  ];

  db.transfers = [
    {
      id: 'TR-2026-000088',
      requestNumber: 'TR-2026-000088',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      designation: 'Senior Assistant',
      department: 'Panchayati Raj & Drinking Water Department',
      currentOffice: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      currentDistrict: 'Khordha',
      currentBlock: 'Bhubaneswar MC',
      currentPosting: 'Accounts Branch - I',
      transferType: 'General Request',
      state: 'Odisha',
      preferredOffice: 'Block Development Office, Puri Sadar, Puri',
      preferredDistrict: 'Puri',
      preferredBlock: 'Puri Sadar',
      reason: 'Elderly dependent parents reside in native village Srirampur, Nimapada (Puri District) needing regular medical care.',
      supportingDocumentName: 'Medical_Certificate_Dependent_Parents.pdf',
      employeeRemarks: 'Completed more than 7 years of service at current Bhubaneswar station.',
      submissionDate: '2026-06-12',
      status: 'UNDER_DDO_REVIEW',
      currentStage: 'Pending at DDO for Recommendation',
      processedBy: 'Establishment Officer (DDO Branch)',
      remarks: 'Application forwarded to Establishment Branch for verification of tenure. Service history verified.',
      createdAt: '2026-06-12T11:00:00Z',
      updatedAt: '2026-06-13T09:30:00Z',
      timeline: [
        {
          id: 'TL-001',
          action: 'Transfer Application Submitted',
          date: '2026-06-12',
          time: '11:00 AM',
          user: 'Rajesh Kumar Sahoo',
          role: 'EMPLOYEE',
          remarks: 'Submitted transfer request via Employee Portal',
          status: 'SUBMITTED'
        },
        {
          id: 'TL-002',
          action: 'Under Verification (Establishment Desk)',
          date: '2026-06-13',
          time: '09:30 AM',
          user: 'Smitarani Panda',
          role: 'ESTABLISHMENT_OFFICER',
          remarks: 'Service book, vigilance clearance & 7-year tenure verified. Forwarded for Reporting Officer appraisal.',
          status: 'UNDER_DDO_REVIEW'
        },
        {
          id: 'TL-003',
          action: 'Pending at Reporting Officer / DDO',
          date: '2026-06-15',
          time: '11:15 AM',
          user: 'Priyanka Mohanty',
          role: 'REPORTING_OFFICER',
          remarks: 'Applicant performance is exemplary. Recommended for transfer on humanitarian grounds.',
          status: 'UNDER_DDO_REVIEW'
        }
      ],
      approvalStages: [
        {
          stageNumber: 1,
          stageName: 'Employee Submission',
          authorityRole: 'Employee (Self)',
          authorityName: 'Rajesh Kumar Sahoo',
          status: 'COMPLETED',
          actionDate: '2026-06-12',
          actionTime: '11:00 AM',
          remarks: 'Transfer application submitted successfully.'
        },
        {
          stageNumber: 2,
          stageName: 'Establishment Verification',
          authorityRole: 'Establishment Officer',
          authorityName: 'Smitarani Panda',
          status: 'COMPLETED',
          actionDate: '2026-06-13',
          actionTime: '09:30 AM',
          remarks: 'Service record & station tenure verified in order.'
        },
        {
          stageNumber: 3,
          stageName: 'Reporting Officer Appraisal',
          authorityRole: 'Section Officer / RO',
          authorityName: 'Priyanka Mohanty',
          status: 'COMPLETED',
          actionDate: '2026-06-15',
          actionTime: '11:15 AM',
          remarks: 'Recommended on compassionate / parental medical grounds.'
        },
        {
          stageNumber: 4,
          stageName: 'DDO Endorsement & Scrutiny',
          authorityRole: 'Drawing & Disbursing Officer',
          authorityName: 'Subhash Chandra Senapati',
          status: 'CURRENT',
          actionDate: '2026-06-16',
          actionTime: '10:00 AM',
          remarks: 'Under active scrutiny for Cadre strength check at Puri Sadar.'
        },
        {
          stageNumber: 5,
          stageName: 'Competent Authority Approval',
          authorityRole: 'District Collector / Director PR',
          authorityName: 'Competent Sanctioning Authority',
          status: 'PENDING',
          remarks: 'Awaiting DDO submission for final sanction.'
        },
        {
          stageNumber: 6,
          stageName: 'Transfer Order Generation',
          authorityRole: 'Establishment Issuing Authority',
          authorityName: 'Departmental Cadre Authority',
          status: 'PENDING',
          remarks: 'To be generated upon competent sanction.'
        }
      ]
    },
    {
      id: 'TR-DRAFT-0041',
      requestNumber: 'TR-DRAFT-2026-0041',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      designation: 'Senior Assistant',
      department: 'Panchayati Raj & Drinking Water Department',
      currentOffice: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      currentDistrict: 'Khordha',
      currentBlock: 'Bhubaneswar MC',
      currentPosting: 'Accounts Branch - I',
      transferType: 'Mutual Transfer',
      state: 'Odisha',
      preferredOffice: 'Collectorate Office, Cuttack Sadar, Cuttack',
      preferredDistrict: 'Cuttack',
      preferredBlock: 'Cuttack Sadar',
      reason: 'Mutual transfer proposal with consent of counterpart employee posted in Cuttack district.',
      supportingDocumentName: 'Mutual_Consent_Letter.pdf',
      employeeRemarks: 'Counterpart employee: Shri Alok Kumar Nayak (HRMS ID: EMP10492)',
      status: 'DRAFT',
      currentStage: 'Draft Application Saved',
      createdAt: '2026-07-02T14:30:00Z',
      updatedAt: '2026-07-02T14:30:00Z',
      timeline: [
        {
          id: 'TL-DRAFT-01',
          action: 'Transfer Application Saved as Draft',
          date: '2026-07-02',
          time: '02:30 PM',
          user: 'Rajesh Kumar Sahoo',
          role: 'EMPLOYEE',
          remarks: 'Saved draft in HRMS portal for later submission',
          status: 'DRAFT'
        }
      ]
    }
  ];

  db.transferHistory = [
    {
      id: 'TH-2018-001',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      designation: 'Senior Assistant',
      previousOffice: 'District Education Office, Cuttack',
      previousDistrict: 'Cuttack',
      previousBlock: 'Cuttack Sadar',
      newOffice: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      newDistrict: 'Khordha',
      newBlock: 'Bhubaneswar MC',
      transferDate: '2018-10-01',
      orderDate: '2018-09-25',
      transferOrderNumber: 'ORD-PRDW/EST/2018/8890',
      transferStatus: 'COMPLETED',
      transferAuthority: 'Special Secretary to Government, PR & DW Department',
      transferType: 'Administrative Grounds / Promotion Transfer',
      relievingDate: '2018-09-30 (Afternoon)',
      joiningDate: '2018-10-01 (Forenoon)',
      remarks: 'Transferred and posted on cadre promotion from Junior Assistant to Senior Assistant.'
    },
    {
      id: 'TH-2014-002',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      designation: 'Junior Assistant',
      previousOffice: 'Sub-Divisional Office, Athagarh',
      previousDistrict: 'Cuttack',
      previousBlock: 'Athagarh',
      newOffice: 'District Education Office, Cuttack',
      newDistrict: 'Cuttack',
      newBlock: 'Cuttack Sadar',
      transferDate: '2014-07-15',
      orderDate: '2014-07-02',
      transferOrderNumber: 'ORD-SME-CTC/2014/1102',
      transferStatus: 'COMPLETED',
      transferAuthority: 'District Magistrate & Collector, Cuttack',
      transferType: 'General Request Transfer',
      relievingDate: '2014-07-14 (Afternoon)',
      joiningDate: '2014-07-15 (Forenoon)',
      remarks: 'Transferred on official request to District Education Office, Cuttack.'
    }
  ];

  db.lpcRecords = [
    {
      id: 'LPC-2024-01',
      lpcNumber: 'LPC-PRDW-2024-0091',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      designation: 'Senior Assistant',
      department: 'Panchayati Raj & Drinking Water Department',
      previousOffice: 'Block Development Office, Cuttack',
      newOffice: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      relievingDate: '2018-09-30',
      lastSalaryMonth: 'September 2018',
      basicPay: 35400,
      allowances: 14160,
      deductions: 5200,
      recoveries: 0,
      pendingDues: 0,
      status: 'APPROVED',
      remarks: 'All government dues cleared up to date of relief.',
      createdBy: 'DDO30001',
      approvedBy: 'Subhash Chandra Senapati',
      createdAt: '2018-10-02T10:00:00Z'
    }
  ];

  db.joiningReports = [
    {
      id: 'JR-001',
      reportNumber: 'JR-2018-00412',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      designation: 'Senior Assistant',
      department: 'Panchayati Raj & Drinking Water Department',
      postingOrderNumber: 'PRDW-BBSR/2018/8890',
      postingOrderDate: '2018-09-25',
      placeOfPosting: 'Panchayati Raj & Drinking Water Department, Bhubaneswar',
      joiningDate: '2018-10-01',
      joiningTime: 'FORENOON',
      remarks: 'Joined on transfer from DEO Cuttack.',
      status: 'ACCEPTED',
      acceptedBy: 'Priyanka Mohanty',
      createdAt: '2018-10-01T10:30:00Z'
    }
  ];

  db.eParReports = [
    {
      id: 'EPAR-2025-26',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      designation: 'Senior Assistant',
      department: 'Panchayati Raj & Drinking Water Department',
      period: '2025-2026',
      reportingOfficerName: 'Priyanka Mohanty',
      reviewingOfficerName: 'Smitarani Panda',
      acceptingAuthorityName: 'Director, Panchayati Raj & Drinking Water Department',
      selfAppraisal: 'Achieved 100% timely processing of HRMS file clearances, pension proposals, and daily office correspondence without backlog.',
      performanceRating: 'VERY_GOOD',
      reportingRemarks: 'Punctual, diligent, and knowledgeable officer.',
      reviewingRemarks: 'Agreed with Reporting Officer rating.',
      status: 'ACCEPTED',
      createdAt: '2026-04-10T11:00:00Z'
    }
  ];

  db.grievanceRecords = [
    {
      id: 'GRV-2026-001',
      grievanceNumber: 'REQ-2026-000001',
      employeeId: 'EMP10001',
      employeeName: 'Rajesh Kumar Sahoo',
      category: 'PAY_ANOMALY',
      subject: 'Correction of DA arrear calculation for Jan-Mar 2026',
      description: 'Request to verify and release pending DA arrears amounting to Rs 2,400 for the period January 2026 to March 2026.',
      priority: 'MEDIUM',
      status: 'UNDER_PROCESS',
      resolutionRemarks: 'Assigned to Accounts Officer for verification of arrear bill.',
      createdAt: '2026-07-01T14:20:00Z',
      updatedAt: '2026-07-05T10:00:00Z'
    }
  ];

  db.notifications = [
    {
      id: 'NOTIF-001',
      employeeId: 'EMP10001',
      title: 'Leave Request Status Updated',
      message: 'Your Casual Leave application LR-2026-00002 has been APPROVED.',
      type: 'LEAVE',
      isRead: false,
      createdAt: '2026-05-02T11:30:00Z',
      link: '/leave'
    },
    {
      id: 'NOTIF-002',
      employeeId: 'EMP10001',
      title: 'Salary Credit Notice',
      message: 'Salary for June 2026 of Net Amount ₹63,495 processed successfully.',
      type: 'SALARY',
      isRead: false,
      createdAt: '2026-06-30T18:00:00Z',
      link: '/salary'
    },
    {
      id: 'NOTIF-003',
      employeeId: 'EMP10001',
      title: 'Transfer Application Under Review',
      message: 'Your transfer application TR-2026-00088 is under verification at Establishment Branch.',
      type: 'TRANSFER',
      isRead: true,
      createdAt: '2026-06-12T11:05:00Z',
      link: '/transfer'
    }
  ];

  db.auditLogs = [
    {
      id: 'AUD-001',
      userId: 'EMP10001',
      username: 'EMP10001',
      role: 'EMPLOYEE',
      action: 'SYSTEM_BOOTSTRAP',
      module: 'SYSTEM',
      recordId: 'SYS-INIT',
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      details: 'Initial Demo HRMS database seeded successfully.'
    }
  ];

  saveDatabase();
}

export function ensureDdoAccount() {
  const ddoUsername = 'EMP20267858';
  const ddoPassHash = bcrypt.hashSync('Ranjan@2004', 10);
  
  // Ensure User
  let ddoUser = db.users.find(u => u.username === ddoUsername || u.employeeId === ddoUsername);
  if (!ddoUser) {
    ddoUser = {
      id: 'USR-20267858',
      employeeId: ddoUsername,
      username: ddoUsername,
      role: 'DDO',
      name: 'Drawing & Disbursing Officer (DDO)',
      designation: 'Drawing & Disbursing Officer',
      department: 'Panchayati Raj & Drinking Water Department',
      office: 'Office of the DDO, Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      district: 'Khordha',
      status: 'ACTIVE'
    };
    db.users.push(ddoUser);
  } else {
    ddoUser.role = 'DDO';
    ddoUser.status = 'ACTIVE';
    ddoUser.department = 'Panchayati Raj & Drinking Water Department';
    ddoUser.office = 'Office of the DDO, Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar';
  }

  // Ensure Auth
  let ddoAuth = db.userAuth.find(a => a.username === ddoUsername);
  if (!ddoAuth) {
    db.userAuth.push({
      username: ddoUsername,
      passwordHash: ddoPassHash,
      failedAttempts: 0,
      lockUntil: null
    });
  } else {
    ddoAuth.passwordHash = ddoPassHash;
    ddoAuth.failedAttempts = 0;
    ddoAuth.lockUntil = null;
  }

  // Ensure Employee record
  let ddoEmp = db.employees.find(e => e.employeeId === ddoUsername);
  if (!ddoEmp) {
    db.employees.push({
      id: 'EMP-20267858',
      employeeId: ddoUsername,
      name: 'Drawing & Disbursing Officer (DDO)',
      fatherName: 'N/A',
      motherName: 'N/A',
      dob: '1980-01-01',
      gender: 'MALE',
      mobile: '+91 94370 99887',
      email: 'ddo.office@hrmsodisha.gov.in',
      designation: 'Drawing & Disbursing Officer',
      cadre: 'Odisha Administrative Service',
      department: 'Panchayati Raj & Drinking Water Department',
      office: 'Office of the DDO, Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
      district: 'Khordha',
      block: 'Bhubaneswar MC',
      dateOfJoining: '2005-06-01',
      employmentType: 'PERMANENT',
      currentPosting: 'DDO Establishment',
      status: 'ACTIVE',
      panNumber: 'ABCDE7858R',
      gpfNpsNo: 'OR/NPS/2005/78580',
      payLevel: 'Level-14',
      basicPay: 78800,
      reportingOfficerId: 'ADMIN999',
      reportingOfficerName: 'Ramesh Chandra Pradhan',
      ddoId: ddoUsername
    });
  } else {
    ddoEmp.department = 'Panchayati Raj & Drinking Water Department';
    ddoEmp.office = 'Office of the DDO, Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar';
  }

  // Auto-migrate any existing records in memory from Department of Higher Education
  if (db.users) {
    db.users.forEach(u => {
      if (!u.department || u.department.includes('Higher Education')) {
        u.department = 'Panchayati Raj & Drinking Water Department';
      }
      if (u.office && u.office.includes('Higher Education')) {
        u.office = 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar';
      }
    });
  }
  if (db.employees) {
    db.employees.forEach(e => {
      if (!e.department || e.department.includes('Higher Education')) {
        e.department = 'Panchayati Raj & Drinking Water Department';
      }
      if (e.office && e.office.includes('Higher Education')) {
        e.office = 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar';
      }
    });
  }
  if (db.officesMaster) {
    db.officesMaster.forEach(o => {
      if (o.department && o.department.includes('Higher Education')) {
        o.department = 'Panchayati Raj & Drinking Water Department';
      }
      if (o.name && o.name.includes('Higher Education')) {
        o.name = 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar';
      }
    });
  }
  if (db.joiningReports) {
    db.joiningReports.forEach(j => {
      if (j.department && j.department.includes('Higher Education')) {
        j.department = 'Panchayati Raj & Drinking Water Department';
      }
      if (j.placeOfPosting && j.placeOfPosting.includes('Higher Education')) {
        j.placeOfPosting = 'Panchayati Raj & Drinking Water Department, Bhubaneswar';
      }
    });
  }
  if (db.lpcRecords) {
    db.lpcRecords.forEach(l => {
      if (l.department && l.department.includes('Higher Education')) {
        l.department = 'Panchayati Raj & Drinking Water Department';
      }
      if (l.newOffice && l.newOffice.includes('Higher Education')) {
        l.newOffice = 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar';
      }
    });
  }

  saveDatabase();
}

export function ensureTransferDocuments() {
  if (!db.transferDocuments) {
    db.transferDocuments = [];
  }

  // Ensure documents for existing transfers (like Laxmi Naik's TR-2026-000002)
  if (db.transfers && db.transfers.length > 0) {
    db.transfers.forEach(transfer => {
      // Check for Laxmi Naik's existing transfer or any transfer with order/approved status
      const existingDocs = db.transferDocuments.filter(d => d.transferId === transfer.id);

      // If transfer is FORWARDED_TO_COLLECTOR or APPROVED or ORDER_ISSUED or RELIEVED or JOINED, ensure Approval Order exists
      const isApprovedOrBeyond = ['FORWARDED_TO_COLLECTOR', 'COLLECTOR_APPROVED', 'APPROVED', 'ORDER_ISSUED', 'RELIEVED', 'JOINED'].includes(transfer.status);
      if (isApprovedOrBeyond && !existingDocs.some(d => d.documentType === 'Approval Order')) {
        const empNameFormatted = (transfer.employeeName || 'Employee').replace(/\s+/g, '_');
        const blockFormatted = (transfer.currentBlock || 'Bijatala').replace(/\s+/g, '_');
        const dateStr = transfer.orderDate || (transfer.createdAt ? transfer.createdAt.split('T')[0] : '2026-08-18');
        db.transferDocuments.push({
          id: `DOC-${transfer.id}-APP-v1`,
          transferId: transfer.id,
          employeeId: transfer.employeeId,
          documentType: 'Approval Order',
          documentTitle: `BDO Forwarding & Recommendation Letter – ${transfer.employeeName}`,
          fileName: `${empNameFormatted}_Recommendation_Letter_${blockFormatted}_${dateStr.replace(/-/g, '')}.pdf`,
          fileSize: '164 KB',
          mimeType: 'application/pdf',
          orderNumber: `LTR-BDO/2026/${transfer.requestNumber.slice(-4) || '0892'}`,
          orderDate: dateStr,
          uploadedBy: `Block Development Officer (${transfer.currentBlock || 'Bijatala'} Block)`,
          uploaderRole: 'DDO',
          uploadedAt: transfer.updatedAt || transfer.createdAt || new Date().toISOString(),
          documentStatus: 'Available',
          remarks: `Transfer application recommended and forwarded to the District Collector, ${transfer.currentDistrict || 'Mayurbhanj'} for consideration and necessary orders.`,
          version: 1,
          isCurrentVersion: true,
          createdAt: transfer.createdAt || new Date().toISOString(),
          updatedAt: transfer.updatedAt || new Date().toISOString()
        });
      }

      // If transfer is ORDER_ISSUED or RELIEVED or JOINED, ensure Transfer Order exists
      const isOrderIssuedOrBeyond = ['ORDER_ISSUED', 'RELIEVED', 'JOINED'].includes(transfer.status);
      if (isOrderIssuedOrBeyond && !existingDocs.some(d => d.documentType === 'Transfer Order')) {
        const ordNo = transfer.orderNumber || 'ORD-PRDW-2026/1185';
        const ordDate = transfer.orderDate || '2026-08-18';
        db.transferDocuments.push({
          id: `DOC-${transfer.id}-ORD-v1`,
          transferId: transfer.id,
          employeeId: transfer.employeeId,
          documentType: 'Transfer Order',
          documentTitle: `Transfer Order – ${transfer.employeeName}`,
          fileName: `Transfer_Order_${ordNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
          fileSize: '215 KB',
          mimeType: 'application/pdf',
          orderNumber: ordNo,
          orderDate: ordDate,
          uploadedBy: 'Drawing & Disbursing Officer (DDO)',
          uploaderRole: 'DDO',
          uploadedAt: transfer.updatedAt || transfer.createdAt || new Date().toISOString(),
          documentStatus: 'Available',
          remarks: 'Official Transfer Order issued by Government of Odisha, Panchayati Raj & Drinking Water Department.',
          version: 1,
          isCurrentVersion: true,
          createdAt: transfer.createdAt || new Date().toISOString(),
          updatedAt: transfer.updatedAt || new Date().toISOString()
        });
      }
    });
  }

  saveDatabase();
}

/**
 * Creates an immutable, timestamped JSON snapshot in /backups
 */
export function createBackupSnapshot(label: string = 'snapshot'): string {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hrms_backup_${timestamp}_${label}.json`;
    const filepath = path.join(BACKUPS_DIR, filename);
    const serialized = JSON.stringify(db, null, 2);
    fs.writeFileSync(filepath, serialized, 'utf-8');
    console.log(`Created automated database snapshot: ${filename}`);

    // Prune very old backups if exceeding 30 snapshots to keep disk clean
    const allBackups = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith('hrms_backup_') && f.endsWith('.json'));
    if (allBackups.length > 30) {
      allBackups.sort();
      const toDelete = allBackups.slice(0, allBackups.length - 30);
      toDelete.forEach(f => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch (e) {}
      });
    }

    return filename;
  } catch (e) {
    console.error('Error creating backup snapshot:', e);
    return '';
  }
}

/**
 * Returns available backup files with metadata
 */
export function getAvailableBackups(): DatabaseBackupInfo[] {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith('hrms_backup_') && f.endsWith('.json'));
    files.sort().reverse(); // newest first

    return files.map(file => {
      const fullPath = path.join(BACKUPS_DIR, file);
      const stat = fs.statSync(fullPath);
      let empCount = 0;
      let userCount = 0;
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const parsed = JSON.parse(raw);
        empCount = (parsed.employees || []).length;
        userCount = (parsed.users || []).length;
      } catch (e) {}

      const sizeKb = (stat.size / 1024).toFixed(1);
      return {
        filename: file,
        filepath: fullPath,
        timestamp: stat.mtime.toISOString(),
        sizeBytes: stat.size,
        sizeFormatted: `${sizeKb} KB`,
        totalEmployees: empCount,
        totalUsers: userCount,
        label: file.split('_').slice(3).join('_').replace('.json', '') || 'Automated'
      };
    });
  } catch (e) {
    console.error('Error listing backups:', e);
    return [];
  }
}

/**
 * Restores database from a given backup filename
 */
export function restoreFromBackup(filename: string): boolean {
  try {
    const fullPath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(fullPath)) return false;
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.users || !parsed.employees) return false;

    // Create a safety snapshot of current state before restore
    createBackupSnapshot('pre_restore_safety');

    db = parsed;
    saveDatabase();
    console.log(`Database successfully restored from snapshot ${filename}`);
    return true;
  } catch (e) {
    console.error('Failed to restore from backup:', e);
    return false;
  }
}

export function loadDatabase(): DatabaseSchema {
  let loaded = false;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        db = JSON.parse(raw);
        loaded = true;
      }
    }
  } catch (e) {
    console.error('Failed to load primary DB file, attempting backup load:', e);
  }

  if (!loaded) {
    try {
      if (fs.existsSync(DB_BAK)) {
        const bakRaw = fs.readFileSync(DB_BAK, 'utf-8');
        if (bakRaw && bakRaw.trim().length > 0) {
          db = JSON.parse(bakRaw);
          loaded = true;
          console.log('Successfully restored database from backup file.');
        }
      }
    } catch (bakErr) {
      console.error('Failed to load DB backup file:', bakErr);
    }
  }

  // Attempt load from snapshots directory if primary and bak failed
  if (!loaded && fs.existsSync(BACKUPS_DIR)) {
    try {
      const snapshotFiles = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith('hrms_backup_') && f.endsWith('.json'));
      if (snapshotFiles.length > 0) {
        snapshotFiles.sort().reverse();
        const latestSnapshot = path.join(BACKUPS_DIR, snapshotFiles[0]);
        const snapshotRaw = fs.readFileSync(latestSnapshot, 'utf-8');
        if (snapshotRaw && snapshotRaw.trim().length > 0) {
          db = JSON.parse(snapshotRaw);
          loaded = true;
          console.log(`Successfully recovered database from snapshot ${snapshotFiles[0]}`);
        }
      }
    } catch (snapErr) {
      console.error('Failed to load snapshot file:', snapErr);
    }
  }

  if (!loaded) {
    console.log('Initializing fresh database with seed data...');
    seedDatabase();
  }

  db.transferDocuments = db.transferDocuments || [];
  ensureDdoAccount();
  ensureMasterData();
  ensureTransferDocuments();
  ensureServiceBooks();
  ensureCommunications();

  // Create an automatic startup snapshot
  if (db.employees && db.employees.length > 0) {
    createBackupSnapshot('server_boot');
  }

  return db;
}

export function ensureCommunications() {
  if (!db.communications) {
    db.communications = [];
  }

  if (db.communications.length === 0) {
    const seedCommunications: CommunicationItem[] = [
      {
        id: 'COMM-2026-001',
        referenceNo: 'PR-EST-2026/894',
        title: 'Submission of Annual Property Statement 2025-26 on HRMS Portal',
        type: 'CIRCULAR',
        priority: 'HIGH',
        category: 'Property Statements & Conduct Rules',
        content: `In accordance with Rule 21 of the Odisha Government Servants' Conduct Rules, 1959, all Group A, Group B, and Group C State Government employees are hereby instructed to file and submit their Annual Property Statement for the Financial Year 2025-26 online through the e-PAR & Property module of the HRMS Odisha Portal on or before the revised deadline of 31st March 2026.\n\nPlease note:\n1. All movable and immovable properties held by the government servant or acquired in the name of any family member must be declared accurately.\n2. Non-compliance or delayed submission shall result in withholding of annual increments and vigilance clearance for promotions and transfers.\n3. DDOs and Establishment Officers are directed to verify and countersign employee submissions without delay.`,
        summary: 'Instruction for online filing of Annual Property Statement 2025-26 on HRMS before 31-Mar-2026.',
        targetAudience: 'ALL_EMPLOYEES',
        targetDepartment: 'Panchayati Raj & Drinking Water Department',
        status: 'PUBLISHED',
        publishDate: '2026-01-15T10:30:00.000Z',
        expiryDate: '2026-04-15T23:59:59.000Z',
        actionRequired: true,
        actionDeadline: '2026-03-31',
        actionType: 'SUBMIT_PROPERTY_STATEMENT',
        actionLinkTab: 'epar',
        attachments: [
          {
            id: 'ATT-COMM-001-A',
            fileName: 'Property_Statement_Guidelines_2025_26.pdf',
            fileSize: '340 KB',
            fileType: 'application/pdf',
            downloadName: 'Property_Statement_Guidelines_2025_26.pdf'
          },
          {
            id: 'ATT-COMM-001-B',
            fileName: 'Conduct_Rules_Circular_Govt_Odisha.pdf',
            fileSize: '1.2 MB',
            fileType: 'application/pdf',
            downloadName: 'Conduct_Rules_Circular_Govt_Odisha.pdf'
          }
        ],
        senderName: 'Smt. Priyanka Mohanty, OAS (SAG)',
        senderDesignation: 'Additional Secretary & Establishment DDO',
        senderDepartment: 'Panchayati Raj & Drinking Water Department',
        senderOffice: 'Odisha Secretariat, Lok Seva Bhawan, Bhubaneswar',
        readByEmployeeIds: [],
        createdAt: '2026-01-15T10:30:00.000Z',
        updatedAt: '2026-01-15T10:30:00.000Z'
      },
      {
        id: 'COMM-2026-002',
        referenceNo: 'DDO/SAL/2026/112',
        title: 'Verification and Re-fixation of Pay & DA Arrears under 7th CPC Revised Pay Rules',
        type: 'OFFICE_ORDER',
        priority: 'NORMAL',
        category: 'Payroll & Allowances',
        content: `It is hereby notified to all establishment staff that the verification of revised Dearness Allowance (DA) rates and annual increment fixation records for the current financial year has been completed and countersigned by the Drawing & Disbursing Officer (DDO).\n\nEmployees are advised to inspect their updated monthly payslips and digital e-Service Book fixation entries on the portal. Any discrepancies in basic pay, grade pay, or DA calculations must be reported to the DDO Accounts Wing via the Grievance/Help Desk module within 15 working days.`,
        summary: 'DA revision and 7th CPC annual increment verification completed by Establishment Accounts Section.',
        targetAudience: 'ALL_EMPLOYEES',
        targetDepartment: 'Panchayati Raj & Drinking Water Department',
        status: 'PUBLISHED',
        publishDate: '2026-02-10T14:15:00.000Z',
        expiryDate: '2026-05-31T23:59:59.000Z',
        actionRequired: true,
        actionDeadline: '2026-03-15',
        actionType: 'VERIFY_SERVICE_BOOK',
        actionLinkTab: 'service-book',
        attachments: [
          {
            id: 'ATT-COMM-002-A',
            fileName: 'Pay_Fixation_Order_7thCPC_Verification.pdf',
            fileSize: '520 KB',
            fileType: 'application/pdf',
            downloadName: 'Pay_Fixation_Order_7thCPC_Verification.pdf'
          }
        ],
        senderName: 'Accounts Officer & DDO',
        senderDesignation: 'Finance & Accounts Branch Officer',
        senderDepartment: 'Panchayati Raj & Drinking Water Department',
        senderOffice: 'Panchayati Raj & Drinking Water Department, Government of Odisha, Bhubaneswar',
        readByEmployeeIds: ['EMP100001'],
        createdAt: '2026-02-10T14:15:00.000Z',
        updatedAt: '2026-02-10T14:15:00.000Z'
      },
      {
        id: 'COMM-2026-003',
        referenceNo: 'GA-HRMS-2026/304',
        title: 'Mandatory e-KYC Verification and Aadhaar Seeding in HRMS Profile',
        type: 'NOTIFICATION',
        priority: 'URGENT',
        category: 'HRMS Profile & Service Verification',
        content: `As per the directions of the Centre for Modernizing Government Initiative (CMGI) and General Administration & Public Grievance Department, all State Government employees must verify and validate their personal demographic information, mobile numbers, Aadhaar details, emergency contacts, and family nominee declarations in their HRMS profile.\n\nFailure to complete e-KYC verification may cause temporary interruption in e-Service Book generation, online leave processing, and digital LPC issuance during transfer and joining.`,
        summary: 'Mandatory biometric/OTP e-KYC profile update and nominee declaration for all state employees.',
        targetAudience: 'ALL_EMPLOYEES',
        targetDepartment: 'Panchayati Raj & Drinking Water Department',
        status: 'PUBLISHED',
        publishDate: '2026-02-22T09:00:00.000Z',
        expiryDate: '2026-04-30T23:59:59.000Z',
        actionRequired: true,
        actionDeadline: '2026-03-25',
        actionType: 'UPDATE_PROFILE',
        actionLinkTab: 'profile',
        attachments: [
          {
            id: 'ATT-COMM-003-A',
            fileName: 'eKYC_Instruction_Manual_v2.4.pdf',
            fileSize: '780 KB',
            fileType: 'application/pdf',
            downloadName: 'eKYC_Instruction_Manual_v2.4.pdf'
          }
        ],
        senderName: 'Centre for Modernizing Government Initiative (CMGI)',
        senderDesignation: 'Director of HRMS Modernization',
        senderDepartment: 'General Administration & Public Grievance Department',
        senderOffice: 'Odisha Secretariat, Lok Seva Bhawan, Bhubaneswar',
        readByEmployeeIds: [],
        createdAt: '2026-02-22T09:00:00.000Z',
        updatedAt: '2026-02-22T09:00:00.000Z'
      },
      {
        id: 'COMM-2026-004',
        referenceNo: 'MED-BEN-2026/058',
        title: 'Empanelment of Specialized Hospitals under Odisha State Employee Health Scheme (OSEHS)',
        type: 'POLICY_UPDATE',
        priority: 'NORMAL',
        category: 'Health & Welfare Schemes',
        content: `Health & Family Welfare Department has notified the empanelment of 14 additional super-specialty hospitals and diagnostic centers across Bhubaneswar, Cuttack, Rourkela, Sambalpur, and Berhampur for cashless in-patient treatment and specialized surgeries for State Government employees and their dependent family members.\n\nEligible beneficiaries can avail cashless admissions by presenting their HRMS Employee ID Card and Health Scheme Enrollment Certificate at hospital TPA help desks.`,
        summary: 'Notification of 14 newly empanelled super-specialty hospitals for cashless medical benefits.',
        targetAudience: 'ALL_EMPLOYEES',
        targetDepartment: 'Health & Family Welfare Department',
        status: 'PUBLISHED',
        publishDate: '2026-02-25T11:45:00.000Z',
        expiryDate: '2026-12-31T23:59:59.000Z',
        actionRequired: false,
        attachments: [
          {
            id: 'ATT-COMM-004-A',
            fileName: 'Empanelled_Hospitals_List_2026.pdf',
            fileSize: '1.1 MB',
            fileType: 'application/pdf',
            downloadName: 'Empanelled_Hospitals_List_2026.pdf'
          }
        ],
        senderName: 'Under Secretary to Government',
        senderDesignation: 'State Health Insurance Cell Officer',
        senderDepartment: 'Health & Family Welfare Department',
        senderOffice: 'Government of Odisha, Lok Seva Bhawan',
        readByEmployeeIds: ['EMP100001'],
        createdAt: '2026-02-25T11:45:00.000Z',
        updatedAt: '2026-02-25T11:45:00.000Z'
      }
    ];

    db.communications = seedCommunications;
    saveDatabase();
  }
}


export function saveDatabase(): void {
  try {
    const serialized = JSON.stringify(db, null, 2);
    fs.writeFileSync(DB_FILE, serialized, 'utf-8');
    fs.writeFileSync(DB_BAK, serialized, 'utf-8');
  } catch (e) {
    console.error('Error saving DB:', e);
  }
}

// Initial boot
loadDatabase();

export const getDb = () => db;
