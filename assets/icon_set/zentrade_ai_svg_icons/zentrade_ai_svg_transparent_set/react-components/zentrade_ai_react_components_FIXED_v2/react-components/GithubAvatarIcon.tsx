import React from "react";

export type GithubAvatarIconProps = {
  size?: number | string;
  className?: string;
  title?: string;
  alt?: string;
};

export default function GithubAvatarIcon({
  size = 48,
  className = "",
  title = "github-avatar",
  alt = "github-avatar",
}: GithubAvatarIconProps) {
  return (
    <img
      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgcm9sZT0iaW1nIj4KPHN0eWxlPgogIC5iZyB7IGZpbGw6ICMwNzA4MTI7IH0KICAucmluZyB7IGZpbGw6IG5vbmU7IHN0cm9rZTogdXJsKCNuZW9uKTsgc3Ryb2tlLXdpZHRoOiA1OyBmaWx0ZXI6IHVybCgjZ2xvdyk7IH0KICAubGluZSB7IGZpbGw6IG5vbmU7IHN0cm9rZTogIzIzZTZmZjsgc3Ryb2tlLXdpZHRoOiA1OyBzdHJva2UtbGluZWNhcDogcm91bmQ7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IGZpbHRlcjogdXJsKCNnbG93KTsgfQogIC5saW5lMiB7IGZpbGw6IG5vbmU7IHN0cm9rZTogI2ZmNGZkODsgc3Ryb2tlLXdpZHRoOiA1OyBzdHJva2UtbGluZWNhcDogcm91bmQ7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IGZpbHRlcjogdXJsKCNnbG93KTsgfQogIC5maWxsIHsgZmlsbDogIzIzZTZmZjsgZmlsdGVyOiB1cmwoI2dsb3cpOyB9CiAgLmZpbGwyIHsgZmlsbDogI2ZmNGZkODsgZmlsdGVyOiB1cmwoI2dsb3cpOyB9CiAgLnR4dCB7IGZvbnQtZmFtaWx5OiBPcmJpdHJvbiwgQXJpYWwsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA3MDA7IGZpbGw6ICNlOWZiZmY7IGxldHRlci1zcGFjaW5nOiAycHg7IH0KPC9zdHlsZT4KPGRlZnM+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJuZW9uIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMyM2U2ZmYiLz4KICAgIDxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjOTE1Y2ZmIi8+CiAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZjRmZDgiLz4KICA8L2xpbmVhckdyYWRpZW50PgogIDxmaWx0ZXIgaWQ9Imdsb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgogICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMy41IiByZXN1bHQ9ImNvbG9yZWRCbHVyIi8+CiAgICA8ZmVNZXJnZT4KICAgICAgPGZlTWVyZ2VOb2RlIGluPSJjb2xvcmVkQmx1ciIvPgogICAgICA8ZmVNZXJnZU5vZGUgaW49IlNvdXJjZUdyYXBoaWMiLz4KICAgIDwvZmVNZXJnZT4KICA8L2ZpbHRlcj4KPC9kZWZzPgoKPHJlY3QgY2xhc3M9ImJnIiB4PSIyNCIgeT0iMjQiIHdpZHRoPSI0NjQiIGhlaWdodD0iNDY0IiByeD0iOTYiLz4KCjxjaXJjbGUgY2xhc3M9InJpbmciIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjE3NiIvPgo8cGF0aCBjbGFzcz0ibGluZSIgZD0iTTE3MiAzMDRjMzgtMTAyIDEzMC0xMDIgMTY4IDAiLz4KPHBhdGggY2xhc3M9ImxpbmUyIiBkPSJNMTk4IDIxNmMyMi00OCA5NC00OCAxMTYgMCIvPgo8Y2lyY2xlIGNsYXNzPSJmaWxsIiBjeD0iMjIwIiBjeT0iMjUyIiByPSIxMSIvPgo8Y2lyY2xlIGNsYXNzPSJmaWxsMiIgY3g9IjI5MiIgY3k9IjI1MiIgcj0iMTEiLz4KPHBhdGggY2xhc3M9ImxpbmUiIGQ9Ik0xODYgMzY2aDE0MCIvPgo8dGV4dCBjbGFzcz0idHh0IiB4PSIyNTYiIHk9IjQyNCIgZm9udC1zaXplPSI3MiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+WlQ8L3RleHQ+Cjwvc3ZnPgo="
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
