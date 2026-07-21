import { useEffect, useState, useCallback } from 'react';
import { useInventory } from '../context/InventoryContext';
import { projectId } from '../../../utils/supabase/info';
import Header from '../components/Header';
import { Clock, Filter, User as UserIcon, CalendarClock, ChevronDown, Loader2 } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';

type FilterType = 'all' | 'stock_out' | 'return' | 'stock_in';
type DateRangeFilter = 'all' | 'day' | 'week' | 'month' | 'year';

interface TransactionGroup {
  transaction_date: string;
  transactions: any[];
  removed_by?: any;
  received_by?: any;
}

interface TransactionCounts {
  all: number;
  stock_out: number;
  return: number;
  stock_in: number;
}

const PAGE_SIZE = 100;

function getDateFrom(range: DateRangeFilter): string | null {
  if (range === 'all') return null;
  const d = new Date();
  if (range === 'day') d.setDate(d.getDate() - 1);
  else if (range === 'week') d.setDate(d.getDate() - 7);
  else if (range === 'month') d.setMonth(d.getMonth() - 1);
  else if (range === 'year') d.setFullYear(d.getFullYear() - 1);
  return d.toISOString();
}

export default function Historico() {
  const { profiles, fetchProfiles, accessToken } = useInventory();

  const [filter, setFilter] = useState<FilterType>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [supervisorFilter, setSupervisorFilter] = useState<string>('all');
  const [cleanerFilter, setCleanerFilter] = useState<string>('all');

  const [localTransactions, setLocalTransactions] = useState<any[]>([]);
  const [localTotal, setLocalTotal] = useState(0);
  const [localCounts, setLocalCounts] = useState<TransactionCounts>({ all: 0, stock_out: 0, return: 0, stock_in: 0 });
  const [localHasMore, setLocalHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (profiles.length === 0) fetchProfiles();
  }, [fetchProfiles, profiles.length]);

  const fetchFiltered = useCallback(async (offset: number, append: boolean) => {
    const url = new URL(
      `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/transactions`
    );
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('offset', String(offset));
    if (filter !== 'all') url.searchParams.set('type', filter);
    const dateFrom = getDateFrom(dateRangeFilter);
    if (dateFrom) url.searchParams.set('date_from', dateFrom);
    if (supervisorFilter !== 'all') url.searchParams.set('supervisor_id', supervisorFilter);
    if (cleanerFilter !== 'all') url.searchParams.set('cleaner_id', cleanerFilter);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch');

    if (append) {
      setLocalTransactions(prev => [...prev, ...(data.transactions || [])]);
    } else {
      setLocalTransactions(data.transactions || []);
    }
    setLocalTotal(data.total ?? 0);
    setLocalHasMore(data.hasMore ?? false);
    if (data.counts) setLocalCounts(data.counts);
  }, [filter, dateRangeFilter, supervisorFilter, cleanerFilter]);

  useEffect(() => {
    setLoading(true);
    fetchFiltered(0, false).finally(() => setLoading(false));
  }, [fetchFiltered]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchFiltered(localTransactions.length, true);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    } catch { return 'Data não disponível'; }
  };

  const formatTimeShort = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch { return '--:--'; }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'stock_out': return { label: 'Entrega', color: 'text-orange-600', bg: 'bg-orange-100', icon: '📤' };
      case 'return':    return { label: 'Devolução', color: 'text-blue-600', bg: 'bg-blue-100', icon: '🔄' };
      case 'stock_in':  return { label: 'Compra', color: 'text-green-600', bg: 'bg-green-100', icon: '🛒' };
      default:          return { label: type, color: 'text-gray-600', bg: 'bg-gray-100', icon: '📦' };
    }
  };

  const supervisors = profiles.filter(p => p.role === 'Supervisora' || p.role === 'Admin' || p.role === 'Owner');
  const cleaners = profiles.filter(p => p.role === 'Cleaner');

  // Group loaded transactions
  const groupedTransactions: TransactionGroup[] = [];
  const dateMap = new Map<string, TransactionGroup>();

  localTransactions.forEach(transaction => {
    const removedById = transaction.removed_by_id || 0;
    const receivedById = transaction.received_by_id || 0;
    const d = new Date(transaction.transaction_date);
    const dateOnly = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const key = `${dateOnly}-${transaction.transaction_type}-${removedById}-${receivedById}`;

    if (!dateMap.has(key)) {
      dateMap.set(key, {
        transaction_date: transaction.transaction_date,
        transactions: [],
        removed_by: transaction.removed_by,
        received_by: transaction.received_by,
      });
      groupedTransactions.push(dateMap.get(key)!);
    }
    dateMap.get(key)!.transactions.push(transaction);
    const group = dateMap.get(key)!;
    if (!group.removed_by && transaction.removed_by) group.removed_by = transaction.removed_by;
    if (!group.received_by && transaction.received_by) group.received_by = transaction.received_by;
  });

  groupedTransactions.sort((a, b) =>
    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );

  const getGroupSummary = (group: TransactionGroup) => ({
    totalQuantity: group.transactions.reduce((sum, t) => sum + t.quantity, 0),
    itemCount: group.transactions.length,
    types: [...new Set(group.transactions.map(t => t.transaction_type))] as string[],
  });

  const getGroupTypeColor = (types: string[]) => {
    if (types.length === 1) {
      if (types[0] === 'stock_out') return 'border-orange-300 bg-orange-50';
      if (types[0] === 'return')    return 'border-blue-300 bg-blue-50';
      if (types[0] === 'stock_in')  return 'border-green-300 bg-green-50';
    }
    return 'border-gray-300 bg-gray-50';
  };

  return (
    <div className="bg-[#fafafa] content-stretch flex flex-col gap-[24px] lg:gap-[32px] items-start py-[32px] lg:py-[48px] relative min-h-screen w-full">
      <Header />

      <div className="relative shrink-0 w-full">
        <div className="content-stretch flex flex-col gap-[4px] items-start leading-[normal] px-[16px] lg:px-[24px] relative text-black w-full">
          <div className="flex items-center gap-[8px] lg:gap-[12px]">
            <Clock className="size-[28px] lg:size-[32px] text-[#0c7c97]" />
            <p className="font-['Montserrat',sans-serif] font-semibold text-[24px] lg:text-[32px]">
              Histórico de Transações
            </p>
          </div>
          <p className="font-['Montserrat',sans-serif] font-normal text-[16px] lg:text-[20px]">
            Visualize todas as movimentações do estoque agrupadas por momento
          </p>
        </div>
      </div>

      {/* Dropdown Filters */}
      <div className="relative shrink-0 w-full px-[16px] lg:px-[24px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[8px]">
          <div className="relative">
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as DateRangeFilter)}
              className="w-full h-[52px] px-[16px] py-[12px] bg-white border-2 border-[#f0f2fb] rounded-[12px] font-['Montserrat',sans-serif] font-normal text-[16px] text-gray-900 appearance-none cursor-pointer hover:border-[#e0e5f5] transition-colors focus:outline-none focus:border-[#0c7c97]"
            >
              <option value="all">Todos os Períodos</option>
              <option value="day">Último Dia</option>
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
              <option value="year">Último Ano</option>
            </select>
            <ChevronDown className="absolute right-[16px] top-1/2 -translate-y-1/2 size-[20px] text-gray-600 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={supervisorFilter}
              onChange={(e) => setSupervisorFilter(e.target.value)}
              className="w-full h-[52px] px-[16px] py-[12px] bg-white border-2 border-[#f0f2fb] rounded-[12px] font-['Montserrat',sans-serif] font-normal text-[16px] text-gray-900 appearance-none cursor-pointer hover:border-[#e0e5f5] transition-colors focus:outline-none focus:border-[#0c7c97]"
            >
              <option value="all">Todas as Supervisoras</option>
              {supervisors.map(s => (
                <option key={s.employee_id} value={s.employee_id}>{s.full_name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-[16px] top-1/2 -translate-y-1/2 size-[20px] text-gray-600 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={cleanerFilter}
              onChange={(e) => setCleanerFilter(e.target.value)}
              className="w-full h-[52px] px-[16px] py-[12px] bg-white border-2 border-[#f0f2fb] rounded-[12px] font-['Montserrat',sans-serif] font-normal text-[16px] text-gray-900 appearance-none cursor-pointer hover:border-[#e0e5f5] transition-colors focus:outline-none focus:border-[#0c7c97]"
            >
              <option value="all">Todas as Cleaners</option>
              {cleaners.map(c => (
                <option key={c.employee_id} value={c.employee_id}>{c.full_name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-[16px] top-1/2 -translate-y-1/2 size-[20px] text-gray-600 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="relative shrink-0 w-full px-[16px] lg:px-[24px]">
        <div className="bg-white rounded-[16px] border-2 border-[#f0f2fb] p-[6px] lg:p-[8px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[6px] lg:gap-[8px]">
            {([
              { key: 'all',       label: 'Todas',     activeClass: 'bg-[#0c7c97] text-white shadow-md', numClass: (a: boolean) => a ? 'text-white' : 'text-[#0c7c97]' },
              { key: 'stock_out', label: 'Entregas',  activeClass: 'bg-orange-100 border-2 border-orange-600 shadow-md', numClass: (a: boolean) => a ? 'text-orange-600' : 'text-gray-600' },
              { key: 'return',    label: 'Devoluções',activeClass: 'bg-blue-100 border-2 border-blue-600 shadow-md',   numClass: (a: boolean) => a ? 'text-blue-600' : 'text-gray-600' },
              { key: 'stock_in',  label: 'Compras',   activeClass: 'bg-green-100 border-2 border-green-600 shadow-md', numClass: (a: boolean) => a ? 'text-green-600' : 'text-gray-600' },
            ] as const).map(tab => {
              const isActive = filter === tab.key;
              const count = localCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-[12px] lg:px-[16px] py-[10px] lg:py-[12px] rounded-[12px] transition-all ${isActive ? tab.activeClass : 'bg-transparent hover:bg-[#f0f2fb] text-black'}`}
                >
                  <div className="flex flex-col items-center gap-[2px] lg:gap-[4px]">
                    <span className={`font-['Montserrat',sans-serif] font-semibold text-[13px] lg:text-[14px] ${isActive && tab.key !== 'all' ? (tab.key === 'stock_out' ? 'text-orange-700' : tab.key === 'return' ? 'text-blue-700' : 'text-green-700') : ''}`}>
                      {tab.label}
                    </span>
                    <span className={`font-['Montserrat',sans-serif] font-bold text-[16px] lg:text-[18px] ${tab.numClass(isActive)}`}>
                      {loading ? '—' : count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction count summary */}
      {!loading && localTotal > 0 && (
        <div className="relative shrink-0 w-full px-[16px] lg:px-[24px]">
          <p className="font-['Montserrat',sans-serif] font-medium text-[13px] text-gray-500">
            Exibindo <span className="font-bold text-gray-700">{localTransactions.length}</span> de{' '}
            <span className="font-bold text-gray-700">{localTotal}</span> transações
          </p>
        </div>
      )}

      {/* Grouped Transaction List */}
      <div className="relative shrink-0 w-full px-[16px] lg:px-[24px] pb-[48px]">
        {loading ? (
          <div className="flex justify-center py-[48px]">
            <Loader2 className="size-[32px] animate-spin text-[#0c7c97]" />
          </div>
        ) : groupedTransactions.length === 0 ? (
          <div className="bg-white rounded-[16px] border-2 border-[#f0f2fb] p-[32px] lg:p-[48px] text-center">
            <div className="flex flex-col items-center gap-[12px] lg:gap-[16px]">
              <Filter className="size-[48px] lg:size-[64px] text-gray-300" />
              <div>
                <p className="font-['Montserrat',sans-serif] font-semibold text-[18px] lg:text-[20px] text-gray-700">
                  Nenhuma transação encontrada
                </p>
                <p className="font-['Montserrat',sans-serif] font-normal text-[14px] lg:text-[16px] text-gray-500 mt-[6px] lg:mt-[8px]">
                  {filter === 'all'
                    ? 'Nenhuma transação corresponde aos filtros selecionados'
                    : `Não há ${filter === 'stock_out' ? 'entregas' : filter === 'return' ? 'devoluções' : 'compras'} para os filtros selecionados`
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-[10px] lg:space-y-[12px]">
            {groupedTransactions.map((group, index) => {
              const summary = getGroupSummary(group);
              const groupColor = getGroupTypeColor(summary.types);

              return (
                <AccordionItem
                  key={`${group.transaction_date}-${index}`}
                  value={`${group.transaction_date}-${index}`}
                  className={`bg-white rounded-[16px] border-2 ${groupColor} shadow-sm overflow-hidden`}
                >
                  <AccordionTrigger className="px-[16px] lg:px-[20px] py-[16px] hover:no-underline hover:bg-white/50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full lg:pr-4 gap-[12px]">
                      <div className="flex items-start justify-between lg:justify-start gap-[12px] lg:gap-[16px] w-full lg:w-auto">
                        <div className="bg-[#0c7c97] rounded-[12px] p-[10px] lg:p-[12px] flex flex-col items-center justify-center min-w-[70px] lg:min-w-[80px]">
                          <CalendarClock className="size-[20px] lg:size-[24px] text-white mb-[2px] lg:mb-[4px]" />
                          <p className="font-['Montserrat',sans-serif] font-bold text-[12px] lg:text-[14px] text-white">
                            {formatDateShort(group.transaction_date)}
                          </p>
                          <p className="font-['Montserrat',sans-serif] font-semibold text-[11px] lg:text-[12px] text-white/80">
                            {formatTimeShort(group.transaction_date)}
                          </p>
                        </div>

                        <div className="flex lg:hidden flex-col gap-[8px] items-end">
                          <div className="flex items-center gap-[6px] flex-wrap justify-end">
                            {summary.types.map(type => {
                              const typeInfo = getTransactionTypeLabel(type);
                              return (
                                <span key={type} className={`${typeInfo.bg} ${typeInfo.color} text-[11px] px-[8px] py-[2px] rounded-full font-['Montserrat',sans-serif] font-semibold`}>
                                  {typeInfo.label}
                                </span>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-[8px] bg-[#0c7c97]/10 px-[12px] py-[8px] rounded-[12px]">
                            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">
                              {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'itens'}
                            </p>
                            <span className="font-['Montserrat',sans-serif] font-medium text-[14px] text-gray-400">•</span>
                            <p className="font-['Montserrat',sans-serif] font-bold text-[18px] text-[#0c7c97]">
                              {summary.totalQuantity}
                            </p>
                            <p className="font-['Montserrat',sans-serif] font-medium text-[12px] text-gray-600">unid.</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-[8px] lg:gap-[4px] flex-1 order-2 lg:order-none">
                        <div className="hidden lg:flex items-center gap-[8px] flex-wrap">
                          <p className="font-['Montserrat',sans-serif] font-semibold text-[18px] text-black">
                            {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'itens'}
                          </p>
                          {summary.types.map(type => {
                            const typeInfo = getTransactionTypeLabel(type);
                            return (
                              <span key={type} className={`${typeInfo.bg} ${typeInfo.color} text-[11px] px-[8px] py-[2px] rounded-full font-['Montserrat',sans-serif] font-semibold`}>
                                {typeInfo.icon} {typeInfo.label}
                              </span>
                            );
                          })}
                        </div>

                        <div className="flex flex-col gap-[4px] lg:gap-[2px]">
                          {group.removed_by && (
                            <div className="flex items-center gap-[6px]">
                              <UserIcon className="size-[14px] text-gray-500" />
                              <p className="font-['Montserrat',sans-serif] font-normal text-[13px] text-gray-600">
                                {summary.types[0] === 'stock_out' ? 'Entregue por: ' : summary.types[0] === 'return' ? 'Devolvido por: ' : ''}
                                <span className="font-semibold text-black">{group.removed_by.full_name}</span>
                                {group.removed_by.role && <span className="text-[11px] text-gray-500"> ({group.removed_by.role})</span>}
                              </p>
                            </div>
                          )}
                          {group.received_by && (
                            <div className="flex items-center gap-[6px]">
                              <UserIcon className="size-[14px] text-gray-500" />
                              <p className="font-['Montserrat',sans-serif] font-normal text-[13px] text-gray-600">
                                {summary.types[0] === 'stock_out' ? 'Recebido por: ' : summary.types[0] === 'return' ? 'Recebido por: ' : summary.types[0] === 'stock_in' ? 'Registrado por: ' : ''}
                                <span className="font-semibold text-black">{group.received_by.full_name}</span>
                                {group.received_by.role && <span className="text-[11px] text-gray-500"> ({group.received_by.role})</span>}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="hidden lg:flex items-center gap-[8px]">
                        <p className="font-['Montserrat',sans-serif] font-bold text-[20px] text-[#0c7c97]">
                          {summary.totalQuantity}
                        </p>
                        <p className="font-['Montserrat',sans-serif] font-medium text-[14px] text-gray-500">unid.</p>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-[16px] lg:px-[20px] pb-[16px]">
                    <div className="space-y-[8px] pt-[8px]">
                      {group.transactions.map((transaction, txIndex) => {
                        const typeInfo = getTransactionTypeLabel(transaction.transaction_type);
                        return (
                          <div
                            key={`${transaction.transaction_id}-${txIndex}`}
                            className="bg-white border-2 border-[#f0f2fb] rounded-[12px] p-[12px] hover:border-[#e0e5f5] hover:shadow-sm transition-all"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-[12px]">
                              <div className="flex items-center gap-[12px] flex-1">
                                <div className="aspect-square flex h-[60px] items-center justify-center overflow-clip rounded-[8px] shrink-0 bg-gray-100">
                                  {transaction.items?.photo_link ? (
                                    <img alt={transaction.items.display_name} className="size-full object-cover" src={transaction.items.photo_link} />
                                  ) : (
                                    <div className="text-gray-400 text-2xl">📦</div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-[4px] flex-1 min-w-0">
                                  <p className="font-['Montserrat',sans-serif] font-semibold text-[15px] lg:text-[16px] text-black truncate">
                                    {transaction.items?.display_name || 'Item desconhecido'}
                                  </p>
                                  <span className={`${typeInfo.bg} ${typeInfo.color} text-[11px] px-[8px] py-[2px] rounded-full font-['Montserrat',sans-serif] font-semibold self-start`}>
                                    {typeInfo.icon} {typeInfo.label}
                                  </span>
                                </div>
                              </div>
                              <div className={`flex items-center justify-center gap-[4px] px-[16px] py-[10px] lg:px-[12px] lg:py-[8px] rounded-[8px] ${typeInfo.bg} self-stretch lg:self-auto`}>
                                <p className={`font-['Montserrat',sans-serif] font-bold text-[22px] lg:text-[20px] ${typeInfo.color}`}>
                                  {transaction.transaction_type === 'stock_out' ? '-' : '+'}{transaction.quantity}
                                </p>
                                <p className={`font-['Montserrat',sans-serif] font-medium text-[11px] lg:text-[10px] ${typeInfo.color}`}>unid.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {localHasMore && !loading && (
          <div className="flex justify-center pt-[8px]">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-[8px] px-[24px] py-[12px] bg-white border-2 border-[#f0f2fb] rounded-[12px] font-['Montserrat',sans-serif] font-semibold text-[14px] text-[#0c7c97] hover:border-[#0c7c97] hover:bg-[#f0f9fb] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore
                ? <><Loader2 className="size-[16px] animate-spin" /> Carregando...</>
                : `Carregar mais (${localTotal - localTransactions.length} restantes)`
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
