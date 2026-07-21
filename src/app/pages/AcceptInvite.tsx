import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../context/InventoryContext';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import imgLogo from 'figma:asset/08d20ecb15948845987a58e1893d9942aa75c450.png';

// Reached from the link in a Supabase "invite" email. supabase-js's
// detectSessionInUrl (default true) already parses the access/refresh token
// out of the URL and establishes a session before this component mounts —
// there's no separate "verify" step to do here, just check the session
// exists, then let the invitee set their password.
export default function AcceptInvite() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true);
        setName((session.user.user_metadata?.name as string) || '');
      }
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);

      toast.success('Conta ativada com sucesso!');
      // Hard reload so InventoryProvider remounts and re-runs checkSession
      // against the now-password-protected session, matching the pattern
      // used elsewhere for GitHub Pages' base path.
      window.location.href = `${window.location.origin}${import.meta.env.BASE_URL}`;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ativar conta');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c7c97]"></div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6">
        <div className="w-full max-w-[480px] bg-white rounded-[20px] border-2 border-[#f0f2fb] p-8 lg:p-10 text-center">
          <h1 className="font-['Montserrat',sans-serif] font-bold text-[24px] text-black mb-2">
            Link inválido ou expirado
          </h1>
          <p className="font-['Montserrat',sans-serif] text-[16px] text-[#666] mb-6">
            Peça para o administrador da organização enviar um novo convite.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#0c7c97] hover:bg-[#0a6a7f] text-white font-['Montserrat',sans-serif] font-semibold text-[16px] py-3 px-6 rounded-xl transition-colors"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6">
      <div className="w-full max-w-[480px]">
        <div className="flex justify-center mb-8">
          <img alt="StockFlow Logo" className="h-[80px] w-auto object-contain" src={imgLogo} />
        </div>

        <div className="bg-white rounded-[20px] border-2 border-[#f0f2fb] p-8 lg:p-10">
          <div className="text-center mb-8">
            <KeyRound className="size-[40px] text-[#0c7c97] mx-auto mb-4" />
            <h1 className="font-['Montserrat',sans-serif] font-bold text-[24px] lg:text-[28px] text-black mb-2">
              Bem-vindo(a){name ? `, ${name}` : ''}!
            </h1>
            <p className="font-['Montserrat',sans-serif] text-[16px] text-[#666]">
              Defina sua senha para ativar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                Senha
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]"
              />
            </div>

            <div className="space-y-2">
              <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                Confirmar Senha
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0c7c97] hover:bg-[#0a6a7f] text-white font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ativando...' : 'Ativar Conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
