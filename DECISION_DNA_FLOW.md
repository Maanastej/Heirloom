# Decision DNA: Complete Flow Architecture

## 🎯 Overview
Decision DNA is a **AI Digital Twin** system that learns and preserves your decision-making patterns. It captures your values, rules, and behavioral patterns to create a personal advisory model that can simulate your decisions for future scenarios.

---

## 📊 PART 1: TRAINING PIPELINE

### Phase 1: Initial Onboarding (Create Your Twin)
**File**: `DecisionDNA.tsx` (lines 771-887)

#### Step 1A: Choose or Create Twin
- User clicks "Map Your Decision DNA" card
- Two options:
  1. **New Twin**: Create a fresh DNA model for self
  2. **Existing Profiles**: View previously trained profiles

**Database**: `dna_profiles` table
- Each profile stores base training data with scoring metrics

---

### Phase 2: Three-Step Interview (MCQ + Open-Ended)

#### Step 2A: Core Family Values (Text Input)
- **Prompt**: "Define the fundamental priorities that guide your decisions"
- **Captured in**: `draftAnswers.values`
- **Example**: "Hard work, faith, integrity, and absolute devotion to family legacy"
- **Stored**: `core_values` field in `dna_profiles`

#### Step 2B: Guardrails & Rules (Text Input)
- **Prompt**: "State absolute boundaries (e.g. Always debt-free, long-term focus)"
- **Captured in**: `draftAnswers.rules`
- **Example**: "Always save 30% of what you make, never go to sleep angry at your kin"
- **Stored**: `decision_rules` field in `dna_profiles`

#### Step 2C: Life Crucible Experience (Text Input)
- **Prompt**: "Describe a major career or life event that taught you a lasting lesson"
- **Captured in**: `draftAnswers.experiences`
- **Example**: "Rebuilding our family farm after a critical drought taught me community value"
- **Stored**: `life_experiences` field in `dna_profiles`

#### Step 2D: Risk Assessment MCQs (10 questions)
- Multiple choice questions capture personality traits:
  - **draftMCQAnswers[1]** → risk_score
  - **draftMCQAnswers[10]** → adversity_score
- Other defaults: trust_score=3, horizon_score=4, ethics_score=4

**Results stored**:
```javascript
{
  risk_score,
  trust_score,
  horizon_score,
  adversity_score,
  ethics_score,
  core_values,
  decision_rules,
  life_experiences
}
```

---

### Phase 3: Synthesis (Training State)
**File**: `DecisionDNA.tsx` (finishTest function, lines 600-700)

When user clicks "Complete Synthesis":

1. **Insert Profile into Database**
   ```javascript
   const { data } = await supabase
     .from('dna_profiles')
     .insert({
       family_id,
       created_by: user.id,
       name: currentUserName,
       relationship: "Self",
       risk_score,
       trust_score,
       horizon_score,
       adversity_score,
       ethics_score,
       core_values,
       decision_rules,
       life_experiences
     })
     .select()
     .single();
   ```

2. **Calculate Archetype**
   - Based on 5 personality scores (risk, trust, horizon, adversity, ethics)
   - Examples:
     - High risk + Low trust = "The Guarded Trailblazer"
     - High horizon + High ethics = "The Legacy Builder"
     - Low risk + High ethics = "The Compassionate Guardian"

3. **Show Loading State**
   - "Synthesizing Worldview DNA..."
   - Simulates backend processing

4. **Activate Dashboard**
   - Profile now appears in dashboard tabs
   - User can now:
     - Add memories
     - Record decisions
     - Extract principles
     - Ask simulation questions

---

## 📚 PART 2: CONTINUOUS LEARNING (Training Data Ingestion)

### Memory Preservation Pipeline
**Location**: Dashboard → Identity Tab → Memory Preservation Panel

#### Input: Add Memory
- **Title**: Short description (e.g., "Father's Business Advice")
- **Content**: Long-form narrative
- **Year**: When it occurred
- **Event Type**: family, career, relationship, financial, health
- **Emotion**: hope, fear, joy, sadness, calm
- **Importance Score**: 1-10
- **People Involved**: Comma-separated names

