import { createBrowserRouter, Navigate, useLocation } from "react-router";
import { useInventory } from "./context/InventoryContext";
import Root from "./components/Root";
import Estoque from "./pages/Estoque";
import EditarItem from "./pages/EditarItem";
import Movimentacoes from "./pages/Movimentacoes";
import EntregarMateriais from "./pages/EntregarMateriais";
import DevolverMateriais from "./pages/DevolverMateriais";
import RegistrarCompras from "./pages/RegistrarCompras";
import Historico from "./pages/Historico";
import AdicionarItem from "./pages/AdicionarItem";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import GerenciarCleaners from "./pages/GerenciarCleaners";
import Monitoramento from "./pages/Monitoramento";
import Assinatura from "./pages/Assinatura";
import Login from "./pages/Login";
import AcceptInvite from "./pages/AcceptInvite";
import ResetPassword from "./pages/ResetPassword";
import Landing from "./pages/Landing";

// Protected route wrapper. Shows the public landing page in place of the app
// for signed-out visitors (rather than bouncing straight to /login) so "/"
// has a real marketing page instead of an immediate redirect.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useInventory();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Landing />;
  }

  return <>{children}</>;
}

// Admin-only route wrapper (includes the org's Owner)
function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { currentProfile, loading } = useInventory();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (currentProfile?.role !== 'Admin' && currentProfile?.role !== 'Owner') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Supervisor-or-above route wrapper (anyone who can manage Cleaners)
function SupervisorOnlyRoute({ children }: { children: React.ReactNode }) {
  const { currentProfile, loading } = useInventory();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const role = currentProfile?.role;
  if (role !== 'Supervisora' && role !== 'Admin' && role !== 'Owner') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Owner-only route wrapper (this organization's highest authority)
function OwnerOnlyRoute({ children }: { children: React.ReactNode }) {
  const { currentProfile, loading } = useInventory();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (currentProfile?.role !== 'Owner') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function isSubscriptionActive(status?: string, trialEndsAt?: string | null): boolean {
  if (status === 'active') return true;
  if (status === 'trialing' && trialEndsAt && new Date(trialEndsAt).getTime() > Date.now()) return true;
  return false;
}

// Blocks the whole app (except the billing page itself) once a trial has
// expired and no paid subscription is active. Mirrors the backend's own
// check in supabase/functions/make-server-264019ad/index.ts so the UI never
// shows working buttons for actions the API will reject with 402.
function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { currentOrg, currentProfile, loading } = useInventory();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // The billing page must always be reachable, even while blocked, so an
  // Owner can actually pay.
  if (location.pathname.startsWith('/assinatura')) {
    return <>{children}</>;
  }

  if (isSubscriptionActive(currentOrg?.subscription_status, currentOrg?.trial_ends_at)) {
    return <>{children}</>;
  }

  if (currentProfile?.role === 'Owner') {
    return <Navigate to="/assinatura" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6">
      <div className="text-center max-w-md">
        <p className="font-['Montserrat',sans-serif] font-semibold text-[24px] text-black mb-2">
          Assinatura da organização inativa
        </p>
        <p className="font-['Montserrat',sans-serif] text-[16px] text-gray-600">
          Peça para o responsável (Owner) da organização renovar a assinatura para continuar usando o sistema.
        </p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/accept-invite",
    Component: AcceptInvite,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <SubscriptionGate>
          <Root />
        </SubscriptionGate>
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Estoque },
      { path: "editar/:id", Component: EditarItem },
      {
        path: "adicionar",
        element: (
          <AdminOnlyRoute>
            <AdicionarItem />
          </AdminOnlyRoute>
        )
      },
      { path: "movimentacoes", Component: Movimentacoes },
      { path: "entregar", Component: EntregarMateriais },
      { path: "devolver", Component: DevolverMateriais },
      { path: "comprar", Component: RegistrarCompras },
      {
        path: "historico",
        element: (
          <AdminOnlyRoute>
            <Historico />
          </AdminOnlyRoute>
        )
      },
      {
        path: "gerenciar-usuarios",
        element: (
          <AdminOnlyRoute>
            <GerenciarUsuarios />
          </AdminOnlyRoute>
        )
      },
      {
        path: "gerenciar-cleaners",
        element: (
          <SupervisorOnlyRoute>
            <GerenciarCleaners />
          </SupervisorOnlyRoute>
        )
      },
      {
        path: "monitoramento",
        element: (
          <OwnerOnlyRoute>
            <Monitoramento />
          </OwnerOnlyRoute>
        )
      },
      {
        path: "assinatura",
        element: (
          <OwnerOnlyRoute>
            <Assinatura />
          </OwnerOnlyRoute>
        )
      },
    ],
  },
], {
  // import.meta.env.BASE_URL is Vite's own reflection of the `base` config
  // in vite.config.ts (itself driven by VITE_BASE_PATH) -- keeping the
  // router's basename derived from it means a custom-domain deploy (base
  // "/") or a different subpath never needs a code change here too.
  basename: import.meta.env.BASE_URL,
});