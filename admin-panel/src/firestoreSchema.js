export const FIRESTORE_COLLECTIONS = {
  withdrawRequests: 'withdrawRequests',
  adminLogs: 'adminLogs',
};

export const WITHDRAW_REQUEST_FIELDS = {
  userId: 'userId',
  userEmail: 'userEmail',
  fullName: 'fullName',
  pixKey: 'pixKey',
  amount: 'amount',
  points: 'points',
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
  targetUserId: 'targetUserId',
  targetUserEmail: 'targetUserEmail',
  previousStatus: 'previousStatus',
  newStatus: 'newStatus',
  amount: 'amount',
  points: 'points',
  reason: 'reason',
  adminUid: 'adminUid',
  adminEmail: 'adminEmail',
  createdAt: 'createdAt',
};

export function mapWithdrawRequestDoc(docSnap) {
  const data = docSnap.data();
  const fields = WITHDRAW_REQUEST_FIELDS;

  return {
    id: docSnap.id,
    raw: data,
    userId: data[fields.userId] ?? null,
    userEmail: data[fields.userEmail] ?? null,
    fullName: data[fields.fullName] ?? null,
    pixKey: data[fields.pixKey] ?? null,
    amount: data[fields.amount] ?? null,
    points: data[fields.points] ?? null,
    status: data[fields.status] ?? null,
    createdAt: data[fields.createdAt] ?? null,
    updatedAt: data[fields.updatedAt] ?? null,
    reviewedAt: data[fields.reviewedAt] ?? null,
    reviewedBy: data[fields.reviewedBy] ?? null,
    rejectionReason: data[fields.rejectionReason] ?? null,
    paidAt: data[fields.paidAt] ?? null,
  };
}
