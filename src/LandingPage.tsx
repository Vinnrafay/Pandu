import { useState, type FormEvent } from 'react';
import { 
  Compass, 
  Zap, 
  Wallet, 
  Flame, 
  ArrowRight, 
  Check, 
  Clock, 
  Timer, 
  Calendar, 
  Inbox, 
  AlertCircle,
  X,
  UserCheck,
  Loader2
} from 'lucide-react';

/* ==========================================
   BRAND ICONS
   ========================================== */

function GoogleMeetIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M15 12.5L19.5 9V15L15 11.5V12.5Z" fill="#00AC47" />
      <path d="M4.5 7H12.5C13.6 7 14.5 7.9 14.5 9V15C14.5 16.1 13.6 17 12.5 17H4.5C3.4 17 2.5 16.1 2.5 15V9C2.5 7.9 3.4 7 4.5 7Z" fill="#00832D" />
      <path d="M2.5 9C2.5 7.9 3.4 7 4.5 7H12.5V10.5H2.5V9Z" fill="#EA4335" />
      <path d="M2.5 10.5H14.5V13.5H2.5V10.5Z" fill="#FFBA00" />
      <path d="M2.5 13.5H14.5V15C14.5 16.1 13.6 17 12.5 17H4.5C3.4 17 2.5 16.1 2.5 15V13.5Z" fill="#2684FC" />
      <path d="M14.5 9L19.5 7V10L14.5 11.5V9Z" fill="#0066DA" />
      <path d="M14.5 12.5L19.5 14V17L14.5 15V12.5Z" fill="#00832D" />
    </svg>
  );
}

function ZoomIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#2D8CFF" />
      <rect x="5" y="7.5" width="8.5" height="9" rx="1.5" fill="white" />
      <path d="M14 10.2L18.5 7.8V16.2L14 13.8V10.2Z" fill="white" />
    </svg>
  );
}

function TeamsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#505AC9" />
      <circle cx="15.5" cy="7" r="1.5" fill="#7B83EB" />
      <path d="M13.5 9.5H17.5C18.3 9.5 19 10.2 19 11V12.5C19 13.3 18.3 14 17.5 14H13.5V9.5Z" fill="#7B83EB" />
      <rect x="4.5" y="7" width="9.5" height="10" rx="1.5" fill="#3940AB" />
      <path d="M6.5 9.5H12V11H10V15H8.5V11H6.5V9.5Z" fill="white" />
    </svg>
  );
}

function GoogleCalendarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="3" y="3" width="18" height="6" rx="1" fill="#4285F4" />
      <text x="12" y="18" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#3C4043">31</text>
    </svg>
  );
}

function SlackIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M6 14.5a2.5 2.5 0 1 0-2.5-2.5V14.5H6zm1.25 0a2.5 2.5 0 1 0 2.5-2.5H7.25v2.5z" fill="#E01E5A"/>
      <path d="M9.5 6a2.5 2.5 0 1 0-2.5-2.5H9.5V6zm0 1.25a2.5 2.5 0 1 0-2.5 2.5V7.25h2.5z" fill="#36C5F0"/>
      <path d="M18 9.5a2.5 2.5 0 1 0 2.5 2.5V9.5H18zm-1.25 0a2.5 2.5 0 1 0-2.5 2.5h2.5V9.5z" fill="#2EB67D"/>
      <path d="M14.5 18a2.5 2.5 0 1 0 2.5 2.5H14.5V18zm0-1.25a2.5 2.5 0 1 0 2.5-2.5v2.5h-2.5z" fill="#ECB22E"/>
    </svg>
  );
}

