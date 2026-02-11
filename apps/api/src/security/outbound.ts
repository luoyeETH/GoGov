import { lookup } from "dns/promises";
import net from "net";

type SafeFetchOptions = {
  maxRedirects?: number;
};

const MAX_REDIRECTS = 3;

function ipv4ToInt(address: string) {
  const parts = address.split(".").map((value) => Number.parseInt(value, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }
  if (parts.some((part) => part < 0 || part > 255)) {
    return null;
  }
  return (
    (((parts[0] ?? 0) << 24) >>> 0) +
    (((parts[1] ?? 0) << 16) >>> 0) +
    (((parts[2] ?? 0) << 8) >>> 0) +
    ((parts[3] ?? 0) >>> 0)
  );
}

function isIpv4InRange(value: number, start: number, end: number) {
  return value >= start && value <= end;
}

function isPublicIpv4(address: string) {
  const value = ipv4ToInt(address);
  if (value === null) {
    return false;
  }

  // Special-purpose and non-routable ranges (fail closed).
  if (isIpv4InRange(value, 0x00000000, 0x00ffffff)) return false; // 0.0.0.0/8
  if (isIpv4InRange(value, 0x0a000000, 0x0affffff)) return false; // 10.0.0.0/8
  if (isIpv4InRange(value, 0x64400000, 0x647fffff)) return false; // 100.64.0.0/10
  if (isIpv4InRange(value, 0x7f000000, 0x7fffffff)) return false; // 127.0.0.0/8
  if (isIpv4InRange(value, 0xa9fe0000, 0xa9feffff)) return false; // 169.254.0.0/16
  if (isIpv4InRange(value, 0xac100000, 0xac1fffff)) return false; // 172.16.0.0/12
  if (isIpv4InRange(value, 0xc0000000, 0xc00000ff)) return false; // 192.0.0.0/24
  if (isIpv4InRange(value, 0xc0000200, 0xc00002ff)) return false; // 192.0.2.0/24
  if (isIpv4InRange(value, 0xc0586300, 0xc05863ff)) return false; // 192.88.99.0/24
  if (isIpv4InRange(value, 0xc0a80000, 0xc0a8ffff)) return false; // 192.168.0.0/16
  if (isIpv4InRange(value, 0xc6120000, 0xc613ffff)) return false; // 198.18.0.0/15
  if (isIpv4InRange(value, 0xc6336400, 0xc63364ff)) return false; // 198.51.100.0/24
  if (isIpv4InRange(value, 0xcb007100, 0xcb0071ff)) return false; // 203.0.113.0/24
  if (isIpv4InRange(value, 0xe0000000, 0xefffffff)) return false; // 224.0.0.0/4
  if (isIpv4InRange(value, 0xf0000000, 0xffffffff)) return false; // 240.0.0.0/4

  return true;
}

function parseFirstHextet(address: string) {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::")) {
    return 0;
  }
  const idx = normalized.indexOf(":");
  const first = idx === -1 ? normalized : normalized.slice(0, idx);
  if (!first) {
    return 0;
  }
  const parsed = Number.parseInt(first, 16);
  return Number.isFinite(parsed) ? parsed : null;
}

function isPublicIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") {
    return false;
  }

  if (normalized.startsWith("::ffff:")) {
    const ipv4 = normalized.slice("::ffff:".length);
    return isPublicIpv4(ipv4);
  }

  const first = parseFirstHextet(normalized);
  if (first === null) {
    return false;
  }

  // Unique local addresses fc00::/7.
  if (first >= 0xfc00 && first <= 0xfdff) {
    return false;
  }

  // Link-local fe80::/10 (fe80-feBF).
  if (first >= 0xfe80 && first <= 0xfebf) {
    return false;
  }

  // Multicast ff00::/8.
  if (first >= 0xff00 && first <= 0xffff) {
    return false;
  }

  // Documentation 2001:db8::/32.
  if (first === 0x2001 && normalized.startsWith("2001:db8:")) {
    return false;
  }

  return true;
}

function isPublicIp(address: string) {
  const family = net.isIP(address);
  if (family === 4) {
    return isPublicIpv4(address);
  }
  if (family === 6) {
    return isPublicIpv6(address);
  }
  return false;
}

async function assertPublicHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    throw new Error("URL 缺少主机名");
  }
  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    throw new Error("不允许访问本机地址");
  }

  const isIpLiteral = net.isIP(normalized) !== 0;
  if (isIpLiteral) {
    if (!isPublicIp(normalized)) {
      throw new Error("不允许访问内网/本机 IP");
    }
    return;
  }

  let results: Array<{ address: string }> = [];
  try {
    results = (await lookup(normalized, { all: true })) as Array<{ address: string }>;
  } catch {
    throw new Error("主机名解析失败");
  }
  if (!results.length) {
    throw new Error("主机名解析结果为空");
  }
  const addresses = results.map((item) => item.address);
  for (const address of addresses) {
    if (!isPublicIp(address)) {
      throw new Error("不允许访问内网/本机 IP");
    }
  }
}

export async function assertSafeOutboundUrl(input: string | URL) {
  let url: URL;
  if (typeof input === "string") {
    try {
      url = new URL(input);
    } catch {
      throw new Error("URL 格式不正确");
    }
  } else {
    url = input;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("仅支持 http/https URL");
  }
  if (url.username || url.password) {
    throw new Error("URL 不允许包含用户名或密码");
  }

  await assertPublicHostname(url.hostname);
  return url;
}

function isRedirectStatus(status: number) {
  return status >= 300 && status < 400;
}

function cloneHeaders(headers?: HeadersInit) {
  return headers ? new Headers(headers) : new Headers();
}

export async function safeFetch(
  input: string | URL,
  init: RequestInit = {},
  options: SafeFetchOptions = {}
) {
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  let url: URL;
  if (typeof input === "string") {
    try {
      url = new URL(input);
    } catch {
      throw new Error("URL 格式不正确");
    }
  } else {
    url = input;
  }
  const initialHost = url.hostname;
  const allowedHosts = new Set<string>([initialHost]);
  if (initialHost.startsWith("www.")) {
    allowedHosts.add(initialHost.slice(4));
  } else {
    allowedHosts.add(`www.${initialHost}`);
  }

  let headers = cloneHeaders(init.headers);

  for (let redirected = 0; redirected <= maxRedirects; redirected += 1) {
    await assertSafeOutboundUrl(url);

    const response = await fetch(url, {
      ...init,
      headers,
      redirect: "manual"
    });

    if (!isRedirectStatus(response.status)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      return response;
    }

    if (redirected === maxRedirects) {
      throw new Error("上游重定向次数过多");
    }

    const nextUrl = new URL(location, url);
    if (!allowedHosts.has(nextUrl.hostname)) {
      throw new Error("上游重定向到不同主机，已被拦截");
    }

    url = nextUrl;
    // Keep headers, method and body for same-host redirects (e.g. http->https).
    headers = cloneHeaders(init.headers);
  }

  throw new Error("上游重定向次数过多");
}
