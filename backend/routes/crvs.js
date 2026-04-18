import { Router } from 'express';

const router = Router();

// Mock endpoint for CRVS Birth Notification
// In production, this would communicate with the IPRS API
router.post('/birth-notification', async (req, res) => {
  const { delivery_id, infant_gender, infant_weight_kg, mother_id } = req.body;

  if (!delivery_id || !mother_id) {
    return res.status(400).json({ error: 'Missing required fields for birth notification' });
  }

  // Simulate network delay and processing
  await new Promise(resolve => setTimeout(resolve, 800));

  // Generate a mock CRVS tracking ID
  const crvsTrackingId = `CRVS-BN-${Date.now()}${(Math.random() * 1000).toFixed(0)}`;

  console.log(`[CRVS Mock] Birth Notification received for delivery: ${delivery_id}`);
  console.log(`[CRVS Mock] Issued tracking ID: ${crvsTrackingId}`);

  // Return success
  res.json({
    status: 'success',
    message: 'Birth notification successfully registered with CRVS',
    crvs_tracking_id: crvsTrackingId,
    timestamp: new Date().toISOString()
  });
});

export default router;
