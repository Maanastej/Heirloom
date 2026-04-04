## Plan

### 1. Set up Supabase client integration
- Create `src/integrations/supabase/client.ts` with Supabase client config

### 2. Create Auth pages
- **Auth page** (`/auth`): Combined signup/login form with email & password
- Update SignupModal to either redirect to `/auth?mode=signup` or embed auth directly
- "Request Access" → signup flow (one-time), subsequent visits → login

### 3. Create Auth context
- `AuthProvider` with session state, login/logout
- Protected route wrapper component

### 4. Create Dashboard layout
- `/dashboard` - main authenticated area with sidebar navigation
- Three main sections:
  - **Video Legacy**: Upload/manage family legacy videos
  - **Document Vault**: Upload/organize legal documents, property records
  - **Asset Manager**: Track and view all family assets

### 5. Update landing page
- "Begin Your Legacy" / "Request Access" → navigate to `/auth`
- Header shows "Login" when not authenticated, "Dashboard" when authenticated

### 6. Build placeholder dashboard pages
- Video Legacy page (upload UI, video list)
- Document Vault page (upload UI, document list)
- Asset Manager page (asset categories, overview)

**Note**: Dashboard pages will be UI shells initially - file upload and data persistence can be added incrementally.