# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Backend Integration
The backend belonging to this repository lives in ../website-backend. Whenever you're making changes, consider whether the backend should also be adjusted. If you need additional context for an API, consult the backend repository as well.

## Common Development Commands

### Development
```bash
yarn dev              # Start development server at http://localhost:5173
yarn build:prod       # Production build with locale generation
yarn build:dev        # Development build without locale generation
```

### Code Quality
```bash
yarn lint             # Run ESLint to check for code issues
yarn lint:fix         # Auto-fix ESLint issues
yarn dprint           # Check code formatting
yarn dprint:fix       # Auto-format code with dprint
```

## Architecture Overview

### Technology Stack
- **Vue 2.7** with Composition API support (not Vue 3)
- **TypeScript 4.9** for type safety
- **Vuetify 2.7** for Material Design components
- **Pinia** for state management (stores in `/src/store/`)
- **Vue Router 3** for routing
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
  @playerSearchCleared="onPlayerSearchCleared"
/>
```

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
The project doesn't have a traditional test suite. When making changes:
1. Run `yarn lint` to catch TypeScript and linting errors
2. Run `yarn dprint` to ensure consistent formatting
3. Test functionality manually in development mode
4. Verify no console errors in browser developer tools

### Environment Configuration
Development environment variables are in `/public/env.js`:
- `BASE_URL` - Backend API URL
- `IDENTIFICATION_URL` - Auth service URL
- `LAUNCHER_UPDATE_URL` - Update service URL
- `INGAME_STATIC_RESOURCES_URL` - CDN for game resources

### Localization
- Translations managed via Google Sheets (see README)
- Generated with `yarn generate-locales`
- Locale files in `/src/locales/`
- Use `$t()` or `$i18n.t()` for translations

### Important Notes
- This is Vue 2.7, not Vue 3 - use appropriate syntax
- Always check if backend changes are needed
- Respect the existing code style and patterns
- Use TypeScript types from `/src/store/*/types.ts`
- Follow Vuetify 2 component patterns, not Vuetify 3