import React, { useState } from 'react';
import {
  Download,
  Share2,
  Smartphone,
  X,
  CheckCircle2,
  ExternalLink,
  Laptop,
  MoreVertical,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isIOS, isAndroid, hasNativePrompt, triggerNativeInstall } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [modalTab, setModalTab] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  });

  const handleButtonClick = async () => {
    // If native 1-click prompt is available in current browser (Chrome / Edge / Samsung Internet)
    if (hasNativePrompt) {
      setIsTriggering(true);
      try {
        const result = await triggerNativeInstall();
        if (result === 'unsupported' || result === 'dismissed') {
          // If native trigger is not permitted in this context (e.g. inside an iframe or preview), open guided modal
          setShowModal(true);
        }
      } catch {
        setShowModal(true);
      } finally {
        setIsTriggering(false);
      }
      return;
    }

    // Otherwise, open comprehensive install/download guide tailored for the user's device
    if (isIOS) setModalTab('ios');
    else if (isAndroid) setModalTab('android');
    else setModalTab('desktop');

    setShowModal(true);
  };

  return (
    <>
      {/* Header Compact Download Button */}
      {variant === 'header' && (
        <button
          onClick={handleButtonClick}
          disabled={isTriggering}
          type="button"
          title="Download Offnot Energy PWA App on your phone or computer"
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 shadow-xs hover:shadow-md rounded-lg transition-all border border-emerald-500/40 ${className}`}
        >
          <Download className="w-3.5 h-3.5 shrink-0 group-hover:-translate-y-0.5 transition-transform" />
          <span className="hidden sm:inline">Download App</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {/* Sidebar Full Download Banner */}
      {variant === 'sidebar' && (
        <button
          onClick={handleButtonClick}
          disabled={isTriggering}
          type="button"
          className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-xs font-bold text-emerald-950 dark:text-emerald-100 bg-gradient-to-r from-emerald-100 via-emerald-50 to-teal-50 dark:from-emerald-950/80 dark:via-emerald-900/40 dark:to-teal-950/60 hover:from-emerald-200 hover:to-teal-100 dark:hover:from-emerald-900/80 dark:hover:to-teal-900/70 border border-emerald-300 dark:border-emerald-700/60 rounded-xl transition-all shadow-xs active:scale-[0.98] ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs shrink-0">
              <Download className="w-3.5 h-3.5 text-emerald-200" />
            </div>
            <div className="text-left">
              <span className="block leading-tight font-extrabold text-[12px]">Download Mobile App</span>
              <span className="block text-[10px] text-emerald-700 dark:text-emerald-300 font-normal">
                Install for Android, iPhone & PC
              </span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 opacity-70" />
        </button>
      )}

      {/* Cross-Device PWA Download & Install Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* App Header Identity */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-800 p-2 flex items-center justify-center shadow-md shrink-0 border border-emerald-700">
                <img
                  src="/pwa-192x192.png"
                  alt="Offnot Energy"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                  Download Offnot Energy
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Installable Progressive Web App (PWA)
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Offline Ready
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">v3.5 PWA</span>
                </div>
              </div>
            </div>

            {/* Direct 1-Click Install Button if supported */}
            {hasNativePrompt && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Direct 1-Click Download Ready
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await triggerNativeInstall();
                    setShowModal(false);
                  }}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Immediately on this Device</span>
                </button>
              </div>
            )}

            {/* Device Tabs Selector */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab('android')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  modalTab === 'android'
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('ios')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  modalTab === 'ios'
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('desktop')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  modalTab === 'desktop'
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Laptop / PC</span>
              </button>
            </div>

            {/* Instruction Panels */}
            {modalTab === 'android' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">
                  How to download on Android (Chrome, Samsung Internet, Edge):
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      1
                    </span>
                    <span>
                      Tap the <strong>three dots menu (⋮)</strong> <MoreVertical className="w-3.5 h-3.5 inline text-slate-500 mx-0.5" /> in the top right corner of Chrome.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      2
                    </span>
                    <span>
                      Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      3
                    </span>
                    <span>
                      Tap <strong>Install</strong>. The Offnot Energy icon will download onto your homescreen and app drawer!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {modalTab === 'ios' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">
                  How to download on iPhone & iPad (Safari browser):
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      1
                    </span>
                    <span>
                      Open this URL in <strong>Safari</strong> and tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" /> at the bottom.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      2
                    </span>
                    <span>
                      Scroll down the list and tap <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-500 mx-0.5" />.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      3
                    </span>
                    <span>
                      Tap <strong>Add</strong> in the top right. It installs with full standalone offline support!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {modalTab === 'desktop' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">
                  How to download on Windows / Mac / Linux (Chrome & Edge):
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      1
                    </span>
                    <span>
                      Look in your browser's address bar (URL bar) on the right side for the <strong>Install App icon</strong> <Download className="w-3.5 h-3.5 inline text-emerald-600 mx-0.5" />.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      2
                    </span>
                    <span>
                      Click <strong>Install Offnot Energy</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      3
                    </span>
                    <span>
                      The system opens in its own clean window, desktop shortcut, and taskbar pin!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Offline & PWA Perks */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                ✨ App Benefits once downloaded:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Works completely offline — records sales to IndexedDB.</li>
                <li>Auto-syncs to cloud when internet reconnects.</li>
                <li>Opens like a native Android, iOS, or Windows software.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-xl transition-all"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </>
  );
};
