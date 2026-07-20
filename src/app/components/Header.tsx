import { useNavigate, useLocation } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import imgLogo from 'figma:asset/08d20ecb15948845987a58e1893d9942aa75c450.png';
import { LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, currentProfile, signOut } = useInventory();

  const isStockPage = location.pathname === '/' || location.pathname.startsWith('/editar');
  const isMovementsPage = location.pathname.includes('movimentacoes') ||
                           location.pathname.includes('entregar') ||
                           location.pathname.includes('devolver') ||
                           location.pathname.includes('comprar');
  const isHistoryPage = location.pathname.includes('historico');
  const isMonitoringPage = location.pathname.includes('monitoramento');

  // Check if user is Admin
  const isAdmin = currentProfile?.role === 'Admin';

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <div className="relative shrink-0 w-full">
      {/* Logo + Perfil */}
      <div className="flex items-center justify-between px-[24px] lg:px-[48px] py-4 relative w-full">
        <div className="h-[48px] lg:h-[56px] relative shrink-0 w-[150px] lg:w-[176px] cursor-pointer" onClick={() => navigate('/')}>
          <img
            alt="Manatee Logo"
            className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
            src={imgLogo}
          />
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 bg-[#f0f2fb] rounded-lg">
            <User className="h-4 w-4 lg:h-5 lg:w-5 text-[#0c7c97]" />
            <p className="font-['Montserrat',sans-serif] font-medium text-[#323232] text-sm lg:text-base hidden sm:block">
              {currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'Usuário'}
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSignOut}
            title="Sair"
            className="h-10 w-10 lg:h-11 lg:w-11 border-2 border-[#f0f2fb] hover:border-[#0c7c97] hover:bg-[#f0f2fb]"
          >
            <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
