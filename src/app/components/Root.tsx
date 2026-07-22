import { Outlet, useLocation, useNavigate } from 'react-router';
import NavigationFooter from './NavigationFooter';
import { useInventory } from '../context/InventoryContext';

function TrialBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrg, currentProfile } = useInventory();

  const isOwner = currentProfile?.role === 'Owner';
  const trialEndsAt = currentOrg?.trial_ends_at ? new Date(currentOrg.trial_ends_at) : null;
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;

  // Only a heads-up during the trial's final days -- SubscriptionGate
  // already takes over the whole screen once it actually expires.
  if (!isOwner || currentOrg?.subscription_status !== 'trialing' || daysLeft === null || daysLeft > 5) {
    return null;
  }
  if (location.pathname.startsWith('/assinatura')) {
    return null;
  }

  return (
    <div className="bg-amber-100 border-b-2 border-amber-300 px-4 py-2 flex items-center justify-center gap-3 flex-wrap">
      <p className="font-['Montserrat',sans-serif] text-[13px] lg:text-[14px] text-amber-900">
        {daysLeft <= 0
          ? 'Seu período de teste terminou.'
          : `Seu período de teste termina em ${daysLeft} dia${daysLeft === 1 ? '' : 's'}.`}
      </p>
      <button
        onClick={() => navigate('/assinatura')}
        className="font-['Montserrat',sans-serif] font-semibold text-[13px] lg:text-[14px] text-amber-900 underline"
      >
        Assinar agora
      </button>
    </div>
  );
}

export default function Root() {
  const location = useLocation();

  // Don't add bottom padding on action pages
  const isActionPage = location.pathname.includes('entregar') ||
                       location.pathname.includes('devolver') ||
                       location.pathname.includes('comprar');

  return (
    <div className={`bg-[#fafafa] min-h-screen w-full ${!isActionPage ? 'pb-[72px]' : ''}`}>
      <TrialBanner />
      <Outlet />
      <NavigationFooter />
    </div>
  );
}
