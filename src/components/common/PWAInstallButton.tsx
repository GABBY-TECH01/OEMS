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
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'banner' | 'login';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'login',
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

  const handleAndroidClick = async () => {
    setModalTab('android');
    if (hasNativePrompt) {
      setIsTriggering(true);
      try {
        await triggerNativeInstall();
      } catch {
        setShowModal(true);
      } finally {
        setIsTriggering(false);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleIOSClick = () => {
    setModalTab('ios');
    setShowModal(true);
  };

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <>
      {/* Login Screen Dedicated Mobile App Download Section */}
      {variant === 'login' && (
        <div className={`mt-6 w-full bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-4 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden border border-emerald-400/40">
              <img
                src={logoUrl}
                alt={shortName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/pwa-192x192.png';
                }}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white truncate">Download Mobile App</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  Real App
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Install on Android &amp; iPhone for offline terminal access
              </p>
            </div>
          </div>

          {/* Real App Download Store Badges (Google Play & Apple App Store style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Google Play / Android WebAPK Button */}
            <button
              type="button"
              onClick={handleAndroidClick}
              disabled={isTriggering}
              className="group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-700 hover:border-emerald-500/70 text-left transition-all active:scale-[0.98] shadow-md cursor-pointer"
            >
              {/* Google Play Styled Icon */}
              <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M3.6 1.4L13.8 12 3.6 22.6c-.4-.4-.6-1-.6-1.7V3.1c0-.7.2-1.3.6-1.7z" fill="#00C1A6"/>
                  <path d="M17.2 8.6L13.8 12l3.4 3.4 3.9-2.2c1.1-.6 1.1-1.7 0-2.3l-3.9-2.3z" fill="#FFBA00"/>
                  <path d="M3.6 1.4l10.2 10.6 3.4-3.4L6.1.4c-.9-.6-2-.3-2.5 1z" fill="#00E676"/>
                  <path d="M17.2 15.4L13.8 12 3.6 22.6c.5 1.3 1.6 1.6 2.5 1l11.1-8.2z" fill="#FF3D00"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold leading-tight">
                  GET IT ON
                </span>
                <span className="block text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                  Google Play (Android)
                </span>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0 transition-transform group-hover:translate-y-0.5" />
            </button>

            {/* Apple App Store / iPhone Button */}
            <button
              type="button"
              onClick={handleIOSClick}
              className="group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-700 hover:border-blue-500/70 text-left transition-all active:scale-[0.98] shadow-md cursor-pointer"
            >
              {/* Apple Styled Icon */}
              <div className="w-7 h-7 shrink-0 flex items-center justify-center text-white">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.96-12.02-14.64-5.38-8.34-9.68-17.72-12.91-28.14-3.23-10.42-4.85-20.44-4.85-30.06 0-14.35 3.65-26.06 10.95-35.14 7.3-9.08 16.51-13.68 27.63-13.8 4.79 0 10.37 1.34 16.74 4.02 6.37 2.68 10.22 4.08 11.55 4.2 1.9-.3 5.76-1.74 11.58-4.32 5.82-2.58 11.23-3.79 16.24-3.63 12.63.63 22.84 5.38 30.64 14.25-11.05 6.69-16.45 16.03-16.2 28.02.25 9.38 3.86 17.26 10.82 23.63 6.96 6.37 15.22 10.02 24.78 10.95-1.9 5.8-4.14 11.45-6.72 16.94zm-30.65-104.7c0-6.85 2.5-13.19 7.5-19.01 5-5.83 11.23-9.42 18.69-10.77.34 2.12.51 4.19.51 6.2 0 6.78-2.6 13.23-7.8 19.35-5.2 6.13-11.5 9.77-18.9 10.93z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold leading-tight">
                  Download on the
                </span>
                <span className="block text-xs font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                  App Store (iPhone)
                </span>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-400 shrink-0 transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>

          {/* Quick Guide: Real App vs Chrome Shortcut */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>How to avoid entering Chrome browser:</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              When installing, choose <strong className="text-white">"Install app"</strong> instead of adding a plain bookmark. This compiles the standalone app into your phone&apos;s <strong className="text-white">App Drawer</strong>, launching in full-screen with zero Chrome address bar!
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>100% Offline POS Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Instant Cloud Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>No Chrome URL Bar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Android &amp; iOS Support</span>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Device PWA Download & Automatic Entry Pop-Up Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">
                  {appTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Clean Energy, Stronger Tomorrow
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Standalone App
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Offline + Cloud Sync</span>
                </div>
              </div>
            </div>

            {/* Direct 1-Click Install Button if browser supports beforeinstallprompt */}
            {hasNativePrompt && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    1-Click Direct Download Ready
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await triggerNativeInstall();
                    setShowModal(false);
                  }}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 active:scale-98 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download &amp; Install Standalone App</span>
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
                  To download directly as a standalone mobile application onto your device (without the web iframe frame), open in a dedicated browser tab:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.open(window.location.href, '_blank');
                  }}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-800 hover:bg-teal-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  modalTab === 'ios'
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('desktop')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  modalTab === 'desktop'
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>PC / Laptop</span>
              </button>
            </div>

            {/* Android Instructions */}
            {modalTab === 'android' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Convert to Standalone Android App (No Chrome Bar):
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
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                      Select <strong>&quot;Install app&quot;</strong> (do not tap basic &quot;Add shortcut&quot;).
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      3
                    </span>
                    <span>
                      Confirm <strong>&quot;Install&quot;</strong>. Google Play &amp; Android compile a true WebAPK into your phone&apos;s App Drawer that opens without Chrome&apos;s URL bar.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {modalTab === 'ios' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Install Standalone App on iPhone &amp; iPad:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      1
                    </span>
                    <span>
                      Open in <strong>Safari</strong> and tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" /> in the bottom bar.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      2
                    </span>
                    <span>
                      Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-500 mx-0.5" />.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      3
                    </span>
                    <span>
                      Tap <strong>Add</strong>. The app launches directly from your home screen in full-screen mode without Safari navigation bars.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {modalTab === 'desktop' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Download on Windows / Mac / Linux:
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
                      alert('Look in the address bar for the install icon (⊕) or open the menu -> "Install Offnot Energy".');
                    }
                  }}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                      Look in the address bar for the <strong>Install icon</strong> <Download className="w-3.5 h-3.5 inline text-emerald-600 mx-0.5" />.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      2
                    </span>
                    <span>
                      Click <strong>&quot;Install Offnot Energy&quot;</strong>.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Offline & Sync Guarantee */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enterprise Offline + Supabase Sync:</span>
              </p>
              <p className="text-[10px] leading-relaxed">
                Sales recorded while offline are saved in Dexie IndexedDB and automatically synced to Supabase when network connectivity returns.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
