(() => {
  "use strict";

  const PREFIX_SIZE = 6;

  const ui = {
    form: null,
    password: null,
    resultCard: null,
    title: null,
    message: null,
    meta: null,
  };

  const setResult = ({ state = "neutral", title, message, meta }) => {
    ui.resultCard.classList.remove("neutral", "safe", "breached");
    ui.resultCard.classList.add(state);
    ui.title.textContent = title;
    ui.message.textContent = message;
    ui.meta.textContent = meta;
  };

  const fetchBreachRange = async (prefix) => {
    const response = await fetch(`/api/breach-range/${prefix}`);
    if (!response.ok) {
      throw new Error("Breach endpoint unavailable");
    }
    return response.json();
  };

  const handleBreachCheck = async (event) => {
    event.preventDefault();

    let rawPassword = ui.password.value;

    if (!rawPassword.trim()) {
      setResult({
        state: "neutral",
        title: "Input required",
        message: "Enter a password before running the breach check.",
        meta: "No hash lookup executed.",
      });
      return;
    }

    try {
      setResult({
        state: "neutral",
        title: "Checking breach exposure...",
        message: "Generating SHA-256 hash in browser and querying prefix range.",
        meta: "Processing securely...",
      });

      const sha256Hash = await window.CyberApp.sha256Hex(rawPassword);
      const prefix = sha256Hash.slice(0, PREFIX_SIZE);
      const suffix = sha256Hash.slice(PREFIX_SIZE);

      // Remove the raw value from function scope as soon as the hash is created.
      rawPassword = "";

      const rangeData = await fetchBreachRange(prefix);
      const matches = rangeData.matches || {};
      const matchCount = matches[suffix];

      if (matchCount !== undefined) {
        setResult({
          state: "breached",
          title: "Compromised password detected",
          message: `This password appears in known breaches approximately ${matchCount.toLocaleString()} times in the dataset.`,
          meta: `Hash prefix checked: ${prefix} | Status: At risk`,
        });
        return;
      }

      setResult({
        state: "safe",
        title: "Safe in current dataset",
        message: "No breach match found for this password in the current corpus.",
        meta: `Hash prefix checked: ${prefix} | Status: Not found`,
      });
    } catch {
      setResult({
        state: "neutral",
        title: "Lookup failed",
        message: "The breach service is temporarily unavailable. Try again shortly.",
        meta: "No data was stored.",
      });
    }
  };

  const init = () => {
    ui.form = document.getElementById("breachForm");
    ui.password = document.getElementById("breachPassword");
    ui.resultCard = document.getElementById("breachResult");
    ui.title = document.getElementById("resultTitle");
    ui.message = document.getElementById("resultMessage");
    ui.meta = document.getElementById("resultMeta");

    if (!ui.form || !ui.password) {
      return;
    }

    window.CyberApp.attachPasswordToggle("breachPassword", "breachToggle");
    ui.form.addEventListener("submit", handleBreachCheck);
  };

  document.addEventListener("DOMContentLoaded", init);
})();
