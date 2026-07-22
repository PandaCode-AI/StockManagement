import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import { CreditCard, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

function daysLeft(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function Assinatura() {
  const { currentOrg, startCheckout, openBillingPortal } = useInventory();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      toast.success('Assinatura confirmada! Pode levar alguns segundos para atualizar.');
    } else if (checkout === 'cancelled') {
      toast.info('Checkout cancelado.');
    }
    if (checkout) {
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = currentOrg?.subscription_status;
  const trialDaysLeft = daysLeft(currentOrg?.trial_ends_at);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await startCheckout();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar checkout');
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    try {
      await openBillingPortal();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao abrir portal de cobrança');
      setLoading(false);
    }
  };

  const cancelAtPeriodEnd = currentOrg?.cancel_at_period_end === true;

  let statusCard;
  if (status === 'active' && cancelAtPeriodEnd) {
    statusCard = (
      <div className="bg-white rounded-[16px] lg:rounded-[20px] border-2 border-amber-300 p-[24px] lg:p-[32px]">
        <div className="flex items-center gap-[12px] mb-[12px]">
          <AlertTriangle className="size-[28px] text-amber-600" />
          <p className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black">
            Assinatura cancelada
          </p>
        </div>
        <p className="font-['Montserrat',sans-serif] text-[15px] lg:text-[16px] text-gray-600 mb-[20px]">
          Você ainda tem acesso até {formatDate(currentOrg?.current_period_end)}. Depois dessa data o sistema ficará bloqueado, a menos que reative a assinatura.
        </p>
        <button
          onClick={handlePortal}
          disabled={loading}
          className="flex items-center gap-[8px] bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-50 px-[24px] py-[14px] rounded-[999px] font-['Montserrat',sans-serif] font-semibold text-[15px] lg:text-[16px] text-white transition-colors"
        >
          <CreditCard className="size-[18px]" />
          Reativar assinatura
        </button>
      </div>
    );
  } else if (status === 'active') {
    statusCard = (
      <div className="bg-white rounded-[16px] lg:rounded-[20px] border-2 border-[#f0f2fb] p-[24px] lg:p-[32px]">
        <div className="flex items-center gap-[12px] mb-[12px]">
          <CheckCircle2 className="size-[28px] text-green-600" />
          <p className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black">
            Assinatura ativa
          </p>
        </div>
        <p className="font-['Montserrat',sans-serif] text-[15px] lg:text-[16px] text-gray-600 mb-[20px]">
          Próxima cobrança em {formatDate(currentOrg?.current_period_end)}.
        </p>
        <button
          onClick={handlePortal}
          disabled={loading}
          className="flex items-center gap-[8px] bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-50 px-[24px] py-[14px] rounded-[999px] font-['Montserrat',sans-serif] font-semibold text-[15px] lg:text-[16px] text-white transition-colors"
        >
          <CreditCard className="size-[18px]" />
          Gerenciar assinatura
        </button>
      </div>
    );
  } else if (status === 'past_due' || status === 'unpaid') {
    statusCard = (
      <div className="bg-white rounded-[16px] lg:rounded-[20px] border-2 border-amber-300 p-[24px] lg:p-[32px]">
        <div className="flex items-center gap-[12px] mb-[12px]">
          <AlertTriangle className="size-[28px] text-amber-600" />
          <p className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black">
            Pagamento pendente
          </p>
        </div>
        <p className="font-['Montserrat',sans-serif] text-[15px] lg:text-[16px] text-gray-600 mb-[20px]">
          Não conseguimos processar seu pagamento. Atualize a forma de pagamento para continuar usando o sistema.
        </p>
        <button
          onClick={handlePortal}
          disabled={loading}
          className="flex items-center gap-[8px] bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-[24px] py-[14px] rounded-[999px] font-['Montserrat',sans-serif] font-semibold text-[15px] lg:text-[16px] text-white transition-colors"
        >
          <CreditCard className="size-[18px]" />
          Atualizar pagamento
        </button>
      </div>
    );
  } else if (status === 'trialing') {
    const expired = trialDaysLeft <= 0;
    statusCard = (
      <div className={`bg-white rounded-[16px] lg:rounded-[20px] border-2 ${expired ? 'border-red-300' : 'border-[#f0f2fb]'} p-[24px] lg:p-[32px]`}>
        <div className="flex items-center gap-[12px] mb-[12px]">
          <Clock className={`size-[28px] ${expired ? 'text-red-600' : 'text-[#0c7c97]'}`} />
          <p className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black">
            {expired ? 'Período de teste encerrado' : `Período de teste — ${trialDaysLeft} dia${trialDaysLeft === 1 ? '' : 's'} restante${trialDaysLeft === 1 ? '' : 's'}`}
          </p>
        </div>
        <p className="font-['Montserrat',sans-serif] text-[15px] lg:text-[16px] text-gray-600 mb-[20px]">
          {expired
            ? 'Assine para continuar usando o sistema sem interrupções.'
            : `Seu teste gratuito termina em ${formatDate(currentOrg?.trial_ends_at)}. Assine a qualquer momento para não perder acesso.`}
        </p>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="flex items-center gap-[8px] bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-50 px-[24px] py-[14px] rounded-[999px] font-['Montserrat',sans-serif] font-semibold text-[15px] lg:text-[16px] text-white transition-colors"
        >
          <CreditCard className="size-[18px]" />
          Assinar agora — R$299,00/mês
        </button>
      </div>
    );
  } else {
    statusCard = (
      <div className="bg-white rounded-[16px] lg:rounded-[20px] border-2 border-[#f0f2fb] p-[24px] lg:p-[32px]">
        <div className="flex items-center gap-[12px] mb-[12px]">
          <AlertTriangle className="size-[28px] text-red-600" />
          <p className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black">
            Assinatura inativa
          </p>
        </div>
        <p className="font-['Montserrat',sans-serif] text-[15px] lg:text-[16px] text-gray-600 mb-[20px]">
          Assine para liberar o acesso ao sistema para toda a organização.
        </p>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="flex items-center gap-[8px] bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-50 px-[24px] py-[14px] rounded-[999px] font-['Montserrat',sans-serif] font-semibold text-[15px] lg:text-[16px] text-white transition-colors"
        >
          <CreditCard className="size-[18px]" />
          Assinar agora — R$299,00/mês
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] content-stretch flex flex-col gap-[32px] lg:gap-[40px] items-start py-[48px] lg:py-[56px] relative min-h-screen w-full">
      <Header />

      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <div className="content-stretch flex flex-col gap-[4px] items-start leading-[normal] text-black">
          <div className="flex items-center gap-[12px]">
            <CreditCard className="size-[32px] lg:size-[40px] text-[#0c7c97]" />
            <p className="font-['Montserrat',sans-serif] font-semibold text-[32px] lg:text-[40px]">
              Assinatura
            </p>
          </div>
          <p className="font-['Montserrat',sans-serif] font-normal text-[20px] lg:text-[24px]">
            Plano da organização {currentOrg?.name}
          </p>
        </div>
      </div>

      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        {statusCard}
      </div>
    </div>
  );
}
