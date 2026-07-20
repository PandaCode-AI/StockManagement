import { Outlet, useLocation } from 'react-router';
import NavigationFooter from './NavigationFooter';

export default function Root() {
  const location = useLocation();

  // Don't add bottom padding on action pages
  const isActionPage = location.pathname.includes('entregar') ||
                       location.pathname.includes('devolver') ||
                       location.pathname.includes('comprar');

  return (
    <div className={`bg-[#fafafa] min-h-screen w-full ${!isActionPage ? 'pb-[72px]' : ''}`}>
      <Outlet />
      <NavigationFooter />
    </div>
  );
}
