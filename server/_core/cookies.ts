import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // Para desenvolvimento local, usar "lax" para sameSite
  // Para produção com HTTPS, usar "none" e secure: true
  const isLocal = LOCAL_HOSTS.has(req.hostname) || req.hostname === "127.0.0.1" || req.hostname === "::1" || req.hostname.includes("localhost");
  
  return {
    httpOnly: true,
    path: "/",
    sameSite: isLocal ? "lax" : "none",
    secure: !isLocal && isSecureRequest(req),
  };
}
