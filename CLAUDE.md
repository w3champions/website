# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Backend Integration
The backend belonging to this repository lives in ../website-backend. Whenever you're making changes, consider whether the backend should also be adjusted. If you need additional context for an API, consult the backend repository as well.

## Common Development Commands

### Development
```bash
npm run dev           # Start development server at http://localhost:5173
npm run build:prod    # Production build with locale generation
npm run build         # Build without locale generation
```

### Code Quality
```bash
npm run lint          # Run ESLint to check for code issues
npm run lint:fix      # Auto-fix ESLint issues
npm run dprint        # Check code formatting
npm run dprint:fix    # Auto-format code with dprint
npm run type-check-vue # Type-check .ts and .vue files (what CI runs)
```

## Architecture Overview

### Technology Stack
- **Vue 3.4** for the frontend framework
- **TypeScript 6.0** for type safety
- **Vuetify 3.10** for Material Design components
- **Pinia** for state management (stores in `/src/store/`)
- **Vue Router 4** for routing
- **Vite** as the build tool
- **Chart.js** for data visualization
- **TipTap** for rich text editing

### Project Structure
- `/src/services/` - API service layer for backend communication
- `/src/store/` - Pinia stores for state management
- `/src/components/` - Reusable Vue components
- `/src/views/` - Page-level components
- `/src/router/` - Routing configuration
- `/public/env.js` - Environment configuration (API URLs)

### Key Systems

#### Authentication & Permissions
- JWT-based authentication with BattleTag identifiers
- Admin permissions checked via `CheckIfBattleTagIsAdmin` filter
- OAuth integration for Patreon linking
- Permission store manages user roles and access

#### Rewards System
- Comprehensive reward management for Patreon/Ko-Fi subscribers
- Automatic webhook processing for subscription events
- Portrait rewards and special pictures integration
- Admin tools for drift detection and manual assignment

#### Admin Components
The admin section (`/src/components/admin/`) includes:
- `AdminRewards.vue` - Reward template management
- `AdminAssignments.vue` - User reward assignments
- `AdminPatreonLinks.vue` - Patreon account linking management
- `AdminDriftDetection.vue` - Sync discrepancy monitoring
- `AdminProductMappings.vue` - Provider product to reward mapping

#### Commercial Events
The "Commercial Events" admin section (permission `CommercialLicense`) has four pages under `/admin/commercial-events/`: `tagged-accounts`, `allocations`, `events` (detail view at `events/<eventId>`) and `active-games`.
- Client: `src/services/admin/CommercialEventsService.ts`; website-backend proxies `api/admin/commercial-events/...` to the matchmaking service.
- Pure helpers with tests (drafts, validation, formatting, error messages by `code`): `src/store/admin/commercialEvents/`. Pages and dialogs: `src/components/admin/commercial-events/`.
- Admin date fields are entered and shown in UTC. Battle tags are stored and compared exactly as written (never case-folded).
- How events, allocations, periods and event games work: `docs/commercial-events.md` in the matchmaking-service repository.

### API Integration Patterns

#### Service Layer
All API calls go through service classes in `/src/services/`:
```typescript
// Example: AdminService.ts
async getRewards(): Promise<Reward[]> {
  return await axios.get<Reward[]>(`${API_URL}admin/rewards`);
}
```

#### Store Pattern
Stores use Pinia with typed state and actions:
```typescript
// Example store pattern
export const useRewardsStore = defineStore("rewards", {
  state: (): RewardsState => ({
    rewards: [],
    loading: false
  }),
  actions: {
    async loadRewards() {
      // Implementation
    }
  }
});
```

### Component Conventions

#### PlayerSearch Integration
When implementing user search functionality, use the `PlayerSearch` component:
```vue
<PlayerSearch
  @playerFound="onPlayerFound"
  @searchCleared="onPlayerSearchCleared"
/>
```
Optional `@searchTextChanged="(text) => ..."` fires on every edit of the search text; use it to drop a previous selection once the text no longer matches.

#### URL Encoding for BattleTags
Always encode BattleTags in URLs due to the # character:
```typescript
encodeURIComponent(battleTag) // "player#123" -> "player%23123"
```

#### Loading States
Use Vuetify's loading components consistently:
```vue
<v-progress-circular v-if="loading" indeterminate />
<v-skeleton-loader v-else-if="!data" type="table" />
```

### Testing Approach
Vitest covers pure helpers only (`npm test`; tests live beside the code as `src/**/*.test.ts`, run in the `node` environment with `node:assert/strict`). There are no component tests. When making changes:
1. Run `npm test` for the helper tests (add one when you change a pure helper)
2. Run `npm run lint` to catch TypeScript and linting errors
3. Run `npm run dprint` to ensure consistent formatting
4. Test UI functionality manually in development mode and verify no console errors in the browser developer tools

### Environment Configuration
Development environment variables are in `/public/env.js`:
- `BASE_URL` - Backend API URL
- `IDENTIFICATION_URL` - Auth service URL
- `LAUNCHER_UPDATE_URL` - Update service URL
- `INGAME_STATIC_RESOURCES_URL` - CDN for game resources

### Localization
- Translations managed via Google Sheets (see README)
- Generated with `npm run generate-locales`
- Locale files in `/src/locales/`
- Use `$t()` or `$i18n.t()` for translations

### Important Notes
- This is a Vue 3 codebase - use Vue 3 patterns and APIs
- Always check if backend changes are needed
- Respect the existing code style and patterns
- Use TypeScript types from `/src/store/*/types.ts`
- Follow Vuetify 3 component patterns