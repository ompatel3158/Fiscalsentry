import { AuditResult, ChatSession, ChatMessage, RAGSourceCitation } from './types';

export const MOCK_AUDITS: Record<string, AuditResult> = {
  'medical-metro-health': {
    id: 'audit-med-001',
    title: 'Metro General Hospital Emergency & Surgical Statement',
    category: 'medical_bill',
    providerOrVendor: 'Metro Health Regional Medical Center',
    accountNumber: 'MH-8849201-B',
    documentDate: '2026-08-12',
    totalBilledAmount: 6450.0,
    fairBenchmarkAmount: 4610.0,
    potentialRecoveryAmount: 1840.0,
    riskLevel: 'critical',
    summary:
      'Critical billing discrepancies identified: CPT 99285 (Level 5 ED Visit) was unbundled alongside routine CPT 99214, violating CMS bundling guidelines. Additionally, an out-of-network assistant surgeon fee ($1,200) was balance-billed at an in-network hospital, violating Sec. 102 of the Federal No Surprises Act.',
    citations: [
      {
        statute: 'No Surprises Act (Public Law 116-260)',
        title: 'Balance Billing Protections for Emergency & In-Facility Services',
        applicableSection: 'Section 102(a) - Prohibition of Out-of-Network Balance Billing',
        summary:
          'Prohibits healthcare providers from billing patients beyond in-network cost-sharing amounts for emergency services and non-emergency services performed by out-of-network clinicians at in-network facilities.',
      },
      {
        statute: 'CMS National Correct Coding Initiative (NCCI)',
        title: 'Policy Manual for Medicare Services',
        applicableSection: 'Chapter 1, Sec. B - Unbundling & Mutually Exclusive Code Pairs',
        summary:
          'Comprehensive and component codes billed concurrently for the same encounter without distinct anatomical modifier -59 are non-reimbursable overcharges.',
      },
    ],
    lineItems: [
      {
        id: 'li-1',
        code: 'CPT 99285',
        description: 'Emergency Dept Visit - High Complexity',
        category: 'Emergency Services',
        quantity: 1,
        originalAmount: 2200.0,
        benchmarkAmount: 1550.0,
        deltaSavings: 650.0,
        status: 'overcharge',
        violationType: 'Excessive Hospital Chargemaster Markup',
        confidenceScore: 0.96,
        reasoning:
          'Billed at 380% of regional Medicare Part B Allowable ($407.50 base rate). Fair market median for Zip 94107 is $1,550.00.',
      },
      {
        id: 'li-2',
        code: 'CPT 99214',
        description: 'Office / Outpatient Visit - Detailed (Unbundled with 99285)',
        category: 'Evaluation & Management',
        quantity: 1,
        originalAmount: 440.0,
        benchmarkAmount: 0.0,
        deltaSavings: 440.0,
        status: 'unbundled',
        violationType: 'CMS NCCI Unbundling Violation',
        confidenceScore: 0.99,
        reasoning:
          'Improperly unbundled from CPT 99285. CMS regulations prohibit billing separate E&M codes during the same emergency encounter.',
      },
      {
        id: 'li-3',
        code: 'CPT 00142',
        description: 'Anesthesia Out-of-Network Assistant Provider Surcharge',
        category: 'Anesthesiology',
        quantity: 1,
        originalAmount: 1200.0,
        benchmarkAmount: 450.0,
        deltaSavings: 750.0,
        status: 'statutory_violation',
        violationType: 'No Surprises Act Balance Billing Breach',
        confidenceScore: 0.98,
        reasoning:
          'Facility is in-network; assistant provider was out-of-network. Under Federal No Surprises Act, patient responsibility is capped at the in-network qualifying payment amount (QPA) of $450.00.',
      },
      {
        id: 'li-4',
        code: 'CPT 70450',
        description: 'CT Head / Brain without Contrast',
        category: 'Radiology',
        quantity: 1,
        originalAmount: 1850.0,
        benchmarkAmount: 1850.0,
        deltaSavings: 0.0,
        status: 'compliant',
        confidenceScore: 0.95,
        reasoning: 'Standard diagnostic imaging charge verified within normal insurance contract rates.',
      },
      {
        id: 'li-5',
        code: 'PHARM-091',
        description: 'Intravenous Saline Solution 1000ml (2 Bags)',
        category: 'Pharmacy',
        quantity: 2,
        originalAmount: 760.0,
        benchmarkAmount: 760.0,
        deltaSavings: 0.0,
        status: 'compliant',
        confidenceScore: 0.92,
        reasoning: 'Standard inpatient IV hydration administration fee.',
      },
    ],
    actions: [
      {
        id: 'act-1',
        type: 'pdf_dispute',
        title: 'Generate Legal Medical Dispute & Appeal Dossier',
        description:
          'Compile official 3-page formal dispute letter citing No Surprises Act Sec. 102 and CMS NCCI unbundling violations, addressed to Metro Health Billing Compliance Officer.',
        targetService: 'PDF Engine',
        status: 'pending',
        priority: 'urgent',
        estimatedRecoveryAmount: 1840.0,
        payload: {
          recipient: 'Patient Financial Services & Billing Dispute Dept.',
          facility: 'Metro Health Regional Medical Center',
          patientName: 'Alex Rivera',
          accountNumber: 'MH-8849201-B',
          disputedAmount: 1840.0,
        },
      },
      {
        id: 'act-2',
        type: 'google_calendar',
        title: 'Schedule Statutory 30-Day Insurer Response Deadline',
        description:
          'Set Google Calendar statutory milestone for provider response cutoff pursuant to state balance billing dispute regulations.',
        targetService: 'Google Calendar',
        status: 'pending',
        priority: 'high',
        deadlineDate: '2026-09-15T17:00:00Z',
        payload: {
          summary: '⚖️ Statutory Appeal Deadline: Metro Health Dispute #MH-8849201-B',
          description:
            'Deadline for Metro Health to respond to formal CPT 99214 & NSA Sec. 102 dispute of $1,840 overcharge.',
          date: '2026-09-15',
        },
      },
      {
        id: 'act-3',
        type: 'google_tasks',
        title: 'Create Priority Task: Hospital Billing Compliance Follow-up',
        description: 'Add prioritized task with battlecard script to Google Tasks for follow-up call.',
        targetService: 'Google Tasks',
        status: 'pending',
        priority: 'high',
        payload: {
          title: '📞 Follow up with Metro Health Billing Supervisor',
          notes:
            'Reference Account MH-8849201-B. Request removal of unbundled CPT 99214 ($440) and adjustment of CPT 00142 under No Surprises Act ($750 adjustment).',
          due: '2026-08-30',
        },
      },
      {
        id: 'act-4',
        type: 'google_sheets',
        title: 'Log $1,840 Disputed Recovery in Financial Ledger',
        description: 'Append structured row to Google Sheets recovery ledger with CPT breakdown.',
        targetService: 'Google Sheets',
        status: 'pending',
        priority: 'medium',
        payload: {
          sheetName: '2026 Medical Recovery Ledger',
          rowValues: ['2026-08-24', 'Metro Health', 'Dispute Active', '$6,450.00', '$4,610.00', '$1,840.00', 'Alex Rivera'],
        },
      },
      {
        id: 'act-5',
        type: 'slack',
        title: 'Dispatch Slack Alert to #financial-defense',
        description: 'Post rich interactive card with approval buttons to internal Slack channel.',
        targetService: 'Slack',
        status: 'pending',
        priority: 'medium',
        payload: {
          channel: '#financial-defense',
          text: '🚨 *Medical Bill Audit Complete:* $1,840 overcharge flagged at Metro Health. Ready for 1-click dispute dispatch.',
        },
      },
    ],
    createdAt: '2026-08-24T02:15:00Z',
    updatedAt: '2026-08-24T02:15:00Z',
  },

  'vendor-techcorp-procurement': {
    id: 'audit-quote-002',
    title: 'Enterprise Cloud Workstation & Hardware Procurement',
    category: 'vendor_quotes',
    providerOrVendor: 'Apex Systems vs. Nexus Cloud vs. Vertex IT',
    accountNumber: 'RFP-2026-088',
    documentDate: '2026-07-20',
    totalBilledAmount: 28400.0,
    fairBenchmarkAmount: 25200.0,
    potentialRecoveryAmount: 3200.0,
    riskLevel: 'medium',
    summary:
      'Normalized 3 vendor quotes across 15 enterprise developer workstations. Apex Systems quoted inflated enterprise warranty tiers (+18%) and excessive freight fees ($850), while Nexus Cloud provides identical OEM components with bundled 3-year ProSupport at $25,200.',
    citations: [
      {
        statute: 'Federal Acquisition Regulation (FAR 15.404)',
        title: 'Proposal Analysis Techniques',
        applicableSection: 'FAR 15.404-1(b) - Price Analysis Comparison',
        summary:
          'Mandates competitive quote comparison against published catalog prices and historical procurement benchmarks to establish price reasonableness.',
      },
    ],
    lineItems: [
      {
        id: 'vq-1',
        code: 'SKU-WS-64GB',
        description: 'Developer Workstations - 64GB DDR5 / 2TB NVMe (15 Units)',
        category: 'Hardware',
        quantity: 15,
        originalAmount: 22500.0,
        benchmarkAmount: 21000.0,
        deltaSavings: 1500.0,
        status: 'negotiable',
        violationType: 'Price Variance Across Vendors',
        confidenceScore: 0.94,
        reasoning: 'Nexus Cloud provides direct OEM batch pricing at $1,400/unit vs Apex quoted $1,500/unit.',
      },
      {
        id: 'vq-2',
        code: 'SVC-WARRANTY-3Y',
        description: '3-Year 24/7 On-site Enterprise Replacement SLA',
        category: 'Support Services',
        quantity: 15,
        originalAmount: 4200.0,
        benchmarkAmount: 3350.0,
        deltaSavings: 850.0,
        status: 'overcharge',
        violationType: 'Inflated Support Markup',
        confidenceScore: 0.95,
        reasoning: 'Standard manufacturer warranty direct purchase is $223/unit vs vendor markup of $280/unit.',
      },
      {
        id: 'vq-3',
        code: 'LOG-FREIGHT-EXPRESS',
        description: 'Expedited White-Glove Palletized Freight & Staging',
        category: 'Logistics',
        quantity: 1,
        originalAmount: 1700.0,
        benchmarkAmount: 850.0,
        deltaSavings: 850.0,
        status: 'negotiable',
        violationType: 'Excessive Logistics Surcharge',
        confidenceScore: 0.91,
        reasoning: 'Standard 3-day freight benchmark is $850. Vendor can waive shipping for orders > $20k.',
      },
    ],
    actions: [
      {
        id: 'act-v1',
        type: 'pdf_po',
        title: 'Generate Official Purchase Order for Nexus Cloud ($25,200)',
        description: 'Auto-generate signed corporate Purchase Order with optimal vendor selection and negotiated terms.',
        targetService: 'PDF Engine',
        status: 'pending',
        priority: 'high',
        estimatedRecoveryAmount: 3200.0,
        payload: {
          vendorName: 'Nexus Cloud Solutions Inc.',
          poNumber: 'PO-2026-9921',
          totalAmount: 25200.0,
          savings: 3200.0,
        },
      },
      {
        id: 'act-v2',
        type: 'google_sheets',
        title: 'Export Multi-Vendor Comparison Matrix to Google Sheets',
        description: 'Generate formatted line-by-line comparison sheet with price deltas and delivery lead times.',
        targetService: 'Google Sheets',
        status: 'pending',
        priority: 'medium',
        payload: {
          sheetName: 'Q3 Hardware Procurement Matrix',
        },
      },
      {
        id: 'act-v3',
        type: 'gmail',
        title: 'Draft Counter-Offer Email to Apex Systems',
        description: 'Pre-draft negotiation counter-offer requesting price match on workstations and waived freight fees.',
        targetService: 'Gmail',
        status: 'pending',
        priority: 'medium',
        payload: {
          to: 'sales@apexsystems.example.com',
          subject: 'Counter-Offer: RFP-2026-088 Hardware Procurement',
        },
      },
    ],
    createdAt: '2026-08-24T02:20:00Z',
    updatedAt: '2026-08-24T02:20:00Z',
  },

  'grant-clean-energy-rebate': {
    id: 'audit-grant-003',
    title: 'Clean Energy & Solar Small Business Tax Incentive Audit',
    category: 'grant_subsidy',
    providerOrVendor: 'Dept of Energy & State Clean Power Authority',
    accountNumber: 'DOE-IRA-SEC48',
    documentDate: '2026-06-18',
    totalBilledAmount: 15000.0,
    fairBenchmarkAmount: 10500.0,
    potentialRecoveryAmount: 4500.0,
    riskLevel: 'low',
    summary:
      'Small business facility energy audit and HVAC electrical upgrades qualify for 30% direct Investment Tax Credit (ITC) under Section 48 of the Inflation Reduction Act, plus a $1,500 municipal grid modernization rebate, totaling $4,500 in non-dilutive grant recovery.',
    citations: [
      {
        statute: 'Inflation Reduction Act (26 U.S.C. § 48)',
        title: 'Energy Investment Tax Credit (ITC)',
        applicableSection: 'Section 48(a)(3) - Qualified Commercial Clean Energy Property',
        summary:
          'Provides a base 30% tax credit for qualified commercial solar, thermal, and microgrid electrical infrastructure improvements placed in service during tax year 2026.',
      },
    ],
    lineItems: [
      {
        id: 'gr-1',
        code: 'IRA-SEC48-ITC',
        description: '30% Federal ITC on $10,000 Facility Inverter & Battery Storage',
        category: 'Federal Tax Credit',
        originalAmount: 10000.0,
        benchmarkAmount: 7000.0,
        deltaSavings: 3000.0,
        status: 'rebate_eligible',
        violationType: 'Eligible Federal Subsidy',
        confidenceScore: 0.98,
        reasoning: 'Qualifies for direct 30% elective payment under IRA Section 48.',
      },
      {
        id: 'gr-2',
        code: 'STATE-CLEAN-2026',
        description: 'Municipal Commercial Energy Efficiency Incentive',
        category: 'State Grant',
        originalAmount: 5000.0,
        benchmarkAmount: 3500.0,
        deltaSavings: 1500.0,
        status: 'rebate_eligible',
        violationType: 'Eligible State Rebate',
        confidenceScore: 0.95,
        reasoning: 'State Clean Power Authority offers $0.30/kWh annual reduction match up to $1,500.',
      },
    ],
    actions: [
      {
        id: 'act-g1',
        type: 'pdf_grant',
        title: 'Generate Completed DOE Form 3468 Dossier',
        description: 'Auto-fill official federal tax credit filing package with certified line-item schedule.',
        targetService: 'PDF Engine',
        status: 'pending',
        priority: 'high',
        estimatedRecoveryAmount: 4500.0,
        payload: {
          formName: 'IRS Form 3468 / Investment Credit',
          eligibleAmount: 4500.0,
        },
      },
      {
        id: 'act-g2',
        type: 'google_calendar',
        title: 'Add State Rebate Filing Deadline to Calendar',
        description: 'Add deadline milestone for state clean power application submission cutoff.',
        targetService: 'Google Calendar',
        status: 'pending',
        priority: 'medium',
        deadlineDate: '2026-10-01T17:00:00Z',
        payload: {
          summary: '🌿 State Clean Energy Rebate Filing Deadline',
          date: '2026-10-01',
        },
      },
      {
        id: 'act-g3',
        type: 'google_drive',
        title: 'Create Google Drive Dossier Folder',
        description: 'Create organized folder `/FiscalSentry/Grants/2026-DOE-CleanEnergy/` and archive receipts.',
        targetService: 'Google Drive',
        status: 'pending',
        priority: 'low',
        payload: {
          folderPath: '/FiscalSentry/Grants/2026-DOE-CleanEnergy/',
        },
      },
    ],
    createdAt: '2026-08-24T02:25:00Z',
    updatedAt: '2026-08-24T02:25:00Z',
  },
};

