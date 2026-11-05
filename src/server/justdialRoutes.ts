import express, { Request, Response } from 'express';
import { 
  getJustdialConfig, 
  updateJustdialConfig, 
  getJustdialStats, 
  getJustdialLogs, 
  clearJustdialLogs, 
  processJustdialWebhook, 
  simulateTestLead 
} from './justdialService';
import { extractUserFromReq } from './crmRoutes';

export const justdialRouter = express.Router();

/**
 * =========================================================================
 * PUBLIC WEBHOOK INGESTION ENDPOINT
 * POST /api/integrations/justdial/webhook
 * =========================================================================
 * Secured with secret token passed via:
 * - Header: 'x-justdial-token' or 'Authorization: Bearer <token>'
 * - Query: '?token=<token>'
 * - Body: 'token' or 'secret'
 */
justdialRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'Unknown IP';
    const result = await processJustdialWebhook(req.body, req.headers, req.query, ip);
    return res.status(result.status).json(result.body);
  } catch (err: any) {
    console.error('[JustdialWebhook] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error processing Justdial webhook'
    });
  }
});

// Diagnostic GET on webhook endpoint for verification / uptime pings
justdialRouter.get('/webhook', (_req: Request, res: Response) => {
  const stats = getJustdialStats();
  res.json({
    service: 'Royal Epic Interiors - Justdial Webhook Receiver',
    status: 'ACTIVE',
    methodRequired: 'POST',
    integrationStatus: stats.status,
    totalIngested: stats.totalSuccess,
    timestamp: new Date().toISOString()
  });
});

/**
 * =========================================================================
 * ADMIN CRM INTEGRATION MANAGEMENT ENDPOINTS
 * =========================================================================
 */

// GET /api/crm/integrations/justdial/status
justdialRouter.get('/status', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const config = getJustdialConfig(true);
    const stats = getJustdialStats();
    const recentLogs = getJustdialLogs(15);

    // Dynamic webhook URL based on incoming host
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'tele.royalepicinteriors.com';
    const webhookUrl = `${proto}://${host}/api/integrations/justdial/webhook`;

    res.json({
      success: true,
      config,
      stats,
      recentLogs,
      webhookUrl
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching status' });
  }
});

// POST /api/crm/integrations/justdial/config (Update Secret or Active State)
justdialRouter.post('/config', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const { webhookSecret, isActive, autoAssignTelecallerId } = req.body;
    const updated = updateJustdialConfig({
      webhookSecret,
      isActive,
      autoAssignTelecallerId
    });

    res.json({
      success: true,
      message: 'Justdial integration configuration updated successfully.',
      config: getJustdialConfig(true)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error updating config' });
  }
});

// POST /api/crm/integrations/justdial/test (Trigger Simulated Lead)
justdialRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const result = await simulateTestLead();
    res.status(result.status).json({
      success: result.status >= 200 && result.status < 300,
      testResult: result.body,
      stats: getJustdialStats(),
      config: getJustdialConfig(true)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error running test' });
  }
});

// GET /api/crm/integrations/justdial/logs
justdialRouter.get('/logs', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const limit = Number(req.query.limit) || 50;
    const logs = getJustdialLogs(limit);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching logs' });
  }
});

// POST /api/crm/integrations/justdial/logs/clear
justdialRouter.post('/logs/clear', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    clearJustdialLogs();
    res.json({ success: true, message: 'Justdial activity logs cleared.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error clearing logs' });
  }
});
