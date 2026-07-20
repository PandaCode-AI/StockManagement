# Sistema de Gestão de Estoque 📦

Sistema completo de gestão de estoque responsivo otimizado para tablet, onde usuários podem fazer retiradas, devoluções e compras de materiais de limpeza, criando registros automáticos de todas as movimentações.

## 🎯 Funcionalidades

- ✅ **Autenticação completa** com login e cadastro de usuários
- ✅ **Gestão de Estoque** com lista completa de itens
- ✅ **Edição de Itens** com todos os campos editáveis
- ✅ **Movimentações**:
  - 📤 Entregar Materiais (stock_out)
  - 📥 Devolver Materiais (return)
  - 🛒 Registrar Compras (stock_in)
- ✅ **Alertas visuais** para estoque abaixo do mínimo
- ✅ **Histórico completo** de transações
- ✅ **Controle de permissões** por roles (Supervisora/Cleaner)

## 🗄️ Estrutura do Banco de Dados

### Tabelas

1. **profile** - Perfis dos usuários
   - `id` (UUID) - Referência para auth.users
   - `name` (TEXT)
   - `email` (TEXT)
   - `role` (TEXT) - 'Supervisora' ou 'Cleaner'

2. **items** - Itens do estoque
   - `id` (UUID)
   - `name` (TEXT)
   - `description` (TEXT)
   - `sku` (TEXT UNIQUE)
   - `category` (TEXT)
   - `current_stock` (INTEGER)
   - `min_stock` (INTEGER)
   - `recommended_usage` (INTEGER)
   - `image` (TEXT)

3. **inventory_transactions** - Transações de estoque
   - `id` (UUID)
   - `item_id` (UUID) → items
   - `user_id` (UUID) → profile
   - `transaction_type` (TEXT) - 'stock_out', 'return', 'stock_in'
   - `quantity` (INTEGER)
   - `notes` (TEXT)

4. **last_movements** - Rastreamento de movimentos
   - `id` (UUID)
   - `item_id` (UUID) → items
   - `user_id` (UUID) → profile
   - `movement_type` (TEXT)
   - `quantity` (INTEGER)

## 🚀 Configuração do Supabase

### Passo 1: Execute o Script SQL

1. Acesse o **SQL Editor** no painel do Supabase
2. Copie todo o conteúdo do arquivo `/database-setup.sql`
3. Cole no editor e clique em **Run**

Este script irá:
- Criar todas as tabelas necessárias
- Adicionar índices para performance
- Configurar triggers para atualização automática
- Popular com 10 itens de exemplo
- Configurar políticas RLS (Row Level Security)

### Passo 2: Verificar as Credenciais

As credenciais do Supabase já estão configuradas automaticamente:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Você pode verificá-las em `/utils/supabase/info.tsx`

## 📱 Como Usar

### 1. Criar uma Conta

1. Acesse a aplicação
2. Clique em **"Cadastrar"**
3. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
   - Função (Cleaner ou Supervisora)
4. Clique em **"Criar conta"**

### 2. Fazer Login

1. Use o email e senha cadastrados
2. Clique em **"Entrar"**
3. Você será redirecionado para a tela de Estoque

### 3. Gerenciar Estoque

#### Visualizar Itens
- A tela principal mostra todos os itens com:
  - Imagem do produto
  - Nome e SKU
  - Estoque atual (em vermelho se abaixo do mínimo)
  - Estoque mínimo

#### Editar um Item
1. Clique em qualquer item ou no ícone de lápis
2. Edite os campos desejados:
   - Nome
   - Descrição
   - Categoria
   - Estoque atual
   - Estoque mínimo
   - Uso recomendado
3. Clique em **"Salvar Alterações"**

### 4. Fazer Movimentações

#### Entregar Materiais (Retirada)
1. Vá em **Movimentações** → **Entregar Materiais**
2. Selecione os itens usando + e -
3. Clique em **"Confirmar Entrega"**
4. O estoque será reduzido automaticamente

#### Devolver Materiais
1. Vá em **Movimentações** → **Devolver Materiais**
2. Selecione os itens e quantidades
3. Clique em **"Confirmar Devolução"**
4. O estoque será aumentado automaticamente

#### Registrar Compras
1. Vá em **Movimentações** → **Registrar Compras**
2. Itens com estoque baixo aparecem destacados em vermelho
3. Selecione os itens e quantidades compradas
4. Clique em **"Confirmar Compra"**
5. O estoque será aumentado automaticamente

