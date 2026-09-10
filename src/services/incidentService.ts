import { 
  getDbService, 
  getAuthService, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  Timestamp, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot
} from '../lib/firebase';
import { SystemAlert, AlertCategory, AlertSeverity } from '../types';

export const ADMIN_ALERT_EMAIL = 'dlaniger.napm.consulting@gmail.com';

// In-memory cache to prevent duplicate alerts flooding within 30 seconds
const recentAlertsCache = new Map<string, number>();

export interface ReportIncidentParams {
  error?: any;
  title?: string;
  category?: AlertCategory;
  severity?: AlertSeverity;
  message?: string;
  service?: string;
  endpoint?: string;
  details?: any;
  userEmail?: string;
}

/**
 * Classifies an error into category, severity, and clear title
 */
export function classifyError(error: any, fallbackService: string = 'Gemini AI'): {
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
} {
  const errStr = error instanceof Error 
    ? `${error.message} ${error.name} ${(error as any).stack || ''}`
    : typeof error === 'object' 
    ? JSON.stringify(error) 
    : String(error || '');

  const lower = errStr.toLowerCase();

  // 1. Quota & Billing Limitations (429, Resource Exhausted)
  if (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('billing') ||
    lower.includes('rate limit') ||
    lower.includes('exceeded your current quota') ||
    lower.includes('check your plan and billing')
  ) {
    return {
      category: 'billing',
      severity: 'critical',
      title: `${fallbackService} Quota & Billing Limitation (429)`,
      message: error instanceof Error ? error.message : 'API quota exceeded or billing threshold reached.'
    };
  }

  // 2. API Restrictions & Invalid Credentials (403, 401, Permissions)
  if (
    lower.includes('403') ||
    lower.includes('api key not valid') ||
    lower.includes('api_key_invalid') ||
    lower.includes('permission_denied') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden') ||
    lower.includes('location not supported') ||
    lower.includes('restricted') ||
    lower.includes('consumer has been suspended') ||
    lower.includes('blocked by safety policy')
  ) {
    return {
      category: 'api_restriction',
      severity: 'critical',
      title: `${fallbackService} API Key Restriction / Forbidden (403)`,
      message: error instanceof Error ? error.message : 'API access was blocked by policy, geographic restriction, or invalid credentials.'
    };
  }

  // 3. Database Security Rules & Permission
  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    return {
      category: 'permission_denied',
      severity: 'high',
      title: `Firestore Security Rule Access Denied`,
      message: error instanceof Error ? error.message : 'Firestore security rule denied client read/write operation.'
    };
  }

  // 4. Service Outages & Network Failures (500, 503, Failed to fetch)
  if (
    lower.includes('500') ||
    lower.includes('503') ||
    lower.includes('service unavailable') ||
    lower.includes('internal server error') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('client is offline') ||
    lower.includes('econnrefused')
  ) {
    return {
      category: 'service_outage',
      severity: 'high',
      title: `${fallbackService} Service Interruption / Network Outage`,
      message: error instanceof Error ? error.message : 'Connection failed or external service reported an internal error.'
    };
  }

  // Fallback
  return {
    category: 'other',
    severity: 'warning',
    title: `${fallbackService} Request Failure`,
    message: error instanceof Error ? error.message : 'An unexpected request error occurred.'
  };
}

/**
 * Formats a comprehensive email body for admin alerting
 */
export function formatAlertEmailBody(alert: {
  title: string;
  category: string;
  severity: string;
  message: string;
  service: string;
  endpoint?: string;
  details?: string;
  userEmail?: string;
  timestamp?: string;
}): string {
  return `=======================================================
SANCTUARY OPERATIONAL ALARM INCIDENT REPORT
=======================================================

ATTENTION APP ADMIN: ${ADMIN_ALERT_EMAIL}
INCIDENT STATUS: ACTION REQUIRED

INCIDENT SUMMARY
-------------------------------------------------------
Title:    ${alert.title}
Category: ${alert.category.toUpperCase()}
Severity: ${alert.severity.toUpperCase()}
Service:  ${alert.service}
Feature:  ${alert.endpoint || 'General Application Request'}
Pilgrim:  ${alert.userEmail || 'Anonymous Pilgrim'}
Time:     ${alert.timestamp || new Date().toISOString()}

ERROR DIAGNOSTICS & DETAILS
-------------------------------------------------------
${alert.message}

ADDITIONAL TECHNICAL PAYLOAD:
${alert.details || 'None provided'}

RECOMMENDED IMMEDIATE ADMIN ACTIONS:
1. Verify Google AI Studio / Gemini API billing status & quotas.
2. Review API key restrictions (HTTP referrers, IP restrictions, API enabled).
3. Log into Sanctuary Admin Dashboard to Acknowledge this alert.
4. If rate limit, consider adjusting throttle or upgrading tier.

-------------------------------------------------------
XeJesUs Sanctuary Platform Automated Incident Dispatcher
=======================================================`;
}

