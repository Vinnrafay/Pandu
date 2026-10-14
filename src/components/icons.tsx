import type { ReactElement } from 'react';

export interface BrandIconProps {
  className?: string;
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
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="3" y="3" width="18" height="6" rx="1" fill="#4285F4" />
      <text x="12" y="18" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#3C4043">
        31
      </text>
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
