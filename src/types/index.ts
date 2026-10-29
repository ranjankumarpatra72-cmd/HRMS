export type UserRole =
  | 'EMPLOYEE'
  | 'REPORTING_OFFICER'
  | 'ESTABLISHMENT_OFFICER'
  | 'DDO'
  | 'DISTRICT_ADMIN'
  | 'DEPT_ADMIN'
  | 'SUPER_ADMIN';

export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';

export type TransferStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_DDO_REVIEW'
  | 'FORWARDED_TO_COLLECTOR'
  | 'PENDING_APPROVAL'
  | 'COLLECTOR_APPROVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED_FOR_CORRECTION'
  | 'CANCELLED'
  | 'ORDER_ISSUED'
  | 'RELIEVED'
  | 'JOINED';

export interface TransferTimelineItem {
  id: string;
  action: string;
  date: string;
  time: string;
  user: string;
  role: string;
  remarks?: string;
  status: string;
}

export type GrievanceStatus = 'SUBMITTED' | 'ASSIGNED' | 'UNDER_PROCESS' | 'RESOLVED' | 'REJECTED';

export interface User {
  id: string;
  employeeId: string;
  username: string;
  role: UserRole;
  name: string;
  designation: string;
  department: string;
  office: string;
  district: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEACTIVATED' | 'LOCKED';
}

export interface Employee {
  id: string;
  employeeId: string;
  employeeCode?: string;
  name: string;
  employeeName?: string;
  fatherName: string;
  motherName: string;
  dob: string;
  dateOfBirth?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  mobile: string;
  mobileNumber?: string;
  email: string;
  designation: string;
  cadre: string;
  department: string;
  office: string;
  district: string;
  districtId?: string;
  block: string;
  blockId?: string;
  gp?: string;
  gramPanchayat?: string;
  gpId?: string;
  village?: string;
  villageId?: string;
  dateOfJoining: string;
  joiningDate?: string;
  employmentType: 'PERMANENT' | 'CONTRACTUAL' | 'PROBATION';
  currentPosting: string;
  postingPlace?: string;
  postingStation?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEACTIVATED' | 'SUSPENDED' | 'RETIRED';
  employeeStatus?: string;
  panNumber: string;
  gpfNpsNo: string;
  payLevel: string;
  basicPay: number;
  reportingOfficerId: string;
  reportingOfficerName: string;
  ddoId: string;
  createdByDDO?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DatabaseBackupInfo {
  filename: string;
  filepath: string;
  timestamp: string;
  sizeBytes: number;
  sizeFormatted: string;
  totalEmployees: number;
  totalUsers: number;
  label?: string;
}

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
  grade: string;
}

export interface PostingHistoryItem {
  office: string;
  district: string;
  designation: string;
  startDate: string;
  endDate: string;
  orderNo: string;
}

export interface PromotionHistoryItem {
  oldDesignation: string;
  newDesignation: string;
  orderNumber: string;
  effectiveDate: string;
  payLevel: string;
}

export interface IncrementHistoryItem {
  currentBasic: number;
  incrementAmount: number;
  revisedBasic: number;
  effectiveDate: string;
  orderRef: string;
}

export interface ServiceBookIdentityDoc {
  type: string;
  number: string;
  placeOfIssue?: string;
  dateOfIssue?: string;
  dateOfExpiry?: string;
}

export interface ServiceBookFamilyMember {
  relationType: string;
  name: string;
  isAlive: boolean | string;
  dob?: string;
  maritalStatus?: string;
  age?: number | string;
}

export interface ServiceBookNominee {
  relationType: string;
  name: string;
  isAlive: boolean | string;
  dob?: string;
  maritalStatus?: string;
  age?: number | string;
  sharePercent?: number;
}

export interface ServiceBookOfficialEntry {
  id?: string;
  entryType: 'TRANSFER & POSTING' | 'RELIEVE' | 'JOINING' | 'SUSPENSION' | 'INCREMENT' | 'PROMOTION' | 'LEAVE' | 'OTHER';
  postCadreScale?: string;
  pay?: string;
  wef?: string;
  entryText: string;
  noteText?: string;
  entryDate?: string;
  orderNumber?: string;
  orderDate?: string;
}

export interface ServiceBookEarnedLeaveRow {
  periodFrom: string;
  periodTo: string;
  completedMonths: number;
  leaveCreditDays: number;
  eolAvailed: number;
  elDeducted: number;
  balanceReturnFromLeave: number;
  availedFrom?: string;
  availedTo?: string;
  availedTotal: number;
  balanceLeave: number;
}

