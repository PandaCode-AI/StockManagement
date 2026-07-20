-- ====================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS
-- Sistema de Gestão de Estoque
-- ====================

-- Este script configura o banco de dados existente:
-- - Popular tabela items com produtos de exemplo
-- - Configurar políticas de segurança (RLS)
-- - Criar índices para performance

-- ====================
-- POPULAR TABELA: items
-- ====================

-- Inserir 10 produtos de limpeza de exemplo
INSERT INTO items (display_name, nick_name, sku, in_stock, desired_stock, recomend_use, photo_link) 
VALUES
  ('Balde', 'Balde', 'SKU-0001', 9, 7, 1, 'figma:asset/4e58d37a34d6cb7e292122c76cb2534d907a74b4.png'),
  ('Bar Keepers Friend', 'Bar Keepers', 'SKU-0002', 6, 4, 2, 'figma:asset/872ec4ad07d38c889d7e7400393ee2d2c2b8a88d.png'),
  ('Base de Rodo', 'Base Rodo', 'SKU-0003', 15, 5, 1, 'figma:asset/34aeb254302194168b6583ca864e678f71610c19.png'),
  ('Borrifador', 'Borrifador', 'SKU-0004', 12, 8, 2, 'figma:asset/ab8bc1e58f2120f2456cfd7204232b046835ec7a.png'),
  ('Esponja', 'Esponja', 'SKU-0005', 20, 15, 5, 'figma:asset/538902ef5433fa9dcd573b69a33149fec37905a2.png'),
  ('Pano de Microfibra', 'Pano Microfibra', 'SKU-0006', 25, 20, 3, 'figma:asset/34876092fca2eaec0f35f15c47fe114f7108aa48.png'),
  ('Luvas', 'Luvas', 'SKU-0007', 50, 30, 10, 'figma:asset/5b1f428241ceb5cd2e2a6b72a283b08e6e6084ea.png'),
  ('Sabão Líquido', 'Sabão', 'SKU-0008', 8, 5, 2, 'figma:asset/7176f4adff05f319747afd709c6730980385079f.png'),
  ('Desinfetante', 'Desinfetante', 'SKU-0009', 10, 6, 2, 'figma:asset/3d58f89622321cae4a944017c078812ad0a69ac1.png'),
  ('Rodo', 'Rodo', 'SKU-0010', 7, 4, 1, 'figma:asset/a6a4c8028a202d53f9eb8f826dea5f3b2d7b82f8.png')
ON CONFLICT (sku) DO NOTHING;

-- ====================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ====================

-- Índices para items
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_in_stock ON items(in_stock);
CREATE INDEX IF NOT EXISTS idx_items_display_name ON items(display_name);

-- Índices para inventory_transactions
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_removed_by_id ON inventory_transactions(removed_by_id);
CREATE INDEX IF NOT EXISTS idx_transactions_received_by_id ON inventory_transactions(received_by_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON inventory_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(transaction_type);

-- Índices para last_movements
CREATE INDEX IF NOT EXISTS idx_last_movements_item_id ON last_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_last_movements_date ON last_movements(last_movement DESC);

-- Índices para profile
CREATE INDEX IF NOT EXISTS idx_profile_role ON profile(role);
CREATE INDEX IF NOT EXISTS idx_profile_full_name ON profile(full_name);

-- ====================
-- HABILITAR RLS (Row Level Security)
-- ====================

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE last_movements ENABLE ROW LEVEL SECURITY;

-- ====================
-- REMOVER POLÍTICAS ANTIGAS (se existirem)
-- ====================

-- items
DROP POLICY IF EXISTS "Enable read access for all users" ON items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON items;
DROP POLICY IF EXISTS "Public items are viewable by everyone" ON items;

-- inventory_transactions
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory_transactions;

-- last_movements
DROP POLICY IF EXISTS "Enable read access for all users" ON last_movements;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON last_movements;

-- profile
DROP POLICY IF EXISTS "Enable read access for all users" ON profile;
DROP POLICY IF EXISTS "Enable insert for service role" ON profile;
DROP POLICY IF EXISTS "Enable update for service role" ON profile;

-- ====================
-- CRIAR POLÍTICAS DE SEGURANÇA
-- ====================

-- Políticas para items (todos usuários autenticados podem ler e modificar)
CREATE POLICY "Enable read access for all users" 
ON items FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable all access for authenticated users" 
ON items FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para inventory_transactions
CREATE POLICY "Enable read access for all users" 
ON inventory_transactions FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON inventory_transactions FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Políticas para last_movements
CREATE POLICY "Enable read access for all users" 
ON last_movements FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON last_movements FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Políticas para profile (permitir service role gerenciar perfis)
CREATE POLICY "Enable read access for all users" 
ON profile FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for service role" 
ON profile FOR INSERT 
TO service_role 
WITH CHECK (true);

CREATE POLICY "Enable update for service role" 
ON profile FOR UPDATE 
TO service_role 
USING (true);

-- ====================
-- VERIFICAÇÃO: Conferir se os dados foram inseridos
-- ====================
-- Execute esta query separadamente para verificar:
-- SELECT item_id, display_name, sku, in_stock, desired_stock FROM items;

-- ====================
-- FIM DO SCRIPT
-- ====================

-- ✅ Banco de dados configurado e pronto para uso!
-- 
-- Próximos passos:
-- 1. Verifique se os 10 itens foram inseridos: SELECT * FROM items;
-- 2. As políticas RLS estão ativas e permitindo acesso autenticado
-- 3. O sistema está pronto para criar usuários e fazer transações
