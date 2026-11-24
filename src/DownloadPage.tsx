import { type ReactElement, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Coffee,
  Download,
  Flame,
  Laptop,
  ShieldCheck,
  Smartphone,
  Target,
  Wallet,
  WifiOff,
  Zap,
} from 'lucide-react';

import { PanduLogo } from './components/icons';
import type { ToastType } from './components/dashboard/modals';

type DetectedPlatform = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'other';
type DeviceStage = 'desktop' | 'mobile';
type InstallGuideTab = 'desktop_browser' | 'android_chrome' | 'ios_safari';

function detectPlatform(): DetectedPlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/win/.test(ua)) return 'windows';
  if (/mac/.test(ua)) return 'macos';
  if (/linux/.test(ua)) return 'linux';
  return 'other';
}

function WindowsIcon({ className = 'size-4' }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5.5L11 4.4V11.5H3V5.5ZM12.2 4.2L21 3V11.5H12.2V4.2ZM3 12.7H11V19.6L3 18.5V12.7ZM12.2 12.7H21V21L12.2 19.8V12.7Z" />
    </svg>
  );
}

function AppleIcon({ className = 'size-4' }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 12.7C16.6 10.3 18.5 9.1 18.6 9C17.5 7.4 15.8 7.2 15.2 7.1C13.8 7 12.4 8 11.7 8C11 8 9.9 7.1 8.7 7.1C7.1 7.1 5.7 8 4.9 9.5C3.3 12.3 4.5 16.5 6 18.7C6.8 19.8 7.7 21 8.9 21C10.1 21 10.5 20.2 11.9 20.2C13.3 20.2 13.7 21 14.9 21C16.2 21 17 19.9 17.7 18.8C18.6 17.5 19 16.2 19 16.1C18.9 16.1 16.6 15.2 16.6 12.7ZM14.3 5.6C14.9 4.8 15.4 3.8 15.2 2.7C14.3 2.7 13.2 3.3 12.5 4.1C11.9 4.8 11.4 5.9 11.6 6.9C12.6 7 13.6 6.4 14.3 5.6Z" />
    </svg>
  );
}

function AndroidIcon({ className = 'size-4' }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.8 9.2H16.2C17.2 9.2 18 10 18 11V17.2C18 18.2 17.2 19 16.2 19H7.8C6.8 19 6 18.2 6 17.2V11C6 10 6.8 9.2 7.8 9.2ZM15.5 7.7H8.5C8.7 6.3 9.7 5.2 11 4.9L10 3.3C9.9 3.1 10 2.8 10.2 2.7C10.4 2.6 10.7 2.7 10.8 2.9L11.8 4.6C12.1 4.6 12.4 4.6 12.7 4.6L13.7 2.9C13.8 2.7 14.1 2.6 14.3 2.7C14.5 2.8 14.6 3.1 14.5 3.3L13.5 4.9C14.8 5.2 15.8 6.3 15.5 7.7ZM10.4 6.4C10.4 6.1 10.2 5.9 9.9 5.9C9.6 5.9 9.4 6.1 9.4 6.4C9.4 6.7 9.6 6.9 9.9 6.9C10.2 6.9 10.4 6.7 10.4 6.4ZM14.6 6.4C14.6 6.1 14.4 5.9 14.1 5.9C13.8 5.9 13.6 6.1 13.6 6.4C13.6 6.7 13.8 6.9 14.1 6.9C14.4 6.9 14.6 6.7 14.6 6.4Z" />
    </svg>
  );
}

function LinuxIcon({ className = 'size-4' }: { className?: string }): ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M7.5 10L10.5 12.5L7.5 15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 15H16.5" strokeLinecap="round" />
    </svg>
  );
}

interface DownloadPageProps {
  activeUserName: string | null;
  onBackHome: () => void;
  onOpenDashboard: () => void;
  onOpenDesktopPrototype: () => void;
  onNotify: (message: string, type?: ToastType) => void;
}

