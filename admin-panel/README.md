# WatchMoney • Painel Administrativo

Painel privado para o administrador do app **WatchMoney** aprovar, rejeitar e marcar
solicitações de saque (`withdrawRequests`) como pagas.

Stack: **React + Vite + Firebase Web SDK (Auth + Firestore)**.
Pronto para deploy estático no **GitHub Pages**.

---

## 🔐 Princípios de segurança

> Leia esta seção **antes** de subir o projeto para o GitHub.

- ❌ **NUNCA** use o `firebase-admin` (Admin SDK) no frontend.
- ❌ **NUNCA** coloque `serviceAccount.json` no repositório.
- ❌ **NUNCA** coloque chaves privadas, secrets ou senhas no código.
- ✅ A `firebaseConfig` usada aqui é a config **pública Web** do Firebase
  (apiKey, authDomain etc.) — pode ser commitada com tranquilidade.
- ✅ A proteção real do banco é feita por **Firestore Security Rules**
  (veja `firestore-admin-rules-example.txt`).
- ✅ O painel só aceita login do `ADMIN_UID`. Qualquer outro usuário vê
  tela "Acesso negado".

---

## 1. Configurar Firebase

O arquivo [`src/firebase.js`](src/firebase.js) já está configurado com:

```js
const firebaseConfig = {
  apiKey: "AIzaSyBwhQLpuqett_cRJdvzGcR3e3wKRN6CeYs",
  authDomain: "watchmoney-39b2e.firebaseapp.com",
  projectId: "watchmoney-39b2e",
  storageBucket: "watchmoney-39b2e.firebasestorage.app",
  messagingSenderId: "277731188101",
  appId: "1:277731188101:web:69ba333537ba04e90cb8ec",
  measurementId: "G-L0PB6FMHNQ"
};

export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || "LUdX7IDd4fhAHK2JvhLeaLbgQFx1";
```

Para trocar o admin no deploy do GitHub Pages, crie a variável de repositório
`VITE_ADMIN_UID`. Sem essa variável, o painel usa
`LUdX7IDd4fhAHK2JvhLeaLbgQFx1`.

### Habilitar Authentication

No console do Firebase:

1. **Authentication → Sign-in method**
2. Habilite **Email/Senha**.
3. Em **Authentication → Users**, crie a conta do admin (a que tem
   o UID `LUdX7IDd4fhAHK2JvhLeaLbgQFx1`) com a senha que você quiser.

### Aplicar regras do Firestore

No console:

1. **Firestore Database → Regras**
2. Cole o conteúdo de [`firestore-admin-rules-example.txt`](firestore-admin-rules-example.txt).
3. Publique.

Essas regras garantem que somente o `ADMIN_UID` pode ler/alterar `withdrawRequests`
e `adminLogs`. Usuários comuns só leem o próprio documento em `users/{uid}`.

---

## 2. Estrutura esperada no Firestore

Os nomes usados pelo painel ficam centralizados em
[`src/firestoreSchema.js`](src/firestoreSchema.js). Se o app mobile mudar algum
campo no Firestore, ajuste esse arquivo antes de mexer nas telas.

### `withdrawRequests/{requestId}`

| Campo            | Tipo               | Descrição                                  |
| ---------------- | ------------------ | ------------------------------------------ |
| `userId`         | string             | UID do usuário no app WatchMoney           |
| `userEmail`      | string             | E-mail do usuário                          |
| `fullName`       | string             | Nome completo                              |
| `pixKey`         | string             | Chave Pix                                  |
| `amount`         | number             | Valor solicitado (BRL)                     |
| `points`         | number             | Pontos consumidos                          |
| `status`         | string             | `pending` \| `approved` \| `rejected` \| `paid` |
| `createdAt`      | Timestamp          | Criação (gravado pelo app mobile)          |
| `updatedAt`      | Timestamp          | Última alteração                           |
| `reviewedAt`     | Timestamp          | Quando o admin agiu                        |
| `reviewedBy`     | string (UID)       | UID do admin                               |
| `rejectionReason`| string (opcional)  | Preenchido só em `rejected`                |
| `paidAt`         | Timestamp (opcional) | Preenchido só em `paid`                  |

