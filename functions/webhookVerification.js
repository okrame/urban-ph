// functions/webhookVerification.js - Updated for Firebase v2
const crypto = require('crypto');
const fetch = require('node-fetch');

/**
 * Verify that the webhook event was sent by PayPal
 * Based on PayPal's verification guidelines: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/
 */
async function verifyWebhook(req, webhookId) {
  try {
    if (!webhookId) {
      console.warn("Missing webhookId for verification");
      return { verified: false, message: "Missing webhookId configuration" };
    }

    // Get webhook event transmission data from HTTP headers
    const transmissionId = req.headers['paypal-transmission-id'];
    const timestamp = req.headers['paypal-transmission-time'];
    const webhookEvent = JSON.stringify(req.body);
    const certUrl = req.headers['paypal-cert-url'];
    const transmissionSignature = req.headers['paypal-transmission-sig'];

    // Verify all required headers exist
    if (!transmissionId || !timestamp || !webhookEvent || !certUrl || !transmissionSignature) {
      console.error("Missing required PayPal headers");
      return { verified: false, message: "Missing required PayPal headers" };
    }

    // Validate cert URL - ensure it's from PayPal
    if (!certUrl.startsWith('https://api.paypal.com/') && 
        !certUrl.startsWith('https://api.sandbox.paypal.com/')) {
      console.error("Invalid certificate URL:", certUrl);
      return { verified: false, message: "Invalid certificate URL" };
    }

    // 1. Get PayPal certificate
    const certResponse = await fetch(certUrl);
    if (!certResponse.ok) {
      console.error("Failed to fetch PayPal certificate:", certResponse.status);
      return { verified: false, message: "Failed to fetch PayPal certificate" };
    }
    
    const cert = await certResponse.text();

    // 2. Form the data string to verify
    const dataToVerify = transmissionId + '|' + timestamp + '|' + webhookId + '|' + sha256(webhookEvent);

    // 3. Verify the signature
    const isVerified = crypto.verify(
      'sha256',
      Buffer.from(dataToVerify),
      { key: cert, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
      Buffer.from(transmissionSignature, 'base64')
    );

    if (isVerified) {
      console.log("Webhook signature verified successfully");
      return { verified: true, message: "Webhook verified" };
    } else {
      console.error("Webhook signature verification failed");
      return { verified: false, message: "Signature verification failed" };
    }
  } catch (error) {
    console.error("Webhook verification error:", error);
    return { verified: false, message: "Verification error: " + error.message };
  }
}

// Helper function to create SHA-256 hash
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = { verifyWebhook };