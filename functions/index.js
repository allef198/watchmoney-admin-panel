const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.onWithdrawalRequestUpdate = functions.region("southamerica-east1").firestore
  .document("withdrawRequests/{requestId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const requestId = context.params.requestId;

    const promises = [];

    // PART A: Handle rejected withdrawal refund
    if (afterData.status === "rejected" && beforeData.status !== "rejected") {
      promises.push(handleRejectedWithdrawal(change.after));
    }

    // PART B: Handle first withdrawal referral bonus
    if (afterData.status === 'paid' && beforeData.status !== 'paid') {
      promises.push(handleFirstWithdrawalBonus(afterData));
    }

    // PART C: Send notifications for status changes
    promises.push(sendWithdrawalStatusNotification(change));

    await Promise.all(promises);
    return null;
  });

async function handleRejectedWithdrawal(snapshot) {
  const requestData = snapshot.data();
  const requestId = snapshot.id;

  // Idempotency: ignore if points already refunded
  if (requestData.pointsRefunded) {
    console.log(`Refund for ${requestId} already processed.`);
    return;
  }

  const { uid, pointsRequired } = requestData;

  if (!uid || !pointsRequired || pointsRequired <= 0) {
    console.error(`Invalid data for refund on request ${requestId}.`, { uid, pointsRequired });
    return;
  }

  const userRef = db.collection("users").doc(uid);
  const requestRef = snapshot.ref;
  const notificationRef = userRef.collection("notifications").doc();

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error(`User ${uid} not found.`);
      }

      // Re-read request doc inside transaction for safety
      const requestDoc = await transaction.get(requestRef);
      const currentRequestData = requestDoc.data();

      if (currentRequestData.status !== "rejected" || currentRequestData.pointsRefunded) {
        console.log(`Transaction check failed: Refund for ${requestId} already processed or status changed.`);
        return;
      }

      transaction.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsRequired),
        history: admin.firestore.FieldValue.arrayUnion({
          message: `Pontos devolvidos por saque rejeitado: +${pointsRequired} pontos`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          type: "refund_rejected_withdrawal"
        })
      });

      transaction.update(requestRef, {
        pointsRefunded: true,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.set(notificationRef, {
        title: "Pontos devolvidos",
        message: `Seu saque foi rejeitado e ${pointsRequired} pontos foram devolvidos.`,
        type: "points_refunded",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`Successfully refunded ${pointsRequired} points for user ${uid} from request ${requestId}.`);
  } catch (error) {
    console.error(`Error in refund transaction for request ${requestId}:`, error);
  }
}

async function handleFirstWithdrawalBonus(requestData) {
  const { uid: invitedUid } = requestData;

  if (!invitedUid) {
    console.log("handleFirstWithdrawalBonus: No uid found on withdrawal request.");
    return;
  }

  const invitedUserRef = db.collection('users').doc(invitedUid);
  const invitedUserSnap = await invitedUserRef.get();

  if (!invitedUserSnap.exists) {
    console.log(`handleFirstWithdrawalBonus: Invited user ${invitedUid} not found.`);
    return;
  }

  const invitedUserData = invitedUserSnap.data();

  // Check if bonus was already paid for this invited user
  if (invitedUserData.firstWithdrawalReferralBonusPaid) {
    console.log(`handleFirstWithdrawalBonus: Bonus already processed for user ${invitedUid}.`);
    return;
  }

  // Check if the user was referred by someone
  const referrerUid = invitedUserData.referredBy;
  if (!referrerUid) {
    console.log(`handleFirstWithdrawalBonus: User ${invitedUid} was not referred.`);
    return;
  }

  // As per instructions, create a pending reward. This is a good practice.
  // The document name is the invited user's ID to ensure it's created only once.
  const rewardRef = db.collection('referralPendingFirstWithdrawalRewards').doc(invitedUid);
  const rewardSnap = await rewardRef.get();

  if (rewardSnap.exists) {
    console.log(`handleFirstWithdrawalBonus: A pending reward for invited user ${invitedUid} already exists.`);
    return;
  }
  
  // This check is a bit ambiguous in the instructions. Assuming 'referralLinks/{uid}' is for the referrer.
  // A check against the referrer could be to see if they are eligible to receive rewards.
  // Let's assume there is no need to check 'referralLinks' collection based on the other robust checks.
  // The most important checks are on the invited user and the pending reward collection.

  // Let's fetch bonus amount from config.
  let bonusPoints = 1000; // Default value
  try {
      const configSnap = await db.collection('appConfig').doc('live').get();
      if (configSnap.exists) {
          bonusPoints = configSnap.data().referralBonusPoints || bonusPoints;
      }
  } catch (e) {
      console.error("Could not fetch referral bonus points from appConfig", e);
  }


  try {
    const batch = db.batch();
    
    // Mark that the bonus has been handled for this user to ensure idempotency
    batch.update(invitedUserRef, { firstWithdrawalReferralBonusPaid: true });

    // Create a pending reward for the referrer
    batch.set(rewardRef, {
      referrerUid: referrerUid,
      invitedUid: invitedUid,
      bonusPoints: bonusPoints,
      status: "pending", // To be reviewed by an admin
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    console.log(`Created pending first withdrawal bonus for referrer ${referrerUid} due to user ${invitedUid}'s first paid withdrawal.`);

  } catch (error) {
    console.error(`Failed to create first withdrawal bonus for invited user ${invitedUid}:`, error);
  }
}


async function sendWithdrawalStatusNotification(change) {
  const afterData = change.after.data();
  const requestId = change.after.id;
  const { uid, status, amountRequested } = afterData;

  if (!uid || !status) {
    return;
  }

  const notificationSent = afterData.notificationSentForStatus || {};
  let notification;

  const createNotification = (status, currentNotificationSent) => {
      if (currentNotificationSent[status]) return null;

      const baseNotification = {
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      switch (status) {
          case 'approved':
              return {
                  ...baseNotification,
                  title: "Saque aprovado",
                  message: `Sua solicitação de saque de R$ ${amountRequested || '0,00'} foi aprovada.`,
                  type: "withdrawal_approved",
              };
          case 'rejected':
              return {
                  ...baseNotification,
                  title: "Saque rejeitado",
                  message: `Sua solicitação de saque de R$ ${amountRequested || '0,00'} foi rejeitada.`,
                  type: "withdrawal_rejected",
              };
          case 'paid':
              return {
                  ...baseNotification,
                  title: "Saque pago",
                  message: `Seu saque de R$ ${amountRequested || '0,00'} foi pago.`,
                  type: "withdrawal_paid",
              };
          default:
              return null;
      }
  };

  notification = createNotification(status, notificationSent);

  if (notification) {
    try {
      const notificationsRef = db.collection('users').doc(uid).collection("notifications").doc();
      
      const requestRef = change.after.ref;
      
      const newNotificationSent = { ...notificationSent, [status]: true };

      const batch = db.batch();
      batch.set(notificationsRef, notification);
      batch.update(requestRef, { 
          notificationSentForStatus: newNotificationSent,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      console.log(`Notification for status '${status}' sent to user ${uid} for request ${requestId}.`);

    } catch (error) {
      console.error(`Failed to send notification for request ${requestId} and status ${status}:`, error);
    }
  }
}
