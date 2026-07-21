import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useInventory } from '../context/InventoryContext';
import Header from '../components/Header';
import { ArrowLeft, Minus, Plus, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function EditarItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getItemById, updateItem, uploadItemPhoto, currentProfile } = useInventory();

  const item = getItemById(parseInt(id || '0'));
  const canEdit = currentProfile?.role === 'Admin' || currentProfile?.role === 'Owner';
  const canEditRestrictedFields = canEdit;
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    display_name: '',
    nick_name: '',
    sku: '',
    in_stock: 0,
    desired_stock: 0,
    recomend_use: 0,
    item_type: 'unit' as 'unit' | 'package',
    pack_size: 1,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        display_name: item.display_name,
        nick_name: item.nick_name,
        sku: item.sku,
        in_stock: item.in_stock,
        desired_stock: item.desired_stock,
        recomend_use: item.recomend_use,
        item_type: item.item_type || 'unit',
        pack_size: item.pack_size || 1,
      });
    }
  }, [item]);

  if (!item) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <p className="font-['Montserrat',sans-serif] text-[20px]">Item não encontrado</p>
      </div>
    );
  }

  const handleUnauthorizedClick = () => {
    toast.error('Você não tem permissão para editar este item');
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

  const handleSave = async () => {
    if (!id) return;
    try {
      let updates: any = { ...formData };
      if (photoFile) {
        const photo_link = await uploadItemPhoto(photoFile);
        updates = { ...updates, photo_link };
      }
      await updateItem(parseInt(id), updates);
      navigate('/');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar o item');
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIncrement = (field: 'in_stock' | 'desired_stock' | 'recomend_use' | 'pack_size', step: number = 1) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(field === 'pack_size' ? 1 : 0, prev[field] + step)
    }));
  };

  const handleDecrement = (field: 'in_stock' | 'desired_stock' | 'recomend_use' | 'pack_size', step: number = 1) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(field === 'pack_size' ? 1 : 0, prev[field] - step)
    }));
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
          <p className="font-['Montserrat',sans-serif] font-semibold text-[32px] lg:text-[40px]">
            {canEdit ? 'Editar Item' : 'Visualizar Item'}
          </p>
          <p className="font-['Montserrat',sans-serif] font-normal text-[20px] lg:text-[24px]">
            {canEdit ? 'Realize ajustes nos detalhes do item em estoque' : 'Detalhes do item em estoque (somente visualização)'}
          </p>
        </div>
      </div>

      <div className="relative shrink-0 w-full px-[24px] lg:px-[48px]">
        <div className="bg-white relative rounded-[16px] lg:rounded-[20px] w-full">
          <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[16px] lg:rounded-[20px]" />
          <div className="content-stretch flex flex-col gap-[32px] lg:gap-[40px] items-start p-[32px] lg:p-[40px] relative w-full">
            <div className="content-stretch flex flex-col lg:flex-row gap-[32px] lg:gap-[48px] items-start w-full">
              <div className="content-stretch flex flex-col gap-[24px] lg:gap-[28px] items-start flex-1 w-full">
                <InputField
                  label="Nome"
                  value={formData.display_name}
                  onChange={(value) => handleChange('display_name', value)}
                  readOnly={!canEdit}
                  onClick={!canEdit ? handleUnauthorizedClick : undefined}
                />
                <InputField
                  label="Apelido"
                  value={formData.nick_name}
                  onChange={(value) => handleChange('nick_name', value)}
                  readOnly={!canEdit}
                  onClick={!canEdit ? handleUnauthorizedClick : undefined}
                />
                <InputField
                  label="SKU"
                  value={formData.sku}
                  onChange={(value) => handleChange('sku', value)}
                  readOnly
                />
                <NumberInputWithButtons
                  label="Em Estoque"
                  value={formData.in_stock}
                  onIncrement={() => handleIncrement('in_stock')}
                  onDecrement={() => handleDecrement('in_stock')}
                  onChange={(value) => handleChange('in_stock', value)}
                  readOnly={!canEdit}
                  onClick={!canEdit ? handleUnauthorizedClick : undefined}
                />
                <NumberInputWithButtons
                  label="Estoque Desejado"
                  value={formData.desired_stock}
                  onIncrement={() => handleIncrement('desired_stock')}
                  onDecrement={() => handleDecrement('desired_stock')}
                  onChange={(value) => handleChange('desired_stock', value)}
                  readOnly={!canEdit}
                  onClick={!canEdit ? handleUnauthorizedClick : undefined}
                />
                <NumberInputWithButtons
                  label="Uso Recomendado (em dias)"
                  value={formData.recomend_use}
                  onIncrement={() => handleIncrement('recomend_use')}
                  onDecrement={() => handleDecrement('recomend_use')}
                  onChange={(value) => handleChange('recomend_use', value)}
                  readOnly={!canEdit}
                  onClick={!canEdit ? handleUnauthorizedClick : undefined}
                />
                <SelectField
                  label="Tipo de Item"
                  value={formData.item_type}
                  onChange={(value) => handleChange('item_type', value)}
                  options={[
                    { value: 'unit', label: 'Unidade' },
                    { value: 'package', label: 'Pacote' }
                  ]}
                  readOnly={!canEdit}
                  onClick={!canEdit ? handleUnauthorizedClick : undefined}
                />
                {formData.item_type === 'package' && (
                  <NumberInputWithButtons
                    label="Unidades por Pacote"
                    value={formData.pack_size}
                    onIncrement={() => handleIncrement('pack_size')}
                    onDecrement={() => handleDecrement('pack_size')}
                    onChange={(value) => handleChange('pack_size', value)}
                    readOnly={!canEdit}
                    onClick={!canEdit ? handleUnauthorizedClick : undefined}
                  />
                )}
              </div>
              
              <div className="content-stretch flex flex-col gap-[12px] items-start shrink-0">
                {canEdit && (
                  <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] lg:text-[14px] text-black">
                    Foto do Item
                  </p>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                <div className="relative h-[200px] lg:h-[240px] w-[200px] lg:w-[240px]">
                  <img
                    alt={item.display_name}
                    className="h-full w-full object-cover rounded-[8px] lg:rounded-[12px] border-2 border-[#f0f2fb]"
                    src={photoPreview || item.photo_link}
                  />
                  {canEdit && (
                    <>
                      {photoPreview && (
                        <button
                          onClick={handleRemovePhoto}
                          className="absolute top-[8px] right-[8px] bg-white rounded-full p-[4px] shadow-md hover:bg-red-50 transition-colors"
                        >
                          <X className="size-[16px] text-red-500" />
                        </button>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-[8px] left-1/2 -translate-x-1/2 flex items-center gap-[6px] bg-white/90 backdrop-blur-sm text-[#0c7c97] text-[12px] font-['Montserrat',sans-serif] font-semibold px-[10px] py-[5px] rounded-full shadow-sm hover:bg-white transition-colors whitespace-nowrap"
                      >
                        <ImagePlus className="size-[14px]" />
                        {photoPreview ? 'Trocar foto' : 'Alterar foto'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="content-stretch flex justify-end w-full">
              <button
                onClick={canEdit ? handleSave : handleUnauthorizedClick}
                disabled={!canEdit}
                className={`content-stretch flex gap-[10px] lg:gap-[12px] items-center justify-center px-[24px] lg:px-[32px] py-[12px] lg:py-[16px] relative rounded-[999999px] shrink-0 transition-colors ${
                  canEdit
                    ? 'bg-[#0c7c97] hover:bg-[#0a6a80] cursor-pointer'
                    : 'bg-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                <p className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[16px] lg:text-[18px] text-white whitespace-nowrap">
                  Salvar Alterações
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  readOnly?: boolean;
  onClick?: () => void;
}

function InputField({ label, value, onChange, type = 'text', readOnly = false, onClick }: InputFieldProps) {
  return (
    <div
      className="bg-white content-stretch flex flex-col gap-[8px] lg:gap-[10px] items-start px-[12px] lg:px-[16px] py-[8px] lg:py-[12px] relative rounded-[8px] lg:rounded-[12px] w-full max-w-[500px] lg:max-w-[600px]"
      onClick={onClick}
    >
      <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[8px] lg:rounded-[12px]" />
      <label className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[13px] lg:text-[14px] text-black">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`font-['Montserrat',sans-serif] font-normal leading-[normal] text-[16px] lg:text-[18px] text-black w-full bg-transparent outline-none ${readOnly ? 'text-gray-500 cursor-not-allowed' : ''}`}
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
  readOnly?: boolean;
  onClick?: () => void;
}

function NumberInputWithButtons({ label, value, onIncrement, onDecrement, onChange, readOnly = false, onClick }: NumberInputWithButtonsProps) {
  const handleButtonClick = (callback: () => void) => {
    if (onClick && readOnly) {
      onClick();
    } else {
      callback();
    }
  };

  return (
    <div
      className="bg-white content-stretch flex flex-col gap-[8px] lg:gap-[10px] items-start px-[12px] lg:px-[16px] py-[8px] lg:py-[12px] relative rounded-[8px] lg:rounded-[12px] w-full max-w-[500px] lg:max-w-[600px]"
      onClick={onClick && readOnly ? onClick : undefined}
    >
      <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[8px] lg:rounded-[12px]" />
      <label className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[13px] lg:text-[14px] text-black">
        {label}
      </label>
      <div className="content-stretch flex flex-row gap-[12px] lg:gap-[16px] items-center w-full">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleButtonClick(onDecrement);
          }}
          disabled={value === 0 || readOnly}
          className="bg-[#f0f2fb] hover:bg-[#e0e4f1] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 content-stretch cursor-pointer flex items-center justify-center p-[10px] lg:p-[14px] relative rounded-[8px] lg:rounded-[10px] shrink-0 transition-all"
        >
          <Minus className="size-[20px] lg:size-[24px] text-[#323232]" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          readOnly={readOnly}
          className={`font-['Montserrat',sans-serif] font-bold leading-[normal] text-[20px] lg:text-[28px] text-center text-black w-full bg-transparent outline-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${readOnly ? 'text-gray-500 cursor-not-allowed' : ''}`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleButtonClick(onIncrement);
          }}
          disabled={readOnly}
          className="bg-[#0c7c97] hover:bg-[#0a6a80] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 content-stretch cursor-pointer flex items-center justify-center p-[10px] lg:p-[14px] relative rounded-[8px] lg:rounded-[10px] shrink-0 transition-all"
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
  readOnly?: boolean;
  onClick?: () => void;
}

function SelectField({ label, value, onChange, options, readOnly = false, onClick }: SelectFieldProps) {
  return (
    <div
      className="bg-white content-stretch flex flex-col gap-[8px] lg:gap-[10px] items-start px-[12px] lg:px-[16px] py-[8px] lg:py-[12px] relative rounded-[8px] lg:rounded-[12px] w-full max-w-[500px] lg:max-w-[600px]"
      onClick={onClick}
    >
      <div className="absolute border-2 border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[8px] lg:rounded-[12px]" />
      <label className="font-['Montserrat',sans-serif] font-semibold leading-[normal] text-[13px] lg:text-[14px] text-black">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className={`font-['Montserrat',sans-serif] font-normal leading-[normal] text-[16px] lg:text-[18px] text-black w-full bg-transparent outline-none ${
          readOnly ? 'text-gray-500 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}