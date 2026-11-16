interface KitArenaLogoProps {
  inverted?: boolean;
}

export function KitArenaLogo({ inverted = false }: KitArenaLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        width="30"
        height="30"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M18 2.5L31 7.2V17.6C31 25.4 25.4 31.1 18 33.5C10.6 31.1 5 25.4 5 17.6V7.2L18 2.5Z"
          fill="#064E3B"
          stroke={inverted ? '#C59B27' : '#D4AF37'}
          strokeWidth="1.75"
        />
        <path
          d="M18 6.5V29.5M10.5 14.5H25.5M18 11.5C16.34 11.5 15 12.84 15 14.5C15 16.16 16.34 17.5 18 17.5C19.66 17.5 21 16.16 21 14.5C21 12.84 19.66 11.5 18 11.5Z"
          stroke="#FFFFFF"
          strokeOpacity="0.9"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M13 21.5L18 24.5L23 21.5"
          stroke="#D4AF37"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-display text-2xl font-bold tracking-tight uppercase leading-none ${
          inverted ? 'text-white' : 'text-[#09090B]'
        }`}
      >
        KIT ARENA
      </span>
    </span>
  );
}