#### Processing: Media Ingestion Pipeline
Users can upload via four media types:
1. **Video Recording** (transcribed to text)
2. **Voice Note/Audio** (transcribed to text)
3. **PDF/Legacy Document** (OCR extracted)
4. **Personal Letter/Journal** (raw text input)

**Database**: `memories` table
- `profile_id`: Links to DNA profile
- `title`, `content`: Text fields
- `year`, `event_type`, `emotion`, `importance_score`, `people_involved`

---

### Decision Journal Entry
**Location**: Dashboard → Identity Tab → Decision Journal

#### Input: Record a Decision
- **Situation**: What was the decision about?
- **Options**: What were the alternatives? (min 2)
- **Selected Option**: Which one did you choose?
- **Reasoning**: Why did you make this choice? (moral trade-offs, emotional state)
- **Emotional State**: calm, anxious, confident, uncertain, calm
- **Outcome**: What happened?
- **Outcome Quality**: 1-10 self-assessment

**Database**: `decision_journal` table
- `profile_id`: Links to DNA profile
- `situation`, `options`, `selected_option`, `reasoning`
- `emotional_state`, `outcome`, `outcome_quality`
- `decision_date`: ISO timestamp

---

### Principle Extraction Pipeline
**File**: `principleEngine.ts` (lines 42-150+)

Automatically triggered after Memory or Decision is added.

#### Step 1: Fetch Evidence
- Get all memories for profile
- Get all decisions for profile
- If empty, return empty principles (never fabricate)

#### Step 2: Thematic Clustering
Groups evidence by theme:
- "Family & Relationships"
- "Financial Stability"
- "Long-Term Planning"
- "Career & Growth"
- "Risk Management"
- "Ethics & Values"

Each theme only created if it has supporting evidence.

#### Step 3: Extract Principles
For each theme cluster:
- Calculate **Dynamic Confidence Score**:
  ```
  - Base: (memoryWeight + decisionWeight) / totalEvidence
  - Penalty: contradictingCount * 0.15
  - Cap based on evidence count:
    - <3 pieces: 40% max
    - 3-5 pieces: 55% max
    - 5-8 pieces: 70% max
    - 8+ pieces: 80% max
  ```

**Database**: `principles` table
- `profile_id`, `title`, `description`, `category`
- `confidence_score`: 0.0-1.0
- `supporting_evidence`: array of IDs
- `contradicting_evidence`: array of IDs

---

### Graph Knowledge Base
**Location**: Dashboard → Intelligence Tab → Knowledge Graph

When memory/decision/principle is added, a graph node is created:

```javascript
// Memory → Node
node = { entity_type: "Memory", label: memory.title }
edge = { source: person_node, target: memory_node, type: "RECALLED" }

// Decision → Node  
node = { entity_type: "Decision", label: decision.situation }
edge = { source: person_node, target: decision_node, type: "MADE" }

// Principle → Node
node = { entity_type: "Principle", label: principle.title }
edge = { source: person_node, target: principle_node, type: "INSPIRED" }
```

**Database**: `graph_nodes` and `graph_edges` tables
- Enables knowledge retrieval and connections

---

## 🤖 PART 3: SIMULATION & INFERENCE

### Query Processing Flow
**File**: `DecisionDNA.tsx` (handleAsk function, lines 446-550)

#### Phase 19A: User Asks Question
User types a question (e.g., "How would I handle a business partner betrayal?")

#### Phase 19B: Retrieve Context
**Function**: `retrieveGraphRAGContext()`

Fetches from graph database:
- Relevant memories (semantic search)
- Related decisions
- Applicable principles
- Evidence confidence scores

#### Phase 19C: Generate Simulation Response
**Function**: `generateSimulatorResponse()`
- **Inputs**: 
  - Twin's name and personality scores
  - Question
  - Retrieved context (memories, decisions, principles)
  - Past Q&A history
  - Groq API key (LLM backend)