const DESKTOP_OPTIONS: {
  id: 'windows' | 'macos' | 'linux';
  name: string;
  spec: string;
  format: string;
  size: string;
}[] = [
  {
    id: 'windows',
    name: 'Windows',
    spec: 'Windows 10 dan 11 (64 bit)',
    format: 'Installer .exe',
    size: '~18 MB',
  },
  {
    id: 'macos',
    name: 'macOS',
    spec: 'Apple Silicon dan Intel',
    format: 'Paket .dmg',
    size: '~22 MB',
  },
  {
    id: 'linux',
    name: 'Linux',
    spec: 'Ubuntu, Fedora, Arch (x64)',
    format: 'Berkas .AppImage',
    size: '~20 MB',
  },
];

const MOBILE_OPTIONS: {
  id: 'android' | 'ios';
  name: string;
  spec: string;
  format: string;
  size: string;
}[] = [
  {
    id: 'android',
    name: 'Android',
    spec: 'Android 8.0 ke atas',
    format: 'Berkas .apk',
    size: '~14 MB',
  },
  {
    id: 'ios',
    name: 'iOS',
    spec: 'iPhone dan iPad (iOS 14+)',
    format: 'TestFlight dan App Store',
    size: '~16 MB',
  },
];

const INSTALL_GUIDES: Record<InstallGuideTab, { label: string; steps: string[] }> = {
  desktop_browser: {
    label: 'Chrome, Edge, atau Brave (PC)',
    steps: [
      'Buka Pandu di browser laptop atau PC kamu.',
      'Klik ikon pasang aplikasi di sisi kanan kolom alamat, atau buka menu titik tiga lalu pilih Simpan dan Bagikan, Pasang halaman sebagai aplikasi.',
      'Ikon Pandu akan langsung muncul di taskbar atau desktop dan terbuka sebagai jendela aplikasi terpisah.',
    ],
  },
  android_chrome: {
    label: 'Android (Chrome)',
    steps: [
      'Buka Pandu lewat browser Chrome di HP Android kamu.',
      'Ketuk menu titik tiga di pojok kanan atas layar.',
      'Pilih Tambahkan ke layar utama lalu konfirmasi, aplikasi Pandu siap dibuka satu ketukan.',
    ],
  },
  ios_safari: {
    label: 'iPhone dan iPad (Safari)',
    steps: [
      'Buka Pandu lewat browser Safari di iPhone atau iPad kamu.',
      'Ketuk tombol Bagikan (ikon kotak dengan panah ke atas) di bagian bawah.',
      'Geser ke bawah lalu pilih Tambahkan ke Layar Utama.',
    ],
  },
};

function renderPlatformIcon(id: 'windows' | 'macos' | 'linux' | 'android' | 'ios'): ReactElement {
  switch (id) {
    case 'windows':
      return <WindowsIcon className="size-4" />;
    case 'macos':
    case 'ios':
      return <AppleIcon className="size-4" />;
    case 'android':
      return <AndroidIcon className="size-4" />;
    case 'linux':
      return <LinuxIcon className="size-4" />;
  }
}

/**
 * Halaman Download Pandu yang imersif dengan pratinjau interaktif perangkat
 * (Laptop/PC dan HP), deteksi OS otomatis, dan panduan pasang instan.
 */
