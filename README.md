# Sistema de Gestão de Estoque 📦

SaaS multi-tenant de gestão de estoque para equipes de limpeza: cada organização (empresa) tem seus próprios itens, movimentações e funcionários, completamente isolados dos demais. Otimizado para tablet.

## 🎯 Funcionalidades

- ✅ **Multi-tenant**: cada organização é isolada por `org_id`, tanto na aplicação quanto via Row Level Security no banco
- ✅ **Onboarding self-service**: qualquer pessoa pode criar sua própria organização (vira `Owner`), ou entrar em uma existente via código de convite
- ✅ **Convites por email** para Supervisoras (via Supabase Auth)
- ✅ **Assinatura via Stripe**: 14 dias de teste grátis, depois cobrança mensal fixa por organização
- ✅ **Gestão de Estoque** com lista completa de itens, alertas de estoque baixo
- ✅ **Movimentações**: Entregar (stock_out), Devolver (return), Registrar Compras (stock_in), individual e em lote
- ✅ **Histórico completo** de transações com filtros
- ✅ **Controle de permissões por role**: Owner, Admin, Supervisora, Cleaner

## 🔐 Roles

| Role | Login? | Pode |
|---|---|---|
| **Owner** | Sim | Tudo do Admin + gerenciar assinatura + monitoramento da organização. Um por organização (quem a criou) |
| **Admin** | Sim | Criar/editar/remover itens, ver histórico, gerenciar Supervisoras e Cleaners |
| **Supervisora** | Sim | Movimentações, gerenciar Cleaners |
| **Cleaner** | Não | Registro simples usado para atribuir movimentações (dispositivo compartilhado) |

## 🏢 Como funciona o multi-tenant

- Uma nova conta pode **criar uma organização** (`/auth/signup-org`) — vira `Owner` e ganha 14 dias de teste grátis
- Ou pode **entrar em uma organização existente** via código de convite (`/auth/signup-join`), como Supervisora ou Cleaner
- Admin/Owner também podem **convidar Supervisoras por email** diretamente (tela "Gerenciar Usuários")
- Toda query no backend é filtrada por `org_id` do perfil autenticado (nunca por um `org_id` vindo do cliente) e o Postgres tem políticas RLS como segunda camada de proteção contra acesso direto à API do Supabase

## 💳 Assinatura

- Toda organização nova começa em **teste grátis de 14 dias**
- Depois do teste, o `Owner` assina via **Stripe Checkout** (tela "Assinatura")
- Enquanto a assinatura estiver inativa (teste expirado, pagamento falhou, cancelada), o backend bloqueia todas as rotas de dados (exceto a própria tela de assinatura) com `402 Payment Required`
- `Owner` gerencia forma de pagamento e cancelamento pelo **Stripe Billing Portal**
- Estado da assinatura é mantido via webhook do Stripe (`/billing/webhook`), nunca decidido só no frontend

## 🗄️ Banco de dados

O schema real vive em **`supabase/migrations/*.sql`** (execute em ordem, `001` até o mais recente, via `supabase db push` ou colando cada um no SQL Editor do Supabase). Não existe mais um único script de setup — o schema evoluiu por migrations incrementais.

Tabelas principais:

- **`organizations`** — uma linha por tenant (`org_id`, `name`, `slug`, `invite_code`, campos de assinatura Stripe)
- **`profile`** — perfis (`employee_id`, `full_name`, `role`, `org_id`, `auth_user_id`, `is_active`)
- **`items`** — itens de estoque (`item_id`, `display_name`, `nick_name`, `sku`, `in_stock`, `desired_stock`, `recomend_use`, `photo_link`, `org_id`)
- **`inventory_transactions`** — movimentações (`transaction_id`, `item_id`, `transaction_type`, `removed_by_id`, `received_by_id`, `quantity`, `org_id`)
- **`last_movements`** — última movimentação por (usuário, item), para exibir "último uso" sem varrer todo o histórico

Uma organização nova começa **sem itens** — adicione pelo botão "+" na tela de Estoque (Admin/Owner).

## 🚀 Configuração

### 1. Aplicar as migrations

No SQL Editor do Supabase (ou `supabase db push` com a CLI), rode todos os arquivos em `supabase/migrations/` em ordem numérica.

### 2. Configurar o frontend (Vite)

Copie `.env.example` para `.env.local` e preencha:

```
VITE_SUPABASE_PROJECT_ID=seu-project-ref
VITE_SUPABASE_ANON_KEY=sua-anon-key-publica
# Opcional. Padrão: /StockManagement/ (subpath do GitHub Pages). Use
# VITE_BASE_PATH=/ para publicar num domínio próprio, na raiz.
# VITE_BASE_PATH=/
```

### 3. Configurar a Edge Function (segredos do Supabase, não do Vite)

