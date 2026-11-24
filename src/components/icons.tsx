import type { ReactElement } from 'react';

export interface BrandIconProps {
  className?: string;
}

/**
 * Logo resmi Pandu (clean, tanpa background): monogram P geometris
 * berpadu dengan penunjuk arah kompas emerald.
 */
export function PanduLogo({ className = 'size-7' }: BrandIconProps): ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.5 5.5C7.5 4.67157 8.17157 4 9 4H17C22.2 4 25.5 7.2 25.5 11.8C25.5 16.4 22.2 19.6 17 19.6H12.5V26.5C12.5 27.3284 11.8284 28 11 28H9C8.17157 28 7.5 27.3284 7.5 26.5V5.5ZM12.5 8.6V15H16.8C19.2 15 20.6 13.7 20.6 11.8C20.6 9.9 19.2 8.6 16.8 8.6H12.5Z"
        fill="currentColor"
      />
      <path
        d="M25.4 19.6L22.5 27.5C22.2 28.2 21.2 28.2 20.9 27.5L19.7 24.3L16.5 23.1C15.8 22.8 15.8 21.8 16.5 21.5L24.4 18.6C25.1 18.3 25.7 18.9 25.4 19.6Z"
        fill="#10B981"
      />
    </svg>
  );
}

export function GoogleMeetIcon({ className = 'w-4 h-4' }: BrandIconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M15 12.5L19.5 9V15L15 11.5V12.5Z" fill="#00AC47" />
      <path
        d="M4.5 7H12.5C13.6 7 14.5 7.9 14.5 9V15C14.5 16.1 13.6 17 12.5 17H4.5C3.4 17 2.5 16.1 2.5 15V9C2.5 7.9 3.4 7 4.5 7Z"
        fill="#00832D"
      />
      <path d="M2.5 9C2.5 7.9 3.4 7 4.5 7H12.5V10.5H2.5V9Z" fill="#EA4335" />
      <path d="M2.5 10.5H14.5V13.5H2.5V10.5Z" fill="#FFBA00" />
      <path
        d="M2.5 13.5H14.5V15C14.5 16.1 13.6 17 12.5 17H4.5C3.4 17 2.5 16.1 2.5 15V13.5Z"
        fill="#2684FC"
      />
      <path d="M14.5 9L19.5 7V10L14.5 11.5V9Z" fill="#0066DA" />
      <path d="M14.5 12.5L19.5 14V17L14.5 15V12.5Z" fill="#00832D" />
    </svg>
  );
}

export function ZoomIcon({ className = 'w-4 h-4' }: BrandIconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#2D8CFF" />
      <rect x="5" y="7.5" width="8.5" height="9" rx="1.5" fill="white" />
      <path d="M14 10.2L18.5 7.8V16.2L14 13.8V10.2Z" fill="white" />
    </svg>
  );
}

export function TeamsIcon({ className = 'w-4 h-4' }: BrandIconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#505AC9" />
      <circle cx="15.5" cy="7" r="1.5" fill="#7B83EB" />
      <path
        d="M13.5 9.5H17.5C18.3 9.5 19 10.2 19 11V12.5C19 13.3 18.3 14 17.5 14H13.5V9.5Z"
        fill="#7B83EB"
      />
      <rect x="4.5" y="7" width="9.5" height="10" rx="1.5" fill="#3940AB" />
      <path d="M6.5 9.5H12V11H10V15H8.5V11H6.5V9.5Z" fill="white" />
    </svg>
  );
}

export function GoogleCalendarIcon({ className = 'w-4 h-4' }: BrandIconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3.5" fill="#FFFFFF" stroke="#E2E8F0" />
      <path d="M3 6.5C3 4.567 4.567 3 6.5 3H17.5V7.5H3V6.5Z" fill="#4285F4" />
      <path d="M17.5 3H17.5C19.433 3 21 4.567 21 6.5V7.5H17.5V3Z" fill="#1967D2" />
      <path d="M21 7.5V16.5H17.5V7.5H21Z" fill="#FBBC04" />
      <path d="M3 16.5H17.5V21H6.5C4.567 21 3 19.433 3 17.5V16.5Z" fill="#34A853" />
      <path d="M17.5 16.5H21L17.5 21V16.5Z" fill="#EA4335" />
      <path
        d="M8.4 10.6H11.5L9.9 12.4C10.9 12.5 11.6 13.1 11.6 14C11.6 15 10.8 15.6 9.7 15.6C8.8 15.6 8.2 15.2 7.9 14.6L8.9 14.1C9.1 14.4 9.4 14.6 9.7 14.6C10.2 14.6 10.5 14.3 10.5 13.9C10.5 13.5 10.1 13.2 9.5 13.2H9.1V12.4L10.2 11.4H8.4V10.6ZM14.8 10.6V15.5H13.6V11.8L12.6 12.4V11.3L13.8 10.6H14.8Z"
        fill="#1E293B"
      />
    </svg>
  );
}

export function SlackIcon({ className = 'w-4 h-4' }: BrandIconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 14.5a2.5 2.5 0 1 0-2.5-2.5V14.5H6zm1.25 0a2.5 2.5 0 1 0 2.5-2.5H7.25v2.5z"
        fill="#E01E5A"
      />
      <path
        d="M9.5 6a2.5 2.5 0 1 0-2.5-2.5H9.5V6zm0 1.25a2.5 2.5 0 1 0-2.5 2.5V7.25h2.5z"
        fill="#36C5F0"
      />
      <path
        d="M18 9.5a2.5 2.5 0 1 0 2.5 2.5V9.5H18zm-1.25 0a2.5 2.5 0 1 0-2.5 2.5h2.5V9.5z"
        fill="#2EB67D"
      />
      <path
        d="M14.5 18a2.5 2.5 0 1 0 2.5 2.5H14.5V18zm0-1.25a2.5 2.5 0 1 0 2.5-2.5v2.5h-2.5z"
        fill="#ECB22E"
      />
    </svg>
  );
}
