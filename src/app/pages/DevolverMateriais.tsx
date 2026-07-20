import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import ConfirmacaoModal from '../components/ConfirmacaoModal';
import { ArrowLeft, Minus, Plus, CheckCircle2, User, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function DevolverMateriais() {
  const navigate = useNavigate();
  const { items, batchReturn, currentProfile, profiles } = useInventory();
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [selectedCleaner, setSelectedCleaner] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter only Cleaner profiles
  const cleanerProfiles = profiles.filter(p => p.role === 'Cleaner');

  const handleQuantityChange = (itemId: string, change: number) => {
    setSelectedItems(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleConfirm = () => {
    if (Object.keys(selectedItems).length === 0) {
      toast.error('Selecione pelo menos um item para devolver');
      return;
    }
    if (!selectedCleaner) {
      toast.error('Selecione o funcionário que está devolvendo os materiais');
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
    const receivedById = currentProfile?.employee_id!;

    setLoading(true);
    try {
      const itemsToReturn = Object.entries(selectedItems).map(([itemId, quantity]) => ({
        itemId: parseInt(itemId),
        quantity,
      }));

      await batchReturn(itemsToReturn, selectedCleaner!, receivedById);
      setModalOpen(false);
      toast.success(`${itemCount} ${itemCount === 1 ? 'item devolvido' : 'itens devolvidos'} com sucesso!`);
      navigate('/movimentacoes');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao devolver materiais');
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
    <div className="bg-[#fafafa] content-stretch flex flex-col gap-[32px] lg:gap-[40px] items-start py-[48px] lg:py-[56px] relative min-h-screen w-full">
      <Header />
      
      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <button 
          onClick={() => navigate('/movimentacoes')}
          className="flex items-center gap-[8px] text-[#0c7c97] mb-[16px] lg:mb-[20px] hover:underline"
        >
          <ArrowLeft className="size-[20px] lg:size-[24px]" />
          <span className="font-['Montserrat',sans-serif] font-medium text-[16px] lg:text-[18px]">Voltar</span>
        </button>
        
        <div className="content-stretch flex flex-col gap-[4px] items-start leading-[normal] text-black">
          <p className="font-['Montserrat',sans-serif] font-semibold text-[32px] lg:text-[40px]">Devolver Materiais</p>
          <p className="font-['Montserrat',sans-serif] font-normal text-[20px] lg:text-[24px]">
            Selecione os itens e quantidades para devolução
          </p>
        </div>
      </div>

      {/* Cleaner Selection Dropdown */}
      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <div className="bg-white rounded-[16px] lg:rounded-[20px] border-2 border-[#f0f2fb] p-[20px] lg:p-[28px]">
          <div className="flex items-center justify-between mb-[12px] lg:mb-[16px]">
            <div className="flex items-center gap-[12px] lg:gap-[16px]">
              <User className="size-[20px] lg:size-[24px] text-[#0c7c97]" />
              <label className="font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[20px] text-black">
                Quem está devolvendo?
              </label>
            </div>
            <button
              onClick={() => navigate('/gerenciar-usuarios')}
              className="flex items-center gap-[8px] text-[#0c7c97] hover:text-[#0a6a80] transition-colors px-[12px] py-[8px] rounded-[8px] hover:bg-[#f0f2fb]"
              title="Gerenciar funcionários"
            >
              <Settings className="size-[18px] lg:size-[20px]" />
              <span className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px]">
                Gerenciar
              </span>
            </button>
          </div>
          <select
            value={selectedCleaner || ''}
            onChange={(e) => setSelectedCleaner(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-[16px] lg:px-[20px] py-[12px] lg:py-[16px] rounded-[8px] lg:rounded-[12px] border-2 border-[#f0f2fb] font-['Montserrat',sans-serif] font-medium text-[16px] lg:text-[18px] text-black focus:border-[#0c7c97] focus:outline-none transition-colors"
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

      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px] flex-1 pb-[120px] lg:pb-[140px]">
        <div className="content-stretch flex flex-col gap-[16px] lg:gap-[20px] items-start w-full">
          {items.map((item) => {
            const selectedQty = selectedItems[item.item_id.toString()] || 0;
            
            return (
              <div 
                key={item.item_id}
                className="bg-white relative rounded-[16px] lg:rounded-[20px] w-full"
              >
                <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[16px] lg:rounded-[20px]" />
                <div className="content-stretch flex items-center gap-[12px] lg:gap-[24px] p-[12px] lg:p-[28px] relative w-full">
                  <div className="aspect-square content-stretch flex h-[70px] lg:h-[120px] items-center justify-center overflow-clip relative rounded-[8px] lg:rounded-[12px] shrink-0">
                    <img
                      alt={item.display_name}
                      className="size-full object-cover"
                      src={item.photo_link}
                    />
                  </div>

                  <div className="content-stretch flex flex-col gap-[2px] lg:gap-[6px] items-start shrink-0">
                    <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[24px] text-black">
                      {item.display_name}
                    </p>
                    <p className="font-['Montserrat',sans-serif] font-normal text-[12px] lg:text-[16px] text-black">
                      Estoque atual: {item.in_stock}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-[8px] shrink-0 ml-auto">
                    <button
                      onClick={() => handleQuantityChange(item.item_id.toString(), 1)}
                      className="bg-[#0c7c97] hover:bg-[#0a6a80] rounded-[8px] h-[44px] lg:h-[48px] w-[64px] lg:w-[72px] transition-colors flex items-center justify-center"
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
        title="Confirmar devolução"
        subtitle={cleanerName ? `De: ${cleanerName}` : undefined}
        items={modalItems}
        confirmLabel="Confirmar devolução"
      />

      {totalSelected > 0 && (
        <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t-2 border-[#f0f2fb] px-[24px] lg:px-[48px] py-[16px] lg:py-[20px] z-40 shadow-lg">
          <div className="content-stretch flex items-center justify-between w-full">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[18px] lg:text-[22px] text-black">
              {totalSelected} {totalSelected === 1 ? 'item selecionado' : 'itens selecionados'}
            </p>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-50 disabled:cursor-not-allowed content-stretch cursor-pointer flex gap-[10px] lg:gap-[12px] items-center justify-center px-[24px] lg:px-[32px] py-[12px] lg:py-[16px] relative rounded-[999999px] shrink-0 transition-colors"
            >
              <CheckCircle2 className="size-[20px] text-white" />
              <p className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[16px] lg:text-[18px] text-white whitespace-nowrap">
                Continuar
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}