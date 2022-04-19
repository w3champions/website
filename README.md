## Development setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

#### .env
When running locally, environmental variables will be taken from [this](https://github.com/w3champions/website/blob/master/public/env.js) file.

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/) for Vue options.

## Optional: Setup website backend server (and authenticate as admin)
By default the website you started using `yarn run serve` will connect to the productive
backend of [www.w3champions.com](https://www.w3champions.com/). The API serving the dynamic content
is available at [website-backend.w3champions.com/api/](https://website-backend.w3champions.com/api/). 

If you're not interested in manipulating the API responses you can skip the following setup, but for some
actions you might require a local instance of the website backend:

1) Clone (and fork) the [w3champions/website-backend](https://github.com/w3champions/website-backend)
2) Follow the [setup instructions](https://github.com/w3champions/website-backend#readme) and spin up your local website backend api server
3) Run the project (F5) in Visual Studio. This usually opens a browser window with blank page. Copy the URL of the page (eg. https://localhost:44336/)
4) Change the `BASE_URL` in the environment configuration [/public/env.js#L4](./public/env.js#L4) to your desired URL

### Authenticating as Admin

Granting yourself admin permissions consists of two steps:

#### Granting API admin scope (JWT manipulation)

Permission is validated using a JWT, to intercept the process you can skip the 
JWT validation and return a valid `W3CUserAuthenticationDto` object which grants you `IsAdmin` rights.

Open the file [`W3ChampionsStatisticService/WebApi/ActionFilters/W3CAuthenticationService.cs`](https://github.com/w3champions/website-backend/blob/master/W3ChampionsStatisticService/WebApi/ActionFilters/W3CAuthenticationService.cs) and just return an object which contains your battletag and `IsAdmin = true` like

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
`isAdmin` property in the [`oauth` store](src/store/oauth/index.ts):

```javascript
SET_IS_ADMIN(state: OauthState, isAdmin: boolean) {
    state.isAdmin = true; // state.isAdmin = isAdmin;
},
```

### Deploying to a Pull Request Environment
If you branch starts with "DEPLOY_" azure will create a automatic deployment for your pull request, so you can test it in an isolated environment. It will be deployed to whatever comes after "DEPLOY_". For example, if my branch is called DEPLOY_add-new-language the pr will be published to https://add-new-language.w3champions.com. The https certificate will be generated after the deployment, but this can take some time.

If you need any other connection strings, just update the docker-dompose.toke.yaml file accordingliy, for example if you want to use a different backend for the identification for example (which can also be deployed by a PR just like this repo).

When you are done, please contact one of the older devs, because they can delete the unused containers again.

### Working with Localization
The website rebuilds localizations on each new deployment, running this script:

[generate-locales.ts](https://github.com/w3champions/website/blob/master/scripts/generate-locales.ts)

this works by gathering all the localization strings from this google drive document:

[Localization Tables](https://docs.google.com/spreadsheets/d/1V5f4zguWDmk9nbnoXSJm9g-ZxImo83NJpSY17EUkzOc)

It then merges with the existing localizations here, which contains some english-specific translations, such as the names of maps and proxies:

[locales](https://github.com/w3champions/website/tree/master/src/locales)

If you'd like to add new strings to the website, you can request access to edit the localization document above to add them, and then refer to them in the html by calling the v18n library in that component.

[example](https://github.com/w3champions/website/blob/10eb639aad5175481a6230d3ff55a18f11f831f5/src/views/Home.vue#L8)

Contact @CepheidUK for access to the sheet.
