import { useNavigate, useLocation } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import { Package, Repeat, Clock, BarChart3, Users } from 'lucide-react';

export default function NavigationFooter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProfile } = useInventory();

  // Hide navigation footer on action pages
  const isActionPage = location.pathname.includes('entregar') ||
                       location.pathname.includes('devolver') ||
                       location.pathname.includes('comprar');

  if (isActionPage) {
    return null;
  }

  const isStockPage = location.pathname === '/' || location.pathname.startsWith('/editar');
  const isMovementsPage = location.pathname.includes('movimentacoes');
  const isHistoryPage = location.pathname.includes('historico');
  const isMonitoringPage = location.pathname.includes('monitoramento');
  const isUsersPage = location.pathname.includes('gerenciar-usuarios');

  const isAdmin = currentProfile?.role === 'Admin' || currentProfile?.role === 'Owner';
  const isOwner = currentProfile?.role === 'Owner';

  // Grid columns: 2 for regular users, 4 for Admin, 5 for Owner
  const gridCols = isOwner ? 'grid-cols-5' : isAdmin ? 'grid-cols-4' : 'grid-cols-2';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#f0f2fb] z-50">
      <div className={`grid ${gridCols} w-full`}>
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
            isStockPage ? 'bg-[#0c7c97] text-white' : 'bg-white text-[#323232] hover:bg-[#f0f2fb]'
          }`}
        >
          <Package className={`h-6 w-6 mb-1 ${isStockPage ? 'stroke-white' : 'stroke-[#323232]'}`} strokeWidth={2} />
          <span className={`font-['Montserrat',sans-serif] text-[11px] lg:text-[13px] ${
            isStockPage ? 'font-bold' : 'font-medium'
          }`}>
            Estoque
          </span>
        </button>

        <button
          onClick={() => navigate('/movimentacoes')}
          className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
            isMovementsPage ? 'bg-[#0c7c97] text-white' : 'bg-white text-[#323232] hover:bg-[#f0f2fb]'
          }`}
        >
          <Repeat className={`h-6 w-6 mb-1 ${isMovementsPage ? 'stroke-white' : 'stroke-[#323232]'}`} strokeWidth={2} />
          <span className={`font-['Montserrat',sans-serif] text-[11px] lg:text-[13px] ${
            isMovementsPage ? 'font-bold' : 'font-medium'
          }`}>
            Movimentações
          </span>
        </button>

        {isAdmin && (
          <button
            onClick={() => navigate('/historico')}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
              isHistoryPage ? 'bg-[#0c7c97] text-white' : 'bg-white text-[#323232] hover:bg-[#f0f2fb]'
            }`}
          >
            <Clock className={`h-6 w-6 mb-1 ${isHistoryPage ? 'stroke-white' : 'stroke-[#323232]'}`} strokeWidth={2} />
            <span className={`font-['Montserrat',sans-serif] text-[11px] lg:text-[13px] ${
              isHistoryPage ? 'font-bold' : 'font-medium'
            }`}>
              Histórico
            </span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => navigate('/gerenciar-usuarios')}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
              isUsersPage ? 'bg-[#0c7c97] text-white' : 'bg-white text-[#323232] hover:bg-[#f0f2fb]'
            }`}
          >
            <Users className={`h-6 w-6 mb-1 ${isUsersPage ? 'stroke-white' : 'stroke-[#323232]'}`} strokeWidth={2} />
            <span className={`font-['Montserrat',sans-serif] text-[11px] lg:text-[13px] ${
              isUsersPage ? 'font-bold' : 'font-medium'
            }`}>
              Funcionários
            </span>
          </button>
        )}

        {isOwner && (
          <button
            onClick={() => navigate('/monitoramento')}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
              isMonitoringPage ? 'bg-[#0c7c97] text-white' : 'bg-white text-[#323232] hover:bg-[#f0f2fb]'
            }`}
          >
            <BarChart3 className={`h-6 w-6 mb-1 ${isMonitoringPage ? 'stroke-white' : 'stroke-[#323232]'}`} strokeWidth={2} />
            <span className={`font-['Montserrat',sans-serif] text-[11px] lg:text-[13px] ${
              isMonitoringPage ? 'font-bold' : 'font-medium'
            }`}>
              Monitoramento
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
