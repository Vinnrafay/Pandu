import type { ReactElement } from 'react';

interface AssetProps {
  className?: string;
}

/** Panah melengkung tipis yang menunjuk tegas ke bawah menuju tab pratinjau. */
export function CurvedArrowAsset({ className = 'w-6 h-8' }: AssetProps): ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 36 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 4C20.5 12 21.5 24 18 37.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12.5 31.5L18 38.5L24 32.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ikon clean duotone: 3 slot prioritas fokus. */
export function StepFocusIllustration({ className = 'size-11' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="36"
        height="36"
        rx="10"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      <rect x="11" y="13" width="6" height="6" rx="2" fill="#10B981" />
      <path
        d="M12.6 16L13.7 17.1L15.7 14.9"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21 16H33" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
      <rect
        x="11"
        y="23"
        width="6"
        height="6"
        rx="2"
        fill="#F1F5F9"
        stroke="#CBD5E1"
        strokeWidth="1.3"
      />
      <path d="M21 26H30" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 33H24" stroke="#CBD5E1" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Ikon clean duotone: tab ruang kerja terpisah. */
export function StepTabsIllustration({ className = 'size-11' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="36"
        height="36"
        rx="10"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      <path
        d="M10 15.5C10 14.1193 11.1193 13 12.5 13H20.5L22.5 16H31.5C32.8807 16 34 17.1193 34 18.5V29.5C34 30.8807 32.8807 32 31.5 32H12.5C11.1193 32 10 30.8807 10 29.5V15.5Z"
        fill="#F8FAFC"
        stroke="#0F172A"
        strokeWidth="1.6"
      />
      <rect x="24" y="11" width="9" height="3.5" rx="1.5" fill="#10B981" fillOpacity="0.25" />
      <path d="M15 22H29" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 26.5H23.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Ikon clean duotone: akun tamu tersimpan otomatis. */
export function StepSaveIllustration({ className = 'size-11' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="36"
        height="36"
        rx="10"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      <circle cx="20" cy="17.5" r="4.5" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.6" />
      <path
        d="M12.5 31C13.2 26.8 16.2 24.5 20 24.5C22.2 24.5 24.1 25.3 25.4 26.7"
        stroke="#0F172A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="30" cy="29.5" r="6" fill="#10B981" />
      <path
        d="M27.6 29.5L29.3 31.2L32.6 27.8"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ikon fitur clean duotone: Tab Kustom & Ikon. */
export function FeatureTabsIcon({ className = 'size-10' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#ECFDF5" />
      <rect
        x="9"
        y="13"
        width="22"
        height="17"
        rx="3.5"
        fill="#FFFFFF"
        stroke="#059669"
        strokeWidth="1.6"
      />
      <path d="M9 17.5H31" stroke="#059669" strokeWidth="1.4" />
      <rect x="12" y="10" width="8" height="3" rx="1.2" fill="#10B981" />
      <path d="M14 22.5H26M14 26H21" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Ikon fitur clean duotone: Anggaran & Pos Uang. */
export function FeatureFinanceIcon({ className = 'size-10' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#FFFBEB" />
      <rect
        x="9"
        y="12"
        width="22"
        height="16"
        rx="3.5"
        fill="#FFFFFF"
        stroke="#D97706"
        strokeWidth="1.6"
      />
      <path
        d="M24 18.5H31V22.5H24C22.8954 22.5 22 21.6046 22 20.5C22 19.3954 22.8954 18.5 24 18.5Z"
        fill="#FEF3C7"
        stroke="#D97706"
        strokeWidth="1.4"
      />
      <circle cx="24.5" cy="20.5" r="1" fill="#D97706" />
      <path d="M13 17H19" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Ikon fitur clean duotone: Kebiasaan Harian. */
export function FeatureHabitIcon({ className = 'size-10' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#FFF7ED" />
      <path
        d="M20.6 10.5C20.6 10.5 26.5 14.5 26.5 21C26.5 25.1 23.6 28.5 20 28.5C16.4 28.5 13.5 25.1 13.5 21C13.5 18.3 15.1 15.8 16.5 14.4C16.5 16.1 17.5 17 18.3 17C18.3 14.3 20.6 10.5 20.6 10.5Z"
        fill="#FFFFFF"
        stroke="#EA580C"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M20 28.5C21.8 28.5 23 27.1 23 25.3C23 23.8 21.8 22.2 20.2 21C19.6 22.3 18.6 23.2 18 24.4C17.4 25.6 18.1 28.5 20 28.5Z"
        fill="#FDBA74"
      />
    </svg>
  );
}

/** Ikon fitur clean duotone: Agenda Pertemuan. */
export function FeatureScheduleIcon({ className = 'size-10' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#F0F9FF" />
      <rect
        x="10"
        y="12"
        width="20"
        height="18"
        rx="3.5"
        fill="#FFFFFF"
        stroke="#0284C7"
        strokeWidth="1.6"
      />
      <path d="M10 17.5H30" stroke="#0284C7" strokeWidth="1.4" />
      <path d="M15 9.5V13.5M25 9.5V13.5" stroke="#0284C7" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="14" y="21" width="5" height="4.5" rx="1.2" fill="#38BDF8" fillOpacity="0.35" />
      <path d="M22 22.2H26.5M22 25.2H25" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Ikon clean duotone: Mahasiswa dan Skripsi. */
export function UseCaseStudentAsset({ className = 'size-10' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#F5F3FF" />
      <rect
        x="11"
        y="10"
        width="18"
        height="20"
        rx="3"
        fill="#FFFFFF"
        stroke="#6D28D9"
        strokeWidth="1.6"
      />
      <path d="M15.5 10V30" stroke="#6D28D9" strokeWidth="1.4" />
      <path d="M19 16.5H25M19 21H23.5" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22.5 10V14.5L24.5 13.2L26.5 14.5V10" fill="#8B5CF6" />
    </svg>
  );
}

/** Ikon clean duotone: Pekerja dan Freelancer. */
export function UseCaseWorkerAsset({ className = 'size-10' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#EFF6FF" />
      <rect
        x="9.5"
        y="12"
        width="21"
        height="14"
        rx="2.5"
        fill="#FFFFFF"
        stroke="#2563EB"
        strokeWidth="1.6"
      />
      <path d="M7.5 29H32.5" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 17.5H22M14 21H19" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="25.5" cy="19.5" r="2.2" fill="#10B981" />
    </svg>
  );
}

/** Ikon clean duotone: Pengatur Rutinitas Harian. */
export function UseCaseRoutineAsset({ className = 'size-10' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#ECFDF5" />
      <circle cx="20" cy="21" r="9" fill="#FFFFFF" stroke="#059669" strokeWidth="1.6" />
      <path
        d="M20 16V21L23.5 23"
        stroke="#0F172A"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 9.5H23" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Cover abstrak organik khas Pandu (hijau zamrud, aksen hangat, dan horizon tenang). */
export function PanduCoverArt({ className = 'w-full h-24' }: AssetProps): ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 480 128"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="pandu-cover-bg"
          x1="0"
          y1="0"
          x2="480"
          y2="128"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0F2922" />
          <stop offset="55%" stopColor="#134E4A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
        <radialGradient
          id="pandu-glow-mint"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(120 96) rotate(-20) scale(180 90)"
        >
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0F2922" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="pandu-glow-warm"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(390 28) rotate(140) scale(130 80)"
        >
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#134E4A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="480" height="128" fill="url(#pandu-cover-bg)" />
      <rect width="480" height="128" fill="url(#pandu-glow-mint)" />
      <rect width="480" height="128" fill="url(#pandu-glow-warm)" />
      <path
        d="M-20 98C60 66 155 114 250 78C340 44 410 86 500 58V140H-20V98Z"
        fill="#0F172A"
        fillOpacity="0.2"
      />
    </svg>
  );
}

/** Avatar minimalis clean untuk catatan pengingat. */
export function EditorialAvatarAsset({ className = 'size-7' }: AssetProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.4" />
      <circle cx="18" cy="14" r="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
      <path
        d="M11 28C12 23.5 14.8 21.5 18 21.5C21.2 21.5 24 23.5 25 28"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
