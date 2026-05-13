import React from "react";

export type MarketScanIconProps = {
  size?: number | string;
  className?: string;
  title?: string;
  alt?: string;
};

export default function MarketScanIcon({
  size = 48,
  className = "",
  title = "market-scan",
  alt = "market-scan",
}: MarketScanIconProps) {
  return (
    <img
      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHJvbGU9ImltZyIgYXJpYS1sYWJlbD0iTWFya2V0IFNjYW4gSWNvbiIgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj4KCjxzdHlsZT4KICAuYmcgeyBmaWxsOiAjMDcwODEyOyB9CiAgLnJpbmcgeyBmaWxsOiBub25lOyBzdHJva2U6IHVybCgjbmVvbik7IHN0cm9rZS13aWR0aDogNTsgZmlsdGVyOiB1cmwoI2dsb3cpOyB9CiAgLmxpbmUgeyBmaWxsOiBub25lOyBzdHJva2U6ICMyM2U2ZmY7IHN0cm9rZS13aWR0aDogNTsgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kOyBzdHJva2UtbGluZWpvaW46IHJvdW5kOyBmaWx0ZXI6IHVybCgjZ2xvdyk7IH0KICAubGluZTIgeyBmaWxsOiBub25lOyBzdHJva2U6ICNmZjRmZDg7IHN0cm9rZS13aWR0aDogNTsgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kOyBzdHJva2UtbGluZWpvaW46IHJvdW5kOyBmaWx0ZXI6IHVybCgjZ2xvdyk7IH0KICAuZmlsbCB7IGZpbGw6ICMyM2U2ZmY7IGZpbHRlcjogdXJsKCNnbG93KTsgfQogIC5maWxsMiB7IGZpbGw6ICNmZjRmZDg7IGZpbHRlcjogdXJsKCNnbG93KTsgfQogIC50eHQgeyBmb250LWZhbWlseTogT3JiaXRyb24sIEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXdlaWdodDogNzAwOyBmaWxsOiAjZTlmYmZmOyBsZXR0ZXItc3BhY2luZzogMnB4OyB9Cjwvc3R5bGU+CjxkZWZzPgogIDxsaW5lYXJHcmFkaWVudCBpZD0ibmVvbiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMjNlNmZmIi8+CiAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzkxNWNmZiIvPgogICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZmY0ZmQ4Ii8+CiAgPC9saW5lYXJHcmFkaWVudD4KICA8ZmlsdGVyIGlkPSJnbG93IiB4PSItNTAlIiB5PSItNTAlIiB3aWR0aD0iMjAwJSIgaGVpZ2h0PSIyMDAlIj4KICAgIDxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjMuNSIgcmVzdWx0PSJjb2xvcmVkQmx1ciIvPgogICAgPGZlTWVyZ2U+CiAgICAgIDxmZU1lcmdlTm9kZSBpbj0iY29sb3JlZEJsdXIiLz4KICAgICAgPGZlTWVyZ2VOb2RlIGluPSJTb3VyY2VHcmFwaGljIi8+CiAgICA8L2ZlTWVyZ2U+CiAgPC9maWx0ZXI+CjwvZGVmcz4KCjxyZWN0IGNsYXNzPSJiZyIgeD0iMjQiIHk9IjI0IiB3aWR0aD0iNDY0IiBoZWlnaHQ9IjQ2NCIgcng9Ijk2Ii8+Cgo8Y2lyY2xlIGNsYXNzPSJyaW5nIiBjeD0iMjU2IiBjeT0iMjU2IiByPSIxNjgiLz4KPHBhdGggY2xhc3M9ImxpbmUiIGQ9Ik0xMjAgMjU2aDI3Mk0yNTYgMTIwdjI3MiIvPgo8Y2lyY2xlIGNsYXNzPSJsaW5lMiIgY3g9IjI1NiIgY3k9IjI1NiIgcj0iOTIiLz4KPHBhdGggY2xhc3M9ImxpbmUyIiBkPSJNMjAyIDI4NmwzMi01NiA0MiAzMCA0Mi03NiIvPgo8cGF0aCBjbGFzcz0ibGluZSIgZD0iTTE4NCAzMzJoMTQ0Ii8+Cgo8L3N2Zz4K"
      width={size}
      height={size}
      className={className}
      title={title}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
      }}
      loading="lazy"
      decoding="async"
    />
  );
}
