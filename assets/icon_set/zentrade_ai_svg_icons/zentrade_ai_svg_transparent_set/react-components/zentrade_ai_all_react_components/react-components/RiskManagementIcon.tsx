import React from "react";

export type RiskManagementIconProps = {
  size?: number | string;
  className?: string;
  title?: string;
  alt?: string;
};

export default function RiskManagementIcon({
  size = 48,
  className = "",
  title = "risk-management",
  alt = "risk-management",
}: RiskManagementIconProps) {
  return (
    <img
      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHJvbGU9ImltZyIgYXJpYS1sYWJlbD0iUmlzayBNYW5hZ2VtZW50IEljb24iIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+Cgo8c3R5bGU+CiAgLmJnIHsgZmlsbDogIzA3MDgxMjsgfQogIC5yaW5nIHsgZmlsbDogbm9uZTsgc3Ryb2tlOiB1cmwoI25lb24pOyBzdHJva2Utd2lkdGg6IDU7IGZpbHRlcjogdXJsKCNnbG93KTsgfQogIC5saW5lIHsgZmlsbDogbm9uZTsgc3Ryb2tlOiAjMjNlNmZmOyBzdHJva2Utd2lkdGg6IDU7IHN0cm9rZS1saW5lY2FwOiByb3VuZDsgc3Ryb2tlLWxpbmVqb2luOiByb3VuZDsgZmlsdGVyOiB1cmwoI2dsb3cpOyB9CiAgLmxpbmUyIHsgZmlsbDogbm9uZTsgc3Ryb2tlOiAjZmY0ZmQ4OyBzdHJva2Utd2lkdGg6IDU7IHN0cm9rZS1saW5lY2FwOiByb3VuZDsgc3Ryb2tlLWxpbmVqb2luOiByb3VuZDsgZmlsdGVyOiB1cmwoI2dsb3cpOyB9CiAgLmZpbGwgeyBmaWxsOiAjMjNlNmZmOyBmaWx0ZXI6IHVybCgjZ2xvdyk7IH0KICAuZmlsbDIgeyBmaWxsOiAjZmY0ZmQ4OyBmaWx0ZXI6IHVybCgjZ2xvdyk7IH0KICAudHh0IHsgZm9udC1mYW1pbHk6IE9yYml0cm9uLCBBcmlhbCwgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDcwMDsgZmlsbDogI2U5ZmJmZjsgbGV0dGVyLXNwYWNpbmc6IDJweDsgfQo8L3N0eWxlPgo8ZGVmcz4KICA8bGluZWFyR3JhZGllbnQgaWQ9Im5lb24iIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzIzZTZmZiIvPgogICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiM5MTVjZmYiLz4KICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmNGZkOCIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPGZpbHRlciBpZD0iZ2xvdyIgeD0iLTUwJSIgeT0iLTUwJSIgd2lkdGg9IjIwMCUiIGhlaWdodD0iMjAwJSI+CiAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzLjUiIHJlc3VsdD0iY29sb3JlZEJsdXIiLz4KICAgIDxmZU1lcmdlPgogICAgICA8ZmVNZXJnZU5vZGUgaW49ImNvbG9yZWRCbHVyIi8+CiAgICAgIDxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPgogICAgPC9mZU1lcmdlPgogIDwvZmlsdGVyPgo8L2RlZnM+Cgo8cmVjdCBjbGFzcz0iYmciIHg9IjI0IiB5PSIyNCIgd2lkdGg9IjQ2NCIgaGVpZ2h0PSI0NjQiIHJ4PSI5NiIvPgoKPGNpcmNsZSBjbGFzcz0icmluZyIgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMTY4Ii8+CjxwYXRoIGNsYXNzPSJsaW5lIiBkPSJNMjU2IDExMmwxMjYgNDh2OTJjMCA4Ni01MiAxMzAtMTI2IDE1OC03NC0yOC0xMjYtNzItMTI2LTE1OHYtOTJ6Ii8+CjxyZWN0IGNsYXNzPSJsaW5lMiIgeD0iMjA0IiB5PSIyNDIiIHdpZHRoPSIxMDQiIGhlaWdodD0iODIiIHJ4PSIxNCIvPgo8cGF0aCBjbGFzcz0ibGluZSIgZD0iTTIyNiAyNDJ2LTMyYzAtMzggNjAtMzggNjAgMHYzMiIvPgo8Y2lyY2xlIGNsYXNzPSJmaWxsMiIgY3g9IjI1NiIgY3k9IjI4NCIgcj0iOSIvPgoKPC9zdmc+Cg=="
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
