# WatchMoney Admin Panel — PRD

## Visão geral
Painel administrativo web (React + Vite + Firebase Web SDK) para o app
WatchMoney aprovar, rejeitar e marcar saques (`withdrawRequests`) como pagos.
Pronto para deploy estático no GitHub Pages.

## Localização
Projeto independente em `/app/admin-panel/` (não toca o app Expo em `/app/frontend`).

## Tecnologias
- React 18 + Vite 5
- Firebase Web SDK 10 (Auth + Firestore) — **client config pública**
- React Router DOM 6 (HashRouter, ideal para GitHub Pages)
- gh-pages para publicação estática

## Segurança aplicada
- Apenas `firebaseConfig` público; **sem** Admin SDK / serviceAccount.
- `ADMIN_UID = LUdX7IDd4fhAHK2JvhLeaLbgQFx1` em `src/firebase.js`.
- Usuário autenticado com UID ≠ ADMIN_UID vê tela "Acesso negado".
- Regras Firestore exemplo em `firestore-admin-rules-example.txt`
  restringem `withdrawRequests`/`adminLogs` ao admin.
- `.gitignore` bloqueia `serviceAccount*.json`, `firebase-adminsdk*.json`, `.env*`.

## Telas
1. **Login** — e-mail/senha (Firebase Auth) com mensagens de erro PT-BR.
2. **Dashboard** — 4 cards (pendentes, aprovados, rejeitados, pagos) +
   filtros por status + busca por e-mail/nome/chave Pix + tabela ordenada
   por `createdAt` desc, em tempo real via `onSnapshot`.
3. **Logs** — lista das 200 ações administrativas mais recentes (`adminLogs`).
4. **Configurações** — info da conta admin e checklist de segurança.
5. **Acesso negado** — bloqueio para UIDs não autorizados.

## Ações na tabela
- **Aprovar** (status `pending` → `approved`) — atualiza `reviewedAt`,
  `reviewedBy`, `updatedAt` + cria log `action: 'approve'`.
- **Rejeitar** (`pending` → `rejected`) — modal pede motivo; salva
  `rejectionReason`, `reviewedAt`, `reviewedBy`, `updatedAt` + log
  `action: 'reject'`. Mostra aviso sobre devolução de pontos no backend.
- **Marcar como pago** (`approved` → `paid`) — salva `paidAt`,
  `reviewedBy`, `reviewedAt`, `updatedAt` + log `action: 'pay'`.

Todas usam `writeBatch` para garantir atomicidade entre `withdrawRequests`
e `adminLogs`.

## Status / cores
- pending = amarelo / approved = azul / rejected = vermelho / paid = verde.

## Deploy GitHub Pages
- `vite.config.js` com `base: '/watchmoney-admin/'` (ajustável pelo usuário).
- Scripts: `dev`, `build`, `preview`, `deploy` (gh-pages).
- README com passo-a-passo: criar repo, ajustar base, push, `npm run deploy`,
  ativar Pages, autorizar domínio em Firebase Auth.

## Validação realizada
- ✅ `npm run build` passa (635 KB / 165 KB gzip).
- ✅ ESLint sem issues.
- ✅ Vite preview servido localmente, login real chamou Firebase Auth e
  retornou erro "E-mail ou senha incorretos." em PT-BR para credenciais
  inexistentes (prova de que está usando Firebase real, sem mocks).

## Pendências do usuário (não bloqueantes)
- Criar conta admin no Firebase Auth com o UID `LUdX7IDd4fhAHK2JvhLeaLbgQFx1`.
- Publicar as regras do Firestore (`firestore-admin-rules-example.txt`).
- Ajustar `base` em `vite.config.js` se o nome do repo for diferente.
- Após deploy, autorizar `<usuario>.github.io` em Firebase Auth → Authorized domains.
