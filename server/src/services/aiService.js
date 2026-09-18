const { query, haversineDistanceMeters, getDatabaseEngine } = require('../db/db');

// Reference knowledge base for Indian municipal services
const MUNICIPAL_KNOWLEDGE_BASE = [
  {
    topic: 'Property Tax Payment & Assessment',
    keywords: ['property tax', 'house tax', 'sothu vari', 'veettu vari', 'tax assessment', 'online payment', 'property tax pay'],
    summary: 'Property Tax in Tamil Nadu / Urban Local Bodies is paid semi-annually (April-September and October-March).',
    steps: [
      'Visit your municipal corporation online portal (e.g., GCC: chennaicorporation.gov.in or CCMC: ccmc.gov.in / tnurbanepay.tn.gov.in).',
      'Enter your Assessment Number / Zone / Ward / Bill Number from your previous receipt.',
      'Verify the dues, owner details, and rebate/penalty calculation (5% incentive if paid within first 15 days of half-year).',
      'Pay via UPI, Net Banking, Debit/Credit Card, or at designated e-Seva centres / Bank branches.',
      'Download the instant digitally signed payment receipt.'
    ],
    documents: ['Assessment Bill / Previous Receipt', 'Property Owner ID proof', 'Sale Deed / Patta (if reassessing)'],
    helpline: 'GCC Helpline: 1913 | CCMC Helpline: 0422-2302323'
  },
  {
    topic: 'New Water & Sewerage Connection',
    keywords: ['water connection', 'drinking water', 'kudi thanneer', 'metro water', 'sewerage', 'drainage connection', 'twad', 'pipe connection'],
    summary: 'Apply for domestic or commercial drinking water and underground drainage pipeline connection.',
    steps: [
      'Submit Form-1 online through the CMWSSB portal (Chennai) or TWAD/Corporation single window portal.',
      'Attach building plan sanction copy, property tax receipt, and water meter estimation fee.',
      'An Assistant Engineer (AE) will conduct site inspection within 7-10 working days to verify main pipeline tapping point.',
      'Pay road-cut restoration charges and connection deposit online.',
      'Plumbing work completed and meter installed within 15-30 days.'
    ],
    documents: ['Building completion/approval certificate', 'Updated Property Tax Receipt', 'Ownership proof (Sale deed / Patta)', 'Applicant Aadhaar card'],
    helpline: 'Chennai Metro Water: 044-45674567 | Toll-Free: 1916'
  },
  {
    topic: 'Birth and Death Certificate Registration & Download',
    keywords: ['birth certificate', 'death certificate', 'pirappu saandrithazh', 'irappu saandrithazh', 'crs portal', 'certificate download', 'correction'],
    summary: 'Births and deaths must be registered within 21 days of occurrence at the respective hospital or municipal ward office.',
    steps: [
      'Institutional births/deaths are reported directly by the hospital to the ULB Civil Registration System.',
      'Citizens can download digital certificates free of charge from crstn.org or GCC/CCMC portal after 7-14 days using R.O.P/Mother name/Date of birth.',
      'For home births/deaths beyond 21 days, an affidavit and Revenue Divisional Officer (RDO) sanction is required.',
      'Child name inclusion can be updated online within 1 year of birth without penalty.'
    ],
    documents: ['Hospital discharge summary', 'Form 1 (Birth) / Form 2 (Death)', 'Parents/Deceased Aadhaar Card', 'Burial/Cremation receipt (for death)'],
    helpline: 'Civil Registration Portal: crstn.org'
  },
  {
    topic: 'D&O Trade License (New & Renewal)',
    keywords: ['trade license', 'shop license', 'vyabara license', 'trade permit', 'shop permit', 'fssai', 'business permit'],
    summary: 'All commercial establishments, eateries, shops, and industries must obtain a Dangerous & Offensive (D&O) Trade License.',
    steps: [
      'Apply online via the Urban Local Body single window portal (tnurbanepay.tn.gov.in).',
      'Upload shop rental agreement, NOC from property owner, and Fire/Pollution NOC if applicable.',
      'Health Officer / Sanitary Inspector inspects the premise for sanitation, trade category, and worker safety.',
      'License fee is calculated based on horse-power and shop square footage.',
      'Download computerized trade license; renewal is due annually before March 31.'
    ],
    documents: ['Premises Rental Agreement or Tax Receipt', 'Applicant ID & PAN Card', 'FSSAI License (for food trades)', 'Fire Safety NOC (for large shops)'],
    helpline: 'Toll-free MSME / ULB Support: 1800-425-4567'
  },
  {
    topic: 'Street Light & Electricity Repair',
    keywords: ['street light', 'theru vilakku', 'power failure', 'karand varala', 'transformer', 'dark street', 'pole repair'],
    summary: 'Maintenance of municipal street lights, LED fixtures, and distribution timers.',
    steps: [
      'Report the exact pole number and landmark via the Civic Connect app or municipal helpline (1913).',
      'Electrical wing technician receives automated dispatch ticket with GPS location.',
      'Fault rectification (LED replacement / timer relay fix) is executed within 24 to 48 hours SLA.',
      'Civic Connect status changes to Resolved with photo proof.'
    ],
    documents: ['Pole number / Street landmark (no documents needed)'],
    helpline: 'TNEB Minnagam: 94987 94987 | GCC: 1913'
  }
];

