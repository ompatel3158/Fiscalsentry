const fs = require('fs');
const sharp = require('sharp');

const width = 2400;
const height = 1350;

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090E17"/>
      <stop offset="50%" stop-color="#0D1524"/>
      <stop offset="100%" stop-color="#070A10"/>
    </linearGradient>

    <!-- Card Background Gradient -->
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#152033" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0.95"/>
    </linearGradient>

    <linearGradient id="innerCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#131D2E"/>
    </linearGradient>

    <!-- Accent Gradients -->
    <linearGradient id="accentTeal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>

    <linearGradient id="accentBlue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#6366F1"/>
    </linearGradient>

    <linearGradient id="accentPurple" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>

    <linearGradient id="accentEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
    
    <filter id="glowTeal" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

  <!-- Subtle Blueprint Tech Grid -->
  <g opacity="0.06" stroke="#FFFFFF" stroke-width="1">
    ${Array.from({ length: 48 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="${height}"/>`).join('')}
    ${Array.from({ length: 27 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="${width}" y2="${i * 50}"/>`).join('')}
  </g>

  <!-- ================= TOP HEADER ================= -->
  <g transform="translate(100, 70)">
    <!-- Brand Mark Vector Logo -->
    <g transform="translate(0, 5) scale(1.6)">
      <!-- Left Navy Wing -->
      <polygon points="20,4 6,14 6,28 20,40" fill="#0E2A47" />
      <!-- Right Teal Wing -->
      <polygon points="20,4 34,14 34,28 20,40" fill="#14C9B7" />
      <!-- Center Circle -->
      <circle cx="20" cy="22" r="7" fill="#FFFFFF" />
      <!-- Center Gold Diamond -->
      <polygon points="20,17 24,22 20,27 16,22" fill="#D9A441" />
    </g>

    <text x="80" y="38" fill="#FFFFFF" font-size="38" font-weight="800" letter-spacing="-0.5">FiscalSentry</text>
    <text x="315" y="38" fill="#94A3B8" font-size="34" font-weight="300"> | </text>
    <text x="345" y="38" fill="#38BDF8" font-size="34" font-weight="700">Autonomous System Architecture</text>
    
    <text x="80" y="68" fill="#94A3B8" font-size="18" font-weight="500">
      24/7 Event-Driven Financial Defense &amp; Action Engine • Built on Google Cloud &amp; Gemini 3.7 Flash
    </text>

    <!-- Hackathon Badge Pill -->
    <g transform="translate(1780, 10)">
      <rect width="420" height="50" rx="25" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
      <circle cx="30" cy="25" r="7" fill="#10B981" filter="url(#glowTeal)"/>
      <text x="50" y="31" fill="#F8FAFC" font-size="16" font-weight="700">Google All Things Agentic Hackathon</text>
    </g>
  </g>

  <!-- ================= 4 ARCHITECTURE COLUMNS ================= -->

  <!-- Helper Column Box Function -->
  <!-- Col 1: Ingestion Layer -->
  <g transform="translate(100, 190)" filter="url(#shadow)">
    <!-- Column Card Background -->
    <rect width="490" height="960" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5"/>
    
    <!-- Top Pill Header -->
    <rect x="25" y="25" width="440" height="60" rx="14" fill="#0284C7" fill-opacity="0.15" stroke="#0284C7" stroke-width="1.5"/>
    <text x="45" y="52" fill="#38BDF8" font-size="14" font-weight="800" letter-spacing="1">STAGE 1</text>
    <text x="45" y="72" fill="#FFFFFF" font-size="19" font-weight="700">Ingestion &amp; Surveillance</text>

    <!-- Card 1: Gmail API -->
    <g transform="translate(25, 115)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#EA4335" fill-opacity="0.15" stroke="#EA4335" stroke-width="1"/>
      <!-- Gmail M Icon -->
      <path d="M 30,36 L 42,46 L 54,36" fill="none" stroke="#EA4335" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="29" y="34" width="26" height="18" fill="none" stroke="#EA4335" stroke-width="2" rx="2"/>
      
      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Gmail API Surveillance</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Automated Inbox Stream</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400" width="390">
        • Tiered incremental history ID batching
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Anti-promotional spam &amp; noise filtering
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Raw multipart MIME &amp; PDF attachment extraction
      </text>
    </g>

    <!-- Card 2: Cloud Scheduler -->
    <g transform="translate(25, 310)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#38BDF8" fill-opacity="0.15" stroke="#38BDF8" stroke-width="1"/>
      <circle cx="42" cy="42" r="10" fill="none" stroke="#38BDF8" stroke-width="2"/>
      <polyline points="42,36 42,42 46,44" fill="none" stroke="#38BDF8" stroke-width="2"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Google Cloud Scheduler</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Continuous Background Poller</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Autonomous 15-minute / hourly cron ticks
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Multi-user scheduled audit orchestration
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Zero-human-intervention trigger daemon
      </text>
    </g>

    <!-- Card 3: Multimodal Dropzone -->
    <g transform="translate(25, 505)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="1"/>
      <rect x="33" y="32" width="18" height="22" rx="2" fill="none" stroke="#10B981" stroke-width="2"/>
      <line x1="37" y1="38" x2="47" y2="38" stroke="#10B981" stroke-width="1.5"/>
      <line x1="37" y1="43" x2="47" y2="43" stroke="#10B981" stroke-width="1.5"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Multimodal Dropzone</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Interactive Client Ingress</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Scanned medical bills &amp; vendor quotes (PDF, PNG)
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Multi-page document batching
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Client-side file pre-validation
      </text>
    </g>

    <!-- Card 4: Webhook Ingress -->
    <g transform="translate(25, 700)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#8B5CF6" fill-opacity="0.15" stroke="#8B5CF6" stroke-width="1"/>
      <path d="M 33,42 C 37,34 47,34 51,42 C 47,50 37,50 33,42 Z" fill="none" stroke="#8B5CF6" stroke-width="2"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Inbound Webhooks</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Enterprise &amp; ERP Connectors</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Stripe, Slack, and accounting webhook feeds
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Secret key validation &amp; idempotency control
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Real-time financial debit interception
      </text>
    </g>

    <!-- Bottom Status Line -->
    <g transform="translate(25, 900)">
      <circle cx="15" cy="15" r="5" fill="#38BDF8"/>
      <text x="30" y="20" fill="#94A3B8" font-size="14" font-weight="500">Continuous 24/7 Ingress Stream</text>
    </g>
  </g>

  <!-- Connector Arrow 1 -> 2 -->
  <g transform="translate(605, 650)">
    <path d="M 0,0 L 45,0" stroke="url(#accentTeal)" stroke-width="4" stroke-dasharray="6,4"/>
    <polygon points="55,0 42,-7 42,7" fill="#10B981"/>
  </g>

  <!-- Col 2: Cloud Infrastructure -->
  <g transform="translate(670, 190)" filter="url(#shadow)">
    <!-- Column Card Background -->
    <rect width="490" height="960" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5"/>
    
    <!-- Top Pill Header -->
    <rect x="25" y="25" width="440" height="60" rx="14" fill="#6366F1" fill-opacity="0.15" stroke="#6366F1" stroke-width="1.5"/>
    <text x="45" y="52" fill="#818CF8" font-size="14" font-weight="800" letter-spacing="1">STAGE 2</text>
    <text x="45" y="72" fill="#FFFFFF" font-size="19" font-weight="700">Google Cloud Infrastructure</text>

    <!-- Card 1: Cloud Functions 2nd Gen / Cloud Run -->
    <g transform="translate(25, 115)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#6366F1" fill-opacity="0.15" stroke="#6366F1" stroke-width="1"/>
      <polygon points="34,32 50,42 34,52" fill="none" stroke="#818CF8" stroke-width="2.5"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Cloud Functions (2nd Gen)</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Serverless Cloud Run Runtime</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • HTTP Endpoint: /sentryPollHttp
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Auto-scaling concurrency &amp; low latency
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Multi-tenant execution sandbox
      </text>
    </g>

    <!-- Card 2: Cloud Firestore -->
    <g transform="translate(25, 310)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#F59E0B" fill-opacity="0.15" stroke="#F59E0B" stroke-width="1"/>
      <path d="M 32,48 L 42,28 L 52,48 Z" fill="none" stroke="#F59E0B" stroke-width="2"/>
      <line x1="36" y1="42" x2="48" y2="42" stroke="#F59E0B" stroke-width="1.5"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Cloud Firestore</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Encrypted Ledger &amp; State</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Zero-knowledge AES-256-GCM encrypted records
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Checkpoints: lastAuditedHistoryId &amp; tokens
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Multi-user audit collection isolation
      </text>
    </g>

    <!-- Card 3: Firebase Auth & Token Rotation -->
    <g transform="translate(25, 505)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="1"/>
      <rect x="33" y="38" width="18" height="16" rx="2" fill="none" stroke="#10B981" stroke-width="2"/>
      <path d="M 37,38 L 37,33 C 37,30 47,30 47,33 L 47,38" fill="none" stroke="#10B981" stroke-width="2"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Firebase Authentication</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Zero-Trust Google OAuth 2.0</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Scoped access: Gmail, Calendar, Tasks, Sheets
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Autonomous 45-min background token rotation
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Client-side session purge on logout
      </text>
    </g>

    <!-- Card 4: Firebase Hosting & Edge CDN -->
    <g transform="translate(25, 700)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#EC4899" fill-opacity="0.15" stroke="#EC4899" stroke-width="1"/>
      <circle cx="42" cy="42" r="12" fill="none" stroke="#EC4899" stroke-width="2"/>
      <path d="M 30,42 L 54,42 M 42,30 L 42,54" stroke="#EC4899" stroke-width="1.5"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Firebase Hosting (Edge)</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Worldwide High-Speed CDN</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Sub-second globally distributed static assets
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Next.js 14 SPA with SSR API fallbacks
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Custom SSL &amp; domain routing (/privacy, /terms)
      </text>
    </g>

    <!-- Bottom Status Line -->
    <g transform="translate(25, 900)">
      <circle cx="15" cy="15" r="5" fill="#818CF8"/>
      <text x="30" y="20" fill="#94A3B8" font-size="14" font-weight="500">Google Cloud Enterprise Tier</text>
    </g>
  </g>

  <!-- Connector Arrow 2 -> 3 -->
  <g transform="translate(1175, 650)">
    <path d="M 0,0 L 45,0" stroke="url(#accentPurple)" stroke-width="4" stroke-dasharray="6,4"/>
    <polygon points="55,0 42,-7 42,7" fill="#8B5CF6"/>
  </g>

  <!-- Col 3: Gemini Agent Intelligence -->
  <g transform="translate(1240, 190)" filter="url(#shadow)">
    <!-- Column Card Background -->
    <rect width="490" height="960" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5"/>
    
    <!-- Top Pill Header -->
    <rect x="25" y="25" width="440" height="60" rx="14" fill="#8B5CF6" fill-opacity="0.15" stroke="#8B5CF6" stroke-width="1.5"/>
    <text x="45" y="52" fill="#C084FC" font-size="14" font-weight="800" letter-spacing="1">STAGE 3</text>
    <text x="45" y="72" fill="#FFFFFF" font-size="19" font-weight="700">Gemini 3.7 Agent Brain</text>

    <!-- Card 1: Gemini 3.7 Flash -->
    <g transform="translate(25, 115)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#8B5CF6" fill-opacity="0.15" stroke="#8B5CF6" stroke-width="1"/>
      <polygon points="42,28 46,38 56,42 46,46 42,56 38,46 28,42 38,38" fill="#C084FC"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Gemini 3.7 Flash</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Multimodal OCR &amp; Reasoning</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • High-speed multimodal line item parsing
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Hybrid thinking mode for complex billing codes
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Zero hallucination via strict JSON schema outputs
      </text>
    </g>

    <!-- Card 2: Firebase Genkit -->
    <g transform="translate(25, 310)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#F97316" fill-opacity="0.15" stroke="#F97316" stroke-width="1"/>
      <circle cx="42" cy="42" r="10" fill="#F97316" fill-opacity="0.3"/>
      <polygon points="42,32 49,47 35,47" fill="#F97316"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Firebase Genkit Flows</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Structured Agent Framework</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Type-safe Zod schema validation
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • OpenTelemetry-compliant trace observability
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Sentry batch auditing pipeline integration
      </text>
    </g>

    <!-- Card 3: Statutory RAG Engine -->
    <g transform="translate(25, 505)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#06B6D4" fill-opacity="0.15" stroke="#06B6D4" stroke-width="1"/>
      <path d="M 32,34 L 52,34 L 52,50 L 32,50 Z" fill="none" stroke="#06B6D4" stroke-width="2"/>
      <line x1="36" y1="40" x2="48" y2="40" stroke="#06B6D4" stroke-width="1.5"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Statutory RAG Engine</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Legal &amp; Compliance Memory</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • No Surprises Act (45 CFR § 149) checks
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • CMS NCCI unbundling &amp; mutually exclusive codes
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • CFPB Debt Collection Rule (12 CFR Part 1006)
      </text>
    </g>

    <!-- Card 4: Multi-Currency Reconciler -->
    <g transform="translate(25, 700)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="1"/>
      <text x="42" y="48" fill="#10B981" font-size="20" font-weight="800" text-anchor="middle">₹$</text>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Multi-Currency Reconciler</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Global FX Normalization</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Canonical ISO currency merging (USD, INR, EUR, GBP)
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Temporary lien &amp; IPO mandate hold filtering
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Delta savings benchmark calculations
      </text>
    </g>

    <!-- Bottom Status Line -->
    <g transform="translate(25, 900)">
      <circle cx="15" cy="15" r="5" fill="#C084FC"/>
      <text x="30" y="20" fill="#94A3B8" font-size="14" font-weight="500">Gemini Reasoning &amp; Genkit Core</text>
    </g>
  </g>

  <!-- Connector Arrow 3 -> 4 -->
  <g transform="translate(1745, 650)">
    <path d="M 0,0 L 45,0" stroke="url(#accentEmerald)" stroke-width="4" stroke-dasharray="6,4"/>
    <polygon points="55,0 42,-7 42,7" fill="#10B981"/>
  </g>

  <!-- Col 4: Autonomous Action Layer -->
  <g transform="translate(1810, 190)" filter="url(#shadow)">
    <!-- Column Card Background -->
    <rect width="490" height="960" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5"/>
    
    <!-- Top Pill Header -->
    <rect x="25" y="25" width="440" height="60" rx="14" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="1.5"/>
    <text x="45" y="52" fill="#34D399" font-size="14" font-weight="800" letter-spacing="1">STAGE 4</text>
    <text x="45" y="72" fill="#FFFFFF" font-size="19" font-weight="700">Autonomous Action Layer</text>

    <!-- Card 1: Google Calendar -->
    <g transform="translate(25, 115)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#3B82F6" fill-opacity="0.15" stroke="#3B82F6" stroke-width="1"/>
      <rect x="30" y="32" width="24" height="20" rx="3" fill="none" stroke="#3B82F6" stroke-width="2"/>
      <line x1="30" y1="38" x2="54" y2="38" stroke="#3B82F6" stroke-width="2"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Google Calendar</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Statutory Appeal Deadlines</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Auto-schedules 30-day legal response dates
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Embedded dispute claim IDs &amp; provider numbers
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Direct Google Workspace event creation
      </text>
    </g>

    <!-- Card 2: Google Tasks -->
    <g transform="translate(25, 310)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="1"/>
      <circle cx="42" cy="42" r="10" fill="none" stroke="#10B981" stroke-width="2"/>
      <polyline points="37,42 41,46 48,37" fill="none" stroke="#10B981" stroke-width="2"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Google Tasks</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Action Cards &amp; Scripts</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Prioritized step-by-step negotiation checklists
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Pre-drafted phone scripts with CFR statute references
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Real-time completion status synchronization
      </text>
    </g>

    <!-- Card 3: Google Sheets -->
    <g transform="translate(25, 505)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#059669" fill-opacity="0.15" stroke="#059669" stroke-width="1"/>
      <rect x="30" y="32" width="24" height="20" rx="2" fill="none" stroke="#059669" stroke-width="2"/>
      <line x1="38" y1="32" x2="38" y2="52" stroke="#059669" stroke-width="1.5"/>
      <line x1="30" y1="42" x2="54" y2="42" stroke="#059669" stroke-width="1.5"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Google Sheets Ledger</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Reconciled Accounting Sheet</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Real-time financial audit line item export
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Formats: .xlsx, .csv, and Google Sheets live sync
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • 1-click tax &amp; audit balance reconciliation
      </text>
    </g>

    <!-- Card 4: Vector PDF & Slack Webhooks -->
    <g transform="translate(25, 700)">
      <rect width="440" height="175" rx="14" fill="url(#innerCardGrad)" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="20" y="20" width="44" height="44" rx="10" fill="#F43F5E" fill-opacity="0.15" stroke="#F43F5E" stroke-width="1"/>
      <path d="M 33,32 L 47,32 L 51,37 L 51,52 L 33,52 Z" fill="none" stroke="#F43F5E" stroke-width="2"/>

      <text x="80" y="42" fill="#FFFFFF" font-size="18" font-weight="700">Dispute PDF &amp; Slack</text>
      <text x="80" y="62" fill="#94A3B8" font-size="14">Multi-Channel Output</text>
      <text x="24" y="98" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Signature-ready legal appeal PDF generator
      </text>
      <text x="24" y="122" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Instant Slack &amp; Discord priority defense alerts
      </text>
      <text x="24" y="146" fill="#CBD5E1" font-size="13.5" font-weight="400">
        • Commercial purchase order (PO) generation
      </text>
    </g>

    <!-- Bottom Status Line -->
    <g transform="translate(25, 900)">
      <circle cx="15" cy="15" r="5" fill="#10B981"/>
      <text x="30" y="20" fill="#94A3B8" font-size="14" font-weight="500">Autonomous Execution DAG</text>
    </g>
  </g>

  <!-- ================= BOTTOM FOOTER BADGES ================= -->
  <g transform="translate(100, 1200)">
    <rect width="2200" height="85" rx="16" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
    
    <g transform="translate(40, 26)">
      <circle cx="16" cy="16" r="16" fill="#10B981" fill-opacity="0.15"/>
      <polyline points="10,16 14,20 22,11" fill="none" stroke="#10B981" stroke-width="2.5"/>
      <text x="45" y="22" fill="#F8FAFC" font-size="17" font-weight="700">Zero-Knowledge Security</text>
      <text x="270" y="22" fill="#94A3B8" font-size="16">AES-256-GCM client-side encryption before cloud sync</text>
    </g>

    <g transform="translate(850, 26)">
      <circle cx="16" cy="16" r="16" fill="#38BDF8" fill-opacity="0.15"/>
      <polyline points="10,16 14,20 22,11" fill="none" stroke="#38BDF8" stroke-width="2.5"/>
      <text x="45" y="22" fill="#F8FAFC" font-size="17" font-weight="700">Deterministic Recovery</text>
      <text x="260" y="22" fill="#94A3B8" font-size="16">Idempotent DAG dispatching with self-healing boundaries</text>
    </g>

    <g transform="translate(1620, 26)">
      <circle cx="16" cy="16" r="16" fill="#818CF8" fill-opacity="0.15"/>
      <polyline points="10,16 14,20 22,11" fill="none" stroke="#818CF8" stroke-width="2.5"/>
      <text x="45" y="22" fill="#F8FAFC" font-size="17" font-weight="700">100% Type-Safe</text>
      <text x="195" y="22" fill="#94A3B8" font-size="16">Next.js 14, TypeScript &amp; Zod verified</text>
    </g>
  </g>
</svg>
`;

async function renderDiagram() {
  const svgBuffer = Buffer.from(svg);
  
  // Write SVG file
  fs.writeFileSync('b:/work/Taskmaster/public/fiscalsentry-architecture-diagram.svg', svg);
  fs.writeFileSync('b:/work/Taskmaster/fiscalsentry-architecture-diagram.svg', svg);

  // Render to high-res PNG (2400x1350)
  await sharp(svgBuffer)
    .png({ quality: 100 })
    .toFile('b:/work/Taskmaster/public/fiscalsentry-architecture-diagram.png');
  
  await sharp(svgBuffer)
    .png({ quality: 100 })
    .toFile('b:/work/Taskmaster/fiscalsentry-architecture-diagram.png');

  // Render to high-res JPG (2400x1350)
  await sharp(svgBuffer)
    .jpeg({ quality: 98 })
    .toFile('b:/work/Taskmaster/public/fiscalsentry-architecture-diagram.jpg');

  await sharp(svgBuffer)
    .jpeg({ quality: 98 })
    .toFile('b:/work/Taskmaster/fiscalsentry-architecture-diagram.jpg');

  console.log('Vector Architecture Diagram rendered in ultra-high resolution (2400x1350)!');
}

renderDiagram();
