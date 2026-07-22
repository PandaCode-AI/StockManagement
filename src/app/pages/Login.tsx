import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useInventory, supabase } from '../context/InventoryContext';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { LogIn, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import imgLogo from 'figma:asset/08d20ecb15948845987a58e1893d9942aa75c450.png';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUpCreateOrg, signUpJoinOrg } = useInventory();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  );
  const [signupMode, setSignupMode] = useState<'create' | 'join'>('create');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState('Cleaner');
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(loginEmail, loginPassword);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);

    try {
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo });
      if (error) throw new Error(error.message);
      setForgotSent(true);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de redefinição');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (signupMode === 'create') {
        await signUpCreateOrg(signupEmail, signupPassword, signupName, orgName);
      } else {
        await signUpJoinOrg(signupEmail, signupPassword, signupName, inviteCode, signupRole);
      }
      toast.success('Conta criada com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6">
      <div className="w-full max-w-[480px]">
        <div className="flex justify-center mb-8">
          <img
            alt="StockFlow Logo"
            className="h-[80px] w-auto object-contain"
            src={imgLogo}
          />
        </div>

        <div className="bg-white rounded-[20px] border-2 border-[#f0f2fb] p-8 lg:p-10">
          <div className="text-center mb-8">
            <h1 className="font-['Montserrat',sans-serif] font-bold text-[28px] lg:text-[32px] text-black mb-2">
              Sistema de Estoque
            </h1>
            <p className="font-['Montserrat',sans-serif] text-[16px] lg:text-[18px] text-[#666]">
              Gestão de materiais e movimentações
            </p>
          </div>

          {showForgotPassword ? (
            forgotSent ? (
              <div className="text-center space-y-6">
                <p className="font-['Montserrat',sans-serif] text-[16px] text-[#323232]">
                  Se existir uma conta com o email <strong>{forgotEmail}</strong>, enviamos um link para redefinir a senha.
                </p>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="flex items-center gap-2 justify-center mx-auto font-['Montserrat',sans-serif] font-medium text-[14px] text-[#0c7c97] hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex items-center gap-2 font-['Montserrat',sans-serif] font-medium text-[14px] text-[#0c7c97] hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>

                <div className="space-y-2">
                  <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#0c7c97] hover:bg-[#0a6a7f] text-white font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-5 h-5" />
                  {forgotLoading ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </form>
            )
          ) : (
            <>
          <div className="bg-[#f0f2fb] rounded-[999px] p-2 mb-8">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('login')}
                className={`font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[16px] py-3 px-6 rounded-[999px] transition-all ${
                  activeTab === 'login'
                    ? 'bg-[#0c7c97] text-white shadow-md'
                    : 'bg-transparent text-[#323232] hover:bg-white/50'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`font-['Montserrat',sans-serif] font-semibold text-[14px] lg:text-[16px] py-3 px-6 rounded-[999px] transition-all ${
                  activeTab === 'signup'
                    ? 'bg-[#0c7c97] text-white shadow-md'
                    : 'bg-transparent text-[#323232] hover:bg-white/50'
                }`}
              >
                Cadastrar
              </button>
            </div>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]"
                />
              </div>

              <div className="space-y-2">
                <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                  Senha
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setForgotSent(false);
                    setShowForgotPassword(true);
                  }}
                  className="font-['Montserrat',sans-serif] font-medium text-[13px] lg:text-[14px] text-[#0c7c97] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0c7c97] hover:bg-[#0a6a7f] text-white font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="grid grid-cols-2 gap-2 bg-[#f0f2fb] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setSignupMode('create')}
                  className={`font-['Montserrat',sans-serif] font-semibold text-[13px] lg:text-[14px] py-2 px-3 rounded-lg transition-all ${
                    signupMode === 'create'
                      ? 'bg-[#0c7c97] text-white shadow-md'
                      : 'bg-transparent text-[#323232] hover:bg-white/50'
                  }`}
                >
                  Criar organização
                </button>
                <button
                  type="button"
                  onClick={() => setSignupMode('join')}
                  className={`font-['Montserrat',sans-serif] font-semibold text-[13px] lg:text-[14px] py-2 px-3 rounded-lg transition-all ${
                    signupMode === 'join'
                      ? 'bg-[#0c7c97] text-white shadow-md'
                      : 'bg-transparent text-[#323232] hover:bg-white/50'
                  }`}
                >
                  Entrar com convite
                </button>
              </div>

              <div className="space-y-2">
                <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                  Nome Completo
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                  className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]"
                />
              </div>

              <div className="space-y-2">
                <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]"
                />
              </div>

              <div className="space-y-2">
                <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                  Senha
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]"
                />
              </div>

              {signupMode === 'create' ? (
                <div className="space-y-2">
                  <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                    Nome da Organização
                  </label>
                  <Input
                    type="text"
                    placeholder="Nome da sua empresa"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                      Código de Convite
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: A1B2C3D4"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      required
                      className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif] uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-['Montserrat',sans-serif] font-medium text-[14px] lg:text-[16px] text-black">
                      Função
                    </label>
                    <Select value={signupRole} onValueChange={setSignupRole}>
                      <SelectTrigger className="h-12 text-base border-2 border-[#f0f2fb] rounded-xl focus:border-[#0c7c97] font-['Montserrat',sans-serif]">
                        <SelectValue placeholder="Selecione sua função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cleaner">Cleaner</SelectItem>
                        <SelectItem value="Supervisora">Supervisora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0c7c97] hover:bg-[#0a6a7f] text-white font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
          )}
            </>
          )}
        </div>

        <p className="text-center mt-6 font-['Montserrat',sans-serif] text-[14px] text-[#666]">
          © 2026 StockFlow
        </p>
      </div>
    </div>
  );
}
