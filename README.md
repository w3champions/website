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
2) Add your battletag to this file https://github.com/w3champions/w3champions-statistic-service/blob/master/W3ChampionsStatisticService/Admin/Admins.cs
3) Run the project (F5) in visual studio. This usually opens a browser window with blank page. Copy the url of the page (eg. https://localhost:44336/).
4) Change the `BASE_URL` of ui to the backend url you just copied: https://github.com/w3champions/w3champions-ui/blob/master/public/env.js#L3
5) Change `BNET_API_CLIENT_ID` to `6da84149578f4566a4d0224a2264a54d` https://github.com/w3champions/w3champions-ui/blob/master/public/env.js#L8
6) You should be able to login as admin.
