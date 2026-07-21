import { useNavigate } from 'react-router';
import Header from '../components/Header';
import CleanerManager from '../components/CleanerManager';
import { ArrowLeft, Users } from 'lucide-react';

// Lightweight version of Gerenciar Funcionários for Supervisora, reached from
// the "Gerenciar funcionários" icon inside Entregar/Devolver Materiais.
// Cleaners only — no invite code, no supervisor info (that's Admin/Owner-only,
// see GerenciarUsuarios).
export default function GerenciarCleaners() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#fafafa] content-stretch flex flex-col gap-[32px] lg:gap-[40px] items-start py-[48px] lg:py-[56px] relative min-h-screen w-full">
      <Header />

      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-[8px] text-[#0c7c97] mb-[16px] lg:mb-[20px] hover:underline"
        >
          <ArrowLeft className="size-[20px] lg:size-[24px]" />
          <span className="font-['Montserrat',sans-serif] font-medium text-[16px] lg:text-[18px]">Voltar</span>
        </button>

        <div className="content-stretch flex flex-col gap-[4px] items-start leading-[normal] text-black">
          <div className="flex items-center gap-[12px]">
            <Users className="size-[32px] lg:size-[40px] text-[#0c7c97]" />
            <p className="font-['Montserrat',sans-serif] font-semibold text-[32px] lg:text-[40px]">
              Gerenciar Funcionários
            </p>
          </div>
          <p className="font-['Montserrat',sans-serif] font-normal text-[20px] lg:text-[24px]">
            Adicione ou remova funcionários do tipo Cleaner
          </p>
        </div>
      </div>

      <CleanerManager />
    </div>
  );
}