- **Output**: Structured response including:
  ```javascript
  {
    recommendation: "string",
    confidence: 0.0-1.0,
    reasoning: "string",
    domain: "financial|family|career|moral|etc",
    twinUncertainty: "what the twin is unsure about",
    nextQuestion: {
      question: "follow-up question to reduce uncertainty",
      variableId: "which variable this targets",
      options: ["option A", "option B", "option C"]
    }
  }
  ```

---

### Phase 19D: Confidence-Driven Follow-Up (Optional)
If confidence < 70%:
- System enters "Discovery Mode"
- Shows next follow-up question
- User selects from MCQ options

#### Phase 20: Learning Loop
**Function**: `analyzeUserResponse()`

When user answers follow-up question:

1. **Extraction**: Parse answer for new insights
   ```
   analyzeUserResponse(profileId, followUpQuestion, userAnswer)
   → Returns: extractedItems (new variables, values, rules)
   ```

2. **Update Memory**: Add new insights to backend

3. **Refresh Data**: Reload profile state (`loadActiveProfileData()`)

4. **Re-simulate**: 
   - Auto-run original question with expanded context
   - New recommendation generated with updated confidence
   - Log: "Confidence Before: 45% → Confidence After: 72%"

---

## 🔐 PART 4: OPTOUTS & ACCESS CONTROL

### Family Access Tiers
**File**: `FamilyAccess.tsx` and `FamilyHub.tsx`

#### Tier 1: Founder/Owner (Full Access)
- Complete vault access
- Add/remove family members
- Set inheritance rules
- Record video legacy
- Manage all documents
- **Can optout**: Self data collection

#### Tier 2: Core Family (Extended Access)
- View approved documents
- Access family videos
- Add personal content
- View family history
- Limited editing rights
- **Can optout**: View option for specific content

#### Tier 3: Extended Family (View Access)
- View shared content
- Watch public videos
- Read family stories
- No editing
- **Cannot optout**: Managed by Founder

#### Tier 4: Future Heirs (Time-Locked)
- Scheduled access dates (via `is_inherited` flag)
- Milestone unlocks
- Inherit permissions
- **Optout mechanism**: Time-locked access revocation

---

### Data Retention & Optouts

#### DNA Profile Optout
User can request to **not train** their Decision DNA:
- Skip the interview entirely
- Join as family member without personal profile
- Access other family members' profiles in view mode

#### Invited Member Can Decline
When invited to family vault:
- Email pre-authorization: `family_invites` table
- User can **choose not to accept invite**
- Never becomes part of the family registry

#### Member Removal (Founder Only)
```javascript
handleRemoveMember(memberId)
→ Deletes from members list
→ Revokes access to family content
→ Toast: "Member Severed: Member credentials detached"
```

#### Invite Revocation (Before Acceptance)
```javascript
handleCancelInvite(inviteId)
→ Deletes pending invite
→ User never receives access link
→ Toast: "Invite Revoked"
```

---

### Time-Locked Inheritance Control
**File**: `FamilyHub.tsx` (lines 350-420)

#### Default State: `is_inherited = false`
- Future Heir accounts are **fully isolated**
- Cannot access sensitive financial/will records
- Encrypted in backend storage

#### Release State: `is_inherited = true`
- Only Tier 1 (Founder) can trigger release
- Future Heirs gain full operational access
- Vault Key State: "RELEASED"

```javascript
toggleInheritance(nextState)
→ Updates `families` table: is_inherited
→ Notifies: "Inheritance Key Released" or "Legacy Vault Secured"
```

---

### Privacy & Sovereignty
**Mentioned**: "Sovereign Privacy" section

- Your DNA model remains **encrypted** in your private vault
- No data sharing unless explicitly toggled
- **Document sharing**: Private by default, Shared optionally
- GDPR compliance ready (mentioned in Security section)

---

## 📈 PART 5: EVALUATION & CONTINUOUS IMPROVEMENT

### Twin Accuracy Tracking
**Location**: Dashboard → Accuracy Tab → Twin Evaluation Registry

#### Manual Evaluation Entry
User records:
- **Question**: Simulation scenario
- **Predicted Decision**: What the twin recommended
- **Real User Decision**: What they actually did
- **Confidence Score**: 0.0-1.0 (how confident was the twin)
- **Outcome**: Whether prediction was correct

