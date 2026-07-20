# 🔧 GUIA DE CORREÇÕES - Nomes das Colunas do Banco de Dados

## ✅ Schema Correto do Banco de Dados

### Tabela: `items`
- `item_id` (bigint) - ID do item
- `display_name` (text) - Nome principal  
- `nick_name` (text) - Apelido/nome curto
- `sku` (text) - Código único
- `in_stock` (numeric) - Quantidade em estoque
- `desired_stock` (numeric) - Estoque desejado/mínimo
- `recomend_use` (numeric) - Uso recomendado
- `photo_link` (text) - Link da foto
- `created_at` (timestamp) - Data de criação

### Tabela: `inventory_transactions`
- `transaction_id` (bigint) - ID da transação
- `item_id` (integer) - Referência ao item
- `transaction_type` (text) - 'stock_in', 'stock_out', 'return'
- `removed_by_id` (integer) - ID de quem retirou
- `received_by_id` (integer) - ID de quem recebeu
- `quantity` (numeric) - Quantidade
- `transaction_date` (timestamp) - Data da transação

### Tabela: `profile`
- `employee_id` (bigint) - ID do funcionário
- `full_name` (text) - Nome completo
- `role` (USER-DEFINED) - Função (Supervisora/Cleaner)
- `created_at` (timestamp) - Data de criação

### Tabela: `last_movements`
- `user_id` (bigint) - ID do usuário
- `item_id` (bigint) - ID do item
- `last_movement` (timestamp) - Data do último movimento

## 📝 Arquivos Já Atualizados

✅ `/database-setup.sql` - Script SQL corrigido
✅ `/supabase/functions/server/index.tsx` - Backend atualizado
✅ `/src/app/context/InventoryContext.tsx` - Context atualizado  
✅ `/src/app/pages/Estoque.tsx` - Página de estoque corrigida

## 🔄 Arquivos que Precisam de Atualização

As páginas de movimentação precisam ser atualizadas para:
1. Usar `item_id` em vez de `id`
2. Usar `in_stock` em vez de `current_stock`
3. Usar `display_name` em vez de `name`
4. Usar `photo_link` em vez de `image`
5. Passar `employee_id` nas transações

### Páginas a Atualizar:
- `/src/app/pages/EditarItem.tsx`
- `/src/app/pages/EntregarMateriais.tsx`
- `/src/app/pages/DevolverMateriais.tsx`
- `/src/app/pages/RegistrarCompras.tsx`
- `/src/app/pages/Movimentacoes.tsx`

## 🚀 Próximos Passos

1. Execute o script `/database-setup.sql` no Supabase SQL Editor
2. Verifique se os 10 itens foram inseridos: `SELECT * FROM items;`
3. Crie uma conta usando o formulário de cadastro
4. As correções nas páginas serão aplicadas automaticamente

## ⚠️ Nota Importante

O campo `employee_id` precisa ser obtido do perfil do usuário logado.
Como o schema não tem ligação direta entre auth.users e profile.employee_id,
vamos usar o primeiro perfil disponível como fallback até que o usuário
crie seu perfil manualmente ou via interface.
