import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import i18next from 'i18next';
import ts from 'typescript';
import { buildI18nOptions } from '../src/i18n/config';
import { LANGUAGES, resolveLanguage, isLanguageSetting } from '../src/i18n/languages';
import { en } from '../src/i18n/locales/en';
import { ms } from '../src/i18n/locales/ms';
import { ROUTINE_SYMPTOM_IDS } from '../src/utils/symptomIds';
import { RED_FLAG_SYMPTOMS } from '../src/utils/severityUtils';

function flatten(obj: object, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else Object.assign(out, flatten(v as object, key));
  }
  return out;
}
const placeholders = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort();

describe('translations', () => {
  const fe = flatten(en);
  const fm = flatten(ms);

  it('Malay has exactly the English keys', () => {
    assert.deepEqual(Object.keys(fm).sort(), Object.keys(fe).sort());
  });

  it('no string is empty', () => {
    for (const [k, v] of [...Object.entries(fe), ...Object.entries(fm)]) assert.ok(v.trim().length > 0, k);
  });

  it('Malay text was actually translated, not copied from English', () => {
    const same = Object.keys(fe).filter((k) => fe[k] === fm[k]);
    assert.deepEqual(same, []);
  });

  it('placeholders match between languages', () => {
    for (const k of Object.keys(fe)) assert.deepEqual(placeholders(fm[k]), placeholders(fe[k]), k);
  });

  it('every symptom and red-flag id has text in every language', () => {
    for (const id of ROUTINE_SYMPTOM_IDS) assert.ok(fe[`symptoms.items.${id}`] && fm[`symptoms.items.${id}`], id);
    for (const id of RED_FLAG_SYMPTOMS) {
      for (const part of ['label', 'message']) assert.ok(fe[`redFlags.${id}.${part}`] && fm[`redFlags.${id}.${part}`], `${id}.${part}`);
    }
  });

  it('the language switcher changes the text, and a missing key falls back to English', async () => {
    const i18n = i18next.createInstance();
    await i18n.init(buildI18nOptions('ms'));
    assert.equal(i18n.t('common.done'), ms.common.done);
    await i18n.changeLanguage('en');
    assert.equal(i18n.t('common.done'), en.common.done);
    // Simulate a Malay translation that lacks a key.
    const partial = i18next.createInstance();
    await partial.init({ ...buildI18nOptions('ms'), resources: { en: { translation: en }, ms: { translation: { common: {} } } } });
    assert.equal(partial.t('common.done' as never), en.common.done);
  });
});

describe('language choice', () => {
  it('follows the phone when set to system', () => {
    assert.equal(resolveLanguage('system', ['ms']), 'ms');
    assert.equal(resolveLanguage('system', ['ms-MY']), 'ms');
    assert.equal(resolveLanguage('system', ['zh', 'ms']), 'ms'); // first supported language wins
    assert.equal(resolveLanguage('system', ['en-GB']), 'en');
  });
  it('falls back to English when the phone language is unsupported (Indonesian is not Malay)', () => {
    assert.equal(resolveLanguage('system', ['id']), 'en');
    assert.equal(resolveLanguage('system', []), 'en');
  });
  it('an explicit choice beats the phone language', () => {
    assert.equal(resolveLanguage('en', ['ms']), 'en');
    assert.equal(resolveLanguage('ms', ['en']), 'ms');
  });
  it('validates stored values', () => {
    for (const ok of ['system', ...LANGUAGES]) assert.ok(isLanguageSetting(ok));
    for (const bad of [null, undefined, '', 'fr', 'MS', 42]) assert.ok(!isLanguageSetting(bad));
  });
});

describe('no hard-coded user-visible text in the screens a fresh install uses', () => {
  const root = join(__dirname, '..');
  // AuthScreen and ResultsScreen are unrouted; they must be translated before they are routed (PLAN.md 0.11).
  const files = [
    ...['OnboardingScreen', 'HomeScreen', 'ScanScreen', 'SymptomScreen', 'ScanSavedScreen', 'SettingsScreen'].map(
      (n) => `src/screens/${n}.tsx`
    ),
    ...['LanguagePicker', 'RedFlagAlert'].map((n) => `src/components/${n}.tsx`),
  ].map((f) => join(root, f));
  const TEXT_ATTRS = new Set(['label', 'placeholder', 'title', 'accessibilityLabel', 'accessibilityHint', 'aria-label']);

  for (const file of files) {
    it(relative(root, file), () => {
      const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const found: string[] = [];
      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node) && /[A-Za-z]{2,}/.test(node.text)) found.push(`text "${node.text.trim()}"`);
        if (ts.isJsxAttribute(node) && TEXT_ATTRS.has(node.name.getText(sf)) && node.initializer && ts.isStringLiteral(node.initializer)) {
          found.push(`${node.name.getText(sf)}="${node.initializer.text}"`);
        }
        if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression) && /[A-Za-z]{2,}/.test(node.expression.text)) {
          found.push(`{"${node.expression.text}"}`);
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
      assert.deepEqual(found, []);
    });
  }
});
