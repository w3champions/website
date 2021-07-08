## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

### Authenticating as Admin
1) Clone the backend https://github.com/w3champions/w3champions-chat-service
2) Open this file https://github.com/w3champions/w3champions-chat-service/blob/master/W3ChampionsStatisticService/WebApi/ActionFilters/W3CAuthenticationService.cs and just return an Object that Contains your battletag and IsAdmin = true like
```
public async Task<W3CUserAuthenticationDto> GetUserByToken(string bearer)
{
    return new W3CUserAuthenticationDto
    {
        BattleTag = "modmoto#123",
        Name = "modmoto",
        isAdmin = true
    };
}
```

3) Run the project (F5) in visual studio. This usually opens a browser window with blank page. Copy the url of the page (eg. https://localhost:44336/).
4) Change the `BASE_URL` of ui to the backend url you just copied: https://github.com/w3champions/w3champions-ui/blob/master/public/env.js#L3
6) You should be able to login as admin.

### Deploying to a Pull Request Environment
If you branch starts with "DEPLOY_" azure will create a automatic deployment for your pull request, so you can test it in an isolated environment. It will be deployed to whatever comes after "DEPLOY_". For example, if my branch is called DEPLOY_add-new-language the pr will be published to https://add-new-language.w3champions.com. The https certificate will be generated after the deployment, but this can take some time.

If you need any other connection strings, just update the docker-dompose.toke.yaml file accordingliy, for example if you want to use a different backend for the identification for example (which can also be deployed by a PR just like this repo).

When you are done, please contact one of the older devs, because they can delete the unused containers again.
