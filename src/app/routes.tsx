import { createBrowserRouter, Navigate } from "react-router";
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
import Monitoramento from "./pages/Monitoramento";
import Login from "./pages/Login";
import JobsXml from "./pages/JobsXml";

// Protected route wrapper
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
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin-only route wrapper (includes Super users)
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

  if (currentProfile?.role !== 'Admin' && currentProfile?.role !== 'Super') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Super-only route wrapper
function SuperOnlyRoute({ children }: { children: React.ReactNode }) {
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

  if (currentProfile?.role !== 'Super') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/jobs.xml",
    Component: JobsXml,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Root />
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
      { path: "gerenciar-usuarios", Component: GerenciarUsuarios },
      {
        path: "monitoramento",
        element: (
          <SuperOnlyRoute>
            <Monitoramento />
          </SuperOnlyRoute>
        )
      },
    ],
  },
]);