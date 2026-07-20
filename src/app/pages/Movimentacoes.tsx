import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import { LogIn, LogOut, ShoppingCart, ArrowLeftRight } from 'lucide-react';

export default function Movimentacoes() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#fafafa] content-stretch flex flex-col gap-[24px] lg:gap-[32px] items-start py-[32px] lg:py-[48px] relative w-full">
      <Header />

      <div className="relative shrink-0 w-full">
        <div className="content-stretch flex flex-col gap-[4px] items-start leading-[normal] px-[16px] lg:px-[24px] relative text-black w-full">
          <div className="flex items-center gap-[8px] lg:gap-[12px]">
            <ArrowLeftRight className="size-[28px] lg:size-[32px] text-[#0c7c97]" />
            <p className="font-['Montserrat',sans-serif] font-semibold text-[24px] lg:text-[32px]">
              Movimentações
            </p>
          </div>
          <p className="font-['Montserrat',sans-serif] font-normal text-[16px] lg:text-[20px]">
            Escolha o tipo de ação que gostaria de fazer
          </p>
        </div>
      </div>

      <div className="w-full px-[16px] lg:px-[24px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] lg:gap-[24px]">
          <button
            onClick={() => navigate('/entregar')}
            className="bg-white hover:bg-[#f0f2fb] relative rounded-[16px] lg:rounded-[20px] transition-colors border-2 border-[#f0f2fb] hover:border-[#1ABAE1] hover:shadow-lg"
          >
            <div className="content-stretch flex flex-col gap-[12px] lg:gap-[20px] items-center justify-center px-[20px] lg:px-[32px] py-[24px] lg:py-[48px] relative w-full">
              <div className="relative shrink-0 size-[40px] lg:size-[64px] text-[#1ABAE1]">
                <LogIn className="size-full" strokeWidth={1.5} />
              </div>
              <p className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[16px] lg:text-[22px] text-black">
                Entregar Materiais
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/devolver')}
            className="bg-white hover:bg-[#f0f2fb] relative rounded-[16px] lg:rounded-[20px] transition-colors border-2 border-[#f0f2fb] hover:border-[#1ABAE1] hover:shadow-lg"
          >
            <div className="content-stretch flex flex-col gap-[12px] lg:gap-[20px] items-center justify-center px-[20px] lg:px-[32px] py-[24px] lg:py-[48px] relative w-full">
              <div className="relative shrink-0 size-[40px] lg:size-[64px] text-[#1ABAE1]">
                <LogOut className="size-full" strokeWidth={1.5} />
              </div>
              <p className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[16px] lg:text-[22px] text-black">
                Devolver Materiais
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/comprar')}
            className="bg-white hover:bg-[#f0f2fb] relative rounded-[16px] lg:rounded-[20px] transition-colors border-2 border-[#f0f2fb] hover:border-[#1ABAE1] hover:shadow-lg"
          >
            <div className="content-stretch flex flex-col gap-[12px] lg:gap-[20px] items-center justify-center px-[20px] lg:px-[32px] py-[24px] lg:py-[48px] relative w-full">
              <div className="relative shrink-0 size-[40px] lg:size-[64px] text-[#1ABAE1]">
                <ShoppingCart className="size-full" strokeWidth={1.5} />
              </div>
              <p className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[16px] lg:text-[22px] text-black">
                Registrar Compras
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}