import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertTriangle, TrendingUp, Award, Package } from 'lucide-react';

const COLORS = ['#0c7c97', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'];

export default function Monitoramento() {
  const { items, transactions, profiles } = useInventory();
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');

  // Filter transactions based on selected person
  const filteredTransactions = useMemo(() => {
    if (selectedPersonId === 'all') {
      return transactions;
    }
    const personId = parseInt(selectedPersonId);
    return transactions.filter(t =>
      t.removed_by_id === personId || t.received_by_id === personId
    );
  }, [transactions, selectedPersonId]);

  // Calculate most used products
  const mostUsedProducts = useMemo(() => {
    const productUsage = new Map<number, { id: number; name: string; count: number }>();

    filteredTransactions
      .filter(t => t.transaction_type === 'stock_out')
      .forEach(transaction => {
        const item = items.find(i => i.item_id === transaction.item_id);
        if (item) {
          const existing = productUsage.get(transaction.item_id);
          if (existing) {
            productUsage.set(transaction.item_id, {
              id: transaction.item_id,
              name: item.display_name,
              count: existing.count + transaction.quantity
            });
          } else {
            productUsage.set(transaction.item_id, {
              id: transaction.item_id,
              name: item.display_name,
              count: transaction.quantity
            });
          }
        }
      });

    return Array.from(productUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [items, filteredTransactions]);

  // Calculate return rate by product
  const returnRateByProduct = useMemo(() => {
    const productStats = new Map<number, { id: number; name: string; stockOuts: number; returns: number }>();

    filteredTransactions.forEach(transaction => {
      const item = items.find(i => i.item_id === transaction.item_id);
      if (item) {
        const existing = productStats.get(transaction.item_id);
        if (existing) {
          if (transaction.transaction_type === 'stock_out') {
            existing.stockOuts += transaction.quantity;
          } else if (transaction.transaction_type === 'return') {
            existing.returns += transaction.quantity;
          }
        } else {
          productStats.set(transaction.item_id, {
            id: transaction.item_id,
            name: item.display_name,
            stockOuts: transaction.transaction_type === 'stock_out' ? transaction.quantity : 0,
            returns: transaction.transaction_type === 'return' ? transaction.quantity : 0
          });
        }
      }
    });

    return Array.from(productStats.values())
      .filter(stat => stat.stockOuts > 0)
      .map(stat => ({
        id: stat.id,
        name: stat.name,
        rate: ((stat.returns / stat.stockOuts) * 100).toFixed(1),
        stockOuts: stat.stockOuts,
        returns: stat.returns
      }))
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))
      .slice(0, 10);
  }, [items, filteredTransactions]);

  // Calculate usage vs recommended
  const usageVsRecommended = useMemo(() => {
    const usageMap = new Map<number, { id: number; name: string; actual: number; recommended: number }>();

    filteredTransactions
      .filter(t => t.transaction_type === 'stock_out')
      .forEach(transaction => {
        const item = items.find(i => i.item_id === transaction.item_id);
        if (item) {
          const existing = usageMap.get(transaction.item_id);
          if (existing) {
            existing.actual += transaction.quantity;
          } else {
            usageMap.set(transaction.item_id, {
              id: transaction.item_id,
              name: item.display_name,
              actual: transaction.quantity,
              recommended: item.recomend_use
            });
          }
        }
      });

    return Array.from(usageMap.values())
      .filter(u => u.recommended > 0)
      .slice(0, 8);
  }, [items, filteredTransactions]);

  // Calculate consumption trend over time
  const consumptionTrend = useMemo(() => {
    const trendMap = new Map<string, number>();

    filteredTransactions
      .filter(t => t.transaction_type === 'stock_out')
      .forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate()) / 7)}-${date.getMonth() + 1}`;

        const existing = trendMap.get(weekKey);
        trendMap.set(weekKey, (existing || 0) + transaction.quantity);
      });

    return Array.from(trendMap.entries())
      .map(([week, quantity], index) => ({ id: `week-${index}`, week, quantity }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);
  }, [filteredTransactions]);

  // Calculate efficiency ranking
  const efficiencyRanking = useMemo(() => {
    const cleaners = profiles.filter(p => p.role === 'Cleaner');
    const rankings = cleaners.map(cleaner => {
      const cleanerTransactions = filteredTransactions.filter(t =>
        t.removed_by_id === cleaner.employee_id || t.received_by_id === cleaner.employee_id
      );

      const stockOuts = cleanerTransactions.filter(t => t.transaction_type === 'stock_out').length;
      const returns = cleanerTransactions.filter(t => t.transaction_type === 'return').length;
      const returnRate = stockOuts > 0 ? (returns / stockOuts) * 100 : 0;

      return {
        id: cleaner.employee_id,
        name: cleaner.full_name,
        stockOuts,
        returns,
        returnRate: returnRate.toFixed(1),
        efficiency: (100 - returnRate).toFixed(1)
      };
    });

    return rankings
      .filter(r => r.stockOuts > 0)
      .sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency));
  }, [profiles, filteredTransactions]);

  // Calculate products never returned
  const neverReturnedProducts = useMemo(() => {
    const stockOutItems = new Set<number>();
    const returnedItems = new Set<number>();

    filteredTransactions.forEach(t => {
      if (t.transaction_type === 'stock_out') {
        stockOutItems.add(t.item_id);
      } else if (t.transaction_type === 'return') {
        returnedItems.add(t.item_id);
      }
    });

    const neverReturned: number[] = [];
    stockOutItems.forEach(itemId => {
      if (!returnedItems.has(itemId)) {
        neverReturned.push(itemId);
      }
    });

    return neverReturned
      .map(itemId => {
        const item = items.find(i => i.item_id === itemId);
        const quantity = filteredTransactions
          .filter(t => t.item_id === itemId && t.transaction_type === 'stock_out')
          .reduce((sum, t) => sum + t.quantity, 0);

        return item ? { id: itemId, name: item.display_name, quantity } : null;
      })
      .filter(Boolean)
      .slice(0, 10);
  }, [items, filteredTransactions]);

  // Calculate critical stock items
  const criticalStockItems = useMemo(() => {
    return items
      .filter(item => item.in_stock <= item.desired_stock)
      .map(item => ({
        id: item.item_id,
        name: item.display_name,
        inStock: item.in_stock,
        desired: item.desired_stock,
        deficit: item.desired_stock - item.in_stock
      }))
      .sort((a, b) => b.deficit - a.deficit)
      .slice(0, 8);
  }, [items]);

  // Calculate stock depletion forecast
  const stockDepletionForecast = useMemo(() => {
    const last30Days = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return transactionDate >= thirtyDaysAgo && t.transaction_type === 'stock_out';
    });

    const usageMap = new Map<number, number>();
    last30Days.forEach(t => {
      usageMap.set(t.item_id, (usageMap.get(t.item_id) || 0) + t.quantity);
    });

    return items
      .map(item => {
        const monthlyUsage = usageMap.get(item.item_id) || 0;
        const dailyAverage = monthlyUsage / 30;
        const daysUntilEmpty = dailyAverage > 0 ? Math.floor(item.in_stock / dailyAverage) : 999;

        return {
          id: item.item_id,
          name: item.display_name,
          inStock: item.in_stock,
          dailyAverage: dailyAverage.toFixed(2),
          daysUntilEmpty: daysUntilEmpty > 365 ? '365+' : daysUntilEmpty.toString()
        };
      })
      .filter(f => parseInt(f.daysUntilEmpty) < 30 || f.daysUntilEmpty !== '365+')
      .sort((a, b) => {
        const aDays = a.daysUntilEmpty === '365+' ? 999 : parseInt(a.daysUntilEmpty);
        const bDays = b.daysUntilEmpty === '365+' ? 999 : parseInt(b.daysUntilEmpty);
        return aDays - bDays;
      })
      .slice(0, 8);
  }, [items, filteredTransactions]);

  // Calculate pickup frequency
  const pickupFrequency = useMemo(() => {
    const cleaners = profiles.filter(p => p.role === 'Cleaner');

    return cleaners.map(cleaner => {
      const pickups = filteredTransactions.filter(t =>
        t.transaction_type === 'stock_out' && t.removed_by_id === cleaner.employee_id
      );

      const totalQuantity = pickups.reduce((sum, t) => sum + t.quantity, 0);
      const avgPerPickup = pickups.length > 0 ? (totalQuantity / pickups.length).toFixed(1) : '0';

      return {
        id: cleaner.employee_id,
        name: cleaner.full_name,
        pickups: pickups.length,
        totalQuantity,
        avgPerPickup
      };
    })
    .filter(p => p.pickups > 0)
    .sort((a, b) => b.pickups - a.pickups);
  }, [profiles, filteredTransactions]);

  // Calculate total stats
  const totalReturns = filteredTransactions.filter(t => t.transaction_type === 'return').length;
  const totalStockOuts = filteredTransactions.filter(t => t.transaction_type === 'stock_out').length;
  const totalStockIns = filteredTransactions.filter(t => t.transaction_type === 'stock_in').length;
  const activeUsers = selectedPersonId === 'all' ? profiles.filter(p => p.role === 'Cleaner').length : 1;

  return (
    <div className="bg-[#fafafa] min-h-screen w-full pb-12">
      <div className="flex flex-col gap-8 py-14">
        <Header />

        <div className="px-6 lg:px-12">
          <div className="flex flex-col gap-1">
            <h1 className="font-['Montserrat',sans-serif] font-semibold text-[32px] lg:text-[40px] text-black">
              Monitoramento
            </h1>
            <p className="font-['Montserrat',sans-serif] text-[20px] lg:text-[24px] text-black">
              Acompanhamento de qualidade de serviço
            </p>
          </div>
        </div>

        <div className="px-6 lg:px-12">
          <div className="bg-white rounded-2xl p-6 border-2 border-[#f0f2fb]">
            <label className="font-['Montserrat',sans-serif] text-[16px] lg:text-[18px] text-black font-semibold mb-2 block">
              Filtrar por Pessoa
            </label>
            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger className="w-full lg:w-[300px] h-12 text-base">
                <SelectValue placeholder="Selecione uma pessoa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as pessoas</SelectItem>
                {profiles
                  .filter(profile => profile.role === 'Cleaner')
                  .map(profile => (
                    <SelectItem key={profile.employee_id} value={profile.employee_id.toString()}>
                      {profile.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border-2 border-[#f0f2fb]">
              <p className="font-['Montserrat',sans-serif] text-[14px] lg:text-[16px] text-[#666] mb-2">
                Total de Retiradas
              </p>
              <p className="font-['Montserrat',sans-serif] font-bold text-[32px] lg:text-[40px] text-[#0c7c97]">
                {totalStockOuts}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-[#f0f2fb]">
              <p className="font-['Montserrat',sans-serif] text-[14px] lg:text-[16px] text-[#666] mb-2">
                Devoluções Antecipadas
              </p>
              <p className="font-['Montserrat',sans-serif] font-bold text-[32px] lg:text-[40px] text-[#14b8a6]">
                {totalReturns}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-[#f0f2fb]">
              <p className="font-['Montserrat',sans-serif] text-[14px] lg:text-[16px] text-[#666] mb-2">
                Compras Registradas
              </p>
              <p className="font-['Montserrat',sans-serif] font-bold text-[32px] lg:text-[40px] text-[#0ea5e9]">
                {totalStockIns}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-[#f0f2fb]">
              <p className="font-['Montserrat',sans-serif] text-[14px] lg:text-[16px] text-[#666] mb-2">
                Cleaners Ativos
              </p>
              <p className="font-['Montserrat',sans-serif] font-bold text-[32px] lg:text-[40px] text-[#6366f1]">
                {activeUsers}
              </p>
            </div>
          </div>
        </div>

        {criticalStockItems.length > 0 && (
          <div className="px-6 lg:px-12">
            <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h2 className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-red-800">
                  Produtos com Estoque Crítico
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {criticalStockItems.map((item) => (
                  <div key={`critical-${item.id}`} className="bg-white rounded-xl p-4 border border-red-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[16px] text-black">
                          {item.name}
                        </p>
                        <p className="font-['Montserrat',sans-serif] text-[12px] lg:text-[14px] text-[#666]">
                          Em estoque: {item.inStock} | Desejado: {item.desired}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-['Montserrat',sans-serif] font-bold text-[18px] lg:text-[20px] text-red-600">
                          -{item.deficit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="px-6 lg:px-12">
          <h2 className="font-['Montserrat',sans-serif] font-bold text-[24px] lg:text-[28px] text-black mb-4 flex items-center gap-2">
            <Package className="h-7 w-7" />
            Análise de Produtos
          </h2>
        </div>

        <div className="px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 border-2 border-[#f0f2fb]">
            <h3 className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black mb-6">
              Produtos Mais Utilizados
            </h3>
            {mostUsedProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mostUsedProducts} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2fb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: '#323232', fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: '#323232', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #f0f2fb',
                      borderRadius: '12px',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                  <Bar dataKey="count" fill="#0c7c97" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-[#666] py-12">Nenhum dado disponível</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-[#f0f2fb]">
            <h3 className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black mb-6">
              Taxa de Devolução por Produto
            </h3>
            {returnRateByProduct.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {returnRateByProduct.map((product) => (
                  <div key={`return-rate-${product.id}`} className="flex items-center justify-between p-3 rounded-lg bg-[#fafafa] border border-[#f0f2fb]">
                    <div className="flex-1">
                      <p className="font-['Montserrat',sans-serif] font-medium text-[13px] lg:text-[14px] text-black">
                        {product.name}
                      </p>
                      <p className="font-['Montserrat',sans-serif] text-[11px] lg:text-[12px] text-[#666]">
                        Retiradas: {product.stockOuts} | Devoluções: {product.returns}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-['Montserrat',sans-serif] font-bold text-[16px] lg:text-[18px] text-[#14b8a6]">
                        {product.rate}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#666] py-12">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 border-2 border-[#f0f2fb]">
            <h3 className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black mb-6">
              Uso Real vs Recomendado
            </h3>
            {usageVsRecommended.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageVsRecommended} margin={{ top: 20, right: 30, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2fb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: '#323232', fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: '#323232', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #f0f2fb',
                      borderRadius: '12px',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                  <Legend />
                  <Bar key="actual-bar" dataKey="actual" name="Uso Real" fill="#0c7c97" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                  <Bar key="recommended-bar" dataKey="recommended" name="Recomendado" fill="#14b8a6" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-[#666] py-12">Nenhum dado disponível</p>
            )}
          </div>

          {neverReturnedProducts.length > 0 && (
            <div className="bg-white rounded-2xl p-8 border-2 border-[#f0f2fb]">
              <h3 className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black mb-6">
                Produtos Não Devolvidos
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {neverReturnedProducts.map((product: any) => (
                  <div key={`never-returned-${product.id}`} className="flex items-center justify-between p-3 rounded-lg bg-[#fafafa] border border-[#f0f2fb]">
                    <p className="font-['Montserrat',sans-serif] font-medium text-[13px] lg:text-[14px] text-black">
                      {product.name}
                    </p>
                    <p className="font-['Montserrat',sans-serif] font-bold text-[16px] lg:text-[18px] text-[#0c7c97]">
                      {product.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 lg:px-12">
          <h2 className="font-['Montserrat',sans-serif] font-bold text-[24px] lg:text-[28px] text-black mb-4 flex items-center gap-2">
            <Award className="h-7 w-7" />
            Performance Individual
          </h2>
        </div>

        <div className="px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 border-2 border-[#f0f2fb]">
            <h3 className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black mb-6">
              Ranking de Eficiência
            </h3>
            {efficiencyRanking.length > 0 ? (
              <div className="space-y-3">
                {efficiencyRanking.map((person, index) => (
                  <div
                    key={`efficiency-${person.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#fafafa] border border-[#f0f2fb]"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-['Montserrat',sans-serif] font-bold text-white text-sm"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[16px] text-black">
                          {person.name}
                        </p>
                        <p className="font-['Montserrat',sans-serif] text-[11px] lg:text-[12px] text-[#666]">
                          {person.stockOuts} retiradas | {person.returns} devoluções
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-['Montserrat',sans-serif] font-bold text-[20px] lg:text-[24px] text-[#0c7c97]">
                        {person.efficiency}%
                      </p>
                      <p className="font-['Montserrat',sans-serif] text-[10px] lg:text-[11px] text-[#666]">
                        eficiência
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#666] py-12">Nenhum dado disponível</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-[#f0f2fb]">
            <h3 className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black mb-6">
              Frequência de Retiradas
            </h3>
            {pickupFrequency.length > 0 ? (
              <div className="space-y-3">
                {pickupFrequency.map((person) => (
                  <div
                    key={`pickup-${person.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#fafafa] border border-[#f0f2fb]"
                  >
                    <div className="flex-1">
                      <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[16px] text-black">
                        {person.name}
                      </p>
                      <p className="font-['Montserrat',sans-serif] text-[11px] lg:text-[12px] text-[#666]">
                        Média: {person.avgPerPickup} itens por retirada
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-['Montserrat',sans-serif] font-bold text-[20px] lg:text-[24px] text-[#14b8a6]">
                        {person.pickups}
                      </p>
                      <p className="font-['Montserrat',sans-serif] text-[10px] lg:text-[11px] text-[#666]">
                        retiradas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#666] py-12">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-12">
          <h2 className="font-['Montserrat',sans-serif] font-bold text-[24px] lg:text-[28px] text-black mb-4 flex items-center gap-2">
            <TrendingUp className="h-7 w-7" />
            Tendências e Previsões
          </h2>
        </div>

        <div className="px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {consumptionTrend.length > 0 && (
            <div className="bg-white rounded-2xl p-8 border-2 border-[#f0f2fb]">
              <h3 className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black mb-6">
                Tendência de Consumo
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={consumptionTrend} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2fb" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: '#323232', fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: '#323232', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #f0f2fb',
                      borderRadius: '12px',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="#0c7c97"
                    strokeWidth={3}
                    dot={{ fill: '#0c7c97', r: 4 }}
                    name="Quantidade"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {stockDepletionForecast.length > 0 && (
            <div className="bg-white rounded-2xl p-8 border-2 border-[#f0f2fb]">
              <h3 className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black mb-6">
                Previsão de Ruptura (próximos 30 dias)
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {stockDepletionForecast.map((forecast) => (
                  <div key={`forecast-${forecast.id}`} className="flex items-center justify-between p-3 rounded-lg bg-[#fafafa] border border-[#f0f2fb]">
                    <div className="flex-1">
                      <p className="font-['Montserrat',sans-serif] font-medium text-[13px] lg:text-[14px] text-black">
                        {forecast.name}
                      </p>
                      <p className="font-['Montserrat',sans-serif] text-[11px] lg:text-[12px] text-[#666]">
                        Estoque: {forecast.inStock} | Uso diário: {forecast.dailyAverage}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-['Montserrat',sans-serif] font-bold text-[16px] lg:text-[18px] text-[#e11d48]">
                        {forecast.daysUntilEmpty} dias
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