export const INITIAL_RAG_KNOWLEDGE: RAGSourceCitation[] = [
  {
    id: 'rag-1',
    title: 'Federal No Surprises Act (45 CFR § 149.410)',
    snippet:
      'Healthcare providers and facilities may not bill a participant, beneficiary, or enrollee for out-of-network emergency services, or non-emergency services at an in-network facility, more than the in-network cost-sharing requirement.',
    sourceType: 'statute',
    score: 0.98,
  },
  {
    id: 'rag-2',
    title: 'CMS NCCI Policy Manual - Chapter 1 E&M Unbundling',
    snippet:
      'When an evaluation and management (E&M) service is provided on the same day as another procedure by the same physician, it is non-reimbursable unless modifier -25 or -59 is substantiated with separate anatomical documentation.',
    sourceType: 'policy',
    score: 0.95,
  },
  {
    id: 'rag-3',
    title: 'National Medicare Part B Physician Fee Schedule (MPFS 2026)',
    snippet:
      'CPT 99285 National Base Allowable: $407.50; Regional Geographic Adjusted Benchmark for Northern California: $512.30. Hospital chargemaster markup rates exceeding 300% can be formally challenged for fair value settlement.',
    sourceType: 'pricing_benchmark',
    score: 0.93,
  },
  {
    id: 'rag-4',
    title: 'Inflation Reduction Act Commercial ITC Section 48 Guidelines',
    snippet:
      'Businesses investing in qualified clean energy technologies (solar, energy storage, heat pumps) are eligible for a 30% base Investment Tax Credit with direct-pay monetization provisions.',
    sourceType: 'statute',
    score: 0.91,
  },
  {
    id: 'rag-5',
    title: 'Standard Medical Dispute Legal Letter Precedent (AHA / HFMA)',
    snippet:
      'A formal dispute notice must specify the patient name, account ID, specific CPT codes in dispute, the legal foundation under federal/state law, and a demand for an itemized zero-balance adjustment within 30 days.',
    sourceType: 'dispute_template',
    score: 0.89,
  },
];

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'session-med-dispute',
    title: 'Metro Health $1,840 Dispute & Appeal',
    previewText: 'Analyzed CPT 99285 and No Surprises Act balance billing violation...',
    createdAt: '2026-08-24T02:15:00Z',
    updatedAt: '2026-08-24T02:30:00Z',
    isPinned: true,
    tags: ['Medical', 'Dispute', 'Hospital'],
    totalAudited: 6450,
    totalSaved: 1840,
  },
  {
    id: 'session-hardware-po',
    title: 'Q3 Developer Workstations Procurement',
    previewText: 'Compared 3 vendor quotes. Apex quoted $28.4k vs Nexus $25.2k...',
    createdAt: '2026-08-24T02:20:00Z',
    updatedAt: '2026-08-24T02:25:00Z',
    tags: ['Procurement', 'Hardware', 'PO'],
    totalAudited: 28400,
    totalSaved: 3200,
  },
  {
    id: 'session-clean-energy',
    title: 'Solar & Battery Tax Incentive Dossier',
    previewText: 'Found 30% Section 48 ITC eligibility for facility energy audit...',
    createdAt: '2026-08-24T02:25:00Z',
    updatedAt: '2026-08-24T02:28:00Z',
    tags: ['Grant', 'Rebate', 'CleanEnergy'],
    totalAudited: 15000,
    totalSaved: 4500,
  },
];

