from __future__ import annotations

import re
from collections import defaultdict

from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Mock breach corpus represented as SHA-256 hashes and approximate hit counts.
BREACHED_PASSWORDS: dict[str, int] = {
    "5E884898DA28047151D0E56F8DC6292773603D0D6AABBDD62A11EF721D1542D8": 23_439_201,  # password
    "8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92": 18_930_404,  # 123456
    "65E84BE33532FB784C48129675F9EFF3A682B27168C0EA744B2CF58EE02337C5": 9_154_443,   # qwerty
    "1C8BFE8F801D79745C4631D09FFF36C82AA37FC4CCE4FC946683D7B336B63032": 4_982_100,   # letmein
    "E4AD93CA07ACB8D908A3AA41E920EA4F4EF4F26E7F86CF8291C5DB289780A5AE": 3_841_992,   # iloveyou
    "8C6976E5B5410415BDE908BD4DEE15DFB167A9C873FC4BB8A81F6F2AB448A918": 2_272_019,   # admin
    "280D44AB1E9F79B5CCE2DD4F58F5FE91F0FBACDAC9F7447DFFC318CEB79F2D02": 2_108_932,   # welcome
    "000C285457FC971F862A79B786476C78812C8897063C6FA9C045F579A3B2D63F": 1_803_552,   # monkey
    "A9C43BE948C5CABD56EF2BACFFB77CDAA5EEC49DD5EB0CC4129CF3EDA5F0E74C": 1_529_800,   # dragon
    "6382DEAF1F5DC6E792B76DB4A4A7BF2BA468884E000B25E7928E621E27FB23CB": 1_220_443,   # football
    "6CA13D52CA70C883E0F0BB101E425A89E8624DE51DB2D2392593AF6A84118090": 1_141_009,   # abc123
    "A109E36947AD56DE1DCA1CC49F0EF8AC9AD9A7B1AA0DF41FB3C4CB73C1FF01EA": 624_014,     # Password123!
}

PREFIX_LEN = 6
RANGE_INDEX: dict[str, dict[str, int]] = defaultdict(dict)

for password_hash, count in BREACHED_PASSWORDS.items():
    prefix = password_hash[:PREFIX_LEN]
    suffix = password_hash[PREFIX_LEN:]
    RANGE_INDEX[prefix][suffix] = count


@app.get("/")
def home() -> str:
    return render_template("index.html", page="home")


@app.get("/breach-check")
def breach_check() -> str:
    return render_template("breach.html", page="breach")


@app.get("/security-tips")
def security_tips() -> str:
    return render_template("tips.html", page="tips")


@app.get("/about")
def about() -> str:
    return render_template("about.html", page="about")


@app.get("/api/breach-range/<prefix>")
def breach_range(prefix: str):
    # K-anonymity style query: only a short hash prefix is accepted.
    normalized = prefix.strip().upper()
    if not re.fullmatch(r"^[0-9A-F]{6}$", normalized):
        return jsonify({"error": "Invalid hash prefix"}), 400

    return jsonify(
        {
            "prefix": normalized,
            "hash_type": "SHA-256",
            "matches": RANGE_INDEX.get(normalized, {}),
            "source": "mock-breach-corpus",
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