A função `supabase/functions/make-server-264019ad` precisa destes segredos (via `supabase secrets set` ou painel do Supabase — **nunca** em `.env` do frontend):

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY       # chave secreta do Stripe (test ou live)
STRIPE_PRICE_ID         # price_... do plano mensal
STRIPE_WEBHOOK_SECRET   # whsec_... do endpoint de webhook
```

Deploy da função: `supabase functions deploy make-server-264019ad`.

No painel do Stripe, crie um endpoint de webhook apontando para:
`https://{projectId}.supabase.co/functions/v1/make-server-264019ad/billing/webhook`, escutando pelo menos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

### 4. Criar uma organização

Acesse o app, aba "Cadastrar" → "Criar organização". A primeira conta criada vira `Owner`.

## 🎨 Design e Interface

- **Responsivo** para tablets e desktops
- **Cores principais**: Azul `#0c7c97`, Cinza claro `#fafafa`, Vermelho (alerta) `#ff4444`
- **Tipografia**: Montserrat
- **Feedback em tempo real** com notificações toast (Sonner)

## 🛠️ Tecnologias

### Frontend
- React 18 + TypeScript, Vite
- React Router 7
- Tailwind CSS v4
- Lucide React (ícones), Radix UI (componentes acessíveis), Sonner (toasts)

### Backend
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Hono (web framework) rodando em Deno na Edge Function
- Stripe (assinaturas)

## 🔧 API (Edge Function)

Base: `https://{projectId}.supabase.co/functions/v1/make-server-264019ad`

**Públicas** (sem token de sessão):
- `POST /auth/signup-org` — cria organização + Owner
- `POST /auth/signup-join` — entra em organização via código de convite
- `POST /billing/webhook` — webhook do Stripe (autenticado por assinatura, não por Bearer token)
- `GET /health`

**Autenticadas** (Bearer token da sessão Supabase; sempre filtradas pelo `org_id` do perfil, nunca por input do cliente):
- `GET /me` — perfil + organização (inclui status da assinatura)
- `GET/POST/PUT/DELETE /items` — Admin/Owner para escrita
- `POST /items/upload-photo`
- `GET /transactions` (filtros e paginação)
- `POST /transactions/{stock-out,return,stock-in}` e `/transactions/batch/*`
- `GET /profiles`, `POST /profiles` (Cleaner), `DELETE /profiles/:id`
- `POST /invites` — convite de Supervisora por email (Admin/Owner)
- `POST /billing/checkout`, `POST /billing/portal` — Owner apenas

Bloqueio automático: qualquer rota autenticada (exceto `/me` e as de billing) retorna `402` se a assinatura da organização estiver inativa.

## ✅ Qualidade

- `npm run typecheck` — checagem de tipos do frontend (sem erros)
- `npm run build` — build de produção via Vite
- `cd supabase/functions/make-server-264019ad && deno check index.ts` — checagem de tipos da Edge Function contra os tipos reais de `hono`, `@supabase/supabase-js` e `stripe` (requer [Deno](https://deno.land) instalado)

## 🔒 Segurança

- **Senhas**: nunca tocam nosso código — `signIn`/`signUpCreateOrg`/`signUpJoinOrg` chamam `supabase.auth.*`, que faz hash (bcrypt) e verificação inteiramente dentro do Supabase Auth. O backend e o frontend nunca veem nem armazenam senha em texto puro ou hash.
- **Isolamento multi-tenant**: toda rota autenticada filtra por `org_id` resolvido no servidor a partir do token da sessão (nunca por um `org_id` enviado pelo cliente), e o Postgres tem RLS como segunda camada — ver `supabase/migrations/005_rls_rewrite.sql`.
- **Segredos**: chave de serviço do Supabase e chaves do Stripe só existem como *function secrets* (`supabase secrets set`), nunca em `.env` do frontend nem no bundle publicado.
- **Rate limiting**: `/auth/signup-org` e `/auth/signup-join` (as únicas rotas sem autenticação prévia) limitam a 5 tentativas por IP a cada 10 minutos, testado localmente — chamada 6 em diante recebe `429`.

## 🚦 Checklist antes de cobrar de clientes reais

O código está pronto; o que falta são decisões e credenciais que só o dono do produto pode fornecer:

- [ ] Rodar as migrations e configurar os segredos do Stripe em produção (seção "Configuração" acima)
- [ ] Trocar a chave do Stripe de test mode para live mode quando for cobrar de verdade
- [ ] Configurar um provedor de SMTP próprio (ex: Resend, SendGrid) no painel do Supabase — o SMTP padrão do Supabase tem limite de envio baixo, adequado para dev/teste mas não para volume de clientes reais
- [ ] (Opcional) Domínio próprio: publicar com `VITE_BASE_PATH=/` num host que sirva a SPA com fallback (Vercel, Netlify, Cloudflare Pages) em vez do GitHub Pages atual

## 📄 Licença

Este projeto foi desenvolvido para fins de gestão de estoque e inventário.

---

**Desenvolvido com ❤️ usando React, Supabase e Stripe**
