(() => {
  "use strict";

  const setCurrentYear = () => {
    const yearNode = document.getElementById("currentYear");
    if (yearNode) {
      yearNode.textContent = String(new Date().getFullYear());
    }
  };

  const initRevealAnimations = () => {
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    nodes.forEach((node) => observer.observe(node));
  };

  const attachPasswordToggle = (inputId, buttonId) => {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    if (!input || !button) {
      return;
    }

    button.addEventListener("click", () => {
      const nextType = input.type === "password" ? "text" : "password";
      input.type = nextType;
      const isVisible = nextType === "text";
      button.textContent = isVisible ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(isVisible));
      button.setAttribute("aria-label", isVisible ? "Hide password" : "Show password");
    });
  };

  const sha256Hex = async (value) => {
    const encoded = new TextEncoder().encode(value);
    const digestBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const bytes = new Uint8Array(digestBuffer);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  };

  const copyText = async (value) => {
    if (!value) {
      return false;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "true");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();
    const result = document.execCommand("copy");
    document.body.removeChild(helper);
    return result;
  };

  const secureRandomInt = (maxExclusive) => {
    const values = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    do {
      crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % maxExclusive;
  };

  window.CyberApp = {
    attachPasswordToggle,
    copyText,
    secureRandomInt,
    sha256Hex,
  };

  document.addEventListener("DOMContentLoaded", () => {
    setCurrentYear();
    initRevealAnimations();
  });
})();
