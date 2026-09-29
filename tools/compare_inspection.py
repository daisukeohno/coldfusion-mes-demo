#!/usr/bin/env python3
"""旧 CFML 画面 (inspection.cfm) と新 REST API の判定・一覧・集計を突き合わせる。

前提: docker compose up -d db web / backend (8080) が起動済み。
注意: 両系統に検査結果を実際に INSERT する (lot_no=CMP-LEGACY / CMP-NEW)。
"""
import html
import json
import re
import sys
import urllib.parse
import urllib.request

LEGACY = "http://localhost:8888/inspection.cfm"
API = "http://localhost:8080/api"

SPEC_MIN, SPEC_MAX = "219.900", "220.100"
CASES = [
    "219.899", "219.900", "219.901", "220.000", "220.089", "220.090",
    "220.091", "220.099", "220.100", "220.101", "abc", "",
]
# 旧画面は double 演算のため 220.100 - 220.090 = 0.00999999... となり「再検査」になる。
# 新実装は仕様 (差ちょうど 0.010 は OK) どおり BigDecimal で判定するため、意図した差異として扱う。
INTENDED_DIFFS = {"220.090": ("再検査", "OK")}


def legacy_register(sunpou):
    data = urllib.parse.urlencode({
        "mode": "regist", "shiji_no": "SJ-2608-0014", "lot_no": "CMP-LEGACY", "kensa_sha": "cmp",
        "sunpou": sunpou, "kijun_min": SPEC_MIN, "kijun_max": SPEC_MAX, "furyo_naiyo": "",
    }).encode()
    body = urllib.request.urlopen(LEGACY, data).read().decode()
    m = re.search(r"判定は (.+?) です", body)
    if m:
        return m.group(1)
    return "ERROR" if "数値で入力してください" in body else "?"


def api_register(sunpou):
    req = urllib.request.Request(f"{API}/inspections", method="POST", headers={"Content-Type": "application/json"},
                                 data=json.dumps({"shiji_no": "SJ-2608-0014", "lot_no": "CMP-NEW", "kensa_sha": "cmp",
                                                  "sunpou": sunpou, "kijun_min": SPEC_MIN, "kijun_max": SPEC_MAX,
                                                  "furyo_naiyo": ""}).encode())
    try:
        return json.load(urllib.request.urlopen(req))["hantei"]
    except urllib.error.HTTPError as e:
        return "ERROR" if e.code == 400 else f"HTTP {e.code}"


def legacy_history(query):
    body = urllib.request.urlopen(f"{LEGACY}?{urllib.parse.urlencode(query)}").read().decode()
    section = body.split("■ 検査履歴")[1].split("■ 不良内容")[0]
    return [int(x) for x in re.findall(r'<td class="num">(\d+)</td>\s*<td><a href="order_detail', section)]


def legacy_summary():
    body = urllib.request.urlopen(LEGACY).read().decode()
    section = body.split("■ 不良内容 集計")[1]
    return [(html.unescape(a).strip(), int(b)) for a, b in
            re.findall(r"<td>([^<]*)</td>\s*<td class=\"num\">(\d+)</td>", section)]


def legacy_orders():
    body = urllib.request.urlopen(LEGACY).read().decode()
    return re.findall(r'<option value="([^"]+)"', body)


def get(path, query=None):
    return json.load(urllib.request.urlopen(f"{API}{path}?{urllib.parse.urlencode(query or {})}"))


def main():
    diffs = 0
    print(f"規格 {SPEC_MIN}〜{SPEC_MAX}")
    print(f"{'sunpou':>10} | {'legacy':<6} | {'new':<6}")
    for s in CASES:
        old, new = legacy_register(s), api_register(s)
        if old == new:
            mark = ""
        elif INTENDED_DIFFS.get(s) == (old, new):
            mark = "  <-- 意図した差異 (浮動小数点誤差の解消)"
        else:
            mark = "  <-- 差異"
            diffs += 1
        print(f"{s!r:>10} | {old:<6} | {new:<6}{mark}")

    for query in ({}, {"hantei": "NG"}, {"hantei": "再検査"}, {"shiji_no": "SJ-2608-0009"}):
        old = legacy_history(query)
        new = [r["kensa_id"] for r in get("/inspections", query)]
        ok = old == new
        diffs += not ok
        print(f"一覧 {query}: legacy={len(old)}件 new={len(new)}件 {'一致' if ok else '不一致'}")

    old = legacy_summary()
    new = [(r["furyo_naiyo"], r["ken"]) for r in get("/inspections/defect-summary")]
    diffs += old != new
    print(f"不良内容集計: {'一致' if old == new else f'不一致 {old} / {new}'}")

    old = legacy_orders()
    new = [r["shiji_no"] for r in get("/production-orders")]
    diffs += old != new
    print(f"製造指示ドロップダウン: {'一致' if old == new else '不一致'} ({len(new)}件)")
    return 1 if diffs else 0


if __name__ == "__main__":
    sys.exit(main())
