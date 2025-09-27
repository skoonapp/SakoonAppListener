/**
 * Payment processing functions using Cashfree.
 * - cashfreeWebhook: Handles status updates from Cashfree after a payment.
 */
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Ensure Firebase Admin is initialized.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Webhook to handle payment status updates from Cashfree.
 */
export const cashfreeWebhook = functions.region("asia-south1").https.onRequest(async (req, res) => {
  try {
    const webhookData = req.body;
    functions.logger.info("Received Cashfree Webhook:", webhookData);

    // --- TODO: Add signature verification for production ---
    // This step is critical to ensure the webhook is genuinely from Cashfree.
    // const signature = req.headers["x-webhook-signature"];
    // const timestamp = req.headers["x-webhook-timestamp"];
    // ... verification logic ...

    const order = webhookData.data.order;
    const orderId = order.order_id;
    const orderStatus = order.order_status;
    const uid = order.customer_details.customer_id;

    const rechargeRef = db.collection("users").doc(uid).collection("recharges").doc(orderId);
    const userRef = db.collection("users").doc(uid);

    await db.runTransaction(async (transaction) => {
      const rechargeDoc = await transaction.get(rechargeRef);
      if (!rechargeDoc.exists || rechargeDoc.data()?.status !== "PENDING") {
        functions.logger.warn(`Webhook for already processed or non-existent order ${orderId}`);
        return;
      }

      if (orderStatus === "PAID") {
        const amount = order.order_amount;

        // Update recharge status
        transaction.update(rechargeRef, {
          status: "SUCCESS",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          cashfreePaymentId: webhookData.data.payment.cf_payment_id,
        });

        // Add balance to user's wallet
        transaction.update(userRef, {
          balance: admin.firestore.FieldValue.increment(amount),
        });

        functions.logger.info(`Successfully processed payment for order ${orderId}. Added ${amount} to user ${uid}'s balance.`);
      } else if (["ERROR", "EXPIRED", "CANCELLED"].includes(orderStatus)) {
        // Handle failed payment
        transaction.update(rechargeRef, {
          status: "FAILED",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          failureReason: webhookData.data.error_details?.error_description || "Payment failed or was cancelled.",
        });
        functions.logger.warn(`Payment failed for order ${orderId}. Status: ${orderStatus}`);
      }
    });

    res.status(200).send("Webhook received successfully.");
  } catch (error) {
    functions.logger.error("Error processing Cashfree webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});
