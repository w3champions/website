[![Build Status](https://dev.azure.com/w3champions/w3champions/_apis/build/status/website?branchName=master)](https://dev.azure.com/w3champions/w3champions/_build/latest?definitionId=1&branchName=master)

## Development setup

### Install dependencies
```
npm install
```

### Run development server
```
npm start
```

### Environment variables
When running locally, environment variables will be taken from [this](https://github.com/w3champions/website/blob/master/public/env.js) file.

### Lint and fix files
```
npm run lint:fix
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/) for Vue options.

## Optional: Setup website backend server (and authenticate as admin)
By default the website you started using `npm start` will connect to the production
backend of [www.w3champions.com](https://www.w3champions.com/). The API serving the dynamic content
is available at [website-backend.w3champions.com/api/](https://website-backend.w3champions.com/api/). 

If you're not interested in manipulating the API responses you can skip the following setup, but for some
actions you might require a local instance of the website backend:

1) Clone (and fork) the [w3champions/website-backend](https://github.com/w3champions/website-backend)
2) Follow the [setup instructions](https://github.com/w3champions/website-backend#readme) and spin up your local website backend api server
3) Change the `BASE_URL` in the environment configuration [/public/env.js#L4](./public/env.js#L4) to your desired URL

### Authenticating as Admin

Granting yourself admin permissions consists of two steps:

#### Granting API admin scope (JWT manipulation)

Permission is validated using a JWT, to intercept the process you can skip the 
JWT validation and return a valid `W3CUserAuthenticationDto` object which grants you `IsAdmin` rights.

Open the file [`W3ChampionsStatisticService/WebApi/ActionFilters/W3CAuthenticationService.cs`](https://github.com/w3champions/website-backend/blob/master/W3ChampionsStatisticService/WebApi/ActionFilters/W3CAuthenticationService.cs) and just return an object which contains your battleTag and `IsAdmin = true` like

```csharp
public async Task<W3CUserAuthenticationDto> GetUserByToken(string bearer)
{
    return new W3CUserAuthenticationDto
    {
        BattleTag = "modmoto#123",
        Name = "modmoto",
        IsAdmin = true
    };
}
```

After restarting the backend server you're granted access to all routes protected
by the `[CheckIfBattleTagIsAdmin]` attribute.

#### Granting frontend admin permission

In order to set the `isAdmin` state in the frontend you have several options. Since the original
permission request is send to the [w3champions/identification-service](https://github.com/w3champions/identification-service) (see `IDENTIFICATION_URL`) you
could spin up your own local identification server and grant yourself admin permission.

A more convenient option is to overwrite the vue mutation which sets the
`isAdmin` property in the [`oauth` store](src/store/oauth/store.ts):

```typescript
SET_IS_ADMIN(isAdmin: boolean): void {
  this.isAdmin = true; // this.isAdmin = isAdmin;
}
```

### Working with Localization
Translations come from the [Localization Tables](https://docs.google.com/spreadsheets/d/1V5f4zguWDmk9nbnoXSJm9g-ZxImo83NJpSY17EUkzOc) Google Sheet: one row per string (`location`, `id`, then one column per language). `npm run generate-locales` ([script](scripts/generate-locales.ts)) downloads the sheet and rewrites [src/locales/data.ts](src/locales/data.ts). It needs a Google API key with the Sheets API enabled, in `.env` as `GOOGLE_API_KEY` (ask a dev).

The CI build has no key, so the `generate-locales` step in `build:prod` does nothing and the site ships `data.ts` as committed. A change in the sheet reaches the site only after someone with a key runs the script and commits the result.

To add a string:
1. Add a row to the sheet (request edit access to the document) with the English text and every translation you have.
2. Run `npm run generate-locales` with a key and commit `data.ts`. Without a key, add the same strings to `data.ts` by hand. The row in the sheet is still required: the script rewrites the whole file, so a string that exists only in `data.ts` is deleted by the next sync.
3. Use it in the component with `$t("location.id")`:

[example](https://github.com/w3champions/website/blob/10eb639aad5175481a6230d3ff55a18f11f831f5/src/views/Home.vue#L8)

[src/locales/en.ts](src/locales/en.ts) is maintained by hand and the script does not touch it. It is merged over the sheet's English column (it wins for keys in both) and holds English-only strings such as map and proxy names.