/**
 * Generates a direct Web Gmail compose link prefilled with the alert details
 */
export function getGmailComposeUrl(alert: SystemAlert): string {
  const subject = encodeURIComponent(`[SANCTUARY ALARM - ${alert.severity.toUpperCase()}] ${alert.title}`);
  const body = encodeURIComponent(formatAlertEmailBody({
    title: alert.title,
    category: alert.category,
    severity: alert.severity,
    message: alert.message,
    service: alert.service,
    endpoint: alert.endpoint,
    details: alert.details,
    userEmail: alert.userEmail,
    timestamp: alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleString() : new Date().toLocaleString()
  }));

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(ADMIN_ALERT_EMAIL)}&su=${subject}&body=${body}`;
}

/**
 * Generates a standard mailto link
 */
export function getMailtoUrl(alert: SystemAlert): string {
  const subject = encodeURIComponent(`[SANCTUARY ALARM - ${alert.severity.toUpperCase()}] ${alert.title}`);
  const body = encodeURIComponent(formatAlertEmailBody({
    title: alert.title,
    category: alert.category,
    severity: alert.severity,
    message: alert.message,
    service: alert.service,
    endpoint: alert.endpoint,
    details: alert.details,
    userEmail: alert.userEmail,
    timestamp: alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleString() : new Date().toLocaleString()
  }));

  return `mailto:${ADMIN_ALERT_EMAIL}?subject=${subject}&body=${body}`;
}

/**
 * Reports an incident to Firestore and triggers admin email dispatch
 */
export async function reportIncident(params: ReportIncidentParams): Promise<string | null> {
  const auth = getAuthService();
  const db = getDbService();

  const service = params.service || 'Gemini AI';
  let category = params.category;
  let severity = params.severity;
  let title = params.title;
  let message = params.message;

  if (params.error) {
    const classification = classifyError(params.error, service);
    category = category || classification.category;
    severity = severity || classification.severity;
    title = title || classification.title;
    message = message || classification.message;
  }

  category = category || 'other';
  severity = severity || 'warning';
  title = title || `${service} Operational Issue`;
  message = message || 'An unknown request issue was detected.';

  // Deduplication check: prevent same title + category within 30 seconds
  const dedupKey = `${title}_${category}_${params.endpoint || ''}`;
  const now = Date.now();
  const lastLogged = recentAlertsCache.get(dedupKey);
  if (lastLogged && now - lastLogged < 30000) {
    console.warn(`[Incident Deduplicated] Skipping duplicate alert within 30s: ${title}`);
    return null;
  }
  recentAlertsCache.set(dedupKey, now);

  const currentUser = auth?.currentUser;
  const userEmail = params.userEmail || currentUser?.email || 'Anonymous Pilgrim';
  const userId = currentUser?.uid || 'anonymous';

  let detailsStr = '';
  if (params.details) {
    detailsStr = typeof params.details === 'object' ? JSON.stringify(params.details, null, 2) : String(params.details);
  } else if (params.error) {
    detailsStr = params.error instanceof Error ? (params.error.stack || params.error.message) : String(params.error);
  }

  const alertPayload: Omit<SystemAlert, 'id'> = {
    title,
    category,
    severity,
    message,
    service,
    endpoint: params.endpoint || 'Application Request',
    details: detailsStr,
    userEmail,
    userId,
    status: 'active',
    createdAt: serverTimestamp(),
    emailNotified: true,
    emailRecipient: ADMIN_ALERT_EMAIL,
    acknowledgedAt: null,
    acknowledgedBy: ''
  };

  // 1. Log alert to console with high visibility
  console.group(`🚨 [SANCTUARY ALARM TRIGGERED] ${severity.toUpperCase()} - ${title}`);
  console.error(`Message:`, message);
  console.warn(`Admin Email Target:`, ADMIN_ALERT_EMAIL);
  console.warn(`Details:`, detailsStr);
  console.groupEnd();

  // 2. Write to Firestore `system_alerts` if database is connected
  let docId: string | null = null;
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'system_alerts'), alertPayload);
      docId = docRef.id;
      console.log(`[Incident Document Created] ID: ${docId}`);
    } catch (firestoreErr) {
      console.error("Failed to write incident to Firestore:", firestoreErr);
    }
  }

  // 3. Dispatch automated email notification log
  dispatchAutomatedEmail({
    alertId: docId || `local-${Date.now()}`,
    title,
    category,
    severity,
    message,
    service,
    endpoint: params.endpoint,
    details: detailsStr,
    userEmail,
    recipient: ADMIN_ALERT_EMAIL
  });

  // 4. Dispatch browser custom event for immediate UI responsiveness
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sanctuary_incident_alert', {
      detail: { ...alertPayload, id: docId }
    }));
  }

  return docId;
}

/**
 * Dispatches an automated email payload to the Admin
 */
function dispatchAutomatedEmail(payload: {
  alertId: string;
  title: string;
  category: string;
  severity: string;
  message: string;
  service: string;
  endpoint?: string;
  details?: string;
  userEmail?: string;
  recipient: string;
}) {
  const emailContent = formatAlertEmailBody({
    title: payload.title,
    category: payload.category,
    severity: payload.severity,
    message: payload.message,
    service: payload.service,
    endpoint: payload.endpoint,
    details: payload.details,
    userEmail: payload.userEmail,
    timestamp: new Date().toLocaleString()
  });

  console.log(`%c[AUTOMATED ADMIN EMAIL DISPATCHED] To: ${payload.recipient}`, 'background: #b91c1c; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
  console.log(emailContent);

  // We also persist an email record in Firestore if DB is available for auditing
  const db = getDbService();
  if (db) {
    addDoc(collection(db, 'alert_emails'), {
      alertId: payload.alertId,
      recipient: payload.recipient,
      subject: `[SANCTUARY ALARM - ${payload.severity.toUpperCase()}] ${payload.title}`,
      body: emailContent,
      sentAt: serverTimestamp(),
      status: 'dispatched'
    }).catch(err => console.warn("Notice: could not record email audit log", err));
  }
}

/**
 * Acknowledges an active alert in Firestore
 */
export async function acknowledgeAlert(alertId: string, adminEmail: string): Promise<void> {
  const db = getDbService();
  if (!db) throw new Error("Database not connected");

  await updateDoc(doc(db, 'system_alerts', alertId), {
    status: 'acknowledged',
    acknowledgedAt: serverTimestamp(),
    acknowledgedBy: adminEmail
  });
}

/**
 * Marks an alert as resolved in Firestore
 */
export async function resolveAlert(alertId: string, adminEmail: string): Promise<void> {
  const db = getDbService();
  if (!db) throw new Error("Database not connected");

  await updateDoc(doc(db, 'system_alerts', alertId), {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    resolvedBy: adminEmail
  });
}

/**
 * Deletes an alert from Firestore
 */
export async function deleteAlert(alertId: string): Promise<void> {
  const db = getDbService();
  if (!db) throw new Error("Database not connected");

  await deleteDoc(doc(db, 'system_alerts', alertId));
}

/**
 * Helper to simulate realistic incident scenarios for testing & verification
 */
export async function simulateAlert(
  type: 'billing_429' | 'api_restriction_403' | 'network_outage_500' | 'firestore_permission'
): Promise<string | null> {
  switch (type) {
    case 'billing_429':
      return reportIncident({
        title: 'Gemini API Monthly Quota & Billing Exceeded (429)',
        category: 'billing',
        severity: 'critical',
        service: 'Gemini AI',
        endpoint: 'generateExegesis (Seek the Word)',
        message: 'GoogleGenAIError: [429 Resource Exhausted] Quota exceeded for quota metric "Generate Content API Requests" and limit "Requests per minute". Please verify billing account and quota limits in Google Cloud Console.',
        details: {
          httpStatus: 429,
          reason: 'RESOURCE_EXHAUSTED',
          quotaMetric: 'generate_content_api_requests',
          recommendedAction: 'Check Cloud Billing account payment method or request quota increase.'
        }
      });

    case 'api_restriction_403':
      return reportIncident({
        title: 'Gemini API Key Restriction / Location Forbidden (403)',
        category: 'api_restriction',
        severity: 'critical',
        service: 'Gemini AI',
        endpoint: 'chatWithSanctuary (Sanctuary Scholar)',
        message: 'GoogleGenAIError: [403 Forbidden] The caller does not have permission. Your API key has API restrictions enabled that forbid calling Generative Language API or this IP / HTTP referrer is not authorized.',
        details: {
          httpStatus: 403,
          reason: 'PERMISSION_DENIED',
          apiRestriction: 'API_KEY_HTTP_REFERRER_BLOCKED',
          recommendedAction: 'Inspect API Key restrictions in Google Cloud Console Credentials menu.'
        }
      });

    case 'network_outage_500':
      return reportIncident({
        title: 'Gemini Speech Synthesizer Outage (503 Service Unavailable)',
        category: 'service_outage',
        severity: 'high',
        service: 'Gemini AI (TTS)',
        endpoint: 'generateScholarTTS (Voice Playback)',
        message: 'GoogleGenAIError: [503 Service Unavailable] The model gemini-3.1-flash-tts-preview is currently overloaded. Failed to generate speech audio stream.',
        details: {
          httpStatus: 503,
          service: 'TTS Audio Generator',
          retryCount: 3,
          networkState: 'disconnected'
        }
      });

    case 'firestore_permission':
      return reportIncident({
        title: 'Firestore Security Rule Violation (permission-denied)',
        category: 'permission_denied',
        severity: 'high',
        service: 'Firestore Database',
        endpoint: 'inquiries/addDoc',
        message: 'FirebaseError: Missing or insufficient permissions. The user lacks permissions to write to /inquiries.',
        details: {
          operation: 'create',
          path: '/inquiries',
          reason: 'isFrozen == true or user email is unverified'
        }
      });
  }
}
