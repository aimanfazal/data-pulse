export function DataPulseLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DataPulse logo"
    >
      <defs>
        <linearGradient id="dp-grad" x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.75 0.18 195)" />
          <stop offset="100%" stopColor="oklch(0.55 0.17 185)" />
        </linearGradient>
      </defs>
      {/* Outer circle */}
      <circle cx="18" cy="18" r="16" stroke="url(#dp-grad)" strokeWidth="1.75" />
      {/* Heartbeat / ECG waveform path */}
      <polyline
        points="4,18 9,18 11,12 14,24 17,15 19,21 21,18 32,18"
        stroke="url(#dp-grad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
