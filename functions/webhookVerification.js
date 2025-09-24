// functions/webhookVerification.js - Enhanced for Production
const crypto = require('crypto');
const fetch = require('node-fetch');

/**
 * Verify that the webhook event was sent by PayPal
 * Enhanced security for production environment
 */
async function verifyWebhook(req, webhookId, isProduction = false) {
  try {
    if (!webhookId) {
      console.error("Missing webhookId for verification");
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
      console.error("Missing required PayPal headers", {
        transmissionId: !!transmissionId,
        timestamp: !!timestamp, 
        webhookEvent: !!webhookEvent,
        certUrl: !!certUrl,
        transmissionSignature: !!transmissionSignature
      });
      return { verified: false, message: "Missing required PayPal headers" };
    }

    // Validation request - accept without verification
    if (req.body && req.body.event_type === "VALIDATION") {
      console.log("Received validation request from PayPal - accepting without verification");
      return { verified: true, message: "Validation request accepted" };
    }

    // Enhanced cert URL validation for production
    const isLiveCert = certUrl.startsWith('https://api.paypal.com/');
    const isSandboxCert = certUrl.startsWith('https://api.sandbox.paypal.com/');
    
    if (!isLiveCert && !isSandboxCert) {
      console.error("Invalid certificate URL:", certUrl);
      return { verified: false, message: "Invalid certificate URL" };
    }

    // In production, only accept live certificates
    if (isProduction && !isLiveCert) {
      console.error("Production environment but received sandbox certificate");
      return { verified: false, message: "Production environment requires live PayPal certificate" };
    }

    // 1. Get PayPal certificate
    try {
      const certResponse = await fetch(certUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'PayPal-Webhook-Verification/1.0'
        }
      });
      
      if (!certResponse.ok) {
        console.error("Failed to fetch PayPal certificate:", certResponse.status);
        return { verified: false, message: "Failed to fetch PayPal certificate" };
      }
      
      const cert = await certResponse.text();

      // Validate certificate format
      if (!cert.includes('-----BEGIN CERTIFICATE-----')) {
        console.error("Invalid certificate format received");
        return { verified: false, message: "Invalid certificate format" };
      }

      // 2. Form the data string to verify
      const dataToVerify = transmissionId + '|' + timestamp + '|' + webhookId + '|' + sha256(webhookEvent);

      // 3. Verify the signature
      try {
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
          
          // PRODUCTION: Be strict about verification failures
          if (isProduction) {
            console.error("Production environment - rejecting unverified webhook");
            return { verified: false, message: "Signature verification failed in production" };
          }
          
          // SANDBOX: Allow with warning (for development only)
          if (isSandboxCert) {
            console.warn("Sandbox environment - proceeding with failed verification (DEVELOPMENT ONLY)");
            return { 
              verified: true, 
              message: "Sandbox webhook accepted with failed verification",
              warning: true 
            };
          }
          
          return { verified: false, message: "Signature verification failed" };
        }
      } catch (cryptoError) {
        console.error("Crypto verification error:", cryptoError);
        return { verified: false, message: "Crypto verification error: " + cryptoError.message };
      }
    } catch (fetchError) {
      console.error("Certificate fetch error:", fetchError);
      return { verified: false, message: "Certificate fetch error: " + fetchError.message };
    }
  } catch (error) {
    console.error("Webhook verification general error:", error);
    return { verified: false, message: "Verification error: " + error.message };
  }
}

// Helper function to create SHA-256 hash
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = { verifyWebhook };