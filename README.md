# Heirloom: The Digital Family Legacy Vault

Heirloom is a premium, highly-secure React application designed for families to preserve, organize, and pass down their multi-generational legacy. It brings together secure documents, high-fidelity video preservation, asset tracking, and a next-generation "Decision DNA" advisor into a single family vault.

## Core Features

- **Dashboard Workspace**: A unified family dashboard with five core tabs:
  - **Video Legacy** — manage recorded stories, guided sessions, and time-released messages.
  - **Document Vault** — store sensitive legal documents with private sharing controls.
  - **Asset Manager** — track family assets, holdings, and digital legacy data.
  - **Decision DNA** — capture your decision-making profile, validate AI alignment, and consult simulated family advisors.
  - **Family Hub** — invite, manage, and assign access roles for family members.

- **Decision DNA Advisor**: Model and preserve family decision logic using intelligent worldview capture. Includes validation tools and accuracy metrics for the generated persona.

- **Video Legacy Preservation**: Support for guided recording, personal messages, and family-only archives. Video content is positioned as a core legacy asset, not just a media file.

- **Secure Document Storage**: Private-by-default storage for wills, deeds, letters, and vault assets, with controls for sharing to family members.

- **Family Access & Roles**: Multiple access tiers and role-aware family management let owners define exactly who can view, edit, or inherit each part of the vault.

- **Responsive Navigation**: Modern desktop sidebar and mobile-friendly drawer navigation for fast access to all dashboard sections.

- **Updated Landing Navigation**: The public site navigation now explicitly surfaces `Decision DNA`, `The Vault`, `Video Legacy`, and `Security`.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui, Lucide Icons
- **State Management**: TanStack Query (React Query)
- **Backend / Auth**: Supabase (PostgreSQL, Storage, Auth)
- **Routing**: React Router DOM

## Latest Release Highlights

- Added explicit **Decision DNA** and **Video Legacy** navigation labels on the landing page.
- Completed dashboard structure with all five main vault sections.
- Improved video legacy section with guided recording and time-release messaging.
- Enhanced family hub workflows for role-based access.
- Integrated robust GraphRAG fallback rendering to prevent UI collapse during offline mode.
- Standardized the reasoning engine onto `llama-3.3-70b-versatile` for more stable Decision DNA outputs.
- Established strict Push Protection pipelines by enforcing `.env`-only secret management.

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

## Decision DNA Validation

Heirloom includes validation tooling for the Decision DNA advisor to measure how closely the generated persona matches user decision patterns.

### Metrics & Methodology
- **F1-Score**: Harmonic mean of Precision and Recall.
- **ROC-AUC**: Measures the ranking power of the advisor's confidence scores.
- **Accuracy**: Proportion of matched decisions.
- **Precision / Recall**: Evaluate correctness and coverage of positive advice.
- **Cohen's Kappa**: Agreement metric beyond chance.
- **MAE**: Average probability error between advisor scores and user decisions.
- **Cosine Similarity**: Similarity between decision vectors.

> Example calibration results:
>
> - **F1-Score**: 0.85
> - **ROC-AUC**: 0.92
> - **Precision**: 0.86
> - **Recall**: 0.84
> - **Accuracy**: 0.88

## Security & Privacy
Heirloom is built around absolute family privacy. Succession vaults and inheritance keys are strictly managed by designated family owners, and all personal documents remain encrypted and private until explicitly shared.

---
*Built by Maanastej*
