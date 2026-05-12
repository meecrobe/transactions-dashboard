interface IconProps {
  source: 'retry' | 'download' | 'spinner';
}

export function Icon({ source }: IconProps) {
  switch (source) {
    case 'retry': {
      return (
        <svg
          className="w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path
            fill="currentColor"
            d="M3.5 9.25a.75.75 0 0 0 1.5 0 3 3 0 0 1 3-3h6.566l-1.123 1.248a.75.75 0 1 0 1.114 1.004l2.25-2.5a.75.75 0 0 0-.027-1.032l-2.25-2.25a.75.75 0 1 0-1.06 1.06l.97.97h-6.44a4.5 4.5 0 0 0-4.5 4.5Z"
          />
          <path
            fill="currentColor"
            d="M16.5 10.75a.75.75 0 0 0-1.5 0 3 3 0 0 1-3 3h-6.566l1.123-1.248a.75.75 0 1 0-1.114-1.004l-2.25 2.5a.75.75 0 0 0 .027 1.032l2.25 2.25a.75.75 0 0 0 1.06-1.06l-.97-.97h6.44a4.5 4.5 0 0 0 4.5-4.5Z"
          />
        </svg>
      );
    }
    case 'download': {
      return (
        <svg
          className="w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M5.5 5.75c0-.69.56-1.25 1.25-1.25h2.75v3.25c0 .966.784 1.75 1.75 1.75h3.25v.75a.75.75 0 0 0 1.5 0v-1.5a.75.75 0 0 0-.22-.53l-5-5a.75.75 0 0 0-.53-.22h-3.5a2.75 2.75 0 0 0-2.75 2.75v8.5a2.75 2.75 0 0 0 2.75 2.75h3.25a.75.75 0 0 0 0-1.5h-3.25c-.69 0-1.25-.56-1.25-1.25v-8.5Zm7.94 2.25-2.44-2.44v2.19c0 .138.112.25.25.25h2.19Z"
          />
          <path
            fill="currentColor"
            d="M15 12.5a.75.75 0 0 0-1.5 0v2.94l-.72-.72a.75.75 0 1 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l2-2a.75.75 0 1 0-1.06-1.06l-.72.72v-2.94Z"
          />
        </svg>
      );
    }
    case 'spinner': {
      return (
        <span role="status">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 origin-center animate-[spin_0.5s_linear_infinite]"
            viewBox="0 0 44 44"
            fill="none"
            aria-hidden="true"
          >
            <title>Loading</title>
            <circle
              r="14"
              stroke="currentColor"
              className="opacity-30"
              strokeWidth="3"
              cx="22"
              cy="22"
            />
            <circle
              className="stroke-linecap-round [stroke-dasharray:4,6]"
              stroke="currentColor"
              pathLength="10"
              r="14"
              strokeWidth="3"
              cx="22"
              cy="22"
            />
          </svg>
        </span>
      );
    }
    default: {
      return null;
    }
  }
}
