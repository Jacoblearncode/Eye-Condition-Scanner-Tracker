#!/usr/bin/env python3
"""Checks conjunctivitis.json is structurally sound. Python 3 stdlib only.

    python validate.py

It cannot check that a claim is medically correct or faithfully paraphrases its source - that
needs a human (see README.md, 'How to review'). It does check that nothing is unsourced.
"""
import json
import os
import re
import sys

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "conjunctivitis.json")
d = json.load(open(path, encoding="utf-8"))
errors, warnings = [], []

sources = {s["id"] for s in d["sources"]}
for s in d["sources"]:
    for key in ("publisher", "title", "url", "licence"):
        if not s.get(key):
            errors.append(f"source {s.get('id')}: missing {key}")
    if not s["url"].startswith("https://"):
        errors.append(f"source {s['id']}: url is not https")


def check_claims(owner, claims):
    if not claims:
        errors.append(f"{owner}: no claims (every entry needs at least one sourced claim)")
        return
    for c in claims:
        if c.get("source") not in sources:
            errors.append(f"{owner}: claim cites unknown source {c.get('source')!r}")
        if not c.get("says"):
            errors.append(f"{owner}: claim from {c.get('source')} has no 'says' paraphrase")
        q = c.get("quote")
        if q and len(q.split()) > 15:
            errors.append(f"{owner}: quote from {c.get('source')} is over 15 words; paraphrase instead")


ids = set()


def register(i):
    if i in ids:
        errors.append(f"duplicate id {i}")
    if not re.fullmatch(r"[a-z]+\.[a-z0-9_]+", i):
        errors.append(f"id {i!r} does not match group.snake_case")
    ids.add(i)


for it in d["items"]:
    register(it["id"])
    check_claims(it["id"], it.get("claims"))
    for key in ("labelEn", "askEn", "reportedBy"):
        if not it.get(key):
            errors.append(f"{it['id']}: missing {key}")
    if "photoVisibleByApp" not in it:
        errors.append(f"{it['id']}: missing photoVisibleByApp")
for t in d["riskFactorsAndTriggers"]["items"]:
    register(t["id"])
    check_claims(t["id"], t.get("claims"))
for c in d["courseAndDuration"]:
    register(c["id"])
    check_claims(c["id"], c.get("claims"))
for c in d["selfCareAndHygiene"]["items"]:
    register(c["id"])
    check_claims(c["id"], c.get("claims"))

COMPUTED = ("course.", "profile.")  # conditions the app computes; not entries in this file
for r in d["actionRulesCandidates"]["rules"]:
    register(r["id"])
    check_claims(r["id"], r.get("claims"))
    if r.get("status") != "proposed-needs-clinician-decision":
        errors.append(f"{r['id']}: rule status must stay 'proposed-needs-clinician-decision' until a clinician signs off")
    for ref in r["whenAnyOf"]:
        if ref not in ids and not ref.startswith(COMPUTED):
            errors.append(f"{r['id']}: condition {ref} is not an item id or a computed course./profile. condition")
    if r["proposedAdvice"] not in ("contact-clinic", "contact-clinic-urgently"):
        errors.append(f"{r['id']}: advice must be a contact message, never a diagnosis or severity label")

for term in ("viral conjunctivitis", "bacterial conjunctivitis", "allergic conjunctivitis"):
    for it in d["items"]:
        if term in (it.get("labelEn", "") + it.get("askEn", "")).lower():
            errors.append(f"{it['id']}: label/question names a conjunctivitis type ({term}); types wait for a doctor (D1/Q9)")

if d["meta"]["status"] != "draft-not-clinician-reviewed":
    warnings.append("meta.status changed - make sure a clinician review is actually recorded in README.md")

print(f"{len(d['items'])} items, {len(d['riskFactorsAndTriggers']['items'])} triggers, "
      f"{len(d['selfCareAndHygiene']['items'])} self-care, {len(d['actionRulesCandidates']['rules'])} rules, "
      f"{len(d['sources'])} sources")
for w in warnings:
    print("WARNING:", w)
for e in errors:
    print("ERROR:", e)
sys.exit(1 if errors else 0)
