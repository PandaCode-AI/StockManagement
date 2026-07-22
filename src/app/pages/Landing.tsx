import { useNavigate } from 'react-router';
import { Package, Repeat, Users, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import imgLogo from 'figma:asset/08d20ecb15948845987a58e1893d9942aa75c450.png';

const FEATURES = [
  {
    icon: Package,
    title: 'Controle de estoque em tempo real',
    description: 'Veja o estoque de cada item, com alertas automáticos quando algo está abaixo do mínimo.',
  },
  {
    icon: Repeat,
    title: 'Entregas, devoluções e compras',
    description: 'Registre movimentações individuais ou em lote, com histórico completo de quem mexeu em quê.',
  },
  {
    icon: Users,
    title: 'Times e permissões',
    description: 'Owner, Admin, Supervisora e Cleaner — cada um vê e faz só o que precisa.',
  },
  {
    icon: ShieldCheck,
    title: 'Dados isolados por organização',
    description: 'Sua empresa nunca vê dados de outra. Isolamento reforçado no banco de dados, não só na tela.',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="flex items-center justify-between px-6 lg:px-16 py-6">
        <img alt="StockFlow" className="h-[40px] lg:h-[48px] w-auto object-contain" src={imgLogo} />
        <button
          onClick={() => navigate('/login')}
          className="font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[16px] text-[#0c7c97] hover:underline"
        >
          Entrar
        </button>
      </header>

      <main className="px-6 lg:px-16">
        <section className="max-w-3xl mx-auto text-center py-16 lg:py-24">
          <h1 className="font-['Montserrat',sans-serif] font-bold text-[36px] lg:text-[56px] text-black leading-tight mb-6">
            Gestão de estoque para equipes de limpeza
          </h1>
          <p className="font-['Montserrat',sans-serif] text-[18px] lg:text-[22px] text-[#666] mb-10">
            Controle materiais, movimentações e sua equipe em um só lugar. Simples o suficiente para tablet, forte o suficiente para múltiplas equipes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login?tab=signup')}
              className="bg-[#0c7c97] hover:bg-[#0a6a7f] text-white font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] py-4 px-8 rounded-xl transition-colors"
            >
              Começar grátis por 14 dias
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-white border-2 border-[#f0f2fb] hover:border-[#0c7c97] text-[#323232] font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] py-4 px-8 rounded-xl transition-colors"
            >
              Já tenho uma conta
            </button>
          </div>
          <p className="font-['Montserrat',sans-serif] text-[13px] lg:text-[14px] text-gray-500 mt-4">
            Sem cartão de crédito para começar.
          </p>
        </section>

        <section className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-6 pb-16 lg:pb-24">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white rounded-[20px] border-2 border-[#f0f2fb] p-6 lg:p-8">
              <div className="bg-[#0c7c97] rounded-full size-[48px] flex items-center justify-center mb-4">
                <Icon className="size-[24px] text-white" />
              </div>
              <p className="font-['Montserrat',sans-serif] font-semibold text-[18px] lg:text-[20px] text-black mb-2">
                {title}
              </p>
              <p className="font-['Montserrat',sans-serif] text-[15px] lg:text-[16px] text-gray-600">
                {description}
              </p>
            </div>
          ))}
        </section>

        <section className="max-w-2xl mx-auto pb-20 lg:pb-28">
          <div className="bg-white rounded-[24px] border-2 border-[#0c7c97] p-8 lg:p-12 text-center">
            <Clock className="size-[36px] text-[#0c7c97] mx-auto mb-4" />
            <p className="font-['Montserrat',sans-serif] font-semibold text-[24px] lg:text-[28px] text-black mb-2">
              R$299,00/mês por organização
            </p>
            <p className="font-['Montserrat',sans-serif] text-[16px] text-gray-600 mb-6">
              Usuários ilimitados. 14 dias grátis para testar com sua equipe antes de assinar.
            </p>
            <ul className="text-left inline-block mb-8">
              {[
                'Itens, movimentações e histórico ilimitados',
                'Convites por email para sua equipe',
                'Cancele quando quiser',
              ].map((line) => (
                <li key={line} className="flex items-center gap-2 mb-2 font-['Montserrat',sans-serif] text-[15px] text-[#323232]">
                  <CheckCircle2 className="size-[18px] text-[#0c7c97] shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
            <div>
              <button
                onClick={() => navigate('/login?tab=signup')}
                className="bg-[#0c7c97] hover:bg-[#0a6a7f] text-white font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] py-4 px-10 rounded-xl transition-colors"
              >
                Criar minha organização
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-8 font-['Montserrat',sans-serif] text-[13px] text-gray-500">
        © 2026 StockFlow
      </footer>
    </div>
  );
}