#### Metrics Calculated
- **Accuracy**: % correct predictions
- **Precision**: True positives / (True positives + False positives)
- **Recall**: True positives / (True positives + False negatives)
- **F1 Score**: Harmonic mean of precision/recall
- **Calibration Error**: |predicted confidence - actual accuracy|

**Database**: `evaluations` table

#### Model Drift Detection
Compares model's current behavior against verified human choices:
- If matches: "No model drift detected!"
- If diverges: Shows drift suggestions

---

## 🔄 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: INITIAL TRAINING                                   │
├─────────────────────────────────────────────────────────────┤
│  Interview (Values, Rules, Experiences) + MCQ Scores        │
│  ↓                                                            │
│  Insert into dna_profiles table                              │
│  ↓                                                            │
│  Calculate Archetype (5-score model)                         │
│  ↓                                                            │
│  Profile Active in Dashboard                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2-4: CONTINUOUS LEARNING                              │
├─────────────────────────────────────────────────────────────┤
│  Memory → Principle Extraction → Graph Update               │
│  Decision → Principle Extraction → Graph Update             │
│  Media Upload → NLP Processing → Memory Creation            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: SIMULATION & INFERENCE                             │
├─────────────────────────────────────────────────────────────┤
│  User Question                                               │
│  ↓                                                            │
│  Retrieve Context (GraphRAG)                                │
│  ↓                                                            │
│  Generate Response (Groq LLM)                               │
│  ↓                                                            │
│  Confidence < 70%? → Ask Follow-up (MCQ)                    │
│  ↓                                                            │
│  Analyze Answer → Extract New Insights                      │
│  ↓                                                            │
│  Re-simulate with Updated Context                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 6: EVALUATION                                         │
├─────────────────────────────────────────────────────────────┤
│  User Records: Real decision vs Twin's prediction            │
│  ↓                                                            │
│  Calculate: Accuracy, Precision, Recall, F1, Calibration    │
│  ↓                                                            │
│  Detect Model Drift                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ OPTOUT DECISION TREE

```
User Invites to Join Family Vault
    ↓
    ├─ [ACCEPT] → Onboarding flow
    │   ↓
    │   ├─ [Train Decision DNA] → Full participation
    │   │   ↓
    │   │   ├─ Add memories ✓
    │   │   ├─ Record decisions ✓
    │   │   ├─ View principles ✓
    │   │   └─ Ask simulations ✓
    │   │
    │   └─ [Skip DNA Training] → View-only mode
    │       ↓
    │       ├─ View shared documents ✓
    │       ├─ View family videos ✓
    │       └─ No personal profile ✓
    │
    └─ [DECLINE/OPTOUT] → No account created
        ↓
        → No data stored
        → Can rejoin later with new invite
        → No rights granted
```

---

## 🎯 Key Optout Points

1. **Pre-Training**: Skip DNA interview entirely
2. **Post-Training**: Delete DNA profile (implied)
3. **Family Access**: Remove member (founder only)
4. **Document Sharing**: Toggle private/shared per document
5. **Data Collection**: Don't record memories/decisions
6. **Inheritance Release**: Keep Future Heirs locked (default)

---

## 📝 Database Schema Summary

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `dna_profiles` | Twin training data | risk_score, trust_score, core_values, decision_rules |
| `memories` | User memory records | title, content, year, emotion, importance_score |
| `decision_journal` | Decision logs | situation, options, selected_option, reasoning, outcome_quality |
| `principles` | Extracted rules | title, category, confidence_score, supporting_evidence |
| `graph_nodes` | Knowledge entities | entity_type (Memory/Decision/Principle), label |
| `graph_edges` | Entity relationships | source, target, type (RECALLED/MADE/INSPIRED) |
| `evaluations` | Accuracy tracking | question, predicted_decision, real_user_decision, is_correct |
| `families` | Family registry | family_id, is_inherited |
| `profiles` | User auth data | user_id, family_id, role, relationship |
| `family_invites` | Pending invitations | email, role, token, expires_at |
