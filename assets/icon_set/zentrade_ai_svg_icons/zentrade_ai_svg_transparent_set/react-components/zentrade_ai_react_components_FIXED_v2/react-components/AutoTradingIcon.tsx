import React from "react";

export type AutoTradingIconProps = {
  size?: number | string;
  className?: string;
  title?: string;
  alt?: string;
};

export default function AutoTradingIcon({
  size = 48,
  className = "",
  title = "auto-trading",
  alt = "auto-trading",
}: AutoTradingIconProps) {
  return (
    <img
      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgcm9sZT0iaW1nIj4KPHN0eWxlPgogIC5iZyB7IGZpbGw6ICMwNzA4MTI7IH0KICAucmluZyB7IGZpbGw6IG5vbmU7IHN0cm9rZTogdXJsKCNuZW9uKTsgc3Ryb2tlLXdpZHRoOiA1OyBmaWx0ZXI6IHVybCgjZ2xvdyk7IH0KICAubGluZSB7IGZpbGw6IG5vbmU7IHN0cm9rZTogIzIzZTZmZjsgc3Ryb2tlLXdpZHRoOiA1OyBzdHJva2UtbGluZWNhcDogcm91bmQ7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IGZpbHRlcjogdXJsKCNnbG93KTsgfQogIC5saW5lMiB7IGZpbGw6IG5vbmU7IHN0cm9rZTogI2ZmNGZkODsgc3Ryb2tlLXdpZHRoOiA1OyBzdHJva2UtbGluZWNhcDogcm91bmQ7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IGZpbHRlcjogdXJsKCNnbG93KTsgfQogIC5maWxsIHsgZmlsbDogIzIzZTZmZjsgZmlsdGVyOiB1cmwoI2dsb3cpOyB9CiAgLmZpbGwyIHsgZmlsbDogI2ZmNGZkODsgZmlsdGVyOiB1cmwoI2dsb3cpOyB9CiAgLnR4dCB7IGZvbnQtZmFtaWx5OiBPcmJpdHJvbiwgQXJpYWwsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA3MDA7IGZpbGw6ICNlOWZiZmY7IGxldHRlci1zcGFjaW5nOiAycHg7IH0KPC9zdHlsZT4KPGRlZnM+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJuZW9uIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMyM2U2ZmYiLz4KICAgIDxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjOTE1Y2ZmIi8+CiAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZjRmZDgiLz4KICA8L2xpbmVhckdyYWRpZW50PgogIDxmaWx0ZXIgaWQ9Imdsb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgogICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMy41IiByZXN1bHQ9ImNvbG9yZWRCbHVyIi8+CiAgICA8ZmVNZXJnZT4KICAgICAgPGZlTWVyZ2VOb2RlIGluPSJjb2xvcmVkQmx1ciIvPgogICAgICA8ZmVNZXJnZU5vZGUgaW49IlNvdXJjZUdyYXBoaWMiLz4KICAgIDwvZmVNZXJnZT4KICA8L2ZpbHRlcj4KPC9kZWZzPgoKPHJlY3QgY2xhc3M9ImJnIiB4PSIyNCIgeT0iMjQiIHdpZHRoPSI0NjQiIGhlaWdodD0iNDY0IiByeD0iOTYiLz4KCjxjaXJjbGUgY2xhc3M9InJpbmciIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjE2OCIvPgo8cGF0aCBjbGFzcz0ibGluZSIgZD0iTTEyNiAzNDJoMjYwIi8+CjxwYXRoIGNsYXNzPSJsaW5lMiIgZD0iTTE1NiAzMjJsNTgtNzQgNTQgNDAgODgtMTIyIi8+CjxwYXRoIGNsYXNzPSJsaW5lIiBkPSJNMTUwIDI3OHY0NE0yMTQgMjI2djk2TTI2OCAyNjB2NjJNMzU2IDE3NHYxNDgiLz4KPHBhdGggY2xhc3M9ImxpbmUyIiBkPSJNMzI2IDE2NmgzNHYzNCIvPgo8L3N2Zz4K"
      width={size}
      height={size}
      className={className}
      title={title}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "inline-block",
      }}
      loading="lazy"
      decoding="async"
    />
  );
}
