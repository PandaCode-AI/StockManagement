import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import { ArrowLeft, Minus, Plus, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_FORM = {
  display_name: '',
  nick_name: '',
  in_stock: 0,
  desired_stock: 0,
  recomend_use: 0,
  item_type: 'unit' as 'unit' | 'package',
  pack_size: 1,
};

export default function AdicionarItem() {
  const navigate = useNavigate();
  const { createItem, items } = useInventory();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIncrement = (field: 'in_stock' | 'desired_stock' | 'recomend_use' | 'pack_size') => {
    setFormData(prev => ({ ...prev, [field]: prev[field] + 1 }));
  };

  const handleDecrement = (field: 'in_stock' | 'desired_stock' | 'recomend_use' | 'pack_size') => {
    const min = field === 'pack_size' ? 1 : 0;
    setFormData(prev => ({ ...prev, [field]: Math.max(min, prev[field] - 1) }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      return;
    }
    setPhotoFile(file);
    const preview = URL.createObjectURL(file);
    setPhotoPreview(prev => { if (prev) URL.revokeObjectURL(prev); return preview; });
  };

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateSku = () => {
    const existing = items
      .map(i => parseInt(i.sku))
      .filter(n => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return String(next).padStart(4, '0');
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      toast.error('O nome do item é obrigatório');
      return;
    }
    if (!photoFile) {
      toast.error('Selecione uma foto para o item');
      return;
    }

    const sku = generateSku();

    setLoading(true);
    try {
      await createItem({ ...formData, sku }, photoFile);
      toast.success('Item adicionado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fafafa] content-stretch flex flex-col gap-[32px] lg:gap-[40px] items-start py-[48px] lg:py-[56px] relative min-h-screen w-full">
      <Header />

      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-[8px] text-[#0c7c97] mb-[16px] lg:mb-[20px] hover:underline"
        >
          <ArrowLeft className="size-[20px] lg:size-[24px]" />
          <span className="font-['Montserrat',sans-serif] font-medium text-[16px] lg:text-[18px]">Voltar ao Estoque</span>
        </button>

        <div className="content-stretch flex flex-col gap-[4px] items-start leading-[normal] text-black">
          <p className="font-['Montserrat',sans-serif] font-semibold text-[32px] lg:text-[40px]">Novo Item</p>
          <p className="font-['Montserrat',sans-serif] font-normal text-[20px] lg:text-[24px]">
            Preencha os dados do novo item de estoque
          </p>
        </div>
      </div>

      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <div className="bg-white relative rounded-[16px] lg:rounded-[20px] w-full">
          <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[16px] lg:rounded-[20px]" />
          <div className="content-stretch flex flex-col gap-[32px] lg:gap-[40px] items-start p-[32px] lg:p-[40px] relative w-full">

            <div className="content-stretch flex flex-col lg:flex-row gap-[32px] lg:gap-[48px] items-start w-full">
              {/* Form fields */}
              <div className="content-stretch flex flex-col gap-[24px] lg:gap-[28px] items-start flex-1 w-full">
                <InputField
                  label="Nome *"
                  value={formData.display_name}
                  onChange={(v) => handleChange('display_name', v)}
                />
                <InputField
                  label="Apelido"
                  value={formData.nick_name}
                  onChange={(v) => handleChange('nick_name', v)}
                />
                <NumberInputWithButtons
                  label="Quantidade Inicial em Estoque"
                  value={formData.in_stock}
                  onIncrement={() => handleIncrement('in_stock')}
                  onDecrement={() => handleDecrement('in_stock')}
                  onChange={(v) => handleChange('in_stock', v)}
                />
                <NumberInputWithButtons
                  label="Estoque Desejado"
                  value={formData.desired_stock}
                  onIncrement={() => handleIncrement('desired_stock')}
                  onDecrement={() => handleDecrement('desired_stock')}
                  onChange={(v) => handleChange('desired_stock', v)}
                />
                <NumberInputWithButtons
                  label="Uso Recomendado (em dias)"
                  value={formData.recomend_use}
                  onIncrement={() => handleIncrement('recomend_use')}
                  onDecrement={() => handleDecrement('recomend_use')}
                  onChange={(v) => handleChange('recomend_use', v)}
                />
                <SelectField
                  label="Tipo de Item"
                  value={formData.item_type}
                  onChange={(v) => handleChange('item_type', v)}
                  options={[
                    { value: 'unit', label: 'Unidade' },
                    { value: 'package', label: 'Pacote' },
                  ]}
                />
                {formData.item_type === 'package' && (
                  <NumberInputWithButtons
                    label="Unidades por Pacote"
                    value={formData.pack_size}
                    onIncrement={() => handleIncrement('pack_size')}
                    onDecrement={() => handleDecrement('pack_size')}
                    onChange={(v) => handleChange('pack_size', v)}
                  />
                )}
              </div>

              {/* Photo upload */}
              <div className="content-stretch flex flex-col gap-[12px] items-start shrink-0">
                <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] lg:text-[14px] text-black">
                  Foto do Item *
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {photoPreview ? (
                  <div className="relative h-[200px] lg:h-[240px] w-[200px] lg:w-[240px]">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-full w-full object-cover rounded-[8px] lg:rounded-[12px] border-2 border-[#f0f2fb]"
                    />
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute top-[8px] right-[8px] bg-white rounded-full p-[4px] shadow-md hover:bg-red-50 transition-colors"
                    >
                      <X className="size-[16px] text-red-500" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-[8px] left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-[#0c7c97] text-[12px] font-['Montserrat',sans-serif] font-semibold px-[10px] py-[5px] rounded-full shadow-sm hover:bg-white transition-colors whitespace-nowrap"
                    >
                      Trocar foto
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[200px] lg:h-[240px] w-[200px] lg:w-[240px] border-2 border-dashed border-[#c0c8e8] rounded-[8px] lg:rounded-[12px] flex flex-col items-center justify-center gap-[12px] hover:border-[#0c7c97] hover:bg-[#f0f8fa] transition-colors group"
                  >
                    <ImagePlus className="size-[36px] text-[#c0c8e8] group-hover:text-[#0c7c97] transition-colors" />
                    <p className="font-['Montserrat',sans-serif] font-medium text-[13px] text-[#999] group-hover:text-[#0c7c97] transition-colors text-center px-[12px]">
                      Clique para selecionar uma foto
                    </p>
                    <p className="font-['Montserrat',sans-serif] font-normal text-[11px] text-[#bbb] text-center px-[12px]">
                      Será comprimida automaticamente
                    </p>
                  </button>
                )}
              </div>
            </div>

            <div className="content-stretch flex justify-end w-full">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex gap-[10px] lg:gap-[12px] items-center justify-center px-[24px] lg:px-[32px] py-[12px] lg:py-[16px] rounded-[999999px] bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && (
                  <span className="w-[18px] h-[18px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                <p className="font-['Montserrat',sans-serif] font-semibold text-[16px] lg:text-[18px] text-white whitespace-nowrap">
                  {loading ? 'Salvando...' : 'Adicionar Item'}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components (mirrors EditarItem) ─────────────────────────────

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function InputField({ label, value, onChange, placeholder }: InputFieldProps) {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[8px] lg:gap-[10px] items-start px-[12px] lg:px-[16px] py-[8px] lg:py-[12px] relative rounded-[8px] lg:rounded-[12px] w-full max-w-[500px] lg:max-w-[600px]">
      <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[8px] lg:rounded-[12px]" />
      <label className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[13px] lg:text-[14px] text-black">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-['Montserrat',sans-serif] font-normal leading-[normal] text-[16px] lg:text-[18px] text-black w-full bg-transparent outline-none placeholder:text-[#bbb]"
      />
    </div>
  );
}

interface NumberInputWithButtonsProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange: (value: number) => void;
}

function NumberInputWithButtons({ label, value, onIncrement, onDecrement, onChange }: NumberInputWithButtonsProps) {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[8px] lg:gap-[10px] items-start px-[12px] lg:px-[16px] py-[8px] lg:py-[12px] relative rounded-[8px] lg:rounded-[12px] w-full max-w-[500px] lg:max-w-[600px]">
      <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[8px] lg:rounded-[12px]" />
      <label className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[13px] lg:text-[14px] text-black">
        {label}
      </label>
      <div className="content-stretch flex flex-row gap-[12px] lg:gap-[16px] items-center w-full">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value === 0}
          className="bg-[#f0f2fb] hover:bg-[#e0e4f1] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center p-[10px] lg:p-[14px] rounded-[8px] lg:rounded-[10px] shrink-0 transition-all"
        >
          <Minus className="size-[20px] lg:size-[24px] text-[#323232]" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="font-['Montserrat',sans-serif] font-bold text-[20px] lg:text-[28px] text-center text-black w-full bg-transparent outline-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={onIncrement}
          className="bg-[#0c7c97] hover:bg-[#0a6a80] active:scale-95 flex items-center justify-center p-[10px] lg:p-[14px] rounded-[8px] lg:rounded-[10px] shrink-0 transition-all"
        >
          <Plus className="size-[20px] lg:size-[24px] text-white" />
        </button>
      </div>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[8px] lg:gap-[10px] items-start px-[12px] lg:px-[16px] py-[8px] lg:py-[12px] relative rounded-[8px] lg:rounded-[12px] w-full max-w-[500px] lg:max-w-[600px]">
      <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[8px] lg:rounded-[12px]" />
      <label className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[13px] lg:text-[14px] text-black">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-['Montserrat',sans-serif] font-normal text-[16px] lg:text-[18px] text-black w-full bg-transparent outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