export interface ServiceBook {
  employeeId: string;
  employeeName?: string;
  photoUrl?: string;
  pranNo?: string;
  gpfNo?: string;
  gisNo?: string;
  dobWords?: string;
  dateOfEntryGovtService?: string;
  dateOfEntryGovtServiceWords?: string;
  dateOfEntryServiceBookCreated?: string;
  dateOfEntryServiceBookCreatedWords?: string;
  initialJoiningOffice?: string;
  initialJoiningPost?: string;
  declarationOfHomeTown?: string;
  category?: string;
  cellPhone?: string;
  identityDocuments?: ServiceBookIdentityDoc[];
  familyMembers?: ServiceBookFamilyMember[];
  nomineesTable?: ServiceBookNominee[];
  isReservationCategory?: boolean | string;
  reservationCategoryName?: string;
  isRehabilitationScheme?: boolean | string;
  officialEntries?: ServiceBookOfficialEntry[];
  earnedLeaveAccount?: ServiceBookEarnedLeaveRow[];
  personalDetails: {
    bloodGroup: string;
    heightCm: number;
    identificationMark: string;
    permanentAddress: string;
    maritalStatus: string;
    fatherName?: string;
    fatherResidence?: string;
  };
  qualifications: Qualification[];
  postingHistory: PostingHistoryItem[];
  promotionHistory: PromotionHistoryItem[];
  incrementHistory: IncrementHistoryItem[];
  trainingHistory: {
    title: string;
    institute: string;
    fromDate: string;
    toDate: string;
  }[];
  nominations: {
    type: 'NPS' | 'GRATUITY' | 'GIS';
    nomineeName: string;
    relation: string;
    sharePercent: number;
  }[];
  retirementDetails: {
    superannuationDate: string;
    pensionType: string;
  };
}

export interface LeaveTypeBalance {
  leaveType: 'CASUAL' | 'EARNED' | 'MEDICAL' | 'MATERNITY' | 'PATERNITY' | 'SPECIAL';
  openingBalance: number;
  used: number;
  pending: number;
  available: number;
}

export interface LeaveRequest {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  leaveType: 'CASUAL' | 'EARNED' | 'MEDICAL' | 'MATERNITY' | 'PATERNITY' | 'SPECIAL';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  addressDuringLeave: string;
  documentUrl?: string;
  status: RequestStatus;
  reportingOfficerId: string;
  reportingOfficerName: string;
  officerRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  payLevel: string;
  basicPay: number;
  da: number;
  hra: number;
  medicalAllowance: number;
  specialAllowance: number;
  grossSalary: number;
  npsContribution: number;
  professionalTax: number;
  incomeTax: number;
  loanRecovery: number;
  gis: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: 'PAID' | 'PROCESSING' | 'HOLD';
  paymentDate: string;
}

export interface Loan {
  id: string;
  employeeId: string;
  loanType: 'HOUSE_BUILDING' | 'COMPUTER' | 'FESTIVAL' | 'PERSONAL';
  sanctionNo: string;
  sanctionDate: string;
  originalAmount: number;
  monthlyInstallment: number;
  recoveredAmount: number;
  outstandingAmount: number;
  status: 'ACTIVE' | 'CLOSED' | 'PENDING';
}

export type TransferDocumentType =
  | 'Approval Order'
  | 'Transfer Order'
  | 'Relieving Order'
  | 'Joining Order'
  | 'Other Supporting Document';

export type TransferDocumentStatus = 'Available' | 'Uploaded' | 'Replaced' | 'Archived' | 'Not Available Yet';

export interface TransferDocument {
  id: string; // document_id
  transferId: string;
  employeeId: string;
  documentType: TransferDocumentType;
  documentTitle: string;
  fileName: string;
  filePath?: string;
  fileData?: string; // base64 encoded PDF string if uploaded or generated
  fileSize: string;
  mimeType: string;
  orderNumber?: string;
  orderDate?: string;
  uploadedBy: string;
  uploaderRole: string;
  uploadedAt: string;
  documentStatus: TransferDocumentStatus;
  remarks?: string;
  version: number;
  isCurrentVersion: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransferType =
  | 'General Request'
  | 'Mutual Transfer'
  | 'Medical Grounds'
  | 'Spouse Grounds'
  | 'Compassionate Grounds'
  | 'Administrative Grounds'
  | 'Home District Preference';

export interface TransferApprovalStage {
  stageNumber: number;
  stageName: string;
  authorityRole: string;
  authorityName: string;
  status: 'COMPLETED' | 'PENDING' | 'CURRENT' | 'REJECTED' | 'RETURNED' | 'CANCELLED';
  actionDate?: string;
  actionTime?: string;
  remarks?: string;
}

export interface TransferHistoryRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  designation?: string;
  previousOffice: string;
  previousDistrict: string;
  previousBlock?: string;
  newOffice: string;
  newDistrict: string;
  newBlock?: string;
  transferDate: string;
  transferOrderNumber: string;
  transferStatus: string;
  transferAuthority: string;
  orderDate?: string;
  remarks?: string;
  transferType?: string;
  relievingDate?: string;
  joiningDate?: string;
}

