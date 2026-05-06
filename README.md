# WatchMoney Admin Panel

Este repositório agora contém somente o painel administrativo web em
`admin-panel/`.

## Rodar localmente

```bash
cd admin-panel
npm install
npm run dev
```

## Deploy no GitHub Pages

O workflow `.github/workflows/pages.yml` builda `admin-panel/` e publica o
conteúdo de `admin-panel/dist` no GitHub Pages a cada push na branch `main`.

No GitHub, confira em `Settings > Pages` se a origem está configurada como
`GitHub Actions`. A URL esperada é:

```text
https://allef198.github.io/watchmoney-admin-panel/
```

Também adicione `allef198.github.io` em Firebase Auth > Settings >
Authorized domains.

## Segurança

O painel usa Firebase Auth e permite acesso somente ao `ADMIN_UID`. A config
Web do Firebase é pública por natureza; não use Admin SDK no frontend.

Antes de publicar, aplique no Firebase Console as regras em
`admin-panel/firestore-admin-rules-example.txt`.
