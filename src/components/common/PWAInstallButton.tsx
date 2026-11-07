import React, { useState, useEffect } from 'react';
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
import { useApp } from '../../context/AppContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isIOS, isAndroid, isStandalone, hasNativePrompt, triggerNativeInstall } = usePWAInstall();
  const { settings } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [modalTab, setModalTab] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  });

  // Dynamic branding from settings (customizable by superadmin from Admin Settings)
  const appTitle = settings.pwaAppTitle || 'Offnot Energy Management System';
  const shortName = settings.pwaShortName || 'OffnotEnergy';
  const logoUrl = settings.pwaLogoUrl || '/pwa-512x512.png';

  // Automatic Prompt on Entry: If visitor arrives on browser and not installed as standalone PWA
  useEffect(() => {
    if (isStandalone) return;
    if (settings.enablePwaPrompt === false) return;

    // Check if user already dismissed the prompt in this session
    const hasPrompted = sessionStorage.getItem('offnot_pwa_prompt_shown');
    if (hasPrompted) return;

    const delay = Math.max(1, settings.pwaPromptDelaySeconds || 2) * 1000;
    const timer = setTimeout(() => {
      setShowModal(true);
      sessionStorage.setItem('offnot_pwa_prompt_shown', 'true');
    }, delay);

    return () => clearTimeout(timer);
  }, [isStandalone, settings.enablePwaPrompt, settings.pwaPromptDelaySeconds]);

  const handleButtonClick = async () => {
    if (hasNativePrompt) {
      setIsTriggering(true);
      try {
        const result = await triggerNativeInstall();
        if (result === 'unsupported' || result === 'dismissed') {
          setShowModal(true);
        }
      } catch {
        setShowModal(true);
      } finally {
        setIsTriggering(false);
      }
      return;
    }

    if (isIOS) setModalTab('ios');
    else if (isAndroid) setModalTab('android');
    else setModalTab('desktop');

    setShowModal(true);
  };

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <>
      {/* Header Compact Download Button */}
      {variant === 'header' && (
        <button
          onClick={handleButtonClick}
          disabled={isTriggering}
          type="button"
          title={`Download ${appTitle} on your phone or computer`}
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 shadow-xs hover:shadow-md rounded-xl transition-all border border-emerald-500/40 min-h-[38px] ${className}`}
        >
          <Download className="w-3.5 h-3.5 shrink-0 group-hover:-translate-y-0.5 transition-transform" />
          <span>Download App</span>
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
            <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs shrink-0 overflow-hidden border border-emerald-600">
              <img
                src={logoUrl}
                alt={shortName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/pwa-192x192.png';
                }}
                className="w-full h-full object-cover"
              />
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

      {/* Cross-Device PWA Download & Automatic Entry Pop-Up Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close download popup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* App Header Identity with Dynamic Logo */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-900 p-1 flex items-center justify-center shadow-md shrink-0 border border-emerald-700/60 overflow-hidden">
                <img
                  src={logoUrl}
                  alt={appTitle}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/pwa-512x512.png';
                  }}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight truncate">
                  {appTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Official Mobile & Desktop PWA Application
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Standalone App
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Full Offline + Sync</span>
                </div>
              </div>
            </div>

            {/* Direct 1-Click Install Button if supported */}
            {hasNativePrompt && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    1-Click Direct Download Ready
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
                  <span>Download & Install as App</span>
                </button>
              </div>
            )}

            {/* If in iframe, offer 1-click open in full window to install natively */}
            {isIframe && (
              <div className="p-3 bg-teal-50 dark:bg-teal-950/50 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-teal-900 dark:text-teal-200 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                    <span>Download App to Device</span>
                  </span>
                </div>
                <p className="text-[11px] text-teal-800 dark:text-teal-300">
                  To download directly as a standalone mobile application onto your device (not inside web iframe), open in a dedicated window:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.open(window.location.href, '_blank');
                  }}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-800 hover:bg-teal-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Dedicated Window &amp; Install</span>
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
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Download as Standalone Application:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (hasNativePrompt) {
                      await triggerNativeInstall();
                      setShowModal(false);
                    } else if (isIframe) {
                      window.open(window.location.href, '_blank');
                    } else {
                      alert('Tap the Chrome menu (⋮) at top right and select "Install app".');
                    }
                  }}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download &amp; Install on Android</span>
                </button>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      1
                    </span>
                    <span>
                      Tap the <strong>three dots menu (⋮)</strong> <MoreVertical className="w-3.5 h-3.5 inline text-slate-500 mx-0.5" /> at the top right of Google Chrome.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      2
                    </span>
                    <span>
                      Select <strong>"Install app"</strong> (or "Add to Home screen").
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      3
                    </span>
                    <span>
                      Confirm <strong>"Install"</strong>. Android will download the full standalone APK-like app directly into your App Drawer.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {modalTab === 'ios' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">
                  To install on iPhone & iPad (Safari browser):
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      1
                    </span>
                    <span>
                      Tap the Safari <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" /> in the bottom navigation bar.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      2
                    </span>
                    <span>
                      Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-500 mx-0.5" />.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      3
                    </span>
                    <span>
                      Tap <strong>Add</strong> in the top right. It runs in full screen as an independent app without the browser address bar.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {modalTab === 'desktop' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">
                  To download on Windows / Mac (Chrome & Edge):
                </p>

                <button
                  type="button"
                  onClick={async () => {
                    if (hasNativePrompt) {
                      await triggerNativeInstall();
                      setShowModal(false);
                    } else if (isIframe) {
                      window.open(window.location.href, '_blank');
                    } else {
                      alert('Please look in the browser address bar for the install icon (⊕) or open the menu -> "Install Offnot Energy".');
                    }
                  }}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Desktop App</span>
                </button>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      1
                    </span>
                    <span>
                      Look in the address bar for the <strong>Install icon</strong> <Download className="w-3.5 h-3.5 inline text-emerald-600 mx-0.5" /> or open the Chrome menu (⋮).
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      2
                    </span>
                    <span>
                      Click <strong>"Install Offnot Energy"</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      3
                    </span>
                    <span>
                      Launches in a dedicated app window and creates a desktop shortcut.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Offline & Real-time Database Guarantee */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enterprise Offline + Supabase Sync:</span>
              </p>
              <p className="text-[10px] leading-relaxed">
                Transactions, inventory updates, and cash sales recorded offline are saved in IndexedDB and automatically synchronized to your Supabase cloud database upon reconnection.
              </p>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              Continue to Web Version
            </button>
          </div>
        </div>
      )}
    </>
  );
};