export interface TransferRecord {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  designation?: string;
  department?: string;
  currentOffice: string;
  currentDistrict: string;
  currentBlock?: string;
  currentPosting?: string;
  transferType?: TransferType | string;
  state: string;
  preferredOffice?: string;
  preferredDistrict: string;
  preferredBlock: string;
  reason: string;
  documentUrl?: string;
  supportingDocumentName?: string;
  employeeRemarks?: string;
  submissionDate?: string;
  orderNumber?: string;
  orderDate?: string;
  joiningDate?: string;
  transferAuthority?: string;
  status: TransferStatus;
  currentStage?: string;
  processedBy?: string;
  remarks?: string;
  rejectionReason?: string;
  correctionRemarks?: string;
  cancelledDate?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt?: string;
  timeline?: TransferTimelineItem[];
  approvalStages?: TransferApprovalStage[];
  documents?: TransferDocument[];
}

export interface LPCRecord {
  id: string;
  lpcNumber: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  previousOffice: string;
  newOffice: string;
  relievingDate: string;
  lastSalaryMonth: string;
  basicPay: number;
  allowances: number;
  deductions: number;
  recoveries: number;
  pendingDues: number;
  status: 'DRAFT' | 'FORWARDED' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
}

export interface JoiningReport {
  id: string;
  reportNumber: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  postingOrderNumber: string;
  postingOrderDate: string;
  placeOfPosting: string;
  joiningDate: string;
  joiningTime: 'FORENOON' | 'AFTERNOON';
  remarks: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'ACCEPTED' | 'RETURNED';
  acceptedBy?: string;
  createdAt: string;
}

export interface EParReport {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  period: string; // e.g. "2025-2026"
  reportingOfficerName: string;
  reviewingOfficerName: string;
  acceptingAuthorityName: string;
  selfAppraisal: string;
  performanceRating?: 'OUTSTANDING' | 'VERY_GOOD' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE';
  reportingRemarks?: string;
  reviewingRemarks?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REPORTED' | 'REVIEWED' | 'ACCEPTED';
  createdAt: string;
}

export interface Grievance {
  id: string;
  grievanceNumber: string;
  employeeId: string;
  employeeName: string;
  category: 'PAY_ANOMALY' | 'SERVICE_BOOK' | 'TRANSFER' | 'PROMOTION' | 'LEAVE' | 'OTHER';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  attachmentUrl?: string;
  status: GrievanceStatus;
  resolutionRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  type: 'LEAVE' | 'SALARY' | 'TRANSFER' | 'LPC' | 'JOINING' | 'EPAR' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface CorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  fieldName: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  action: string;
  module: string;
  recordId: string;
  timestamp: string;
  ipAddress: string;
  details: string;
}

export interface StateMaster {
  id: string;
  code: string;
  name: string;
}

export interface DistrictMaster {
  id: string;
  code: string;
  name: string;
  headquarter: string;
  stateId: string;
}

export interface BlockMaster {
  id: string;
  code: string;
  districtId: string;
  name: string;
}

export interface GramPanchayatMaster {
  id: string;
  code: string;
  blockId: string;
  name: string;
}

export interface VillageMaster {
  id: string;
  code: string;
  gpId: string;
  name: string;
  pincode?: string;
}

export interface OfficeMaster {
  id: string;
  code: string;
  name: string;
  department: string;
  state: string;
  districtId: string;
  districtName: string;
  blockId: string;
  blockName: string;
  gpId: string;
  gpName: string;
  villageId: string;
  villageName: string;
  pincode?: string;
}

export interface LocationSelection {
  state: string;
  districtId: string;
  districtName: string;
  blockId: string;
  blockName: string;
  gpId: string;
  gpName: string;
  villageId: string;
  villageName: string;
}

export type CommunicationType = 'CIRCULAR' | 'OFFICE_ORDER' | 'NOTIFICATION' | 'INTIMATION' | 'POLICY_UPDATE' | 'ADVISORY' | 'MEMO';
export type CommunicationPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'ROUTINE';
export type CommunicationStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
export type CommunicationAudience = 'ALL_EMPLOYEES' | 'DEPARTMENT' | 'OFFICE' | 'DESIGNATION' | 'INDIVIDUAL';

export interface TargetEmployeeSummary {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  office?: string;
}

export interface CommunicationAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileUrl?: string;
  fileData?: string; // base64 data url for viewing/downloading real PDF
  downloadName?: string;
  uploadedAt?: string;
}

export interface CommunicationItem {
  id: string;
  referenceNo: string;
  title: string;
  type: CommunicationType;
  priority: CommunicationPriority;
  category: string;
  content: string;
  summary?: string;
  targetAudience: CommunicationAudience;
  targetDepartment?: string;
  targetOffice?: string;
  targetDesignation?: string;
  targetEmployeeIds?: string[];
  targetEmployees?: TargetEmployeeSummary[];
  status: CommunicationStatus;
  publishDate: string;
  expiryDate?: string;
  actionRequired?: boolean;
  actionDeadline?: string;
  actionType?: string;
  actionLinkTab?: string;
  attachments: CommunicationAttachment[];
  senderId?: string;
  senderName: string;
  senderDesignation: string;
  senderDepartment: string;
  senderOffice: string;
  readByEmployeeIds: string[];
  isRead?: boolean;
  createdAt: string;
  updatedAt: string;
}


