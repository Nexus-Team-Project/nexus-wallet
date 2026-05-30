# -*- coding: utf-8 -*-
import json, urllib.request, urllib.parse, time

# biz key -> (search terms per lang, filename keywords that mark a real logo)
BRANDS = [
    ("castro",      [("he", "קסטרו רשת אופנה"), ("en", "Castro fashion Israel")], ["castro", "קסטרו"]),
    ("ksp",         [("he", "KSP רשת מחשבים"), ("en", "KSP computers Israel")],   ["ksp"]),
    ("holmesplace", [("en", "Holmes Place"), ("he", "הולמס פלייס")],              ["holmes"]),
    ("shufersal",   [("he", "שופרסל"), ("en", "Shufersal")],                      ["shufersal", "שופרסל"]),
    ("hm",          [("en", "H&M"), ("he", "H&M")],                              ["h&m", "h%26m", "hm-logo", "h_and_m"]),
    ("superpharm",  [("he", "סופר פארם"), ("en", "Super-Pharm")],                 ["super", "pharm", "פארם"]),
    ("isrotel",     [("he", "ישרוטל"), ("en", "Isrotel")],                        ["isrotel", "ישרוטל"]),
    ("cinema-city", [("he", "סינמה סיטי")],                                       ["cinema", "סינמה"]),
    ("aroma",       [("he", "ארומה אספרסו בר")],                                  ["aroma", "ארומה"]),
]

UA = {"User-Agent": "Mozilla/5.0 (logo-finder)"}

def api(lang, params, tries=4):
    base = f"https://{lang}.wikipedia.org/w/api.php"
    params = dict(params); params["format"] = "json"
    url = base + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 * (i + 1)); continue
            raise
    return {}

def search_title(lang, term):
    d = api(lang, {"action": "query", "list": "search", "srsearch": term, "srlimit": "1"})
    hits = d.get("query", {}).get("search", [])
    return hits[0]["title"] if hits else None

def page_images(lang, title):
    d = api(lang, {"action": "query", "titles": title, "prop": "images",
                   "imlimit": "300", "redirects": "1"})
    out = []
    for p in d.get("query", {}).get("pages", {}).values():
        for im in p.get("images", []):
            out.append(im["title"])
    return out

def lead_image(lang, title):
    d = api(lang, {"action": "query", "titles": title, "prop": "pageimages",
                   "piprop": "original", "redirects": "1"})
    for p in d.get("query", {}).get("pages", {}).values():
        src = p.get("original", {}).get("source")
        if src:
            return src
    return None

def image_url(lang, filetitle):
    d = api(lang, {"action": "query", "titles": filetitle, "prop": "imageinfo",
                   "iiprop": "url", "redirects": "1"})
    for p in d.get("query", {}).get("pages", {}).values():
        ii = p.get("imageinfo")
        if ii:
            return ii[0]["url"]
    return None

for key, candidates, kws in BRANDS:
    print(f"\n## {key}")
    done = False
    for lang, term in candidates:
        title = search_title(lang, term); time.sleep(1.2)
        if not title:
            continue
        print(f"   page: {lang}:{title}")
        # 1) brand-name logo files
        files = page_images(lang, title); time.sleep(1.2)
        cands = [f for f in files
                 if ("logo" in f.lower() or any(k in f.lower() for k in kws))
                 and any(k in f.lower() for k in kws)
                 and not any(b in f.lower() for b in ["building", "headquarter", "store", "branch", "disambig", "commons-logo", "instagram", "telegram", "facebook"])]
        for f in cands[:4]:
            u = image_url(lang, f); time.sleep(1.0)
            print(f"      FILE {f}  ->  {u}")
            done = True
        # 2) lead image fallback
        lead = lead_image(lang, title); time.sleep(1.2)
        if lead:
            print(f"      LEAD {lead}")
        if done:
            break
