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
1) Clone the backend https://github.com/w3champions/w3champions-statistic-service
2) Open this file https://github.com/w3champions/w3champions-statistic-service/blob/master/W3ChampionsStatisticService/WebApi/ActionFilters/W3CAuthenticationService.cs and just return an Object that Contains your battletag and IsAdmin = true like
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
