# Heirloom: The Digital Family Legacy Vault

Heirloom is a premium, highly-secure React application designed for families to preserve, organize, and pass down their multi-generational legacy. It offers secure document storage, video legacy archiving, and a cutting-edge "Decision DNA" AI system that simulates the cognitive decision-making models of family members.

## Core Features

- **Multi-Tier Family Hub**: Complete directory management with strict permissions. Tier 1 (Founder/Owner) accounts can dispatch automated email invitations, manage successions, and control manual inheritance locks.
- **Decision DNA AI Synthesizer**: A robust cognitive assessment engine that builds a dynamic, simulated AI profile for each family member based on 5 worldview dimensions (Risk, Trust, Horizon, Adversity, Ethics). Includes a built-in validation suite that quantifies model accuracy (F1-Score, ROC-AUC, Precision, Recall) using real-time validation scenarios. Family members can consult each other's simulated personas for advice.
- **Secure Document & Video Vaults**: Private-by-default multimedia storage with the ability to toggle assets as "Shared with Family," publishing them to the family feed instantly.
- **Automated Direct Onboarding**: Founders generate pre-filled, secure onboarding links that trigger automated email dispatchers. Successors land on a locked registration flow that bypasses verification blocks and auto-links them to their family tree.
- **Offline / Local Fallback Architecture**: Fully robust dual-state data engine. When Supabase cloud connections are unavailable, Heirloom falls back to a highly realistic simulated `localStorage` model, ensuring flawless demonstrations and functionality at all times.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui, Lucide Icons
- **State Management**: TanStack Query (React Query)
- **Backend / Auth**: Supabase (PostgreSQL, Edge Functions, Storage Buckets, Auth)
- **Routing**: React Router DOM

## Running the Project

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

```sh
# Clone the repository
git clone https://github.com/Maanastej/Heirloom.git
cd Heirloom

# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

## Environment Setup
For full production deployment, connect to a Supabase project and set the following environment variables in your `.env` file:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Decision DNA Replication Validation

To ensure the cognitive replication of family members is mathematically accurate, Heirloom implements a validation suite.

### Metrics & Methodology
- **Classification Framing**: We present the user and the AI with validation test cases. The user's choices establish the ground truth $y \in \{0, 1\}$.
- **F1-Score**: Calculates the harmonic mean of Precision and Recall. High F1 represents a high overlap on decision choices.
- **ROC-AUC**: Evaluates how effectively the AI's confidence scores separate positive decisions from negative ones. An AUC of `1.0` represents a perfect replication of the user's decision boundary.
- **Accuracy**: Overall proportion of correct predictions across validation cases.
- **Cohen's Kappa**: Measures agreement between AI predictions and user choices beyond chance.
- **Mean Absolute Error (MAE)**: Average absolute difference between AI probability scores and user binary choices.
- **Cosine Similarity**: Similarity between the binary ground truth vector and AI probability vector.
- **Confusion Matrix**: Displays True Positives, False Positives, True Negatives, and False Negatives to help calibrate the model's sensitivity.

> **Current Calibration Results (example)**
>
> - **F1-Score**: 0.85
> - **ROC-AUC**: 0.92
> - **Precision**: 0.86
> - **Recall**: 0.84
> - **Accuracy**: 0.88
>
> *Run the calibration by accessing the Decision DNA dashboard, answering the validation questions, and the results will be displayed here.*

## Recent Update: Embeddings, Retrieval, and Decision Logs

This release upgrades the Decision DNA system to support embedding-backed profiles and retrieval-augmented generation (RAG). Key changes:

- **Profile Embeddings:** Each synthesized `dna_profile` stores a `profile_embedding` (1536-d float vector) for semantic similarity searches.
- **Decision Logs:** Introduced `decision_logs` to persist user Q/A session history with `log_embedding` vectors for RAG and auditing.
- **pgvector Support:** Supabase migration enables the `vector` extension and adds `profile_embedding` and `log_embedding` columns so you can run nearest-neighbour similarity searches directly in Postgres.
- **RAG & Confidence Scoring:** Chat responses can retrieve top similar decision logs for context and return confidence / cosine-similarity scores to indicate how closely a response matches the profile's historical decisions.
- **Local Fallbacks:** Embedding generation and retrieval gracefully fall back to localStorage mocks when Supabase or the embedding API is unavailable, preserving demoability.
- **Validation Metrics Expanded:** README and UI now surface F1, ROC-AUC, Precision, Recall, Accuracy, Cohen's Kappa, MAE, and Cosine Similarity for transparency and model calibration.

See `supabase/migrations/20260519000000_add_family_and_dna_upgrades.sql` for the exact migration changes and `src/components/dashboard/DecisionDNA.tsx` for the embedding and retrieval scaffolding.

## Security & Privacy
Heirloom is built around absolute family privacy. Succession vaults and inheritance keys are strictly managed by designated family owners, and all personal documents remain encrypted and private until explicitly shared.

---
*Built by Maanastej*
