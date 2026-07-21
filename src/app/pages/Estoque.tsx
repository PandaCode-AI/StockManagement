import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import { Pencil, Search, Package, Plus } from 'lucide-react';

export default function Estoque() {
  const navigate = useNavigate();
  const { items, currentProfile } = useInventory();
  const canAdd = currentProfile?.role === 'Admin' || currentProfile?.role === 'Owner';
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items based on search term
  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const matchesDisplayName = item.display_name.toLowerCase().includes(search);
    const matchesNickName = item.nick_name?.toLowerCase().includes(search);
    return matchesDisplayName || matchesNickName;
  });

  // Sort items: low stock items first, then normal stock items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aIsLowStock = a.in_stock <= a.desired_stock;
    const bIsLowStock = b.in_stock <= b.desired_stock;

    // If one is low stock and the other isn't, prioritize low stock
    if (aIsLowStock && !bIsLowStock) return -1;
    if (!aIsLowStock && bIsLowStock) return 1;

    // If both are low stock or both are normal, maintain original order
    return 0;
  });

  return (
    <div className="bg-[#fafafa] content-stretch flex flex-col gap-[24px] lg:gap-[32px] items-start py-[32px] lg:py-[48px] relative min-h-screen w-full">
      <Header />

      <div className="relative shrink-0 w-full">
        <div className="content-stretch flex flex-col lg:flex-row gap-[16px] lg:gap-[24px] items-start lg:items-center lg:justify-between leading-[normal] px-[16px] lg:px-[24px] relative text-black w-full">
          <div className="content-stretch flex flex-col gap-[4px] items-start">
            <div className="flex items-center gap-[8px] lg:gap-[12px]">
              <Package className="size-[28px] lg:size-[32px] text-[#0c7c97]" />
              <p className="font-['Montserrat',sans-serif] font-semibold text-[24px] lg:text-[32px]">
                Estoque
              </p>
            </div>
            <p className="font-['Montserrat',sans-serif] font-normal text-[16px] lg:text-[20px]">
              Visualizar e editar itens no estoque
            </p>
          </div>

          <div className="flex items-center gap-[10px] lg:gap-[12px] w-full lg:w-auto">
            {canAdd && (
              <button
                onClick={() => navigate('/adicionar')}
                className="flex items-center gap-[6px] lg:gap-[8px] px-[14px] lg:px-[18px] py-[10px] lg:py-[12px] rounded-[8px] lg:rounded-[12px] bg-[#0c7c97] hover:bg-[#0a6a80] transition-colors shrink-0"
              >
                <Plus className="size-[18px] lg:size-[20px] text-white" />
                <span className="font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[16px] text-white whitespace-nowrap">
                  Novo Item
                </span>
              </button>
            )}
            <div className="relative flex-1 lg:min-w-[320px]">
              <div className="absolute left-[12px] lg:left-[16px] top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="size-[18px] lg:size-[20px] text-[#666]" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome ou apelido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-[40px] lg:pl-[48px] pr-[12px] lg:pr-[16px] py-[10px] lg:py-[12px] rounded-[8px] lg:rounded-[12px] border-2 border-[#f0f2fb] font-['Montserrat',sans-serif] font-normal text-[14px] lg:text-[16px] text-black placeholder:text-[#999] focus:border-[#0c7c97] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative shrink-0 w-full px-[16px] lg:px-[24px]">
        <div className="content-stretch flex flex-col gap-[12px] lg:gap-[20px] items-start w-full">
          {sortedItems.length === 0 && searchTerm && (
            <div className="w-full text-center py-[40px] lg:py-[60px]">
              <p className="font-['Montserrat',sans-serif] font-medium text-[16px] lg:text-[20px] text-gray-600">
                Nenhum item encontrado para "{searchTerm}"
              </p>
              <p className="font-['Montserrat',sans-serif] font-normal text-[14px] lg:text-[16px] text-gray-500 mt-[8px]">
                Tente buscar por outro nome ou apelido
              </p>
            </div>
          )}

          {sortedItems.map((item) => {
            const isLowStock = item.in_stock <= item.desired_stock;

            return (
              <div
                key={item.item_id}
                className="bg-white relative rounded-[12px] lg:rounded-[20px] w-full cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/editar/${item.item_id}`)}
              >
                <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[12px] lg:rounded-[20px]" />
                <div className="content-stretch flex items-center gap-[12px] lg:gap-[24px] p-[16px] lg:p-[32px] relative w-full">
                  <div className="aspect-square content-stretch flex h-[80px] lg:h-[160px] items-center justify-center overflow-clip relative rounded-[8px] lg:rounded-[12px] shrink-0">
                    <img
                      alt={item.display_name}
                      className="size-full object-cover"
                      src={item.photo_link}
                    />
                  </div>

                  <div className="content-stretch flex flex-col gap-[8px] lg:gap-[20px] items-start flex-1 min-w-0">
                    <div className="content-stretch flex flex-col gap-[2px] lg:gap-[6px] items-start w-full">
                      <div className="content-stretch flex gap-[6px] lg:gap-[12px] items-center flex-wrap">
                        <p className="font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[28px] text-black">
                          {item.display_name}
                        </p>
                        <p className="font-['Montserrat',sans-serif] font-light text-[#0c7c97] text-[12px] lg:text-[18px]">
                          {item.sku}
                        </p>
                      </div>
                      {item.nick_name && (
                        <p className="font-['Montserrat',sans-serif] font-normal text-[13px] lg:text-[18px] text-gray-600">
                          {item.nick_name}
                        </p>
                      )}
                    </div>

                    <div className="content-stretch flex gap-[8px] lg:gap-[24px] items-center flex-wrap">
                      <div className={`bg-white content-stretch flex flex-col gap-[2px] lg:gap-[6px] items-start px-[12px] lg:px-[20px] py-[6px] lg:py-[12px] relative rounded-[6px] lg:rounded-[12px] shrink-0`}>
                        <div className={`absolute border-2 ${isLowStock ? 'border-[#ff4444]' : 'border-[#1abae1]'} border-solid inset-0 pointer-events-none rounded-[6px] lg:rounded-[12px]`} />
                        <p className="font-['Montserrat',sans-serif] font-normal leading-[normal] text-[11px] lg:text-[18px] text-black">
                          Em Estoque
                        </p>
                        <p className={`font-['Montserrat',sans-serif] font-extrabold leading-[normal] text-[16px] lg:text-[24px] ${isLowStock ? 'text-[#ff4444]' : 'text-black'}`}>
                          {item.in_stock}
                        </p>
                      </div>

                      <div className="bg-white content-stretch flex flex-col gap-[2px] lg:gap-[6px] items-start px-[12px] lg:px-[20px] py-[6px] lg:py-[12px] relative rounded-[6px] lg:rounded-[12px] shrink-0">
                        <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[6px] lg:rounded-[12px]" />
                        <p className="font-['Montserrat',sans-serif] font-normal leading-[normal] text-[11px] lg:text-[18px] text-black whitespace-nowrap">
                          Estoque Mínimo
                        </p>
                        <p className="font-['Montserrat',sans-serif] font-extrabold leading-[normal] text-[16px] lg:text-[24px] text-black">
                          {item.desired_stock}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex items-center justify-center shrink-0 p-[16px] lg:p-[20px]">
                    <Pencil className="size-[24px] lg:size-[32px] text-[#0c7c97]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}