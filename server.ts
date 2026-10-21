import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { BASE_RATES_USD } from './src/utils/currency.ts';
import { calculateDrMetrics } from './src/utils/disasterRecovery.ts';
import { generateIcsFeed } from './src/utils/calendar.ts';
import { INITIAL_LISTINGS } from './src/data/mockData.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '35mb' }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Dynamic simulated audit logs & system events
const auditLogs: Array<{ id: string; timestamp: string; action: string; actor: string; region: string; status: 'SUCCESS' | 'WARNING' | 'CRITICAL'; details: string }> = [
  { id: 'log-101', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), action: 'KMS_KEY_ROTATION', actor: 'system-kms-daemon', region: 'us-east1', status: 'SUCCESS', details: 'Automated AES-256-GCM envelope encryption key rotation verified.' },
  { id: 'log-102', timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(), action: 'CROSS_REGION_DB_SYNC', actor: 'crdb-raft-leader', region: 'asia-northeast1', status: 'SUCCESS', details: 'Semi-synchronous Raft replication lag: 18ms across Tokyo & US nodes.' },
  { id: 'log-103', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), action: 'SOC2_RBAC_CHALLENGE', actor: 'security-policy-engine', region: 'europe-west1', status: 'SUCCESS', details: 'Granular access control policy audit passed for vendor tenant isolation.' },
  { id: 'log-104', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), action: 'FAILOVER_HEARTBEAT', actor: 'geo-dns-healthcheck', region: 'us-east1', status: 'SUCCESS', details: 'Global edge Anycast latency 24ms. Zero packet drop.' },
];

// In-memory split payment sessions
const splitSessions: Record<string, any> = {};

// API: Multi-turn Chatbot with Gemini
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini-3.8-flash', systemInstruction, enableHighThinking } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server GEMINI_API_KEY is not configured.' });
    }

    // Model selection based on requirements:
    // - gemini-4-argon for complex tasks or when High Thinking is enabled
    // - gemini-3.8-flash for general tasks
    // - gemini-3.1-flash-lite for fast query resolution
    let chosenModel = model;
    if (enableHighThinking) {
      chosenModel = 'gemini-4-argon';
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (enableHighThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      // Requirement: Do not set maxOutputTokens
    }

    // Format conversation history for generateContent
    // Build parts from messages
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents: formattedContents,
      config,
    });

    const reply = response.text || 'No response generated.';
    res.json({ reply, modelUsed: chosenModel });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({ error: error?.message || 'Chat generation failed' });
  }
});

