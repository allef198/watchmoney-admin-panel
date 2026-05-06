export const FIRESTORE_COLLECTIONS = {
  withdrawRequests: 'withdrawRequests',
  adminLogs: 'adminLogs',
  users: 'users',
  appConfig: 'appConfig',
  globalNotifications: 'globalNotifications',
};

export const WITHDRAW_REQUEST_FIELDS = {
  uid: 'uid',
  email: 'email',
  fullName: 'fullName',
  pixKey: 'pixKey',
  amountRequested: 'amountRequested',
  pointsRequired: 'pointsRequired',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  reviewedAt: 'reviewedAt',
  reviewedBy: 'reviewedBy',
  rejectionReason: 'rejectionReason',
  paidAt: 'paidAt',
};

export const ADMIN_LOG_FIELDS = {
  action: 'action',
  requestId: 'requestId',
  targetUid: 'targetUid',
  targetEmail: 'targetEmail',
  previousStatus: 'previousStatus',
  newStatus: 'newStatus',
  amountRequested: 'amountRequested',
  pointsRequired: 'pointsRequired',
  reason: 'reason',
  adminUid: 'adminUid',
  adminEmail: 'adminEmail',
  title: 'title',
  createdAt: 'createdAt',
};

export const USER_FIELDS = {
  email: 'email',
  points: 'points',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  blocked: 'blocked',
  blockedAt: 'blockedAt',
  blockedBy: 'blockedBy',
  unblockedAt: 'unblockedAt',
  unblockedBy: 'unblockedBy',
  history: 'history',
};

export const APP_CONFIG_DEFAULTS = {
  withdrawEnabled: true,
  pointsPerReal: 10000,
  minWithdrawAmount: 1,
  maintenanceMode: false,
  globalMessage: '',
};

export function mapWithdrawRequestDoc(docSnap) {
  const data = docSnap.data();
  const fields = WITHDRAW_REQUEST_FIELDS;

  return {
    id: docSnap.id,
    raw: data,
    uid: data[fields.uid] ?? null,
    email: data[fields.email] ?? null,
    fullName: data[fields.fullName] ?? null,
    pixKey: data[fields.pixKey] ?? null,
    amountRequested: data[fields.amountRequested] ?? null,
    pointsRequired: data[fields.pointsRequired] ?? null,
    status: data[fields.status] ?? null,
    createdAt: data[fields.createdAt] ?? null,
    updatedAt: data[fields.updatedAt] ?? null,
    reviewedAt: data[fields.reviewedAt] ?? null,
    reviewedBy: data[fields.reviewedBy] ?? null,
    rejectionReason: data[fields.rejectionReason] ?? null,
    paidAt: data[fields.paidAt] ?? null,
  };
}

export function mapUserDoc(docSnap) {
  const data = docSnap.data();
  const fields = USER_FIELDS;

  return {
    id: docSnap.id,
    uid: docSnap.id,
    raw: data,
    email: data[fields.email] ?? null,
    points: data[fields.points] ?? null,
    createdAt: data[fields.createdAt] ?? null,
    updatedAt: data[fields.updatedAt] ?? null,
    blocked: data[fields.blocked] ?? false,
    blockedAt: data[fields.blockedAt] ?? null,
    blockedBy: data[fields.blockedBy] ?? null,
    unblockedAt: data[fields.unblockedAt] ?? null,
    unblockedBy: data[fields.unblockedBy] ?? null,
    history: data[fields.history] ?? null,
  };
}
