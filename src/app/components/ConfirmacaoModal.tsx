import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ItemResumo {
  name: string;
  quantity: number;
  suffix?: string; // e.g. "unidades", "pacotes"
}

interface ConfirmacaoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title: string;
  subtitle?: string;
  items: ItemResumo[];
  confirmLabel: string;
}

export default function ConfirmacaoModal({
  open,
  onClose,
  onConfirm,
  loading,
  title,
  subtitle,
  items,
  confirmLabel,
}: ConfirmacaoModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={!loading ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-[480px] sm:rounded-[24px] rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-[24px] pt-[24px] pb-[16px] border-b border-[#f0f2fb]">
          <div className="flex flex-col gap-[4px]">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[18px] text-black">
              {title}
            </p>
            {subtitle && (
              <p className="font-['Montserrat',sans-serif] font-medium text-[13px] text-[#0c7c97]">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-[6px] rounded-full hover:bg-[#f0f2fb] transition-colors disabled:opacity-40"
          >
            <X className="size-[18px] text-[#666]" />
          </button>
        </div>

        {/* Item list */}
        <div className="px-[24px] py-[16px] flex flex-col gap-[8px] max-h-[50vh] overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-[10px] px-[14px] bg-[#fafafa] rounded-[12px]"
            >
              <p className="font-['Montserrat',sans-serif] font-medium text-[14px] text-black">
                {item.name}
              </p>
              <p className="font-['Montserrat',sans-serif] font-bold text-[14px] text-[#0c7c97] shrink-0 ml-[12px]">
                {item.quantity}
                {item.suffix ? ` ${item.suffix}` : ''}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-[12px] px-[24px] pb-[28px] pt-[16px] border-t border-[#f0f2fb]">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-[13px] rounded-[999px] border-2 border-[#f0f2fb] font-['Montserrat',sans-serif] font-semibold text-[15px] text-[#555] hover:bg-[#f0f2fb] transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-[8px] py-[13px] rounded-[999px] bg-[#0c7c97] hover:bg-[#0a6a80] font-['Montserrat',sans-serif] font-semibold text-[15px] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-[18px] h-[18px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="size-[18px]" />
            )}
            {loading ? 'Confirmando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
