import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  async headers() {
    const contentSecurityPolicy = (frameAncestors: string) => [
      "default-src 'self'",
      // React/Next require unsafe-eval only for development debugging. Keeping
      // unsafe-inline preserves static rendering; removing it would require
      // converting every route to dynamic nonce-based rendering.
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://api.dicebear.com https://www.qlynk.site",
      "font-src 'self'",
      "connect-src 'self' https://api.groq.com https://*.supabase.co https://api.stripe.com https://*.hcaptcha.com",
      "frame-src https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src 'self' blob:",
      `frame-ancestors ${frameAncestors}`,
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    const commonHeaders = (frameAncestors: string) => [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy(frameAncestors),
      },
    ];

    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      ...commonHeaders("'none'"),
    ];
    const embedHeaders = commonHeaders("*");

    // HSTS only in production
    if (isProd) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
      embedHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/((?!embed(?:/|$)).*)",
        headers: securityHeaders,
      },
      {
        source: "/embed/:path*",
        headers: embedHeaders,
      },
    ];
  },
};

export default nextConfig;
