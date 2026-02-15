"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const guideSeenKey = "gogov_pwa_install_guide_seen_v1";

type DevicePlatform = "ios" | "android" | "other";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function detectStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileViewport() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(max-width: 768px), (hover: none) and (pointer: coarse)").matches;
}

function detectPlatform(): DevicePlatform {
  if (typeof window === "undefined") {
    return "other";
  }
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

  if (isIOS) {
    return "ios";
  }
  if (/android/.test(userAgent)) {
    return "android";
  }
  return "other";
}

function readSeenFlag() {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(guideSeenKey) === "1";
  } catch {
    return false;
  }
}

function persistSeenFlag() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(guideSeenKey, "1");
  } catch {
    // Ignore storage write failures.
  }
}

export default function PWAInstallGuide() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<DevicePlatform>("other");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const closeGuide = useCallback(() => {
    persistSeenFlag();
    setVisible(false);
    setDeferredPrompt(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setPlatform(detectPlatform());

    const updateVisibility = () => {
      const shouldShow =
        isMobileViewport() && !detectStandaloneMode() && !readSeenFlag();
      setVisible(shouldShow);
    };

    updateVisibility();
    const timer = window.setTimeout(updateVisibility, 650);
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    window.addEventListener("resize", updateVisibility);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateVisibility);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(updateVisibility);
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateVisibility);
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", updateVisibility);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(updateVisibility);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (visible) {
      document.body.classList.add("pwa-guide-lock");
    } else {
      document.body.classList.remove("pwa-guide-lock");
    }
    return () => {
      document.body.classList.remove("pwa-guide-lock");
    };
  }, [visible]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      if (typeof installEvent.prompt !== "function") {
        return;
      }
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
    };

    const handleAppInstalled = () => {
      persistSeenFlag();
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const steps = useMemo(() => {
    if (platform === "ios") {
      return [
        "点击 Safari 底部“分享”按钮（方框上箭头）。",
        "在菜单中选择“添加到主屏幕”。",
        "点击右上角“添加”即可完成。"
      ];
    }

    if (platform === "android") {
      if (deferredPrompt) {
        return [
          "点击下方“立即添加”。",
          "在浏览器弹窗里确认“安装”。",
          "回到桌面后即可像 App 一样打开。"
        ];
      }
      return [
        "点击浏览器右上角“⋮”菜单。",
        "选择“添加到主屏幕”或“安装应用”。",
        "确认后即可在桌面快速打开。"
      ];
    }

    return [
      "打开浏览器菜单。",
      "找到“添加到主屏幕”或“安装应用”。",
      "确认后可从桌面直接进入网站。"
    ];
  }, [deferredPrompt, platform]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      persistSeenFlag();
      setVisible(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (!visible) {
    return null;
  }

  const showInstallAction = platform === "android" && deferredPrompt !== null;

  return (
    <div className="pwa-install-guide-overlay">
      <section
        className="pwa-install-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-guide-title"
      >
        <p className="pwa-install-guide-tag">体验升级</p>
        <h2 id="pwa-install-guide-title">将“学了么”添加到桌面</h2>
        <p className="pwa-install-guide-lead">像 App 一样一键打开，学习更专注。</p>
        <ol className="pwa-install-guide-steps">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="pwa-install-guide-actions">
          {showInstallAction ? (
            <button type="button" className="pwa-install-guide-primary" onClick={handleInstall}>
              立即添加
            </button>
          ) : null}
          <button type="button" className="pwa-install-guide-secondary" onClick={closeGuide}>
            {showInstallAction ? "稍后再说" : "我知道了"}
          </button>
        </div>
      </section>
    </div>
  );
}
