# Heirloom: The Digital Family Legacy Vault

Heirloom is a premium, highly-secure React application designed for families to preserve, organize, and pass down their multi-generational legacy. It offers secure document storage, video legacy archiving, and a cutting-edge "Decision DNA" AI system that simulates the cognitive decision-making models of family members.

## Core Features

- **Multi-Tier Family Hub**: Complete directory management with strict permissions. Tier 1 (Patriarch/Matriarch) accounts can dispatch automated email invitations, manage successions, and control manual inheritance locks.
- **Decision DNA AI Synthesizer**: A robust cognitive assessment engine that builds a dynamic, simulated AI profile for each family member based on 5 worldview dimensions (Risk, Trust, Horizon, Adversity, Ethics). Family members can consult each other's simulated personas for advice.
- **Secure Document & Video Vaults**: Private-by-default multimedia storage with the ability to toggle assets as "Shared with Family," publishing them to the family feed instantly.
- **Automated Direct Onboarding**: Patriarchs generate pre-filled, secure onboarding links that trigger automated email dispatchers. Successors land on a locked registration flow that bypasses verification blocks and auto-links them to their family tree.
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

## Security & Privacy
Heirloom is built around absolute family privacy. Succession vaults and inheritance keys are strictly managed by designated family owners, and all personal documents remain encrypted and private until explicitly shared.

---
*Built by Maanastej*