// API: High Quality Image Generation with 1K, 2K, 4K affordances
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, imageSize = '1K', aspectRatio = '16:9' } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server GEMINI_API_KEY is not configured.' });
    }

    // Try gemini-3-pro-image-preview as requested, with fallback to gemini-3-pro-image / gemini-nano-banana-2.1
    const candidateModels = ['gemini-3-pro-image-preview', 'gemini-3-pro-image', 'gemini-nano-banana-2.1', 'gemini-3.1-flash-lite-image'];
    let lastError: any = null;
    let base64Image: string | null = null;
    let modelSuccess = '';

    for (const mod of candidateModels) {
      try {
        const isNanoOrPro = mod.includes('pro-image') || mod.includes('nano-banana');
        const config: any = {};
        if (isNanoOrPro) {
          config.imageConfig = {
            aspectRatio: aspectRatio as any,
            imageSize: imageSize as any,
          };
        } else {
          config.imageConfig = {
            aspectRatio: aspectRatio as any,
          };
        }

        const response = await ai.models.generateContent({
          model: mod,
          contents: {
            parts: [{ text: prompt }],
          },
          config,
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              modelSuccess = mod;
              break;
            }
          }
        }

        if (base64Image) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${mod} failed for image gen:`, err.message);
      }
    }

    if (!base64Image) {
      throw lastError || new Error('Could not generate image from candidate models.');
    }

    res.json({ imageUrl: base64Image, model: modelSuccess, imageSize, aspectRatio });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-image:', error);
    res.status(500).json({ error: error?.message || 'Image generation failed' });
  }
});

// API: Image Understanding / Photo Analysis using gemini-4-argon
app.post('/api/gemini/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt = 'Analyze this travel photo, itinerary, or ticket in detail.' } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server GEMINI_API_KEY is not configured.' });
    }

    // Strip data URL header if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: 'You are an expert travel document scanner and global tourist assistant. Provide structured, accurate, and insightful advice on luggage size compliance, flight boarding pass details, passport validation tips, landmark history, or hotel receipts.',
      },
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze-image:', error);
    res.status(500).json({ error: error?.message || 'Image analysis failed' });
  }
});

// API: Currency rates
app.get(['/api/rates', '/api/currency/rates'], (_req, res) => {
  res.json({
    base: 'USD',
    timestamp: new Date().toISOString(),
    rates: BASE_RATES_USD,
  });
});

// API: System resilience & Disaster Recovery telemetry
app.get('/api/system/metrics', (_req, res) => {
  const drAudit = calculateDrMetrics({
    backupCadenceMinutes: 10,
    replicationMode: 'semi-sync',
    targetRtoMinutes: 5,
    targetRpoMinutes: 1,
    activeRegions: 3,
  });

  res.json({
    regions: [
      { id: 'us-east1', name: 'US East (N. Virginia)', role: 'primary', status: 'healthy', latencyMs: 24, syncLagSeconds: 0.02, uptime30d: 99.998 },
      { id: 'europe-west1', name: 'Europe West (Belgium)', role: 'secondary', status: 'healthy', latencyMs: 68, syncLagSeconds: 0.12, uptime30d: 99.995 },
      { id: 'asia-northeast1', name: 'Asia Northeast (Tokyo)', role: 'secondary', status: 'healthy', latencyMs: 112, syncLagSeconds: 0.18, uptime30d: 99.999 },
    ],
    drAudit,
    auditLogs: auditLogs.slice(0, 8),
    encryption: {
      atRest: 'AES-256-GCM via Cloud KMS with envelope encryption',
      inTransit: 'TLS 1.3 with mTLS for inter-service gRPC',
      compliance: 'SOC2 Type II, ISO 27001, GDPR, PCI-DSS Level 1 compliant',
    },
    recoveryPointObjective: 'RPO <= 1 minute (semi-sync Raft log replication)',
    recoveryTimeObjective: 'RTO <= 2.5 minutes (automated BGP Anycast DNS reroute & replica promotion)',
  });
});

// API: Trigger simulated failover drill
app.post('/api/system/failover-drill', (req, res) => {
  const { targetRegion = 'europe-west1' } = req.body;
  const drillId = `drill-${Date.now().toString(36)}`;
  const timestamp = new Date().toISOString();

  auditLogs.unshift({
    id: drillId,
    timestamp,
    action: 'DISASTER_RECOVERY_FAILOVER_DRILL',
    actor: 'admin@aethervoyage.com',
    region: targetRegion,
    status: 'SUCCESS',
    details: `Simulated primary region cutover to ${targetRegion}. Automated health check rerouted traffic in 1.4s. Zero data loss verified.`,
  });

  res.json({
    drillId,
    targetRegion,
    durationSeconds: 1.4,
    rpoAchievedSeconds: 0.05,
    status: 'PASSED',
    auditLogCreated: true,
  });
});

// API: Split payment session creation & settlement
app.post('/api/bookings/split', (req, res) => {
  const { sessionId, listingTitle, totalAmount, currency, participants, mode } = req.body;
  const id = sessionId || `split-${Math.random().toString(36).substring(2, 9)}`;

  splitSessions[id] = {
    id,
    listingTitle,
    totalAmount,
    currency,
    participants,
    mode,
    createdAt: new Date().toISOString(),
    shareLink: `https://aethervoyage.travel/split/${id}`,
  };

  res.json({ session: splitSessions[id] });
});

// API: Live .ics Calendar Subscription Feed (Apple Calendar / Google Calendar by URL)
app.get('/api/calendar/feed.ics', (req, res) => {
  const baseDate = typeof req.query.baseDate === 'string' ? req.query.baseDate : '2026-10-24';
  const reminderMinutes = req.query.reminder ? parseInt(String(req.query.reminder), 10) : 120;
  const defaultBookings = [INITIAL_LISTINGS[0], INITIAL_LISTINGS[5], INITIAL_LISTINGS[3]];

  const icsContent = generateIcsFeed(defaultBookings, {
    baseDate,
    reminderMinutesBefore: reminderMinutes,
    includeConfirmationCode: true,
    includeCarbonData: true,
  });

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="aethervoyage-itinerary.ics"');
  res.send(icsContent);
});

// API: Custom .ics Feed Generator from client booking history
app.post('/api/calendar/generate-ics', (req, res) => {
  const { bookings = [], options = {} } = req.body;
  const icsContent = generateIcsFeed(bookings, options);
  res.json({
    icsContent,
    eventCount: bookings.length,
    generatedAt: new Date().toISOString(),
  });
});

// Start full-stack server with Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AetherVoyage Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