### `adminLogs/{logId}` (gerado automaticamente pelo painel)

```js
{
  action: 'approve' | 'reject' | 'pay',
  requestId: 'abc123',
  targetUserId: 'uid-do-usuario',
  targetUserEmail: 'email@dominio.com',
  previousStatus: 'pending',
  newStatus: 'approved',
  amount: 100,
  points: 1000,
  reason: 'motivo da rejeição (se houver)',
  adminUid: 'LUdX7IDd4fhAHK2JvhLeaLbgQFx1',
  adminEmail: 'admin@dominio.com',
  createdAt: serverTimestamp()
}
```

---

## 3. Rodar localmente

```bash
cd admin-panel
npm install         # ou: yarn
npm run dev         # abre http://localhost:5173
```

Faça login com a conta admin que você criou no Firebase Auth.
Se o UID não for o `ADMIN_UID`, o painel mostrará **Acesso negado**.

---

## 4. Build de produção

```bash
npm run build       # gera /dist
npm run preview     # serve /dist localmente para testar
```

---

## 5. Deploy no GitHub Pages

Este repositório já está configurado para publicar pelo GitHub Actions em:

```text
https://allef198.github.io/watchmoney-admin-panel/
```

### 5.1. Base do Vite

O `base` padrão em `vite.config.js` é:

```js
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/watchmoney-admin-panel/',
});
```

> Se você usar **domínio customizado** ligado ao GitHub Pages na raiz, use `base: '/'`.

### 5.2. Publicação automática

O workflow de Pages fica em:

```text
.github/workflows/pages.yml
```

Ele roda `npm install` e `npm run build` dentro de `admin-panel/` a cada push na
branch `main`, enviando `admin-panel/dist` para o GitHub Pages.

### 5.3. Ative o GitHub Pages

No repositório → **Settings → Pages**:

- **Source**: `GitHub Actions`
- Salve.

### 5.4. Autorize o domínio no Firebase Auth

No console do Firebase → **Authentication → Settings → Authorized domains**,
adicione:

- `allef198.github.io`

Caso contrário o login falhará com `auth/unauthorized-domain`.

---

## 6. Fluxo das ações

| Ação                | Atualiza `withdrawRequests`                                                  | Cria log em `adminLogs` |
| ------------------- | ----------------------------------------------------------------------------- | ----------------------- |
| **Aprovar**         | `status=approved`, `reviewedAt`, `reviewedBy`, `updatedAt`                    | sim (`action: approve`) |
| **Rejeitar**        | `status=rejected`, `rejectionReason`, `reviewedAt`, `reviewedBy`, `updatedAt` | sim (`action: reject`)  |
| **Marcar como pago**| `status=paid`, `paidAt`, `reviewedBy`, `reviewedAt`, `updatedAt`              | sim (`action: pay`)     |

> Em rejeições, **a devolução de pontos** ao saldo do usuário deve ser feita
> em Cloud Function ou rotina transacional em ambiente confiável — não no cliente.

---

## 7. Checklist de segurança antes do `git push`

- [ ] Não existe `serviceAccount.json` em lugar nenhum do projeto.
- [ ] Não existe `firebase-admin` no `package.json`.
- [ ] `.gitignore` cobre `serviceAccount*.json`, `firebase-adminsdk*.json`, `.env*`.
- [ ] Regras do Firestore foram publicadas e travam por UID.
- [ ] Conta admin existe no Firebase Auth e tem UID = `ADMIN_UID`.
- [ ] Domínio do GitHub Pages está em **Authorized domains**.

---

## 8. Estrutura de arquivos

```
admin-panel/
├── index.html
├── package.json
├── vite.config.js
├── firestore-admin-rules-example.txt
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── firebase.js
    ├── styles.css
    ├── pages/
    │   ├── Login.jsx
    │   ├── Dashboard.jsx
    │   ├── Logs.jsx
    │   └── Settings.jsx
    └── components/
        ├── Sidebar.jsx
        ├── AccessDenied.jsx
        ├── WithdrawTable.jsx
        ├── StatusBadge.jsx
        └── ConfirmModal.jsx
```
