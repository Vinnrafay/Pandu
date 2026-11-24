import {
  type FormEvent,
  type MouseEvent,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Coffee,
  Flame,
  Inbox,
  Loader2,
  Menu,
  PiggyBank,
  Plus,
  Target,
  Timer,
  Trash2,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';

import {
  GoogleCalendarIcon,
  GoogleMeetIcon,
  PanduLogo,
  TeamsIcon,
  ZoomIcon,
} from './components/icons';
import {
  CurvedArrowAsset,
  EditorialAvatarAsset,
  FeatureFinanceIcon,
  FeatureHabitIcon,
  FeatureScheduleIcon,
  FeatureTabsIcon,
  PanduCoverArt,
  StepFocusIllustration,
  StepSaveIllustration,
  StepTabsIllustration,
  UseCaseRoutineAsset,
  UseCaseStudentAsset,
  UseCaseWorkerAsset,
} from './components/LandingAssets';
import type { GuestUser } from './hooks/useDashboardData';
import { validateDisplayName } from './lib/nameFilter';

interface LandingPageProps {
  activeGuest: GuestUser | null;
  savedGuests: GuestUser[];
  onEnterApp: (guestName: string) => void | Promise<void>;
  onSelectSavedGuest: (account: GuestUser) => void | Promise<void>;
  onRemoveSavedGuest: (id: string) => void;
  onResumeDashboard: () => void;
  onOpenDownload: () => void;
}

type PreviewTab = 'tasking' | 'finance' | 'habits' | 'schedule';

const PREVIEW_TABS: {
  id: PreviewTab;
  label: string;
  caption: string;
  Icon: typeof Target;
}[] = [
  {
    id: 'tasking',
    label: 'Tasking',
    caption: 'Fokus pada 3 prioritas utama saja, tugas lain menunggu dengan rapi di Kotak Tunggu.',
    Icon: Target,
  },
  {
    id: 'finance',
    label: 'Pembagian Uang',
    caption: 'Pecah jatah harian ke beberapa pos seperti makan dan transport, lalu pantau sisa kuota.',
    Icon: Wallet,
  },
  {
    id: 'habits',
    label: 'Kebiasaan',
    caption: 'Jaga konsistensi harian dengan target ringan saat sedang sibuk, atau target penuh saat fit.',
    Icon: Flame,
  },
  {
    id: 'schedule',
    label: 'Agenda',
    caption: 'Atur jadwal pertemuan dan waktu fokus agar tidak saling bertabrakan.',
    Icon: Calendar,
  },
];

/**
 * Halaman depan Pandu: editorial hangat ala Notion dengan kartu pengingat melayang,
 * aset ilustrasi sketsa, dan pratinjau workspace interaktif.
 */
export default function LandingPage({
  activeGuest,
  savedGuests,
  onEnterApp,
  onSelectSavedGuest,
  onRemoveSavedGuest,
  onResumeDashboard,
  onOpenDownload,
}: LandingPageProps): ReactElement {
  const [showGuestModal, setShowGuestModal] = useState<boolean>(false);
  const [guestInputName, setGuestInputName] = useState<string>('');
  const [guestNameError, setGuestNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('tasking');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const isMounted = useRef<boolean>(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const scrollToSection = (e: MouseEvent<HTMLAnchorElement>, sectionId: string): void => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleOpenDashboardClick = (): void => {
    if (activeGuest) {
      onResumeDashboard();
      return;
    }
    setShowGuestModal(true);
  };

  const handleResumeSaved = async (account: GuestUser): Promise<void> => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSelectSavedGuest(account);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
        setShowGuestModal(false);
      }
    }
  };

  const handleStartGuest = async (e?: FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const validationError = validateDisplayName(guestInputName, {
      fieldLabel: 'Nama panggilan',
      required: false,
      maxLength: 40,
    });
    if (validationError) {
      setGuestNameError(validationError);
      return;
    }

    setGuestNameError(null);
    setIsSubmitting(true);
    const trimmed = guestInputName.trim();
    const finalName = trimmed !== '' ? trimmed : 'Tamu';

    try {
      await onEnterApp(finalName);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
        setShowGuestModal(false);
      }
    }
  };

  const activePreviewMeta = PREVIEW_TABS.find((t) => t.id === previewTab) ?? PREVIEW_TABS[0];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-slate-900 selection:text-white antialiased overflow-x-hidden">
      <style>{`
        @keyframes pandu-float-slow {
          0%, 100% { transform: translateY(0px) rotate(-3.5deg); }
          50% { transform: translateY(-9px) rotate(-2deg); }
        }
        @keyframes pandu-float-meet {
          0%, 100% { transform: translateY(0px) rotate(2.5deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes pandu-float-left {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(-0.8deg); }
        }
        @keyframes pandu-float-right {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        .animate-pandu-note { animation: pandu-float-slow 6s ease-in-out infinite; }
        .animate-pandu-meet { animation: pandu-float-meet 6.4s ease-in-out infinite 0.5s; }
        .animate-pandu-left { animation: pandu-float-left 5.8s ease-in-out infinite 1s; }
        .animate-pandu-right { animation: pandu-float-right 6.2s ease-in-out infinite 0.8s; }
      `}</style>

      {/* 1. Navbar Minimalis */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-7">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 cursor-pointer group text-left"
              title="Kembali ke atas"
            >
              <PanduLogo className="size-6 text-slate-900 transition-transform group-hover:scale-105" />
              <span className="text-[15px] font-extrabold tracking-tight text-slate-900">
                Pandu
              </span>
            </button>

            <div className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600">
              <a
                href="#cara-kerja"
                onClick={(e) => scrollToSection(e, 'cara-kerja')}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
              >
                Cara Kerja
              </a>
              <a
                href="#fitur"
                onClick={(e) => scrollToSection(e, 'fitur')}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
              >
                Apa yang Bisa Diatur
              </a>
              <a
                href="#contoh-pakai"
                onClick={(e) => scrollToSection(e, 'contoh-pakai')}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
              >
                Cocok untuk Siapa
              </a>
              <button
                type="button"
                onClick={onOpenDownload}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              >
                Download
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuestModal(true)}
              className="hidden sm:inline-flex text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              {activeGuest
                ? `Ganti Akun (${activeGuest.name})`
                : savedGuests.length > 0
                  ? `Akun Tersimpan (${savedGuests.length})`
                  : 'Masuk Tamu'}
            </button>
            <button
              type="button"
              onClick={handleOpenDashboardClick}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-lg shadow-2xs transition cursor-pointer"
            >
              {activeGuest ? `Lanjut (${activeGuest.name})` : 'Coba Gratis'}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Menu Navigasi Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white px-5 py-3 space-y-1 shadow-md">
            <a
              href="#cara-kerja"
              onClick={(e) => scrollToSection(e, 'cara-kerja')}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Cara Kerja
            </a>
            <a
              href="#fitur"
              onClick={(e) => scrollToSection(e, 'fitur')}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Apa yang Bisa Diatur
            </a>
            <a
              href="#contoh-pakai"
              onClick={(e) => scrollToSection(e, 'contoh-pakai')}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Cocok untuk Siapa
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDownload();
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              Download
            </button>
            <div className="pt-2 mt-1 border-t border-slate-100 sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowGuestModal(true);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-[#F7F6F3] hover:bg-slate-200/70 transition cursor-pointer"
              >
                {activeGuest
                  ? `Ganti Akun (${activeGuest.name})`
                  : savedGuests.length > 0
                    ? `Akun Tersimpan (${savedGuests.length})`
                    : 'Masuk Tamu'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. Hero dengan Kartu Pengingat Melayang + Live Tabbed Workspace */}
      <section className="relative pt-14 pb-16 sm:pt-20 sm:pb-24 px-5 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

        <div className="max-w-6xl mx-auto relative">
          {/* Hero Stage dengan Floating Reminder Widgets di desktop */}
          <div className="relative py-4 lg:py-12">
            {/* Floating 1 (Kiri Atas): Sticky Note Pengingat Fokus */}
            <div className="hidden lg:block absolute -top-2 left-0 z-20">
              <div className="relative animate-pandu-note hover:[animation-play-state:paused]">
                <div className="w-52 p-4 rounded-xl bg-[#FEF08A] text-amber-950 shadow-md border border-amber-300/90">
                  <div className="w-2.5 h-2.5 rounded-xs bg-rose-500 border border-rose-600 mx-auto -mt-1.5 mb-2 rotate-45" />
                  <p className="text-xs font-semibold leading-relaxed">
                    "Pilih 3 hal terpenting pagi ini, sisanya taruh dulu di Kotak Tunggu."
                  </p>
                </div>
                <div className="absolute -bottom-3.5 -right-3 bg-white p-2 rounded-lg shadow-md border border-slate-200 text-emerald-600">
                  <Check className="size-4" strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Floating 2 (Kanan Atas): Kartu Pengingat Agenda + Timer */}
            <div className="hidden lg:block absolute -top-4 right-0 z-20">
              <div className="relative animate-pandu-meet hover:[animation-play-state:paused]">
                <div className="w-60 p-3.5 rounded-xl bg-white border border-slate-200 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Pengingat Agenda</span>
                    <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                      Meeting
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Standup Tim Proyek
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-md mt-1">
                        <Clock className="size-2.5" /> 13:00 sampai 13:45
                      </span>
                    </div>
                    <div className="size-8 rounded-lg bg-[#F7F6F3] border border-slate-200 flex items-center justify-center shrink-0">
                      <GoogleMeetIcon className="size-4" />
                    </div>
                  </div>
                </div>
                <div className="absolute -top-3 -left-4 bg-white px-2.5 py-1 rounded-lg shadow-md border border-slate-200 flex items-center gap-1.5">
                  <Timer className="size-3.5 text-slate-700" />
                  <span className="text-[11px] font-bold tabular-nums text-slate-800">45:00</span>
                </div>
              </div>
            </div>

            {/* Floating 3 (Kiri Bawah): Pengingat Sisa Jajan */}
            <div className="hidden lg:block absolute -bottom-4 left-4 z-20">
              <div className="w-56 p-3.5 rounded-xl bg-white border border-slate-200 shadow-md space-y-2 animate-pandu-left hover:[animation-play-state:paused]">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Sisa Jajan</span>
                  <Wallet className="size-3.5 text-amber-600" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-extrabold tabular-nums text-slate-900">
                    Rp 95.000
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700">Aman</span>
                </div>
                <div className="w-full h-1.5 rounded-sm bg-slate-100 overflow-hidden">
                  <div className="h-full w-[38%] bg-slate-900 rounded-sm" />
                </div>
              </div>
            </div>

            {/* Floating 4 (Kanan Bawah): Pengingat Kebiasaan */}
            <div className="hidden lg:block absolute -bottom-4 right-4 z-20">
              <div className="w-56 p-3.5 rounded-xl bg-white border border-slate-200 shadow-md space-y-2 animate-pandu-right hover:[animation-play-state:paused]">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Kebiasaan</span>
                  <Flame className="size-3.5 text-orange-500" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    Olahraga, 12 hari
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                    FULL
                  </span>
                </div>
              </div>
            </div>

            {/* Konten Tengah Hero */}
            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-5">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.14]">
                Atur tugas, uang, dan rutinitas dalam tab yang rapi.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
                Pandu membantu kamu keluar dari catatan harian yang berantakan. Pilih 3 prioritas
                paling penting hari ini, pisahkan proyek atau pembagian uang ke tab sendiri, lalu
                pantau kebiasaan baik tanpa perlu bikin akun yang ribet.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenDashboardClick}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-xs transition inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {activeGuest
                      ? `Lanjut ke Dashboard (${activeGuest.name})`
                      : 'Mulai Sekarang, Gratis'}
                  </span>
                  <ArrowRight className="size-4" />
                </button>
                <a
                  href="#cara-kerja"
                  onClick={(e) => scrollToSection(e, 'cara-kerja')}
                  className="w-full sm:w-auto bg-[#F7F6F3] hover:bg-slate-200/70 text-slate-800 text-sm font-semibold px-5 py-3 rounded-xl border border-slate-200 transition text-center"
                >
                  Lihat Cara Kerjanya
                </a>
              </div>

              <div className="hidden sm:flex flex-col items-center justify-center gap-1 pt-3 text-slate-500">
                <span className="text-[11px] font-semibold">
                  Coba klik tab pratinjau di bawah
                </span>
                <CurvedArrowAsset className="w-6 h-8 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Interactive Notion-Style Workspace Showcase */}
          <div className="mt-10 lg:mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-[#F7F6F3] p-2 sm:p-3 shadow-sm">
            <div className="rounded-xl bg-white border border-slate-200/90 overflow-hidden">
              {/* Simulated Browser Tab Bar */}
              <div className="px-3 py-2.5 bg-[#F7F6F3] border-b border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5">
                  {PREVIEW_TABS.map(({ id, label, Icon }) => {
                    const active = previewTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPreviewTab(id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                          active
                            ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                        }`}
                      >
                        <Icon className={`size-3.5 ${active ? 'text-emerald-600' : ''}`} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleOpenDashboardClick}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-white/60 transition shrink-0 cursor-pointer"
                    title="Buat tab sendiri di dashboard"
                  >
                    <Plus className="size-3.5" />
                    <span className="hidden sm:inline">Tab Baru</span>
                  </button>
                </div>
                <span className="hidden md:inline-block text-[11px] font-medium text-slate-400 pr-1">
                  Klik tab untuk lihat isi tiap ruang kerja
                </span>
              </div>

              {/* Preview Body */}
              <div className="p-5 sm:p-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {activePreviewMeta.label}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{activePreviewMeta.caption}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenDashboardClick}
                    className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Coba langsung
                  </button>
                </div>

                {previewTab === 'tasking' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>Prioritas Fokus (Maksimal 3 Slot)</span>
                        <span className="text-[11px] text-slate-500">1 / 3 Selesai</span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="size-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-400 line-through block truncate">
                              Finalisasi slide presentasi klien
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Slot 1, Pekerjaan, 10:00
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Selesai
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="size-5 rounded-md border border-slate-300 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 block truncate">
                              Rapikan revisi Bab 3 skripsi
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Slot 2, Belajar, target 15:00, 45m
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          Pending
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-5 rounded-xl bg-[#F7F6F3] border border-slate-200/80 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <Inbox className="size-3.5 text-slate-500" /> Kotak Tunggu
                        </span>
                        <span className="text-[10px] text-slate-500">2 Antrean</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Tugas tambahan disimpan di sini dulu agar fokus utamamu tidak terpecah.
                      </p>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-medium flex items-center justify-between">
                        <span className="truncate">Beli buku catatan baru</span>
                        <span className="text-[10px] font-semibold text-slate-600 ml-2 shrink-0">
                          Naikkan
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === 'finance' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 rounded-xl bg-[#F7F6F3] border border-slate-200/80 p-4 space-y-3">
                      <span className="text-xs font-semibold text-slate-500 block">
                        Sisa Kuota Hari Ini
                      </span>
                      <div>
                        <span className="text-2xl font-extrabold tabular-nums text-slate-900 block">
                          Rp 95.000
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Terpakai Rp 55.000 dari limit Rp 150.000
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-sm bg-slate-200 overflow-hidden">
                        <div className="h-full w-[37%] bg-slate-900 rounded-sm" />
                      </div>
                    </div>

                    <div className="md:col-span-7 space-y-2.5">
                      <span className="text-xs font-semibold text-slate-700 block">
                        Pos Pembagian Uang
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="inline-flex items-center gap-1.5">
                              <Coffee className="size-3.5 text-amber-600" /> Makan & Minum
                            </span>
                            <span className="text-[11px] text-emerald-700">Sisa Rp 25.000</span>
                          </div>
                          <div className="w-full h-1.5 rounded-sm bg-slate-100 overflow-hidden">
                            <div className="h-full w-[58%] bg-emerald-600 rounded-sm" />
                          </div>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="inline-flex items-center gap-1.5">
                              <PiggyBank className="size-3.5 text-indigo-600" /> Transportasi
                            </span>
                            <span className="text-[11px] text-emerald-700">Sisa Rp 20.000</span>
                          </div>
                          <div className="w-full h-1.5 rounded-sm bg-slate-100 overflow-hidden">
                            <div className="h-full w-[50%] bg-slate-900 rounded-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === 'habits' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border border-slate-200 bg-[#F7F6F3] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Olahraga Ringan, 12 hari beruntun
                        </span>
                        <span className="text-[11px] text-slate-500">
                          MIN: 10 menit jalan, FULL: 30 menit lari
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-bold shrink-0">
                        FULL
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-[#F7F6F3] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Membaca Buku, 7 hari beruntun
                        </span>
                        <span className="text-[11px] text-slate-500">
                          MIN: 5 halaman, FULL: 20 halaman
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-bold shrink-0">
                        MIN
                      </span>
                    </div>
                  </div>
                )}

                {previewTab === 'schedule' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Diskusi Proyek Mingguan
                        </span>
                        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5">
                          <Clock className="size-3" /> 13:00 sampai 13:45
                        </span>
                      </div>
                      <div className="size-8 rounded-lg bg-[#F7F6F3] border border-slate-200 flex items-center justify-center">
                        <GoogleMeetIcon className="size-4" />
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Sesi Belajar Mandiri
                        </span>
                        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5">
                          <Clock className="size-3" /> 16:00 sampai 17:00
                        </span>
                      </div>
                      <div className="size-8 rounded-lg bg-[#F7F6F3] border border-slate-200 flex items-center justify-center">
                        <GoogleCalendarIcon className="size-4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cara Kerja: Central Orbiting Workspace Showcase + 3 Langkah */}
      <section id="cara-kerja" className="py-16 sm:py-24 px-5 sm:px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="max-w-2xl mx-auto text-center space-y-2.5">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Dirancang supaya kamu tahu apa yang harus dikerjakan sekarang.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
              Semua prioritas, agenda meeting, pembagian uang, dan kebiasaan terhubung dalam satu
              ruang tenang yang rapi, tanpa membuatmu kewalahan.
            </p>
          </div>

          {/* Pandu Command Board Showcase (berbeda dari referensi, berpusat pada Rule-of-3 & Tab) */}
          <div className="relative max-w-4xl mx-auto py-4 sm:py-8">
            {/* Ikon Alur Kerja Mengorbit di Sisi Kiri */}
            <div className="hidden lg:flex flex-col justify-between absolute -left-5 top-8 bottom-10 z-10 pointer-events-none">
              <div className="size-11 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center animate-pandu-left">
                <Target className="size-5 text-emerald-600" />
              </div>
              <div className="-translate-x-3 size-11 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center animate-pandu-note">
                <GoogleMeetIcon className="size-5" />
              </div>
              <div className="size-11 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center animate-pandu-meet">
                <Wallet className="size-5 text-amber-600" />
              </div>
            </div>

            {/* Ikon Alur Kerja Mengorbit di Sisi Kanan */}
            <div className="hidden lg:flex flex-col justify-between absolute -right-5 top-8 bottom-10 z-10 pointer-events-none">
              <div className="size-11 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center animate-pandu-right">
                <GoogleCalendarIcon className="size-5" />
              </div>
              <div className="translate-x-3 size-11 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center animate-pandu-meet">
                <ZoomIcon className="size-5" />
              </div>
              <div className="size-11 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center animate-pandu-left">
                <Flame className="size-5 text-orange-500" />
              </div>
            </div>

            {/* Kartu Utama Horizontal Khas Pandu */}
            <div className="relative z-20 max-w-3xl mx-auto rounded-2xl bg-white border border-slate-200/90 shadow-lg overflow-hidden">
              <div className="relative">
                <PanduCoverArt className="w-full h-20 sm:h-24" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/25 to-transparent flex items-end px-5 sm:px-6 pb-3">
                  <div className="flex items-center gap-2.5 text-white">
                    <PanduLogo className="size-5 text-white shrink-0" />
                    <span className="text-sm sm:text-base font-extrabold tracking-tight">
                      Papan Fokus Hari Ini
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Kolom Kiri: 3 Slot Prioritas */}
                <div className="md:col-span-7 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>3 Prioritas Utama</span>
                    <span className="text-emerald-700">2 Selesai</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F6F3] border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="font-medium text-slate-400 line-through truncate">
                        Revisi desain halaman utama
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold shrink-0">
                      Pekerjaan
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F6F3] border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="font-medium text-slate-400 line-through truncate">
                        Bagi pos uang makan minggu ini
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold shrink-0">
                      Keuangan
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-5 rounded-md border border-slate-300 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">
                        Rangkum catatan kuliah bab 4
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-semibold shrink-0">
                      Belajar
                    </span>
                  </div>
                </div>

                {/* Kolom Kanan: Ringkasan Uang & Catatan Pengingat */}
                <div className="md:col-span-5 flex flex-col justify-between gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F7F6F3] border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet className="size-3.5 text-amber-600" /> Sisa Kuota
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">Rp 95.000</span>
                    </div>
                    <div className="w-full h-1.5 rounded-sm bg-slate-200 overflow-hidden">
                      <div className="h-full w-[38%] bg-emerald-600 rounded-sm" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <EditorialAvatarAsset className="size-7 shrink-0 mt-0.5" />
                    <span>
                      Tinggal 1 prioritas lagi hari ini, setelah beres baru naikkan tugas dari Kotak
                      Tunggu.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="p-6 rounded-2xl bg-[#F7F6F3] border border-slate-200/70 space-y-3.5">
              <StepFocusIllustration />
              <h3 className="text-base font-bold text-slate-900">Tulis 3 hal terpenting saja</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                Slot utama dibatasi 3 prioritas agar energimu fokus. Jika ada tugas baru yang muncul
                mendadak, langsung taruh di Kotak Tunggu.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F6F3] border border-slate-200/70 space-y-3.5">
              <StepTabsIllustration />
              <h3 className="text-base font-bold text-slate-900">Pisahkan pakai Tab sendiri</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                Seperti membuka tab di browser, kamu bisa tambah tab khusus untuk kerjaan, kuliah,
                atau pembagian uang bulanan lengkap dengan ikon pilihanmu.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F6F3] border border-slate-200/70 space-y-3.5">
              <StepSaveIllustration />
              <h3 className="text-base font-bold text-slate-900">
                Masuk sekali, tersimpan otomatis
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                Tidak perlu password. Akun tamu yang kamu buat akan otomatis tersimpan di perangkat
                ini, jadi kapan pun kamu keluar dan kembali, semua tab dan datamu masih ada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Fitur Utama dengan Mini Komponen Interaktif di Setiap Kartu */}
      <section
        id="fitur"
        className="py-16 sm:py-20 px-5 sm:px-6 bg-[#F7F6F3] border-y border-slate-200/70"
      >
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Semua kebutuhan harianmu, terpisah rapi di tiap tab.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Kartu 1: Tab Kustom + Mini Browser Tab Bar */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-5">
              <div className="space-y-2.5">
                <FeatureTabsIcon />
                <h3 className="text-base font-bold text-slate-900">
                  Tab Kustom dan Ikon Pilihan Sendiri
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  Buat tab baru sesuai kebutuhanmu, pilih ikon yang mudah dikenali, lalu kelompokkan
                  tugas berdasarkan kategori seperti Pekerjaan, Belajar, Keuangan, atau Pribadi.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F6F3] border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-900 shadow-2xs shrink-0">
                    <Target className="size-3 text-emerald-600" /> Skripsi
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-500 shrink-0">
                    <Wallet className="size-3" /> Uang Kos
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-slate-300 text-slate-500 shrink-0">
                    <Plus className="size-3" /> Tab Baru
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] bg-white px-2.5 py-2 rounded-lg border border-slate-200/80">
                  <span className="font-semibold text-slate-800 truncate">
                    Finalisasi daftar pustaka
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold shrink-0 ml-2">
                    Belajar
                  </span>
                </div>
              </div>
            </div>

            {/* Kartu 2: Anggaran + Mini Pos Pembagian Uang */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-5">
              <div className="space-y-2.5">
                <FeatureFinanceIcon />
                <h3 className="text-base font-bold text-slate-900">
                  Anggaran Harian dan Pos Pembagian Uang
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  Tentukan batas pengeluaran harian, pecah ke pos khusus seperti makan, transport,
                  atau tabungan, dan langsung dapatkan peringatan jika jatah harian mulai terlampaui.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F6F3] border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 tabular-nums">Sisa Rp 95.000</span>
                  <span className="text-[10px] font-semibold text-slate-500">37% terpakai</span>
                </div>
                <div className="w-full h-1.5 rounded-sm bg-slate-200 overflow-hidden">
                  <div className="h-full w-[37%] bg-slate-900 rounded-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Coffee className="size-3 text-amber-600" /> Makan
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 tabular-nums">25k</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <PiggyBank className="size-3 text-indigo-600" /> Tabungan
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 tabular-nums">40k</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kartu 3: Kebiasaan + Mini Toggle MIN/FULL */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-5">
              <div className="space-y-2.5">
                <FeatureHabitIcon />
                <h3 className="text-base font-bold text-slate-900">
                  Kebiasaan Harian yang Fleksibel
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  Setiap kebiasaan punya dua pilihan, yaitu target MIN saat kamu sedang lelah dan
                  target FULL saat energimu penuh, sehingga streak tetap terjaga tanpa rasa bersalah.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F6F3] border border-slate-200/80 space-y-2">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      Olahraga Pagi, 12 hari
                    </span>
                    <span className="text-[10px] text-slate-500">MIN: 10m, FULL: 30m</span>
                  </div>
                  <div className="flex bg-[#F7F6F3] p-0.5 rounded-md border border-slate-200 text-[10px] font-bold shrink-0">
                    <span className="px-2 py-0.5 text-slate-500">MIN</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">FULL</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      Baca Buku, 7 hari
                    </span>
                    <span className="text-[10px] text-slate-500">MIN: 5 hal, FULL: 20 hal</span>
                  </div>
                  <div className="flex bg-[#F7F6F3] p-0.5 rounded-md border border-slate-200 text-[10px] font-bold shrink-0">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white">MIN</span>
                    <span className="px-2 py-0.5 text-slate-500">FULL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kartu 4: Agenda + Mini Timeline Pertemuan */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <FeatureScheduleIcon />
                  <div className="flex items-center gap-1.5">
                    <GoogleMeetIcon className="size-4" />
                    <ZoomIcon className="size-4" />
                    <TeamsIcon className="size-4" />
                    <GoogleCalendarIcon className="size-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">Agenda Pertemuan Anti Bentrok</h3>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  Catat jadwal rapat atau sesi belajar lengkap dengan jam mulai, jam selesai, dan
                  platform pertemuannya agar harimu tersusun jelas.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F6F3] border border-slate-200/80 space-y-2">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      Sync Proyek Mingguan
                    </span>
                    <span className="text-[10px] text-sky-700 font-semibold inline-flex items-center gap-1 mt-0.5">
                      <Clock className="size-2.5" /> 13:00 sampai 13:45
                    </span>
                  </div>
                  <div className="size-7 rounded-md bg-[#F7F6F3] border border-slate-200 flex items-center justify-center shrink-0">
                    <GoogleMeetIcon className="size-3.5" />
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      Review Materi Presentasi
                    </span>
                    <span className="text-[10px] text-sky-700 font-semibold inline-flex items-center gap-1 mt-0.5">
                      <Clock className="size-2.5" /> 15:30 sampai 16:30
                    </span>
                  </div>
                  <div className="size-7 rounded-md bg-[#F7F6F3] border border-slate-200 flex items-center justify-center shrink-0">
                    <GoogleCalendarIcon className="size-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Cocok untuk Siapa (dengan Mini Komponen Tab di Tiap Persona) */}
      <section id="contoh-pakai" className="py-16 sm:py-20 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Sesuaikan tab dengan gaya aktivitasmu.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Persona 1: Mahasiswa */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <UseCaseStudentAsset />
                <h3 className="text-sm font-bold text-slate-900">Mahasiswa dan Skripsi</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka tab khusus Tugas Kuliah, tab Revisi Skripsi, dan tab Uang Kos supaya target
                  belajar dan pengeluaran bulanan tidak saling mengganggu.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F6F3] border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-1 text-[10px] font-semibold">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-900">
                    Skripsi
                  </span>
                  <span className="px-2 py-0.5 rounded text-slate-500">Kuliah</span>
                  <span className="px-2 py-0.5 rounded text-slate-500">Uang Kos</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center gap-2 text-[11px]">
                  <span className="size-4 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  <span className="font-medium text-slate-700 truncate">Revisi Bab 3 selesai</span>
                </div>
              </div>
            </div>

            {/* Persona 2: Pekerja & Freelancer */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <UseCaseWorkerAsset />
                <h3 className="text-sm font-bold text-slate-900">Pekerja dan Freelancer</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pisahkan prioritas proyek klien di tab kerjaan, jadwal meeting di tab Agenda, dan
                  catat pengeluaran operasional harian di tab Pembagian Uang.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F6F3] border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-1 text-[10px] font-semibold">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-900">
                    Klien
                  </span>
                  <span className="px-2 py-0.5 rounded text-slate-500">Agenda</span>
                  <span className="px-2 py-0.5 rounded text-slate-500">Keuangan</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-medium text-slate-700 truncate">Call review desain</span>
                  <GoogleMeetIcon className="size-3.5 shrink-0" />
                </div>
              </div>
            </div>

            {/* Persona 3: Rutinitas Harian */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <UseCaseRoutineAsset />
                <h3 className="text-sm font-bold text-slate-900">Pengatur Rutinitas Harian</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jaga kebiasaan olahraga, membaca, dan jatah jajan harian tetap seimbang lewat satu
                  tampilan yang ringan dibuka tiap pagi.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F6F3] border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-1 text-[10px] font-semibold">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-900">
                    Habit
                  </span>
                  <span className="px-2 py-0.5 rounded text-slate-500">Jajan</span>
                  <span className="px-2 py-0.5 rounded text-slate-500">Fokus</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-medium text-slate-700 truncate">Jalan pagi, 12 hari</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold shrink-0">
                    FULL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer CTA Bersih */}
      <footer className="border-t border-slate-200 bg-[#F7F6F3] py-14 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <PanduLogo className="size-5 text-slate-900" />
              <span className="text-sm font-extrabold tracking-tight text-slate-900">Pandu</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Siap bikin harimu lebih terarah?
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mulai langsung tanpa daftar email, akun tamumu tersimpan otomatis di browser ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenDownload}
              className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-semibold px-4 py-3 rounded-xl transition cursor-pointer"
            >
              Download Aplikasi
            </button>
            <button
              type="button"
              onClick={handleOpenDashboardClick}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-xs transition inline-flex items-center gap-2 w-fit cursor-pointer"
            >
              <span>
                {activeGuest ? `Buka Dashboard (${activeGuest.name})` : 'Buka Pandu Sekarang'}
              </span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Modal: Guest Login */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <UserCheck size={16} />
                <span>Masuk ke Pandu</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGuestNameError(null);
                  setShowGuestModal(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                aria-label="Tutup modal"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tanpa registrasi atau password. Akun tamu yang kamu buat akan tersimpan otomatis di
              perangkat ini meski kamu keluar dari dashboard.
            </p>

            {savedGuests.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Akun Tamu Tersimpan
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                  {savedGuests.map((acc) => {
                    const isCurrent = activeGuest?.id === acc.id;
                    return (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-200 bg-[#F7F6F3] hover:bg-slate-100 transition"
                      >
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleResumeSaved(acc)}
                          className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <span className="size-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 uppercase">
                            {acc.name.slice(0, 1)}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {acc.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {isCurrent
                                ? 'Sedang aktif, klik untuk lanjut'
                                : 'Klik untuk masuk kembali'}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveSavedGuest(acc.id)}
                          title={`Hapus akun tersimpan ${acc.name}`}
                          aria-label={`Hapus akun tersimpan ${acc.name}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="relative py-1">
                  <div className="border-t border-slate-200" />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 bg-white px-2 text-[10px] font-semibold text-slate-400">
                    atau buat akun baru
                  </span>
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                void handleStartGuest(e);
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Nama Panggilan</label>
                <input
                  type="text"
                  placeholder="Misal: Alex (opsional)"
                  value={guestInputName}
                  onChange={(e) => {
                    setGuestInputName(e.target.value);
                    if (guestNameError) setGuestNameError(null);
                  }}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
                {guestNameError && (
                  <p className="text-[11px] font-medium text-rose-600">{guestNameError}</p>
                )}
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGuestNameError(null);
                    setShowGuestModal(false);
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-75 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Memuat...</span>
                    </>
                  ) : (
                    <>
                      <span>Mulai Sekarang</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
