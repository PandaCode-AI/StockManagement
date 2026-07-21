import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import CleanerManager from '../components/CleanerManager';
import { ArrowLeft, Users, Copy, Check, Trash2, ShieldCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../../../utils/supabase/info';

export default function GerenciarUsuarios() {
  const navigate = useNavigate();
  const { profiles, fetchProfiles, currentOrg, accessToken, inviteSupervisor } = useInventory();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const supervisorProfiles = profiles.filter(p => p.role === 'Supervisora');

  const handleCopyInviteCode = () => {
    if (!currentOrg?.invite_code) return;
    navigator.clipboard.writeText(currentOrg.invite_code);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteSupervisor = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Preencha nome e email');
      return;
    }

    setInviting(true);
    try {
      await inviteSupervisor(inviteName.trim(), inviteEmail.trim());
      toast.success(`Convite enviado para ${inviteEmail.trim()}!`);
      setInviteName('');
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao convidar supervisora');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveSupervisor = async (employeeId: number, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o acesso de ${name}?`)) {
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
        throw new Error(data.error || 'Erro ao remover supervisora');
      }

      toast.success('Acesso removido com sucesso!');
      await fetchProfiles();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover supervisora');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fafafa] content-stretch flex flex-col gap-[32px] lg:gap-[40px] items-start py-[48px] lg:py-[56px] relative min-h-screen w-full">
      <Header />

      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-[8px] text-[#0c7c97] mb-[16px] lg:mb-[20px] hover:underline"
        >
          <ArrowLeft className="size-[20px] lg:size-[24px]" />
          <span className="font-['Montserrat',sans-serif] font-medium text-[16px] lg:text-[18px]">Voltar</span>
        </button>

        <div className="content-stretch flex flex-col gap-[4px] items-start leading-[normal] text-black">
          <div className="flex items-center gap-[12px]">
            <Users className="size-[32px] lg:size-[40px] text-[#0c7c97]" />
            <p className="font-['Montserrat',sans-serif] font-semibold text-[32px] lg:text-[40px]">
              Gerenciar Funcionários
            </p>
          </div>
          <p className="font-['Montserrat',sans-serif] font-normal text-[20px] lg:text-[24px]">
            Gerencie supervisoras e funcionários do tipo Cleaner
          </p>
        </div>
      </div>

      {/* Invite Code (Admin/Owner only — the backend omits it otherwise) */}
      {currentOrg?.invite_code && (
        <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
          <div className="bg-[#f0f2fb] rounded-[16px] lg:rounded-[20px] p-[20px] lg:p-[28px]">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] text-black mb-[8px]">
              Código de convite da organização
            </p>
            <p className="font-['Montserrat',sans-serif] font-normal text-[13px] lg:text-[14px] text-gray-600 mb-[12px]">
              Compartilhe este código para que novas supervisoras entrem em {currentOrg.name}
            </p>
            <div className="flex items-center gap-[12px]">
              <code className="bg-white px-[16px] py-[10px] rounded-[8px] border-2 border-[#0c7c97] font-mono font-bold text-[18px] lg:text-[20px] text-[#0c7c97] tracking-wider">
                {currentOrg.invite_code}
              </code>
              <button
                onClick={handleCopyInviteCode}
                className="flex items-center gap-[6px] px-[16px] py-[10px] rounded-[8px] bg-white border-2 border-[#f0f2fb] hover:border-[#0c7c97] transition-colors"
              >
                {copied ? <Check className="size-[18px] text-green-600" /> : <Copy className="size-[18px] text-[#0c7c97]" />}
                <span className="font-['Montserrat',sans-serif] font-medium text-[14px] text-[#323232]">
                  {copied ? 'Copiado' : 'Copiar'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisoras — real accounts. Invited by email, or joined via the code above */}
      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <div className="flex items-center justify-between mb-[12px] lg:mb-[16px]">
          <p className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black">
            Supervisoras
          </p>
          {!showInviteForm && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-[8px] px-[16px] lg:px-[20px] py-[8px] lg:py-[10px] rounded-[999999px] bg-[#0c7c97] hover:bg-[#0a6a80] transition-colors"
            >
              <UserPlus className="size-[16px] lg:size-[18px] text-white" />
              <span className="font-['Montserrat',sans-serif] font-semibold text-[13px] lg:text-[14px] text-white">
                Convidar Supervisora
              </span>
            </button>
          )}
        </div>

        {showInviteForm && (
          <div className="bg-white rounded-[16px] lg:rounded-[20px] border-2 border-[#f0f2fb] p-[20px] lg:p-[28px] mb-[16px]">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[18px] lg:text-[20px] text-black mb-[12px] lg:mb-[16px]">
              Convidar Supervisora
            </p>
            <div className="flex flex-col gap-[12px]">
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Nome completo"
                className="px-[16px] lg:px-[20px] py-[12px] lg:py-[16px] rounded-[8px] lg:rounded-[12px] border-2 border-[#f0f2fb] font-['Montserrat',sans-serif] font-medium text-[16px] lg:text-[18px] text-black focus:border-[#0c7c97] focus:outline-none transition-colors"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="px-[16px] lg:px-[20px] py-[12px] lg:py-[16px] rounded-[8px] lg:rounded-[12px] border-2 border-[#f0f2fb] font-['Montserrat',sans-serif] font-medium text-[16px] lg:text-[18px] text-black focus:border-[#0c7c97] focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleInviteSupervisor()}
              />
              <div className="flex gap-[12px]">
                <button
                  onClick={handleInviteSupervisor}
                  disabled={inviting || !inviteName.trim() || !inviteEmail.trim()}
                  className="bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-50 disabled:cursor-not-allowed px-[24px] py-[12px] lg:py-[16px] rounded-[999999px] font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] text-white transition-colors"
                >
                  {inviting ? 'Enviando...' : 'Enviar Convite'}
                </button>
                <button
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteName('');
                    setInviteEmail('');
                  }}
                  disabled={inviting}
                  className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-[24px] py-[12px] lg:py-[16px] rounded-[999999px] font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[16px] lg:rounded-[20px] border-2 border-[#f0f2fb] overflow-hidden">
          {supervisorProfiles.length === 0 ? (
            <div className="p-[32px] lg:p-[48px] text-center">
              <ShieldCheck className="size-[48px] lg:size-[64px] text-gray-300 mx-auto mb-[16px]" />
              <p className="font-['Montserrat',sans-serif] font-semibold text-[18px] lg:text-[20px] text-gray-700">
                Nenhuma supervisora cadastrada
              </p>
              <p className="font-['Montserrat',sans-serif] font-normal text-[14px] lg:text-[16px] text-gray-500 mt-[8px]">
                Convide por email, ou compartilhe o código de convite acima
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f2fb]">
              {supervisorProfiles.map((profile) => (
                <div
                  key={profile.employee_id}
                  className="flex items-center justify-between p-[20px] lg:p-[28px] hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-center gap-[12px] lg:gap-[16px]">
                    <div className="bg-[#0c7c97] rounded-full p-[12px] lg:p-[14px]">
                      <ShieldCheck className="size-[20px] lg:size-[24px] text-white" />
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
                    onClick={() => handleRemoveSupervisor(profile.employee_id, profile.full_name)}
                    disabled={loading}
                    className="bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed p-[10px] lg:p-[12px] rounded-full transition-colors"
                    title="Remover acesso"
                  >
                    <Trash2 className="size-[20px] lg:size-[24px] text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cleaners — no login, added/removed directly */}
      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <p className="font-['Montserrat',sans-serif] font-semibold text-[20px] lg:text-[24px] text-black mb-[12px] lg:mb-[16px]">
          Cleaners
        </p>
      </div>
      <CleanerManager />
    </div>
  );
}