### 5. Sair do Sistema

Clique no botão de **Logout** (ícone de saída) no canto superior direito

## 🎨 Design e Interface

- **Responsivo** para tablets e desktops
- **Cores principais**:
  - Azul: `#0c7c97`
  - Cinza claro: `#fafafa`
  - Vermelho (alerta): `#ff4444`
- **Tipografia**: Montserrat
- **Alertas visuais** para estoque baixo
- **Feedback em tempo real** com notificações toast

## 🔒 Segurança

- **Autenticação JWT** via Supabase Auth
- **Row Level Security (RLS)** ativado em todas as tabelas
- **Políticas de acesso**:
  - Supervisoras podem criar/editar/deletar itens
  - Todos podem criar transações e visualizar dados
- **Validação** de estoque antes de entregas
- **Tokens de acesso** nunca expostos no frontend

## 🛠️ Tecnologias

### Frontend
- **React** com TypeScript
- **React Router** para navegação
- **Tailwind CSS** v4 para estilos
- **Lucide React** para ícones
- **Sonner** para notificações toast
- **Radix UI** para componentes acessíveis

### Backend
- **Supabase** (PostgreSQL + Auth + Edge Functions)
- **Hono** como web framework
- **Deno** runtime para Edge Functions

## 📝 Estrutura de Arquivos

```
/src
  /app
    /components
      - Header.tsx (navegação e logout)
      - Root.tsx (layout principal)
      /ui (componentes Radix UI)
    /context
      - InventoryContext.tsx (estado global + API)
    /pages
      - Login.tsx
      - Estoque.tsx
      - EditarItem.tsx
      - Movimentacoes.tsx
      - EntregarMateriais.tsx
      - DevolverMateriais.tsx
      - RegistrarCompras.tsx
    - routes.tsx (configuração de rotas)
    - App.tsx
  /styles
    - index.css
    - tailwind.css
    - theme.css
    - fonts.css
/supabase
  /functions
    /server
      - index.tsx (Edge Function com todas as rotas)
      - kv_store.tsx (utilitário para KV store)
/utils
  /supabase
    - info.tsx (credenciais)
/database-setup.sql (script de configuração)
```

## 🔧 API Endpoints

Todos os endpoints estão em:
`https://{projectId}.supabase.co/functions/v1/make-server-264019ad/*`

### Autenticação
- `POST /auth/signup` - Criar nova conta

### Items
- `GET /items` - Listar todos os itens
- `GET /items/:id` - Obter item específico
- `POST /items` - Criar novo item (Supervisora)
- `PUT /items/:id` - Atualizar item (Supervisora)
- `DELETE /items/:id` - Deletar item (Supervisora)

### Transações
- `GET /transactions` - Listar transações (com filtros)
- `POST /transactions/stock-out` - Registrar entrega
- `POST /transactions/return` - Registrar devolução
- `POST /transactions/stock-in` - Registrar compra

### Perfil
- `GET /profile` - Obter perfil do usuário atual

## 🐛 Troubleshooting

### "Invalid JWT" ao fazer login
- Verifique se o script SQL foi executado corretamente
- Confirme que a tabela `profile` foi criada
- Tente fazer logout e login novamente

### Itens não aparecem
- Verifique se executou o script SQL com os dados iniciais
- Confira os logs do console do navegador
- Verifique se o backend está respondendo em `/health`

### Erro ao criar transação
- Confirme que há estoque suficiente para entregas
- Verifique se o usuário está autenticado
- Confira os logs do Edge Function no painel Supabase

## 📊 Dados de Exemplo

O sistema vem pré-populado com 10 itens:
1. Balde
2. Bar Keepers Friend
3. Base de Rodo
4. Borrifador
5. Esponja
6. Pano de Microfibra
7. Luvas
8. Sabão Líquido
9. Desinfetante
10. Rodo

Cada item tem imagens, descrições, SKUs únicos e níveis de estoque configurados.

## ✨ Próximos Passos

Sugestões de melhorias:
- Adicionar relatórios e dashboards
- Implementar busca e filtros avançados
- Adicionar upload de imagens personalizadas
- Exportar relatórios em PDF/Excel
- Notificações push para estoque baixo
- Histórico detalhado de cada item
- Sistema de categorias personalizáveis

## 📄 Licença

Este projeto foi desenvolvido para fins de gestão de estoque e inventário.

---

**Desenvolvido com ❤️ usando React, Supabase e Tailwind CSS**
