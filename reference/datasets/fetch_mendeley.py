#!/usr/bin/env python3
"""Download the Mendeley "Image Dataset on Eye Diseases Classification" (DOI 10.17632/n9zp473wfw.2).

Reference use only (see README.md in this folder): the images are NOT committed to the repo.
Python 3 standard library only. Resumable: files already downloaded and matching the published
SHA-256 are skipped. Usage:

    python fetch_mendeley.py                              # all classes -> ./data/mendeley_n9zp473wfw
    python fetch_mendeley.py --classes Conjunctivitis Normal
    python fetch_mendeley.py --out D:\\datasets\\eye
"""
import argparse
import collections
import hashlib
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

DATASET_ID = "n9zp473wfw"
API = f"https://data.mendeley.com/public-api/datasets/{DATASET_ID}"
# Mendeley's API returns only folder ids, not folder names. Each id below was matched to its class
# by file count, which equals the per-class counts the authors publish for the data *before*
# SMOTE (Cataract 544, Conjunctivitis 357, Eyelid 525, Normal 649, Uveitis 223); the script
# aborts if the counts ever stop matching. The Conjunctivitis and Normal folders were also
# checked by eye.
FOLDERS = {
    "03f5c932-0989-4dab-9428-29505ee62895": ("Conjunctivitis", 357),
    "a69d3ef0-a997-464e-af75-432a5e7d165b": ("Normal", 649),
    "0c4aa446-e535-448d-bc65-afede618d085": ("Cataract", 544),
    "3a484383-d2cf-4cc0-93bc-55a8e7faa8a8": ("Eyelid", 525),
    "20b6cff3-abf8-41be-a580-afbeef78566b": ("Uveitis", 223),
}
# Mendeley rejects Python's default User-Agent with HTTP 403.
HEADERS = {"User-Agent": "curl/8"}


def fetch(url, timeout=60, tries=6):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            return urllib.request.urlopen(req, timeout=timeout).read()
        except Exception:
            if attempt == tries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join("data", f"mendeley_{DATASET_ID}"))
    ap.add_argument("--classes", nargs="*", help="subset, e.g. Conjunctivitis Normal")
    args = ap.parse_args()

    meta = json.loads(fetch(API))
    files = meta["files"]
    counts = collections.Counter(f.get("folder_id") for f in files)
    for fid, (name, expected) in FOLDERS.items():
        if counts.get(fid) != expected:
            sys.exit(f"Folder {name} has {counts.get(fid)} files, expected {expected}. "
                     "The dataset changed; re-check the folder mapping before continuing.")

    wanted = set(args.classes) if args.classes else {n for n, _ in FOLDERS.values()}
    items = [f for f in files if f.get("folder_id") in FOLDERS and FOLDERS[f["folder_id"]][0] in wanted]

    def get(f):
        cls = FOLDERS[f["folder_id"]][0]
        cd = f["content_details"]
        stem, ext = os.path.splitext(f["filename"])
        # Filenames repeat across folders, so the file id keeps them unique.
        path = os.path.join(args.out, cls, f"{stem}__{f['id'][:8]}{ext}")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        if os.path.exists(path) and hashlib.sha256(open(path, "rb").read()).hexdigest() == cd["sha256_hash"]:
            return cls, True
        try:
            data = fetch(cd["download_url"])
        except Exception:
            return cls, False
        ok = hashlib.sha256(data).hexdigest() == cd["sha256_hash"]
        if ok:
            with open(path, "wb") as fh:
                fh.write(data)
        return cls, ok

    with ThreadPoolExecutor(4) as pool:
        results = list(pool.map(get, items))
    per_class = collections.Counter(c for c, ok in results if ok)
    failed = sum(1 for _, ok in results if not ok)
    print(dict(per_class), "failed or checksum mismatch:", failed)
    print("Credit (CC BY 4.0): Marzia Ahmed, Abu Kowshir Bitto, Daffodil International University,"
          " DOI 10.17632/n9zp473wfw.2")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