// Simple token tokenizer & normalizer
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0B80-\u0BFF]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Compute Jaccard similarity between two text strings
function computeTextSimilarity(text1, text2) {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) {
      intersection++;
    }
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Intelligent Rule-Based & Semantic NLU Classifier
 * Handles English, Tamil, and Tanglish (phonetic Tamil in Latin script)
 */
function localNLUClassifier(description) {
  const text = (description || '').toLowerCase();

  // Category Detection Rules
  const categories = {
    Road: {
      terms: [
        'pothole', 'road', 'salai', 'tar', 'thar', 'asphalt', 'kuzhi', 'path', 'street',
        'speed breaker', 'divider', 'gravel', 'two-wheeler fell', 'accident', 'crater',
        'ரோடு', 'சாலை', 'குழி', 'தார்', 'விபத்து'
      ],
      department: 'Roads & Bridges Department'
    },
    Garbage: {
      terms: [
        'garbage', 'trash', 'waste', 'kuppai', 'dump', 'bin', 'plastic', 'rotting', 'smell',
        'stink', 'conservancy', 'cattle', 'dustbin', 'cleaning', 'debris',
        'குப்பை', 'கழிவு', 'நாற்றம்', 'தூய்மை'
      ],
      department: 'Solid Waste Management (Garbage)'
    },
    Water: {
      terms: [
        'water', 'pipe', 'leak', 'drinking water', 'potable', 'thanneer', 'thanni', 'pipeline',
        'metro water', 'twad', 'burst', 'flooding road', 'no water', 'supply', 'valve',
        'தண்ணீர்', 'குடிநீர்', 'கசிவு', 'பைப்'
      ],
      department: 'Water Supply & Sewerage Board'
    },
    Electricity: {
      terms: [
        'light', 'street light', 'lamp', 'current', 'karand', 'power', 'electric', 'pole',
        'wire', 'spark', 'transformer', 'darkness', 'bulb', 'vilakku', 'theru vilakku',
        'மின்சாரம்', 'தெரு விளக்கு', 'மின் கம்பி', 'இருட்டு'
      ],
      department: 'Electricity & Street Lighting Wing'
    },
    Drainage: {
      terms: [
        'drain', 'drainage', 'gutter', 'sewer', 'sewage', 'culvert', 'choked', 'stagnant',
        'overflow', 'saakadai', 'manhole', 'stink water', 'mosquito', 'monsoon drain',
        'சாக்கடை', 'வடிகால்', 'தேக்கம்', 'கொசு'
      ],
      department: 'Storm Water Drain & Flood Control'
    }
  };

  let bestCategory = 'Other';
  let bestDept = 'General Municipal Administration';
  let maxScore = 0;

  for (const [cat, info] of Object.entries(categories)) {
    let score = 0;
    for (const term of info.terms) {
      if (text.includes(term)) {
        score += term.length > 4 ? 2 : 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
      bestDept = info.department;
    }
  }

  // Severity Detection
  const highSeverityTerms = [
    'danger', 'accident', 'fell', 'hazard', 'spark', 'burst', 'severe', 'flooded', 'emergency',
    'hospital', 'injured', 'deadly', 'exposed wire', 'open manhole', 'child', 'உயிர்', 'ஆபத்து'
  ];
  const lowSeverityTerms = [
    'minor', 'small', 'flickering', 'little', 'slow', 'dim', 'slightly', 'request', 're-paint'
  ];

  let severity = 'Medium';
  if (highSeverityTerms.some((t) => text.includes(t))) {
    severity = 'High';
  } else if (lowSeverityTerms.some((t) => text.includes(t))) {
    severity = 'Low';
  }

  // Cleaned Summary
  let cleaned_description = description.trim();
  if (cleaned_description.length > 120) {
    cleaned_description = cleaned_description.slice(0, 117) + '...';
  }

  return {
    category: bestCategory,
    department: bestDept,
    severity,
    cleaned_description
  };
}

/**
 * Classify Civic Issue using LLM (Gemini or Claude) or local NLU engine
 */
async function classifyIssue(description) {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const prompt = `You are a civic issue classification AI for Indian municipal corporations.
Analyze the citizen's complaint (which might be in English, Tamil, or Tanglish/mixed Tamil-English).
Return ONLY valid JSON matching this schema:
{
  "category": "Road" | "Water" | "Electricity" | "Garbage" | "Drainage" | "Other",
  "department": string (e.g. "Roads & Bridges Department", "Solid Waste Management", "Water Supply & Sewerage", "Electricity & Street Lighting", "Storm Water Drains"),
  "severity": "Low" | "Medium" | "High",
  "cleaned_description": string (a crisp 1-sentence English translation/summary)
}

Citizen complaint: "${description}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const parsed = JSON.parse(candidate);
          return {
            category: parsed.category || 'Other',
            department: parsed.department || 'General Administration',
            severity: parsed.severity || 'Medium',
            cleaned_description: parsed.cleaned_description || description
          };
        }
      }
    } catch (err) {
      console.warn('Gemini classification fallback to local NLU engine:', err.message);
    }
  }

  // Fast & accurate local NLU fallback
  return localNLUClassifier(description);
}

/**
 * Check for duplicate issues within ~50 meters and category/text overlap
 */
async function findDuplicates(lat, lng, category, description, wardId) {
  const targetLat = parseFloat(lat);
  const targetLng = parseFloat(lng);

  if (isNaN(targetLat) || isNaN(targetLng)) {
    return { hasDuplicate: false, candidates: [] };
  }

  // Fetch recent/active posts in nearby area
  let rows = [];
  if (getDatabaseEngine() === 'postgresql') {
    // PostGIS ST_DWithin query (within 60 meters)
    const res = await query(
      `SELECT p.id, p.description, p.cleaned_description, p.category, p.lat, p.lng, p.status, p.photo_url, p.created_at,
              ST_Distance(p.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance_meters,
              COUNT(u.id) as upvotes_count
       FROM posts p
       LEFT JOIN upvotes u ON p.id = u.post_id
       WHERE ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 60)
         AND p.status != 'Resolved'
       GROUP BY p.id
       ORDER BY distance_meters ASC
       LIMIT 5;`,
      [targetLng, targetLat]
    );
    rows = res.rows;
  } else {
    // SQLite: Query posts from same ward or within ~0.001 deg bounding box (~110m)
    const delta = 0.0015;
    const res = await query(
      `SELECT p.id, p.description, p.cleaned_description, p.category, p.lat, p.lng, p.status, p.photo_url, p.created_at,
              (SELECT COUNT(*) FROM upvotes u WHERE u.post_id = p.id) as upvotes_count
       FROM posts p
       WHERE p.status != 'Resolved'
         AND p.lat BETWEEN $1 AND $2
         AND p.lng BETWEEN $3 AND $4
       ORDER BY p.id DESC
       LIMIT 10;`,
      [targetLat - delta, targetLat + delta, targetLng - delta, targetLng + delta]
    );

    rows = res.rows.map((row) => {
      const dist = haversineDistanceMeters(targetLat, targetLng, row.lat, row.lng);
      return {
        ...row,
        distance_meters: Math.round(dist)
      };
    }).filter((r) => r.distance_meters <= 60);
  }

  // Score candidate duplicates based on distance and text similarity
  const duplicates = [];
  for (const post of rows) {
    const dist = post.distance_meters;
    const textSim = computeTextSimilarity(description, post.description + ' ' + (post.cleaned_description || ''));
    const isCategoryMatch = category && post.category.toLowerCase() === category.toLowerCase();

    // Trigger duplicate prompt if within ~50m with matching category OR text similarity
    if (dist <= 50 && (isCategoryMatch || textSim >= 0.2)) {
      duplicates.push({
        id: post.id,
        category: post.category,
        description: post.description,
        cleaned_description: post.cleaned_description,
        photo_url: post.photo_url,
        distance_meters: Math.round(dist),
        text_similarity: parseFloat(textSim.toFixed(2)),
        status: post.status,
        upvotes_count: parseInt(post.upvotes_count || 0, 10),
        match_reason: dist <= 20 ? 'Identical location (within 20m)' : isCategoryMatch ? `Same category (${post.category}) within ${Math.round(dist)}m` : 'High description similarity'
      });
    }
  }

  // Sort by closest distance
  duplicates.sort((a, b) => a.distance_meters - b.distance_meters);

  return {
    hasDuplicate: duplicates.length > 0,
    candidates: duplicates
  };
}

/**
 * AI Guidance Chatbot for Municipal Services
 * Answers questions about property tax, water connection, trade licenses, birth certificates, etc.
 * Supports conversational English, Tamil, and Tanglish.
 */
async function answerCivicGuidance(queryText, conversationHistory = []) {
  const q = (queryText || '').toLowerCase().trim();
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const systemContext = `You are "Civic Sahayak" (சிவக சகாயக்), an expert AI Government Service Guidance Assistant for Indian Municipal Corporations (specifically Greater Chennai Corporation and Coimbatore Corporation in Tamil Nadu).
You guide citizens with clear, friendly step-by-step instructions for:
- Property Tax calculation, exemptions, and online payment (chennaicorporation.gov.in / tnurbanepay.tn.gov.in)
- New Drinking Water & Sewerage connections (CMWSSB / TWAD)
- Birth & Death certificate online registration, name addition, and PDF download (crstn.org)
- D&O Trade License new application & renewal
- Building Plan Sanctions
- Civic Complaints Redressal (Helpline 1913, Minnagam 94987 94987)

Respond in the same language as the user (English, Tamil script, or Tanglish/Colloquial Tamil). Provide clear numbered steps, list required documents, and give direct official portals or helpline numbers.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${systemContext}\n\nUser Question: ${queryText}` }] }
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return {
            reply,
            source: 'gemini-ai',
            suggestedTopics: ['Property Tax', 'New Water Connection', 'Birth Certificate', 'Trade License']
          };
        }
      }
    } catch (err) {
      console.warn('Gemini chat fallback to local civic knowledge base:', err.message);
    }
  }

  // Local Semantic Matcher on Indian Municipal Knowledge Base
  let matchedTopic = null;
  let highestScore = 0;

  for (const item of MUNICIPAL_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (q.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      matchedTopic = item;
    }
  }

  // Detect Tanglish/Tamil greeting or intent
  const isTamilOrTanglish =
    /[ \u0B80-\u0BFF]/.test(queryText) ||
    ['eppadi', 'epdi', 'pannuvathu', 'pannanum', 'sollunga', 'irukku', 'varala', 'kudikanum', 'vaanga'].some((w) => q.includes(w));

  if (!matchedTopic || highestScore === 0) {
    if (isTamilOrTanglish) {
      return {
        reply: `வணக்கம்! நான் உங்கள் "Civic Sahayak" AI வழிகாட்டி. அரசு மற்றும் நகராட்சி சேவைகள் பற்றிய முழு வழிகாட்டலை நான் உங்களுக்கு தருகிறேன்.\n\nநீங்கள் கேட்கக்கூடிய சேவைகள்:\n1. **சொத்து வரி (Property Tax)** செலுத்துவது எப்படி?\n2. **புதிய குடிநீர் மற்றும் கழிவுநீர் இணைப்பு (New Water/Drainage Connection)**\n3. **பிறப்பு / இறப்பு சான்றிதழ் (Birth/Death Certificate)** பதிவிறக்கம்\n4. **தொழில் உரிமம் (Trade License)** பெறுவது எப்படி?\n5. **தெரு விளக்கு / சாலை குறைதீர்ப்பு**\n\nஉங்கள் தேவையை மேலே உள்ள வினாக்களில் ஒன்றைக் கொண்டு அல்லது உங்கள் சொந்த மொழியில் கேளுங்கள்!`,
        source: 'knowledge-base',
        suggestedTopics: ['Property Tax', 'Water Connection', 'Birth Certificate', 'Trade License']
      };
    }
    return {
      reply: `Hello! I am your **Civic Sahayak** AI Assistant. I can help guide you through municipal government services step-by-step:\n\n1. **Property Tax**: Online calculation, rebates & payment receipt download.\n2. **Water & Sewerage Connection**: Form submission, road-cut fees, and timeline.\n3. **Birth & Death Certificate**: Instant download from CRS portal & name inclusion.\n4. **Trade License**: Application for commercial establishments & renewal.\n5. **Civic Complaints**: Municipal helpline 1913 and tracking.\n\nPlease ask about any of these services, or ask your question in English, Tamil, or Tanglish!`,
      source: 'knowledge-base',
      suggestedTopics: ['Property Tax', 'Water Connection', 'Birth Certificate', 'Trade License']
    };
  }

  // Format tailored response
  const stepsFormatted = matchedTopic.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
  const docsFormatted = matchedTopic.documents.map((d) => `• ${d}`).join('\n');

  let replyText = '';
  if (isTamilOrTanglish) {
    replyText = `**${matchedTopic.topic} பற்றிய வழிகாட்டல்:**\n\n${matchedTopic.summary}\n\n**செய்ய வேண்டிய படிநிலைகள் (Steps):**\n${stepsFormatted}\n\n**தேவையான ஆவணங்கள் (Required Documents):**\n${docsFormatted}\n\n📞 **உதவி எண்கள்:** ${matchedTopic.helpline}\n\nமேலும் ஏதேனும் சந்தேகம் இருந்தால் தாராளமாகக் கேளுங்கள்!`;
  } else {
    replyText = `### Guidance: ${matchedTopic.topic}\n\n${matchedTopic.summary}\n\n#### Step-by-Step Process:\n${stepsFormatted}\n\n#### Required Documents:\n${docsFormatted}\n\n📌 **Official Helpline / Support:** ${matchedTopic.helpline}\n\nNeed more details on any specific step? Feel free to ask!`;
  }

  return {
    reply: replyText,
    source: 'knowledge-base',
    matchedTopic: matchedTopic.topic,
    suggestedTopics: ['Property Tax', 'Water Connection', 'Birth Certificate', 'Trade License']
  };
}

module.exports = {
  classifyIssue,
  findDuplicates,
  answerCivicGuidance,
  computeTextSimilarity
};
