import { RouterProvider } from 'react-router';
import { router } from './routes';
import { InventoryProvider } from './context/InventoryContext';
import { Toaster } from 'sonner';
import '../styles/index.css';

function App() {
  return (
    <InventoryProvider>
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </InventoryProvider>
  );
}

export default App;