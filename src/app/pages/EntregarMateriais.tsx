import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import ConfirmacaoModal from '../components/ConfirmacaoModal';
import { ArrowLeft, Minus, Plus, CheckCircle2, User, Settings, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../../../utils/supabase/info';

export default function EntregarMateriais() {
  const navigate = useNavigate();
  const { items, batchStockOut, currentProfile, profiles, accessToken } = useInventory();
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [selectedCleaner, setSelectedCleaner] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastMovements, setLastMovements] = useState<{ [key: number]: string }>({});
  const lastMovementsCache = useRef<Map<number, { [key: number]: string }>>(new Map());

  // Filter only Cleaner profiles
  const cleanerProfiles = profiles.filter(p => p.role === 'Cleaner');

  // Fetch last movements when selectedCleaner changes, using session cache
  useEffect(() => {
    if (!selectedCleaner) {
      setLastMovements({});
      return;
    }

    if (lastMovementsCache.current.has(selectedCleaner)) {
      setLastMovements(lastMovementsCache.current.get(selectedCleaner)!);
      return;
    }

    fetchLastMovements(selectedCleaner);
  }, [selectedCleaner]);

  const fetchLastMovements = async (employeeId: number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/profiles/${employeeId}/last-movements`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar histórico de movimentações');
      }

      const movements = data.lastMovements || {};
      lastMovementsCache.current.set(employeeId, movements);
      setLastMovements(movements);
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      setLastMovements({});
    }
  };

  const calculateDaysSince = (lastDate: string | undefined): string => {
    if (!lastDate) return 'Nunca recebido';

    const last = new Date(lastDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return '1 dia atrás';
    return `${diffDays} dias atrás`;
  };

  const getDaysSinceNumber = (lastDate: string | undefined): number => {
    if (!lastDate) return Infinity;

    const last = new Date(lastDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const isEarlyDelivery = (itemId: string, recomendUse: number): boolean => {
    const selectedQty = selectedItems[itemId] || 0;
    if (selectedQty === 0) return false;

    const daysSince = getDaysSinceNumber(lastMovements[parseInt(itemId)]);
    return daysSince < recomendUse;
  };

  const handleQuantityChange = (itemId: string, change: number) => {
    setSelectedItems(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      const item = items.find(i => i.item_id.toString() === itemId);
      if (item && newQty > item.in_stock) {
        toast.error(`Quantidade indisponível. Estoque atual: ${item.in_stock}`);
        return prev;
      }
      
      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleConfirm = () => {
    if (Object.keys(selectedItems).length === 0) {
      toast.error('Selecione pelo menos um item para entregar');
      return;
    }
    if (!selectedCleaner) {
      toast.error('Selecione o funcionário que receberá os materiais');
      return;
    }
    if (!currentProfile?.employee_id) {
      toast.error('Erro ao identificar usuário logado');
      return;
    }
    setModalOpen(true);
  };

  const handleConfirmModal = async () => {
    const itemCount = Object.keys(selectedItems).length;
    const removedById = currentProfile?.employee_id!;

    setLoading(true);
    try {
      const itemsToDeliver = Object.entries(selectedItems).map(([itemId, quantity]) => ({
        itemId: parseInt(itemId),
        quantity,
      }));

      await batchStockOut(itemsToDeliver, removedById, selectedCleaner!);
      setModalOpen(false);
      toast.success(`${itemCount} ${itemCount === 1 ? 'item entregue' : 'itens entregues'} com sucesso!`);
      navigate('/movimentacoes');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao entregar materiais');
    } finally {
      setLoading(false);
    }
  };

  const totalSelected = Object.keys(selectedItems).length;

  const cleanerName = profiles.find(p => p.employee_id === selectedCleaner)?.full_name;

  const modalItems = Object.entries(selectedItems).map(([itemId, quantity]) => {
    const item = items.find(i => i.item_id.toString() === itemId);
    return { name: item?.display_name || itemId, quantity };
  });

  return (
    <div className="bg-[#fafafa] content-stretch flex flex-col gap-[20px] lg:gap-[40px] items-start py-[24px] lg:py-[56px] relative min-h-screen w-full">
      <Header />

      <div className="relative shrink-0 w-full px-[16px] lg:px-[48px]">
        <button
          onClick={() => navigate('/movimentacoes')}
          className="flex items-center gap-[6px] text-[#0c7c97] mb-[12px] lg:mb-[20px] hover:underline"
        >
          <ArrowLeft className="size-[18px] lg:size-[24px]" />
          <span className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[18px]">Voltar</span>
        </button>

        <div className="content-stretch flex flex-col gap-[2px] items-start leading-[normal] text-black">
          <p className="font-['Montserrat',sans-serif] font-semibold text-[24px] lg:text-[40px]">Entregar Materiais</p>
          <p className="font-['Montserrat',sans-serif] font-normal text-[14px] lg:text-[24px]">
            Selecione os itens e quantidades para entrega
          </p>
        </div>
      </div>

      {/* Cleaner Selection Dropdown */}
      <div className="relative shrink-0 w-full px-[16px] lg:px-[48px]">
        <div className="bg-white rounded-[12px] lg:rounded-[20px] border-2 border-[#f0f2fb] p-[16px] lg:p-[28px]">
          <div className="flex items-center justify-between mb-[8px] lg:mb-[16px]">
            <div className="flex items-center gap-[8px] lg:gap-[16px]">
              <User className="size-[18px] lg:size-[24px] text-[#0c7c97]" />
              <label className="font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[20px] text-black">
                Quem está recebendo?
              </label>
            </div>
            <button
              onClick={() => navigate('/gerenciar-usuarios')}
              className="flex items-center gap-[6px] text-[#0c7c97] hover:text-[#0a6a80] transition-colors px-[8px] py-[6px] rounded-[6px] hover:bg-[#f0f2fb]"
              title="Gerenciar funcionários"
            >
              <Settings className="size-[16px] lg:size-[20px]" />
              <span className="font-['Montserrat',sans-serif] font-medium text-[12px] lg:text-[16px] hidden sm:inline">
                Gerenciar
              </span>
            </button>
          </div>
          <select
            value={selectedCleaner || ''}
            onChange={(e) => setSelectedCleaner(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-[12px] lg:px-[20px] py-[10px] lg:py-[16px] rounded-[8px] lg:rounded-[12px] border-2 border-[#f0f2fb] font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[18px] text-black focus:border-[#0c7c97] focus:outline-none transition-colors"
          >
            <option value="">Selecione um funcionário</option>
            {cleanerProfiles.map((profile) => (
              <option key={profile.employee_id} value={profile.employee_id}>
                {profile.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative shrink-0 w-full px-[16px] lg:px-[48px] flex-1 pb-[120px] lg:pb-[140px]">
        <div className="content-stretch flex flex-col gap-[12px] lg:gap-[20px] items-start w-full">
          {items.map((item) => {
            const selectedQty = selectedItems[item.item_id.toString()] || 0;
            const hasStock = item.in_stock > 0;
            const showEarlyWarning = selectedCleaner && item.recomend_use && isEarlyDelivery(item.item_id.toString(), item.recomend_use);

            return (
              <div
                key={item.item_id}
                className={`bg-white relative rounded-[12px] lg:rounded-[20px] w-full ${!hasStock && 'opacity-50'}`}
              >
                <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[12px] lg:rounded-[20px]" />
                <div className="content-stretch flex items-center gap-[12px] lg:gap-[24px] p-[12px] lg:p-[28px] relative w-full">
                  <div className="aspect-square content-stretch flex h-[70px] lg:h-[120px] items-center justify-center overflow-clip relative rounded-[8px] lg:rounded-[12px] shrink-0">
                    <img
                      alt={item.display_name}
                      className="size-full object-cover"
                      src={item.photo_link}
                    />
                  </div>

                  <div className="content-stretch flex flex-col gap-[8px] lg:gap-[12px] items-start flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-[12px] gap-y-[4px] lg:gap-y-[6px] w-full">
                      <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[24px] text-black">
                        {item.display_name}
                      </p>
                      <p className="font-['Montserrat',sans-serif] font-medium text-[12px] lg:text-[16px] text-gray-600">
                        Disponível: <span className="font-bold text-black">{item.in_stock}</span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-[6px] lg:gap-[8px]">
                      {selectedCleaner && (
                        <div className={`flex items-center gap-[8px] lg:gap-[10px] border-l-[3px] rounded-[8px] px-[10px] lg:px-[14px] py-[6px] lg:py-[8px] max-w-[280px] lg:max-w-[320px] transition-all ${
                          showEarlyWarning
                            ? 'bg-gradient-to-r from-orange-100 to-red-100 border-orange-500'
                            : 'bg-gradient-to-r from-[#0c7c97]/10 to-[#1ABAE1]/10 border-[#0c7c97]'
                        }`}>
                          {showEarlyWarning ? (
                            <AlertTriangle className="size-[14px] lg:size-[16px] text-orange-600 shrink-0" />
                          ) : (
                            <Calendar className="size-[14px] lg:size-[16px] text-[#0c7c97] shrink-0" />
                          )}
                          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-[6px] min-w-0">
                            <span className={`font-['Montserrat',sans-serif] font-medium text-[10px] lg:text-[12px] uppercase tracking-wide ${
                              showEarlyWarning ? 'text-orange-700' : 'text-gray-600'
                            }`}>
                              {showEarlyWarning ? 'Entrega antecipada:' : 'Última entrega:'}
                            </span>
                            <span className={`font-['Montserrat',sans-serif] font-bold text-[12px] lg:text-[14px] ${
                              showEarlyWarning ? 'text-orange-600' : 'text-[#0c7c97]'
                            }`}>
                              {calculateDaysSince(lastMovements[item.item_id])}
                            </span>
                          </div>
                        </div>
                      )}

                      {item.recomend_use && (
                        <div className="flex items-center gap-[8px] lg:gap-[10px] bg-gradient-to-r from-purple-50 to-indigo-50 border-l-[3px] border-purple-500 rounded-[8px] px-[10px] lg:px-[14px] py-[6px] lg:py-[8px] max-w-[280px] lg:max-w-[320px]">
                          <Clock className="size-[14px] lg:size-[16px] text-purple-600 shrink-0" />
                          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-[6px] min-w-0">
                            <span className="font-['Montserrat',sans-serif] font-medium text-[10px] lg:text-[12px] text-gray-600 uppercase tracking-wide">
                              Uso recomendado:
                            </span>
                            <span className="font-['Montserrat',sans-serif] font-bold text-[12px] lg:text-[14px] text-purple-600">
                              {item.recomend_use} dias
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasStock && (
                    <div className="flex flex-col items-center gap-[8px] shrink-0 ml-auto">
                      <button
                        onClick={() => handleQuantityChange(item.item_id.toString(), 1)}
                        disabled={selectedQty >= item.in_stock}
                        className="bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-30 disabled:cursor-not-allowed rounded-[8px] h-[44px] lg:h-[48px] w-[64px] lg:w-[72px] transition-colors flex items-center justify-center"
                      >
                        <Plus className="size-[18px] lg:size-[20px] text-white" />
                      </button>

                      <div className="font-['Montserrat',sans-serif] font-bold text-[18px] lg:text-[20px] text-black text-center w-[64px] lg:w-[72px] h-[40px] lg:h-[44px] flex items-center justify-center">
                        {selectedQty}
                      </div>

                      <button
                        onClick={() => handleQuantityChange(item.item_id.toString(), -1)}
                        disabled={selectedQty === 0}
                        className="bg-[#f0f2fb] hover:bg-[#e0e5f5] disabled:opacity-30 disabled:cursor-not-allowed rounded-[8px] h-[44px] lg:h-[48px] w-[64px] lg:w-[72px] transition-colors flex items-center justify-center"
                      >
                        <Minus className="size-[18px] lg:size-[20px] text-[#323232]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmacaoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmModal}
        loading={loading}
        title="Confirmar entrega"
        subtitle={cleanerName ? `Para: ${cleanerName}` : undefined}
        items={modalItems}
        confirmLabel="Confirmar entrega"
      />

      {totalSelected > 0 && (
        <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t-2 border-[#f0f2fb] px-[16px] lg:px-[48px] py-[12px] lg:py-[20px] z-40 shadow-lg">
          <div className="content-stretch flex items-center justify-between w-full gap-[12px]">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[22px] text-black">
              {totalSelected} {totalSelected === 1 ? 'item' : 'itens'}
            </p>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex gap-[8px] lg:gap-[12px] items-center justify-center px-[16px] lg:px-[32px] py-[10px] lg:py-[16px] relative rounded-[999999px] shrink-0 transition-colors"
            >
              <CheckCircle2 className="size-[18px] lg:size-[20px] text-white" />
              <p className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[14px] lg:text-[18px] text-white whitespace-nowrap">
                Continuar
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}