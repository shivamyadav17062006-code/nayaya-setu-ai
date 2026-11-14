/**
 * NyayaSaathi — Personalized Know Your Rights Discovery Controller
 */

import { rightsDiscoveryService } from '../services/rightsDiscoveryService.js';

export async function getDiscoveryMetadata(req, res, next) {
  try {
    const data = await rightsDiscoveryService.getDiscoveryMetadata();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function classifySituationAndFollowUps(req, res, next) {
  try {
    const { situation = '', context = {} } = req.body;
    if (!situation || situation.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a description of at least 5 characters.',
      });
    }

    const result = rightsDiscoveryService.classifyAndGenerateFollowUps(situation, context);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function discoverRights(req, res, next) {
  try {
    const result = await rightsDiscoveryService.discoverRights(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSavedSession(req, res, next) {
  try {
    const { token } = req.params;
    const session = await rightsDiscoveryService.getSession(token);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or expired.' });
    }
    return res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function deleteSavedSession(req, res, next) {
  try {
    const { token } = req.params;
    const deleted = await rightsDiscoveryService.deleteSession(token);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    return res.json({ success: true, message: 'Saved session data successfully purged.' });
  } catch (err) {
    next(err);
  }
}
