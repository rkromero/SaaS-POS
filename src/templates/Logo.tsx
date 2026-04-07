import { AppConfig } from '@/utils/AppConfig';

export const Logo = (props: {
  isTextHidden?: boolean;
  logoUrl?: string | null;
  businessName?: string | null;
}) => {
  if (props.logoUrl) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={props.logoUrl}
          alt="Logo"
          className="h-8 max-w-[8rem] object-contain"
        />
        {!props.isTextHidden && props.businessName && (
          <span className="truncate text-xl font-semibold">{props.businessName}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center text-xl font-semibold">
      <svg
        className="mr-1 size-8 stroke-current stroke-2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 0h24v24H0z" stroke="none" />
        <rect x="3" y="12" width="6" height="8" rx="1" />
        <rect x="9" y="8" width="6" height="12" rx="1" />
        <rect x="15" y="4" width="6" height="16" rx="1" />
        <path d="M4 20h14" />
      </svg>
      {!props.isTextHidden && (props.businessName || AppConfig.name)}
    </div>
  );
};
