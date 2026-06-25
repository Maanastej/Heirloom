# Heirloom: The Digital Family Legacy Vault

Heirloom is a premium, highly-secure React application designed for families to preserve, organize, and pass down their multi-generational legacy. It brings together secure documents, high-fidelity video preservation, asset tracking, and a next-generation "Decision DNA" advisor into a single family vault.

<div align="center">
  <video src="./images%20and%20videos/Screen%20Recording%202026-06-13%20120638.mp4" width="80%" controls></video>
</div>

## Core Features

- **Dashboard Workspace**: A unified family dashboard with five core tabs:
  - **Video Legacy** — manage recorded stories, guided sessions, and time-released messages.
  - **Document Vault** — store sensitive legal documents with private sharing controls.
  - **Asset Manager** — track family assets, holdings, and digital legacy data.
  - **Decision DNA** — capture your decision-making profile, validate AI alignment, and consult simulated family advisors.
  - **Family Hub** — invite, manage, and assign access roles for family members.

<div align="center">
  <img src="./images%20and%20videos/Screenshot%202026-06-13%20114426.png" alt="Decision Twin Dashboard" width="80%" />
</div>

- **Decision DNA Advisor**: Model and preserve family decision logic using intelligent worldview capture. Includes validation tools and accuracy metrics for the generated persona.



- **Video Legacy Preservation**: Support for guided recording, personal messages, and family-only archives. Video content is positioned as a core legacy asset, not just a media file.

- **Secure Document Storage**: Private-by-default storage for wills, deeds, letters, and vault assets, with controls for sharing to family members.

- **Family Access & Roles**: Multiple access tiers and role-aware family management let owners define exactly who can view, edit, or inherit each part of the vault.

<div align="center">
  <img src="./images%20and%20videos/Screenshot%202026-06-13%20114820.png" alt="Family Registry and Inheritance Lock" width="80%" />
</div>

- **Responsive Navigation**: Modern desktop sidebar and mobile-friendly drawer navigation for fast access to all dashboard sections.

- **Updated Landing Navigation**: The public site navigation now explicitly surfaces `Decision DNA`, `The Vault`, `Video Legacy`, and `Security`.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui, Lucide Icons
- **State Management**: TanStack Query (React Query)
- **Backend / Auth**: Supabase (PostgreSQL, Storage, Auth)
- **Routing**: React Router DOM

## Latest Release Highlights

- **Single Brain Architecture**: Migrated reasoning engine exclusively to `llama-3.3-70b-versatile` to enforce a unified pipeline.
- **Robust GraphRAG Fallback**: Introduced a strict offline "Discovery Mode" renderer. If network calls fail, the system instantly degrades safely without UI collapse, outputting a highly deterministic JSON payload (`FALLBACK_SAFE_MODE`).
- **Push Protection Pipelines**: Enforced strict `.env`-only secret management to clear GitHub push protections and remove legacy keys.
- **Dashboard Completion**: Completed the full five-section structure of the family vault.
- **Improved UI Navigation**: Added explicit **Decision DNA** and **Video Legacy** navigation labels on the public site and fixed capability maps.

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

## Evaluation Framework V3

### Completed Improvements
* Fixed retrieval evaluation pipeline
* Eliminated benchmark leakage
* Added hard semantic retrieval benchmark
* Integrated vector retrieval mode
* Added deterministic extraction scoring
* Replaced LLM arithmetic with semantic alignment judging
* Added extraction error analysis workflow

### Current Evaluation Status
* Domain Classification Accuracy: 79.2% (Human Benchmark, n=120)
* Retrieval Performance (V3 Semantic Benchmark, n=200 queries, 500 corpus size):
  - **Recall@1**: 87.00%
  - **Recall@3**: 94.50%
  - **Recall@5**: 94.50%
  - **MRR**: 0.9075
  - **nDCG@5**: 0.9173
* Memory Extraction Evaluation: Framework operational with deterministic scoring
* Memory Extraction Prompt V2 improved candidate F1 from 59.7% → 73.7% on a partial benchmark subset

### Architecture Highlights
* Semantic memory retrieval
* GraphRAG memory context assembly
* Deterministic evaluation pipeline
* Multi-judge architecture
* Traceable error analysis

For detailed evaluation methodology and additional metrics, see [Evaluation Report V3](./Evaluation%20Report.md).
## Security & Privacy
Heirloom is built around absolute family privacy. Succession vaults and inheritance keys are strictly managed by designated family owners, and all personal documents remain encrypted and private until explicitly shared.

---
*Built by Maanastej*