interface LandingPageProps {
  onEnterApp: (guestName: string) => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [showGuestModal, setShowGuestModal] = useState<boolean>(false);
  const [guestInputName, setGuestInputName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>('');

  /* ============================================================
     CUSTOM EASED SMOOTH SCROLL (650ms Glide Curve)
     Menjamin pergerakan terlihat jelas & halus di semua browser
     ============================================================ */
  const customSmoothScroll = (targetY: number, duration = 650) => {
    const startY = window.pageYOffset || document.documentElement.scrollTop;
    const difference = targetY - startY;
    const startTime = performance.now();

    // Kurva cubic bezier halus: percepat di awal, perlambat di akhir
    const easeInOutCubic = (t: number) => 
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      window.scrollTo(0, startY + difference * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setActiveNav(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 68;
      const targetY = element.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
      customSmoothScroll(targetY, 650);
    }
  };

  const handleScrollToTop = () => {
    setActiveNav('');
    customSmoothScroll(0, 600);
  };

  const handleStartGuest = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    const finalName = guestInputName.trim() || 'Tamu';
    
    setTimeout(() => {
      onEnterApp(finalName);
      setIsSubmitting(false);
      setShowGuestModal(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-slate-900 selection:text-white antialiased overflow-x-hidden">
      
      {/* Floating Card Animations */}
      <style>{`
        @keyframes float-note {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(-3deg); }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0px) rotate(5deg) scale(1); }
          50% { transform: translateY(-7px) rotate(7deg) scale(1.03); }
        }
        @keyframes float-meeting {
          0%, 100% { transform: translateY(0px) rotate(2.5deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes float-timer {
          0%, 100% { transform: translateY(0px) rotate(-10deg) scale(1); }
          50% { transform: translateY(-6px) rotate(-7deg) scale(1.04); }
        }
        @keyframes float-bottom-left {
          0%, 100% { transform: translateY(0px) rotate(-2.5deg); }
          50% { transform: translateY(-9px) rotate(-1deg); }
        }
        @keyframes float-bottom-right {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes float-dice {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .animate-float-note { animation: float-note 6s ease-in-out infinite; will-change: transform; }
        .animate-float-badge { animation: float-badge 4.5s ease-in-out infinite 0.4s; will-change: transform; }
        .animate-float-meeting { animation: float-meeting 6.5s ease-in-out infinite 0.7s; will-change: transform; }
        .animate-float-timer { animation: float-timer 4s ease-in-out infinite 1.1s; will-change: transform; }
        .animate-float-bottom-left { animation: float-bottom-left 5.8s ease-in-out infinite 1.4s; will-change: transform; }
        .animate-float-bottom-right { animation: float-bottom-right 6.2s ease-in-out infinite 0.9s; will-change: transform; }
        .animate-float-dice { animation: float-dice 4.5s ease-in-out infinite; will-change: transform; }
      `}</style>

      {/* 1. Header Navbar dengan Smooth Transition Clicks */}
      <nav className="border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-md z-50 transition-all duration-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              type="button"
              onClick={handleScrollToTop}
              className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform" 
              title="Kembali ke atas"
            >
              <span className="text-base font-bold tracking-tight text-slate-900">Pandu</span>
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600">
              <a 
                href="#solutions" 
                onClick={(e) => handleNavClick(e, 'solutions')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeNav === 'solutions' 
                    ? 'bg-slate-100 text-slate-900 font-bold' 
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Fitur Utama
              </a>
              <a 
                href="#features" 
                onClick={(e) => handleNavClick(e, 'features')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeNav === 'features' 
                    ? 'bg-slate-100 text-slate-900 font-bold' 
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Ekosistem
              </a>
              <a 
                href="#philosophy" 
                onClick={(e) => handleNavClick(e, 'philosophy')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeNav === 'philosophy' 
                    ? 'bg-slate-100 text-slate-900 font-bold' 
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Filosofi
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setShowGuestModal(true)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-xs hover:bg-slate-50 active:scale-95 transition-all"
            >
              Sign In (Guest)
            </button>
            <button 
              onClick={() => setShowGuestModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs active:scale-95 transition-all"
            >
              Buka Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-70" />

        <div className="max-w-6xl mx-auto relative">
          
          {/* Top Left: Floating Sticky Note */}
          <div className="hidden lg:block absolute -top-4 left-2 z-20">
            <div className="relative animate-float-note transition duration-300 hover:[animation-play-state:paused]">
              <div className="w-56 p-4 rounded-xl bg-[#FEF08A] text-amber-950 shadow-md border border-amber-300/80 cursor-pointer transform hover:scale-105 transition duration-300">
                <div className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 shadow-2xs mx-auto -mt-2 mb-2" />
                <p className="text-xs font-semibold leading-relaxed font-sans">
                  "Catat 3 fokus utama pagi ini, selesaikan tepat waktu, dan tinggalkan distraksi."
                </p>
              </div>

              <div className="absolute -bottom-5 -right-3 bg-white p-2.5 rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-emerald-600 animate-float-badge cursor-pointer hover:scale-110 transition duration-300">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Check size={16} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>

          {/* Top Right: Meeting Reminders Card */}
          <div className="hidden lg:block absolute -top-6 right-2 z-20">
            <div className="relative animate-float-meeting transition duration-300 hover:[animation-play-state:paused]">
              <div className="w-64 p-4 rounded-xl bg-white border border-slate-200 shadow-md space-y-3 cursor-pointer hover:scale-105 transition duration-300">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-bold text-slate-400">
                  <span>AGENDA HARI INI</span>
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">Meeting</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">Standup Tim Backend</span>
                    <div className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md text-[10px] font-semibold mt-1">
                      <Clock size={10} /> 13:00 - 13:45
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs">
                    <GoogleMeetIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="absolute -top-3.5 -left-4 bg-white px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200 flex items-center gap-1.5 animate-float-timer cursor-pointer hover:scale-110 transition duration-300">
                <Timer size={14} className="text-slate-700" />
                <span className="text-[11px] font-bold text-slate-800">45:00</span>
              </div>
            </div>
          </div>

          {/* Bottom Left: Progress Fokus Card */}
          <div className="hidden lg:block absolute bottom-2 left-4 z-20">
            <div className="w-60 p-4 rounded-xl bg-white border border-slate-200 shadow-md space-y-2.5 animate-float-bottom-left cursor-pointer hover:scale-105 transition duration-300 hover:[animation-play-state:paused]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fokus Hari Ini</span>
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">API Endpoint Deploy</span>
                    <span className="font-bold text-indigo-600 text-[10px]">60%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full w-[60%] rounded-full transition-all duration-1000" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right: Platform Integration Card */}
          <div className="hidden lg:block absolute bottom-2 right-4 z-20">
            <div className="w-64 p-4 rounded-xl bg-white border border-slate-200 shadow-md space-y-2.5 animate-float-bottom-right cursor-pointer hover:scale-105 transition duration-300 hover:[animation-play-state:paused]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Integrasi Platform</span>
              <div className="flex items-center gap-2 pt-0.5">
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs hover:bg-white transition duration-200">
                  <GoogleMeetIcon className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs hover:bg-white transition duration-200">
                  <ZoomIcon className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs hover:bg-white transition duration-200">
                  <TeamsIcon className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs hover:bg-white transition duration-200">
                  <GoogleCalendarIcon className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs hover:bg-white transition duration-200">
                  <SlackIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Center Hero Content */}
          <div className="relative text-center max-w-3xl mx-auto space-y-6 z-10">
            <div className="inline-flex items-center justify-center animate-float-dice cursor-pointer" onClick={() => setShowGuestModal(true)}>
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center group hover:scale-105 transition duration-300">
                <div className="grid grid-cols-2 gap-1.5 p-3">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-900" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-900" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
              Fokus, eksekusi, dan kendalikan <br />
              <span className="text-slate-400 font-semibold tracking-tight">semua dalam satu layar</span>
            </h1>

            <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Sistem operasi harian yang memangkas distraksi to-do list tak berujung. Gabungan Rule-of-3 prioritas, jatah belanja dinamis, dan daily habits anti-nol.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowGuestModal(true)}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-6 py-3 rounded-lg shadow-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Buka Dashboard Sekarang</span> 
                <ArrowRight size={14} className="group-hover:translate-x-1 transition duration-200" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Section 3 Kartu Pilar */}
      <section id="solutions" className="max-w-6xl mx-auto px-6 py-20 space-y-10 scroll-mt-20">
        <div className="text-center max-w-xl mx-auto space-y-2">

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Dirancang untuk fokus yang tak tergoyahkan
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tiga instrumen harian esensial untuk menjaga kejernihan pikiran dan energi mental.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Kartu 1: Prioritas */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition duration-200">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                <Zap size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rule-of-3 Prioritas</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hanya 3 tugas penting yang diizinkan aktif di layar utama. Tugas tambahan otomatis masuk ke Kotak Tunggu.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-700">Target Hari Ini</span>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-full">Slot 01 - 03</span>
              </div>

              <div className="p-2 bg-white rounded-md border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">01</span>
                  <span className="text-xs text-slate-400 line-through">Deploy Backend API</span>
                </div>
                <Check size={14} className="text-emerald-600" />
              </div>

              <div className="p-2 bg-white rounded-md border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">02</span>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block leading-tight">Review UI & Feedback</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> 15:00 • 45m
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px] font-medium text-slate-500">
                <span className="flex items-center gap-1"><Inbox size={11} /> Kotak Tunggu</span>
                <span className="text-slate-700 font-semibold">2 Antrean</span>
              </div>
            </div>
          </div>

          {/* Kartu 2: Anggaran */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition duration-200">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                <Wallet size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Batas Jajan Dinamis</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ketahui kapan harus berhenti belanja dengan visualisasi kuota real-time dan deteksi instan saat defisit.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sisa Kuota</span>
                <span className="text-[10px] font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">30% Terpakai</span>
              </div>

              <div>
                <span className="text-xl font-bold text-slate-900 tabular-nums block">Rp 105.000</span>
                <span className="text-[10px] text-slate-400">Dari batas harian Rp 150.000</span>
              </div>

              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-900 h-full w-[30%] rounded-full" />
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">+10k</span>
                <span className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">+25k</span>
                <span className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">+50k</span>
                <span className="text-[10px] text-slate-400 ml-auto">Catat cepat</span>
              </div>
            </div>
          </div>

          {/* Kartu 3: Habits */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition duration-200">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                <Flame size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Kebiasaan Anti-Nol</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Jaga streak kebiasaan tanpa putus. Pilih target MIN saat lelah, atau FULL saat kondisi sedang prima.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-900 truncate">Push-up Rutin</span>
                <span className="text-[10px] text-slate-600 bg-slate-200/80 px-1.5 py-0.2 rounded-full font-medium">12d</span>
              </div>

              <p className="text-[11px] text-slate-500">
                5x rep / 30x rep
              </p>

              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
                <div className="flex-1 py-1 bg-slate-900 text-white rounded-md text-center text-[10px] font-semibold shadow-xs">
                  MIN
                </div>
                <div className="flex-1 py-1 text-slate-600 rounded-md text-center text-[10px] font-semibold hover:text-slate-900">
                  FULL
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center">
                Konsistensi momentum terjaga hari ini
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Bento Grid Fitur Ekosistem */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 space-y-8 border-t border-slate-200 scroll-mt-20">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Semua kendali dalam satu tempat
          </h2>
          <p className="text-xs text-slate-500">
            Seluruh instrumen produktivitasmu langsung tertata rapi di satu dasbor tunggal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition duration-200">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Target Waktu & Estimasi Durasi</h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Tiap prioritas dilengkapi target jam selesai dan estimasi durasi sehingga kamu tahu kapan harus menyelesaikannya.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-800 shadow-2xs">
                <Clock size={11} className="text-slate-600" /> Target: 14:00
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-800 shadow-2xs">
                <Timer size={11} className="text-slate-600" /> Estimasi: 45m
              </div>
              <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                <Check size={11} strokeWidth={3} /> Sesuai Jadwal
              </div>
            </div>
          </div>

          <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition duration-200">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                <Inbox size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Kotak Tunggu (Buffer)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ide atau tugas tambahan diisolasi di sini agar tidak memecah 3 fokus utama.
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="truncate">Beli Kopi & Camilan</span>
              <span className="text-[10px] text-slate-900 font-bold hover:underline shrink-0 ml-2">Tukar Slot</span>
            </div>
          </div>

          <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition duration-200">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Agenda Mingguan Dinamis</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sinkronkan jadwal meeting dengan ikon platform resmi (Meet, Zoom, Teams, Calendar).
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs">
                <GoogleMeetIcon className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs">
                <ZoomIcon className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs">
                <TeamsIcon className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs">
                <GoogleCalendarIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition duration-200">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                <Wallet size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Deteksi Defisit Anggaran</h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Indikator otomatis saat pengeluaran melampaui limit, dengan opsi hapus transaksi untuk memulihkan saldo.
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600" />
                <span className="font-bold text-rose-900">Overbudget: -Rp 23.231</span>
              </div>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-200/70 px-2 py-0.5 rounded-full">Defisit Terdeteksi</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Complete Footer */}
      <footer id="philosophy" className="bg-[#090D16] text-white pt-16 pb-10 border-t border-slate-800 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-12 border-b border-white/10">
            <div className="space-y-1.5 max-w-xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Mulai harimu dengan pikiran yang jernih.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fokus pada 3 prioritas, pantau anggaran dengan santai, dan jaga streak kebiasaanmu dalam satu dasbor minimalis.
              </p>
            </div>

            <button
              onClick={() => setShowGuestModal(true)}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold px-5 py-2.5 rounded-lg shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5 w-fit"
            >
              <span>Buka Pandu Dashboard</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            <div className="space-y-3 col-span-2 md:col-span-1">
              <button 
                type="button"
                className="flex items-center gap-2.5 cursor-pointer group active:scale-95 transition text-left"
                onClick={handleScrollToTop}
                title="Scroll ke paling atas"
              >
                <div className="w-8 h-8 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold">
                  <Compass size={16} />
                </div>
                <span className="text-sm font-bold tracking-tight">Pandu</span>
              </button>
              <p className="text-slate-400 text-xs leading-relaxed">
                Sistem operasi harian minimalis untuk menjaga fokus dan energi mental.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">Fitur Utama</span>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <a 
                    href="#solutions" 
                    onClick={(e) => handleNavClick(e, 'solutions')} 
                    className="hover:text-white transition cursor-pointer"
                  >
                    Rule-of-3 Prioritas
                  </a>
                </li>
                <li>
                  <a 
                    href="#solutions" 
                    onClick={(e) => handleNavClick(e, 'solutions')} 
                    className="hover:text-white transition cursor-pointer"
                  >
                    Batas Jajan Dinamis
                  </a>
                </li>
                <li>
                  <a 
                    href="#solutions" 
                    onClick={(e) => handleNavClick(e, 'solutions')} 
                    className="hover:text-white transition cursor-pointer"
                  >
                    Daily Habits Anti-Nol
                  </a>
                </li>
                <li>
                  <a 
                    href="#features" 
                    onClick={(e) => handleNavClick(e, 'features')} 
                    className="hover:text-white transition cursor-pointer"
                  >
                    Agenda Mingguan
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">Filosofi</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><span>Fokus Satu Layar</span></li>
                <li><span>Buffer Task Isolation</span></li>
                <li><span>Deficit Awareness</span></li>
                <li><span>Zero Administrative Fatigue</span></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">Tech Stack</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><span>React & TypeScript</span></li>
                <li><span>Tailwind CSS</span></li>
                <li><span>Laravel REST API</span></li>
                <li><span>PostgreSQL</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Pandu Operations. Dibuat oleh Rafay Arvino Setiawan. Hak Cipta Dilindungi.</p>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Sistem Operasi Aktif</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Modal: Guest Login */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <UserCheck size={16} />
                <span>Masuk Mode Tamu</span>
              </div>
              <button 
                onClick={() => setShowGuestModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tidak perlu registrasi atau password. Semua perubahan tersimpan otomatis di perangkatmu.
            </p>

            <form onSubmit={handleStartGuest} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Nama Panggilan</label>
                <input
                  type="text"
                  placeholder="Misal: Alex (opsional)"
                  value={guestInputName}
                  onChange={(e) => setGuestInputName(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-75"
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