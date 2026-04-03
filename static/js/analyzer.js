(() => {
  "use strict";

  const PASSWORD_INPUT_ID = "analyzerPassword";
  const TOGGLE_BUTTON_ID = "analyzerToggle";

  const COMMON_PASSWORD_PARTS = [
    "password",
    "qwerty",
    "letmein",
    "welcome",
    "admin",
    "abc123",
    "123456",
    "iloveyou",
  ];

  const ui = {
    passwordInput: null,
    strengthFill: null,
    strengthLabel: null,
    scoreValue: null,
    entropyValue: null,
    suggestionsList: null,
    rules: {},
    generateBtn: null,
    copyBtn: null,
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const hasSequentialPattern = (value) => /0123|1234|2345|abcd|bcde|qwer|asdf/i.test(value);

  const analyzePassword = (password) => {
    const length = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const hasRepeats = /(.)\1{2,}/.test(password);
    const lower = password.toLowerCase();
    const isCommon = COMMON_PASSWORD_PARTS.some((entry) => lower.includes(entry));

    let score = 0;
    if (length >= 8) {
      score += 20;
    }
    if (length >= 12) {
      score += 15;
    }
    if (length >= 16) {
      score += 10;
    }
    if (hasUpper) {
      score += 15;
    }
    if (hasLower) {
      score += 15;
    }
    if (hasNumber) {
      score += 15;
    }
    if (hasSymbol) {
      score += 15;
    }

    if (isCommon) {
      score -= 35;
    }
    if (hasRepeats) {
      score -= 12;
    }
    if (hasSequentialPattern(password)) {
      score -= 10;
    }

    score = clamp(score, 0, 100);

    let strength = "Weak";
    if (score >= 75) {
      strength = "Strong";
    } else if (score >= 45) {
      strength = "Medium";
    }

    let poolSize = 0;
    if (hasLower) {
      poolSize += 26;
    }
    if (hasUpper) {
      poolSize += 26;
    }
    if (hasNumber) {
      poolSize += 10;
    }
    if (hasSymbol) {
      poolSize += 32;
    }

    const entropy = poolSize ? length * Math.log2(poolSize) : 0;

    const suggestions = [];
    if (length < 12) {
      suggestions.push("Use at least 12 characters.");
    }
    if (!hasUpper) {
      suggestions.push("Add an uppercase letter (A-Z).");
    }
    if (!hasLower) {
      suggestions.push("Add a lowercase letter (a-z).");
    }
    if (!hasNumber) {
      suggestions.push("Include at least one number (0-9).");
    }
    if (!hasSymbol) {
      suggestions.push("Include at least one special symbol (!@#$...).");
    }
    if (isCommon) {
      suggestions.push("Avoid common words or predictable patterns.");
    }
    if (hasRepeats) {
      suggestions.push("Avoid repeating characters three or more times.");
    }

    return {
      score,
      strength,
      entropy,
      suggestions,
      rules: {
        length: length >= 12,
        upper: hasUpper,
        lower: hasLower,
        number: hasNumber,
        symbol: hasSymbol,
      },
    };
  };

  const renderSuggestions = (items) => {
    ui.suggestionsList.textContent = "";

    if (!items.length) {
      const li = document.createElement("li");
      li.textContent = "Strong profile. Keep this password unique per account.";
      ui.suggestionsList.appendChild(li);
      return;
    }

    items.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      ui.suggestionsList.appendChild(li);
    });
  };

  const renderStrength = (result, showCopied = false) => {
    const { score, strength, entropy, rules, suggestions } = result;

    ui.strengthFill.style.width = `${score}%`;
    ui.strengthLabel.classList.remove("weak", "medium", "strong", "neutral");
    ui.strengthLabel.classList.add(strength.toLowerCase());
    ui.strengthLabel.textContent = showCopied
      ? `Strength: ${strength} | Secure password copied`
      : `Strength: ${strength}`;

    ui.scoreValue.textContent = `${score}/100`;
    ui.entropyValue.textContent = `${Math.round(entropy)} bits`;

    if (strength === "Weak") {
      ui.strengthFill.style.background = "linear-gradient(90deg, #ff5f7a, #ff946c)";
    } else if (strength === "Medium") {
      ui.strengthFill.style.background = "linear-gradient(90deg, #ffbe3f, #ffd56e)";
    } else {
      ui.strengthFill.style.background = "linear-gradient(90deg, #42e79a, #2df0f5)";
    }

    Object.entries(ui.rules).forEach(([key, node]) => {
      node.classList.toggle("met", rules[key]);
    });

    renderSuggestions(suggestions);
  };

  const generateSecurePassword = (length = 18) => {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()-_=+[]{};:,.?/";

    const all = lower + upper + numbers + symbols;
    const mandatory = [lower, upper, numbers, symbols].map(
      (set) => set[window.CyberApp.secureRandomInt(set.length)]
    );

    while (mandatory.length < length) {
      mandatory.push(all[window.CyberApp.secureRandomInt(all.length)]);
    }

    for (let i = mandatory.length - 1; i > 0; i -= 1) {
      const j = window.CyberApp.secureRandomInt(i + 1);
      [mandatory[i], mandatory[j]] = [mandatory[j], mandatory[i]];
    }

    return mandatory.join("");
  };

  const handlePasswordInput = () => {
    const value = ui.passwordInput.value;

    if (!value) {
      ui.strengthFill.style.width = "0%";
      ui.strengthFill.style.background = "linear-gradient(90deg, #ff5f7a, #ff946c)";
      ui.strengthLabel.classList.remove("weak", "medium", "strong");
      ui.strengthLabel.classList.add("neutral");
      ui.strengthLabel.textContent = "Strength: Waiting for input";
      ui.scoreValue.textContent = "0/100";
      ui.entropyValue.textContent = "0 bits";
      Object.values(ui.rules).forEach((node) => node.classList.remove("met"));
      renderSuggestions(["Start typing to receive guidance."]);
      return;
    }

    renderStrength(analyzePassword(value));
  };

  const init = () => {
    ui.passwordInput = document.getElementById(PASSWORD_INPUT_ID);
    ui.strengthFill = document.getElementById("strengthFill");
    ui.strengthLabel = document.getElementById("strengthLabel");
    ui.scoreValue = document.getElementById("scoreValue");
    ui.entropyValue = document.getElementById("entropyValue");
    ui.suggestionsList = document.getElementById("suggestionsList");
    ui.generateBtn = document.getElementById("generatePasswordBtn");
    ui.copyBtn = document.getElementById("copySecureBtn");

    ui.rules = {
      length: document.getElementById("ruleLength"),
      upper: document.getElementById("ruleUpper"),
      lower: document.getElementById("ruleLower"),
      number: document.getElementById("ruleNumber"),
      symbol: document.getElementById("ruleSymbol"),
    };

    if (!ui.passwordInput) {
      return;
    }

    window.CyberApp.attachPasswordToggle(PASSWORD_INPUT_ID, TOGGLE_BUTTON_ID);

    let debounceTimer;
    ui.passwordInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handlePasswordInput, 200);
    });

    ui.generateBtn.addEventListener("click", () => {
      const password = generateSecurePassword();
      ui.passwordInput.value = password;
      renderStrength(analyzePassword(password));
    });

    ui.copyBtn.addEventListener("click", async () => {
      let password = ui.passwordInput.value;
      let result = analyzePassword(password);

      if (!password || result.strength !== "Strong") {
        password = generateSecurePassword();
        ui.passwordInput.value = password;
        result = analyzePassword(password);
      }

      try {
        const copied = await window.CyberApp.copyText(password);
        if (!copied) {
          throw new Error("copy-failed");
        }
        renderStrength(result, true);
      } catch {
        ui.strengthLabel.classList.remove("weak", "medium", "strong");
        ui.strengthLabel.classList.add("neutral");
        ui.strengthLabel.textContent = "Unable to copy automatically. Copy manually from the field.";
      }
    });
  };

  document.addEventListener("DOMContentLoaded", init);
})();
