import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../../../utils/supabase/info';

// Shared by the full admin page (GerenciarUsuarios) and the lightweight
// supervisor-facing page (GerenciarCleaners) — Cleaners only, no login,
// used purely for transaction attribution on shared devices.
export default function CleanerManager() {
  const { profiles, fetchProfiles, accessToken } = useInventory();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanerProfiles = profiles.filter(p => p.role === 'Cleaner');

  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      toast.error('Digite o nome do funcionário');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/profiles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ full_name: newUserName.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar funcionário');
      }

      toast.success('Funcionário adicionado com sucesso!');
      setNewUserName('');
      setShowAddForm(false);
      await fetchProfiles();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar funcionário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (employeeId: number, name: string) => {
    if (!confirm(`Tem certeza que deseja remover ${name}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/profiles/${employeeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover funcionário');
      }

      toast.success('Funcionário removido com sucesso!');
      await fetchProfiles();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover funcionário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Add Cleaner Button */}
      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#0c7c97] hover:bg-[#0a6a80] content-stretch cursor-pointer flex gap-[10px] lg:gap-[12px] items-center justify-center px-[24px] lg:px-[32px] py-[12px] lg:py-[16px] rounded-[999999px] transition-colors"
          >
            <UserPlus className="size-[20px] lg:size-[24px] text-white" />
            <p className="font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] text-white">
              Adicionar Funcionário
            </p>
          </button>
        ) : (
          <div className="bg-white rounded-[16px] lg:rounded-[20px] border-2 border-[#f0f2fb] p-[20px] lg:p-[28px]">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[18px] lg:text-[20px] text-black mb-[12px] lg:mb-[16px]">
              Novo Funcionário
            </p>
            <div className="flex flex-col md:flex-row gap-[12px]">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nome completo"
                className="flex-1 px-[16px] lg:px-[20px] py-[12px] lg:py-[16px] rounded-[8px] lg:rounded-[12px] border-2 border-[#f0f2fb] font-['Montserrat',sans-serif] font-medium text-[16px] lg:text-[18px] text-black focus:border-[#0c7c97] focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
              />
              <div className="flex gap-[12px]">
                <button
                  onClick={handleAddUser}
                  disabled={loading || !newUserName.trim()}
                  className="bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-50 disabled:cursor-not-allowed px-[24px] py-[12px] lg:py-[16px] rounded-[999999px] font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] text-white transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewUserName('');
                  }}
                  disabled={loading}
                  className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-[24px] py-[12px] lg:py-[16px] rounded-[999999px] font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cleaners List */}
      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px] flex-1">
        <div className="bg-white rounded-[16px] lg:rounded-[20px] border-2 border-[#f0f2fb] overflow-hidden">
          {cleanerProfiles.length === 0 ? (
            <div className="p-[48px] text-center">
              <Users className="size-[64px] text-gray-300 mx-auto mb-[16px]" />
              <p className="font-['Montserrat',sans-serif] font-semibold text-[20px] text-gray-700">
                Nenhum funcionário cadastrado
              </p>
              <p className="font-['Montserrat',sans-serif] font-normal text-[16px] text-gray-500 mt-[8px]">
                Clique em "Adicionar Funcionário" para começar
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f2fb]">
              {cleanerProfiles.map((profile) => (
                <div
                  key={profile.employee_id}
                  className="flex items-center justify-between p-[20px] lg:p-[28px] hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-center gap-[12px] lg:gap-[16px]">
                    <div className="bg-[#0c7c97] rounded-full p-[12px] lg:p-[14px]">
                      <Users className="size-[20px] lg:size-[24px] text-white" />
                    </div>
                    <div>
                      <p className="font-['Montserrat',sans-serif] font-semibold text-[18px] lg:text-[20px] text-black">
                        {profile.full_name}
                      </p>
                      <p className="font-['Montserrat',sans-serif] font-normal text-[14px] lg:text-[16px] text-gray-600">
                        {profile.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(profile.employee_id, profile.full_name)}
                    disabled={loading}
                    className="bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed p-[10px] lg:p-[12px] rounded-full transition-colors"
                    title="Remover funcionário"
                  >
                    <Trash2 className="size-[20px] lg:size-[24px] text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
