import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    text?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'blue' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon,
  variant = 'default',
}) => {
  const borderVariants = {
    default: 'border-slate-200 hover:border-slate-300',
    emerald: 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/20',
    amber: 'border-amber-200 hover:border-amber-300 bg-amber-50/20',
    blue: 'border-blue-200 hover:border-blue-300 bg-blue-50/20',
    rose: 'border-rose-200 hover:border-rose-300 bg-rose-50/20',
  };

  return (
    <div className={`p-4 rounded-xl border bg-white shadow-xs transition-colors ${borderVariants[variant]}`}>
      <div className="flex items-center justify-between text-xs text-slate-700 font-medium tracking-tight mb-1.5">
        <span className="truncate">{label}</span>
        {icon && <span className="text-slate-600 shrink-0">{icon}</span>}
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
        {value}
      </div>
      {(subValue || trend) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-700">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {trend.value}
            </span>
          )}
          {trend?.text && <span>{trend.text}</span>}
          {subValue && <span>{subValue}</span>}
        </div>
      )}
    </div>
  );
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'xl',
}) => {
  if (!isOpen) return null;

  const widthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full ${widthMap[maxWidth]} bg-white rounded-2xl shadow-xl border border-slate-200 my-8 overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-700 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[calc(85vh-100px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-full ${
              isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-800 hover:bg-emerald-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionLabel, onAction, icon }) => {
  return (
    <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      {icon && <div className="mx-auto w-10 h-10 text-slate-400 mb-3 flex items-center justify-center">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