export default function DownloadPage({
  activeUserName,
  onBackHome,
  onOpenDashboard,
  onOpenDesktopPrototype,
  onNotify,
}: DownloadPageProps): ReactElement {
  const detected = useMemo<DetectedPlatform>(() => detectPlatform(), []);
  const [stage, setStage] = useState<DeviceStage>(() =>
    detected === 'android' || detected === 'ios' ? 'mobile' : 'desktop',
  );
  const [guideTab, setGuideTab] = useState<InstallGuideTab>(() => {
    if (detected === 'android') return 'android_chrome';
    if (detected === 'ios') return 'ios_safari';
    return 'desktop_browser';
  });
  const [demoChecked, setDemoChecked] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
  });

  const toggleDemoTask = (id: number): void => {
    setDemoChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadClick = (platformName: string, format: string): void => {
    onNotify(
      `Paket native Flutter untuk ${platformName} (${format}) sedang disiapkan, gunakan versi Web atau pasang pintasan aplikasi di bawah sementara ini.`,
      'info',
    );
  };

  const completedDemo = Object.values(demoChecked).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-slate-900 selection:text-white antialiased overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackHome}
            className="flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <PanduLogo className="size-6 text-slate-900 transition-transform group-hover:scale-105" />
            <span className="leading-none">
              <span className="text-[15px] font-extrabold tracking-tight text-slate-900 block">
                Pandu
              </span>
              <span className="text-[11px] text-slate-500 group-hover:text-slate-900 transition inline-flex items-center gap-1 mt-0.5">
                <ArrowLeft className="size-2.5" /> Beranda
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenDashboard}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>{activeUserName ? `Lanjut (${activeUserName})` : 'Buka Versi Web'}</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </nav>

      {/* Immersive Hero Stage */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 px-5 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-55" />

        <div className="max-w-5xl mx-auto relative z-10 space-y-10">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Bawa Pandu ke HP dan Laptop kamu.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
              Satu aplikasi native ringan berbasis Flutter yang hemat RAM dan cepat dibuka setiap
              pagi. Semua tab, prioritas fokus, pos uang, dan kebiasaan tersinkronisasi rapi di
              semua perangkat.
            </p>

            {/* Switcher Perangkat Interaktif */}
            <div className="pt-2 inline-flex p-1 rounded-xl bg-[#F7F6F3] border border-slate-200/90">
              <button
                type="button"
                onClick={() => setStage('desktop')}
                className={`px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${
                  stage === 'desktop'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Laptop className="size-3.5 text-emerald-600" />
                <span>Laptop dan PC</span>
              </button>
              <button
                type="button"
                onClick={() => setStage('mobile')}
                className={`px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${
                  stage === 'mobile'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Smartphone className="size-3.5 text-emerald-600" />
                <span>HP (Android dan iOS)</span>
              </button>
            </div>
          </div>

          {/* Interactive Device Mockup Stage */}
          <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-b from-[#F7F6F3] to-white p-4 sm:p-8 shadow-sm">
            {stage === 'desktop' ? (
              <div className="max-w-3xl mx-auto">
                {/* Desktop Native App Window */}
                <div className="rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
                  {/* Window Title Bar + Tabs */}
                  <div className="px-3.5 py-2.5 bg-[#F7F6F3] border-b border-slate-200/90 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm bg-slate-300" />
                      <span className="size-2.5 rounded-sm bg-slate-300" />
                      <span className="size-2.5 rounded-sm bg-slate-300" />
                      <div className="ml-2 flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-900 shadow-2xs">
                          <Target className="size-3 text-emerald-600" /> Tasking
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-500">
                          <Wallet className="size-3" /> Pembagian Uang
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-500">
                          <Flame className="size-3" /> Kebiasaan
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Native Flutter, ~18 MB
                    </span>
                  </div>

                  {/* Interactive Window Body */}
                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div className="md:col-span-7 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Coba centang prioritas di sini</span>
                        <span className="text-emerald-700 tabular-nums">{completedDemo} / 3</span>
                      </div>
                      {[
                        { id: 1, title: 'Selesaikan ringkasan proyek mingguan', cat: 'Pekerjaan' },
                        { id: 2, title: 'Cek pembagian pos uang makan', cat: 'Keuangan' },
                        { id: 3, title: 'Baca 10 halaman buku sebelum tidur', cat: 'Pribadi' },
                      ].map((task) => {
                        const done = Boolean(demoChecked[task.id]);
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => toggleDemoTask(task.id)}
                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition cursor-pointer ${
                              done
                                ? 'bg-[#F7F6F3] border-slate-200/80'
                                : 'bg-white border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`size-5 rounded-md flex items-center justify-center border shrink-0 transition ${
                                  done
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-slate-300 text-transparent'
                                }`}
                              >
                                <Check className="size-3" strokeWidth={3} />
                              </span>
                              <span
                                className={`text-xs font-semibold truncate ${
                                  done ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                              {task.cat}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="md:col-span-5 space-y-3">
                      <div className="p-3.5 rounded-xl bg-[#F7F6F3] border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Wallet className="size-3.5 text-amber-600" /> Sisa Kuota
                          </span>
                          <span className="font-bold text-slate-900 tabular-nums">Rp 95.000</span>
                        </div>
                        <div className="w-full h-1.5 rounded-sm bg-slate-200 overflow-hidden">
                          <div className="h-full w-[38%] bg-slate-900 rounded-sm" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Coffee className="size-3 text-amber-600" /> Makan: 25k
                          </span>
                          <span>Transport: 20k</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">Agenda Berikutnya</span>
                          <span className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" /> 14:00, Sync Tim
                          </span>
                        </div>
                        <span className="size-2.5 rounded-sm bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Mobile Interactive Frame + Side Context Cards */
              <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 flex justify-center">
                  <div className="w-[270px] rounded-[28px] bg-slate-900 p-2.5 shadow-2xl">
                    <div className="rounded-[21px] bg-white overflow-hidden">
                      {/* Phone Top Bar */}
                      <div className="px-4 py-3 bg-[#F7F6F3] border-b border-slate-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <PanduLogo className="size-4 text-slate-900" />
                          <span className="text-xs font-extrabold text-slate-900">Pandu</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700">
                          {completedDemo} / 3 selesai
                        </span>
                      </div>

                      {/* Phone Content */}
                      <div className="p-3.5 space-y-2.5">
                        <div className="p-2.5 rounded-xl bg-[#F7F6F3] border border-slate-200/80">
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Sisa Jajan Hari Ini
                          </span>
                          <span className="text-base font-extrabold text-slate-900 tabular-nums">
                            Rp 95.000
                          </span>
                        </div>

                        {[
                          { id: 1, title: 'Ringkasan proyek mingguan' },
                          { id: 2, title: 'Cek pos uang makan' },
                          { id: 3, title: 'Baca 10 halaman buku' },
                        ].map((task) => {
                          const done = Boolean(demoChecked[task.id]);
                          return (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => toggleDemoTask(task.id)}
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2 text-left cursor-pointer"
                            >
                              <span
                                className={`size-4 rounded flex items-center justify-center border shrink-0 ${
                                  done
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 text-transparent'
                                }`}
                              >
                                <Check className="size-2.5" strokeWidth={3} />
                              </span>
                              <span
                                className={`text-[11px] font-semibold truncate ${
                                  done ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {task.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Phone Bottom Nav */}
                      <div className="px-3 py-2 border-t border-slate-200 bg-[#F7F6F3] grid grid-cols-3 text-center text-[9px] font-bold">
                        <span className="text-emerald-700">Tasking</span>
                        <span className="text-slate-400">Uang</span>
                        <span className="text-slate-400">Habit</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Nyaman dipakai satu tangan saat sedang di jalan.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Versi HP dirancang supaya kamu bisa langsung catat jajan, centang prioritas, dan
                    pindah tab dari bar navigasi bawah tanpa ribet.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-900 block">Ukuran Ringan</span>
                      <span className="text-[11px] text-slate-500">
                        Estimasi ~14 MB di Android, tidak bikin penyimpanan HP penuh.
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-900 block">Mode Offline Siap</span>
                      <span className="text-[11px] text-slate-500">
                        Catatan tetap masuk meski sinyal hilang, lalu sinkron otomatis.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Kartu Unduhan: Desktop & Mobile */}
      <section className="pb-16 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Desktop Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#F7F6F3] border border-slate-200/90 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-2xs">
                  <Laptop className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    Laptop dan PC
                  </h2>
                  <p className="text-xs text-slate-500">Aplikasi desktop native Flutter</p>
                </div>
              </div>
              {(detected === 'windows' || detected === 'macos' || detected === 'linux') && (
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                  Perangkatmu
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {DESKTOP_OPTIONS.map((opt) => {
                const isCurrentOs = detected === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`p-3.5 rounded-xl bg-white border flex items-center justify-between gap-3 transition ${
                      isCurrentOs
                        ? 'border-slate-900 shadow-xs'
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-lg bg-[#F7F6F3] border border-slate-200/80 flex items-center justify-center text-slate-800 shrink-0">
                        {renderPlatformIcon(opt.id)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{opt.name}</span>
                          {isCurrentOs && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Terdeteksi
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                          {opt.spec}, {opt.format}, {opt.size}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadClick(opt.name, opt.format)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                        isCurrentOs
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <Download className="size-3.5" />
                      <span>Unduh</span>
                    </button>
                  </div>
                );
              })}
            </div>
            {/* Prototype Desktop Local-First CTA */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-slate-900 block">
                  Prototype Desktop Local-First
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Coba folder per akun, rolling backup, deteksi diff, edit JSON, dan ekspor .txt.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenDesktopPrototype}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition cursor-pointer"
              >
                <span>Coba Prototype</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#F7F6F3] border border-slate-200/90 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-2xs">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    HP (Android dan iOS)
                  </h2>
                  <p className="text-xs text-slate-500">Aplikasi mobile native Flutter</p>
                </div>
              </div>
              {(detected === 'android' || detected === 'ios') && (
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                  Perangkatmu
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {MOBILE_OPTIONS.map((opt) => {
                const isCurrentOs = detected === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`p-3.5 rounded-xl bg-white border flex items-center justify-between gap-3 transition ${
                      isCurrentOs
                        ? 'border-slate-900 shadow-xs'
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-lg bg-[#F7F6F3] border border-slate-200/80 flex items-center justify-center text-slate-800 shrink-0">
                        {renderPlatformIcon(opt.id)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{opt.name}</span>
                          {isCurrentOs && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Terdeteksi
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                          {opt.spec}, {opt.format}, {opt.size}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadClick(opt.name, opt.format)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                        isCurrentOs
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <Download className="size-3.5" />
                      <span>Unduh</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Keunggulan Ringkas */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <Zap className="size-3.5 text-emerald-600 mx-auto" />
                <span className="text-[10px] font-bold text-slate-800 block">Hemat RAM</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <WifiOff className="size-3.5 text-amber-600 mx-auto" />
                <span className="text-[10px] font-bold text-slate-800 block">Siap Offline</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <ShieldCheck className="size-3.5 text-blue-600 mx-auto" />
                <span className="text-[10px] font-bold text-slate-800 block">Akun Tersimpan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Panduan Pasang Instan Sekarang (Interaktif per Perangkat) */}
      <section className="py-14 px-5 sm:px-6 bg-[#F7F6F3] border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xl space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Mau langsung pasang di layar utama hari ini?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Sambil menunggu rilis installer Flutter, kamu sudah bisa memasang Pandu seperti
                aplikasi langsung dari browser.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenDashboard}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 w-fit cursor-pointer"
            >
              <span>Buka Versi Web</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3.5">
              {(Object.keys(INSTALL_GUIDES) as InstallGuideTab[]).map((key) => {
                const active = guideTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGuideTab(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-[#F7F6F3] text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {INSTALL_GUIDES[key].label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {INSTALL_GUIDES[guideTab].steps.map((step, idx) => (
                <div
                  key={step}
                  className="p-4 rounded-xl bg-[#F7F6F3] border border-slate-200/70 space-y-2"
                >
                  <span className="size-6 rounded-md bg-white border border-slate-200 text-xs font-extrabold text-slate-900 inline-flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