export const INITIAL_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  'session-med-dispute': [
    {
      id: 'msg-1',
      role: 'user',
      content:
        'I received a bill from Metro Health for $6,450 following my ER visit. Can you audit this bill, check if there are duplicate codes or illegal balance billing, and prepare a dispute letter?',
      createdAt: '2026-08-24T02:15:00Z',
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content:
        '🛡️ **Audit Complete for Metro Health Regional Medical Center (Account: MH-8849201-B)**\n\nI performed a multimodal line-item audit against CMS Medicare benchmarks and the Federal **No Surprises Act** (Public Law 116-260). Here are my findings:\n\n### 🚨 Discrepancies Flagged:\n1. **CPT 99214 ($440.00) - Unbundling Violation:** Billed alongside CPT 99285 (Level 5 ER Visit). Under CMS NCCI Chapter 1 guidelines, separate outpatient evaluation codes cannot be billed during an emergency visit.\n2. **CPT 00142 ($1,200.00) - Out-of-Network Balance Billing:** The hospital is in-network, but the assistant anesthesiologist billed out-of-network. Under **No Surprises Act Sec. 102**, your payment is capped at the in-network rate of $450.00 (**$750.00 overcharge**).\n3. **CPT 99285 ($2,200.00) - Excess Chargemaster Markup:** Marked up 380% above regional fair pricing median of $1,550.00 (**$650.00 reduction target**).\n\n### 💰 Financial Summary:\n* **Total Billed:** $6,450.00\n* **Fair Benchmark:** $4,610.00\n* **Potential Recovery / Savings:** **$1,840.00**\n\nI have staged **5 real-world actions** ready for 1-click execution:\n- 📄 **Generate Signature-Ready Dispute Letter PDF**\n- 🗓️ **Sync 30-Day Statutory Appeal Deadline to Google Calendar**\n- ✅ **Create Follow-Up Task in Google Tasks**\n- 📊 **Log Recovery in Google Sheets Ledger**\n- 💬 **Dispatch Alert to Slack #financial-defense**\n\nWould you like me to execute all actions or download the PDF dispute letter now?',
      ragSources: [INITIAL_RAG_KNOWLEDGE[0], INITIAL_RAG_KNOWLEDGE[1], INITIAL_RAG_KNOWLEDGE[2]],
      generatedAuditId: 'audit-med-001',
      createdAt: '2026-08-24T02:16:00Z',
    },
  ],
  'session-hardware-po': [
    {
      id: 'msg-h1',
      role: 'user',
      content:
        'We have 3 quotes for 15 developer workstations from Apex Systems, Nexus Cloud, and Vertex IT. Total budget is $30,000. Which vendor gives us the best deal and can you generate a PO?',
      createdAt: '2026-08-24T02:20:00Z',
    },
    {
      id: 'msg-h2',
      role: 'assistant',
      content:
        '📊 **Procurement Comparison & Normalization (15 Developer Workstations)**\n\nI normalized all line items across CPU, RAM, NVMe storage, warranty tiers, and logistics across all 3 proposals:\n\n* **Apex Systems:** $28,400 (Inflated $850 freight + 18% support markup)\n* **Vertex IT:** $27,100 (Slower 5-day SLA, no on-site coverage)\n* **Nexus Cloud Solutions:** **$25,200** (Direct OEM pricing + 3-year ProSupport included)\n\n### 💡 Recommendation:\nBy awarding to **Nexus Cloud Solutions**, you save **$3,200.00** while securing the highest SLA.\n\nI have generated the official Purchase Order **PO-2026-9921** and prepared the Google Sheets comparison matrix.',
      generatedAuditId: 'audit-quote-002',
      createdAt: '2026-08-24T02:21:00Z',
    },
  ],
  'session-clean-energy': [
    {
      id: 'msg-c1',
      role: 'user',
      content:
        'We spent $15,000 upgrading our commercial electrical inverters and batteries. Are there federal or state grants we can claim?',
      createdAt: '2026-08-24T02:25:00Z',
    },
    {
      id: 'msg-c2',
      role: 'assistant',
      content:
        '🌿 **Clean Energy Tax Incentive & Subsidy Match**\n\nYour $15,000 upgrade qualifies for **$4,500.00 in combined subsidies**:\n1. **Federal ITC (IRA 26 U.S.C. § 48):** 30% direct investment credit on $10,000 hardware = **$3,000.00**.\n2. **State Clean Power Rebate:** Commercial grid modernization match = **$1,500.00**.\n\nI have compiled the completed **IRS Form 3468 dossier** and added the October 1 submission deadline to Google Calendar.',
      ragSources: [INITIAL_RAG_KNOWLEDGE[3]],
      generatedAuditId: 'audit-grant-003',
      createdAt: '2026-08-24T02:26:00Z',
    },
  ],
};
