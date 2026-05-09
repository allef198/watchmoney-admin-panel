package com.allef198.watchmoney

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.ktx.toObject
import kotlinx.coroutines.tasks.await
import java.util.Date

class UserRepository {

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    data class WithdrawalRequest(
        val id: String = "",
        val uid: String = "",
        val amountRequested: Double = 0.0,
        val pointsRequired: Int = 0,
        val status: String = "pending",
        val createdAt: Date? = null,
        // ... other fields that might be here
    )

    data class User(
        val uid: String = "",
        val email: String? = null,
        // ... other fields
    )

    suspend fun loadWithdrawalRequests(uid: String): List<WithdrawalRequest> {
        if (uid.isBlank()) return emptyList()

        try {
            val snapshot = db.collection("withdrawRequests")
                .whereEqualTo("uid", uid)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()

            return snapshot.documents.mapNotNull { doc ->
                doc.toObject<WithdrawalRequest>()?.copy(id = doc.id)
            }

            /*
            // PART D & E: Logic removed from the client application
            // The client should not be responsible for business logic such as refunds and notifications.
            // This will now be handled by Cloud Functions for security and reliability.
            
            val user = getCurrentUser() // Assuming you have a method to get the current user details

            val requestsToRefund = snapshot.documents.mapNotNull { doc ->
                doc.toObject<WithdrawalRequest>()?.copy(id = doc.id)
            }.filter { it.status == "rejected" && !it.pointsRefunded }

            for (request in requestsToRefund) {
                // This is now handled by a Cloud Function
                // refundRejectedWithdrawal(request.id)
            }
            
            for (request in allRequests) {
                 // This is now handled by a Cloud Function
                // checkAndCreateWithdrawalNotification(user.uid, request)
            }
            */

        } catch (e: Exception) {
            // Handle error
            println("Error loading withdrawal requests: ${e.message}")
            return emptyList()
        }
    }

    /*
    // PART D: This function is no longer needed on the client-side.
    // It's now implemented in a Cloud Function to ensure secure and reliable point refunds.
    private suspend fun refundRejectedWithdrawal(requestId: String): Boolean {
        // This function would have complex logic to refund points to a user.
        // It is inherently insecure on the client because a user could potentially manipulate it.
        // By moving this to a Cloud Function, we run it in a trusted server environment.
        return false // Returning false as it's a no-op now.
    }
    */

    /*
    // PART E: This function is no longer needed on the client-side.
    // Withdrawal status notifications are now created by a Cloud Function.
    // This prevents duplicate notifications and ensures they are sent reliably.
    private suspend fun checkAndCreateWithdrawalNotification(uid: String, request: WithdrawalRequest) {
        // This function would check if a notification for a given status (e.g., approved, rejected)
        // has already been sent, and if not, create a new notification in Firestore.
        // This logic is now centralized in our onWithdrawalRequestUpdate Cloud Function.
    }
    */

    // A helper function to get the current user, assumed to exist.
    private fun getCurrentUser(): User? {
        val firebaseUser = auth.currentUser
        return firebaseUser?.let {
            User(uid = it.uid, email = it.email)
        }
    }
}
