import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import ConfirmacaoModal from '../components/ConfirmacaoModal';
import { ArrowLeft, Minus, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegistrarCompras() {
  const navigate = useNavigate();
  const { items, batchStockIn, currentProfile, profiles } = useInventory();
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [itemModes, setItemModes] = useState<{ [key: string]: 'unit' | 'package' }>({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleItemMode = (itemId: string) => {
    setItemModes(prev => ({
      ...prev,
      [itemId]: prev[itemId] === 'package' ? 'unit' : 'package'
    }));
  };

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

  const buildItemsToRegister = () =>
    Object.entries(selectedItems).map(([itemId, quantity]) => {
      const item = items.find(i => i.item_id.toString() === itemId);
      const mode = itemModes[itemId] || 'unit';
      const actualQuantity = mode === 'package' && item?.pack_size
        ? quantity * item.pack_size
        : quantity;
      return { itemId: parseInt(itemId), quantity: actualQuantity, item, mode, inputQty: quantity };
    });

  const handleConfirm = () => {
    if (Object.keys(selectedItems).length === 0) {
      toast.error('Selecione pelo menos um item para registrar');
      return;
    }
    const employeeId = currentProfile?.employee_id || profiles[0]?.employee_id;
    if (!employeeId) {
      toast.error('Nenhum perfil de funcionário encontrado');
      return;
    }
    setModalOpen(true);
  };

  const handleConfirmModal = async () => {
    const itemCount = Object.keys(selectedItems).length;
    const employeeId = currentProfile?.employee_id || profiles[0]?.employee_id!;

    setLoading(true);
    try {
      const itemsToRegister = buildItemsToRegister().map(({ itemId, quantity }) => ({ itemId, quantity }));
      await batchStockIn(itemsToRegister, employeeId);
      setModalOpen(false);
      toast.success(`${itemCount} ${itemCount === 1 ? 'item registrado' : 'itens registrados'} com sucesso!`);
      navigate('/movimentacoes');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar compras');
    } finally {
      setLoading(false);
    }
  };

  const totalSelected = Object.keys(selectedItems).length;

  const modalItems = buildItemsToRegister().map(({ item, quantity, mode, inputQty }) => ({
    name: item?.display_name || '',
    quantity: mode === 'package' && item?.pack_size
      ? inputQty
      : quantity,
    suffix: mode === 'package' && item?.pack_size
      ? `pacote${inputQty > 1 ? 's' : ''} (${quantity} un)`
      : undefined,
  }));

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
          <p className="font-['Montserrat',sans-serif] font-semibold text-[32px] lg:text-[40px]">Registrar Compras</p>
          <p className="font-['Montserrat',sans-serif] font-normal text-[20px] lg:text-[24px]">
            Selecione os itens e quantidades compradas
          </p>
        </div>
      </div>

      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px] flex-1 pb-[120px] lg:pb-[140px]">
        <div className="content-stretch flex flex-col gap-[16px] lg:gap-[20px] items-start w-full">
          {items.map((item) => {
            const selectedQty = selectedItems[item.item_id.toString()] || 0;
            const isLowStock = item.in_stock <= item.desired_stock;
            const currentMode = itemModes[item.item_id.toString()] || 'unit';
            const isPackageType = item.item_type === 'package';

            return (
              <div
                key={item.item_id}
                className={`bg-white relative rounded-[16px] lg:rounded-[20px] w-full ${isLowStock && 'ring-2 ring-[#ff4444]'}`}
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
                    {isLowStock && (
                      <span className="bg-[#ff4444] text-white text-[11px] lg:text-[12px] px-[8px] py-[2px] rounded-full font-['Montserrat',sans-serif] font-semibold">
                        ESTOQUE BAIXO
                      </span>
                    )}
                    {isPackageType && (
                      <div className="flex items-center gap-[8px] mt-[4px]">
                        <button
                          onClick={() => toggleItemMode(item.item_id.toString())}
                          className={`flex items-center gap-[4px] px-[10px] py-[4px] rounded-full border-2 transition-all ${
                            currentMode === 'unit'
                              ? 'bg-[#0c7c97] border-[#0c7c97] text-white'
                              : 'bg-white border-[#f0f2fb] text-[#666] hover:border-[#0c7c97]'
                          }`}
                        >
                          <span className="font-['Montserrat',sans-serif] font-medium text-[10px] lg:text-[12px]">
                            Unidade
                          </span>
                        </button>
                        <button
                          onClick={() => toggleItemMode(item.item_id.toString())}
                          className={`flex items-center gap-[4px] px-[10px] py-[4px] rounded-full border-2 transition-all ${
                            currentMode === 'package'
                              ? 'bg-[#0c7c97] border-[#0c7c97] text-white'
                              : 'bg-white border-[#f0f2fb] text-[#666] hover:border-[#0c7c97]'
                          }`}
                        >
                          <span className="font-['Montserrat',sans-serif] font-medium text-[10px] lg:text-[12px]">
                            Pacote ({item.pack_size || 1}x)
                          </span>
                        </button>
                      </div>
                    )}
                    <p className="font-['Montserrat',sans-serif] font-normal text-[12px] lg:text-[16px] text-black">
                      Estoque atual: {item.in_stock}
                    </p>
                    <p className="font-['Montserrat',sans-serif] font-normal text-[12px] lg:text-[16px] text-black">
                      Mínimo: {item.desired_stock}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-[8px] shrink-0 ml-auto">
                    <button
                      onClick={() => handleQuantityChange(item.item_id.toString(), 1)}
                      className="bg-[#0c7c97] hover:bg-[#0a6a80] rounded-[8px] h-[44px] lg:h-[48px] w-[64px] lg:w-[72px] transition-colors flex items-center justify-center"
                    >
                      <Plus className="size-[18px] lg:size-[20px] text-white" />
                    </button>

                    <input
                      type="number"
                      value={selectedQty}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setSelectedItems(prev => {
                          if (value === 0) {
                            const { [item.item_id.toString()]: _, ...rest } = prev;
                            return rest;
                          }
                          return { ...prev, [item.item_id.toString()]: Math.max(0, value) };
                        });
                      }}
                      className="font-['Montserrat',sans-serif] font-bold text-[18px] lg:text-[20px] text-black text-center w-[64px] lg:w-[72px] h-[40px] lg:h-[44px] bg-transparent outline-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-pointer hover:bg-[#f0f2fb] rounded-[4px] px-[4px]"
                    />

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
        title="Confirmar compra"
        items={modalItems}
        confirmLabel="Confirmar compra"
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