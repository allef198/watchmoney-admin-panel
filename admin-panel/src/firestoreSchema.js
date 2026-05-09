export const FIRESTORE_COLLECTIONS = {
  withdrawRequests: 'withdrawRequests',
  adminLogs: 'adminLogs',
  users: 'users',
  appConfig: 'appConfig',
  globalNotifications: 'globalNotifications',
  referralPendingFirstWithdrawalRewards: 'referralPendingFirstWithdrawalRewards'
};

export const APP_CONFIG_FIELDS = {
  withdrawEnabled: 'withdrawEnabled',
  pointsPerReal: 'pointsPerReal',
  minWithdrawAmount: 'minWithdrawAmount',
  withdrawDisabledMessage: 'withdrawDisabledMessage',
  maintenanceMode: 'maintenanceMode',
  maintenanceMessage: 'maintenanceMessage',
  globalMessage: 'globalMessage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  updatedBy: 'updatedBy',
};

export const GLOBAL_NOTIFICATION_FIELDS = {
  title: 'title',
  message: 'message',
  active: 'active',
  priority: 'priority',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy',
};

export const ADMIN_LOG_FIELDS = {
  action: 'action',
  adminUid: 'adminUid',
  adminEmail: 'adminEmail',
  createdAt: 'createdAt',
  targetId: 'targetId',
  previousValue: 'previousValue',
  newValue: 'newValue',
  // Legacy fields for compatibility
  requestId: 'requestId',
  targetUid: 'targetUid',
  targetEmail: 'targetEmail',
  previousStatus: 'previousStatus',
  newStatus: 'newStatus',
  amountRequested: 'amountRequested',
  pointsRequired: 'pointsRequired',
  reason: 'reason',
  title: 'title',
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
  referralCode: 'referralCode',
  referredBy: 'referredBy',
  firstWithdrawalReferralBonusPaid: 'firstWithdrawalReferralBonusPaid'
};

export const REFERRAL_BONUS_FIELDS = {
    referrerUid: 'referrerUid',
    invitedUid: 'invitedUid',
    bonusPoints: 'bonusPoints',
    status: 'status',
    createdAt: 'createdAt'
};

export const APP_CONFIG_DEFAULTS = {
  [APP_CONFIG_FIELDS.withdrawEnabled]: true,
  [APP_CONFIG_FIELDS.pointsPerReal]: 10000,
  [APP_CONFIG_FIELDS.minWithdrawAmount]: 1,
  [APP_CONFIG_FIELDS.withdrawDisabledMessage]: 'Os saques estão temporariamente desativados. Tente novamente mais tarde.',
  [APP_CONFIG_FIELDS.maintenanceMode]: false,
  [APP_CONFIG_FIELDS.maintenanceMessage]: 'O aplicativo está em manutenção. Tente novamente mais tarde.',
  [APP_CONFIG_FIELDS.globalMessage]: '', // Legacy field
};

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
    referralCode: data[fields.referralCode] ?? null,
    referredBy: data[fields.referredBy] ?? null,
    firstWithdrawalReferralBonusPaid: data[fields.firstWithdrawalReferralBonusPaid] ?? false
  };
}

export function mapReferralBonusDoc(docSnap) {
    const data = docSnap.data();
    const fields = REFERRAL_BONUS_FIELDS;
    return {
        id: docSnap.id,
        raw: data,
        referrerUid: data[fields.referrerUid] ?? null,
        invitedUid: data[fields.invitedUid] ?? null,
        bonusPoints: data[fields.bonusPoints] ?? null,
        status: data[fields.status] ?? null,
        createdAt: data[fields.createdAt] ?? null
    };
}

export function mapGlobalNoticeDoc(docSnap) {
  const data = docSnap.data();
  const fields = GLOBAL_NOTIFICATION_FIELDS;
  return {
    id: docSnap.id,
    raw: data,
    title: data[fields.title] ?? '',
    message: data[fields.message] ?? '',
    active: data[fields.active] ?? false,
    priority: data[fields.priority] ?? 0,
    createdAt: data[fields.createdAt] ?? null,
    updatedAt: data[fields.updatedAt] ?? null,
    createdBy: data[fields.createdBy] ?? null,
    updatedBy: data[fields.updatedBy] ?? null,
  };
}

export function mapAdminLogDoc(docSnap) {
  const data = docSnap.data();
  const fields = ADMIN_LOG_FIELDS;
  return {
    id: docSnap.id,
    raw: data,
    action: data[fields.action] ?? 'unknown',
    adminUid: data[fields.adminUid] ?? null,
    adminEmail: data[fields.adminEmail] ?? null,
    createdAt: data[fields.createdAt] ?? null,
    targetId: data[fields.targetId] ?? null,
    // Legacy fields for full data visibility
    requestId: data[fields.requestId] ?? null,
    targetUid: data[fields.targetUid] ?? null,
    reason: data[fields.reason] ?? null,
    previousValue: data[fields.previousValue] ?? null,
    newValue: data[fields.newValue] ?? null
  };
}

// Legacy mapping function for compatibility
export function mapWithdrawRequestDoc(docSnap) {
  const data = docSnap.data();
  return { id: docSnap.id, raw: data, ...data };
}
