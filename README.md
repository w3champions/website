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
Translations are edited by hand in [src/locales](https://github.com/w3champions/website/tree/master/src/locales): English strings live in `en.ts`, every other language in its own block of `data.ts`. To add a string, add it to `en.ts` and to each language block in `data.ts`, then use it in the component with `$t("section.key")`:

[example](https://github.com/w3champions/website/blob/10eb639aad5175481a6230d3ff55a18f11f831f5/src/views/Home.vue#L8)

The production build runs a `generate-locales` step that would regenerate `data.ts` from a Google Sheet. It needs a Google API key, which the CI build does not have, so it leaves `data.ts` unchanged. Do not run `npm run generate-locales` locally with a key: it would overwrite the hand-edited translations.
