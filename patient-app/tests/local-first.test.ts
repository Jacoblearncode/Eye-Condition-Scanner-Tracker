// Guards PLAN.md D3 (local-first) and Q15/0.10 (no login on the default path): the code a fresh
// install runs must not import Firebase, the cloud upload code, or make network calls.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';

const root = join(__dirname, '..');
const list = (dir: string) =>
  readdirSync(join(root, dir)).filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.d.ts')).map((f) => join(root, dir, f));

// Everything a fresh install runs. Deliberately NOT listed (unrouted until Phase 4/0.8):
// AuthScreen, ResultsScreen, hooks/useAuth, hooks/useScan, services/{firebase,cloudinary,aiPipeline,cloudShare}Service.
const defaultPath = [
  join(root, 'App.tsx'),
  join(root, 'src/navigation/RootNavigator.tsx'),
  join(root, 'src/services/scanService.ts'),
  ...list('src/storage'),
  ...list('src/i18n'),
  ...list('src/i18n/locales'),
  ...list('src/utils'),
  ...['OnboardingScreen', 'HomeScreen', 'ScanScreen', 'SymptomScreen', 'ScanSavedScreen', 'SettingsScreen'].map((n) =>
    join(root, `src/screens/${n}.tsx`)
  ),
  ...['I18nGate', 'LanguagePicker', 'RedFlagAlert'].map((n) => join(root, `src/components/${n}.tsx`)),
];

const FORBIDDEN_IMPORT = /firebase|cloudinary|aiPipeline|cloudShare|useAuth|useScan|AuthScreen|ResultsScreen/i;

function parse(file: string) {
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

describe('default path stays local-first and login-free', () => {
  for (const file of defaultPath) {
    it(`${relative(root, file)} has no cloud/auth imports or network calls`, () => {
      const sf = parse(file);
      const problems: string[] = [];
      const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
          const spec = (node as ts.ImportDeclaration).moduleSpecifier;
          if (spec && ts.isStringLiteral(spec) && FORBIDDEN_IMPORT.test(spec.text)) problems.push(`imports ${spec.text}`);
        }
        if (ts.isCallExpression(node)) {
          const callee = node.expression.getText(sf);
          if (callee === 'fetch' || callee === 'globalThis.fetch' || callee === 'require') {
            if (callee === 'fetch' || callee === 'globalThis.fetch') problems.push('calls fetch');
            if (callee === 'require' && node.arguments[0] && FORBIDDEN_IMPORT.test(node.arguments[0].getText(sf))) problems.push('requires cloud code');
          }
        }
        if (ts.isNewExpression(node) && node.expression.getText(sf) === 'XMLHttpRequest') problems.push('uses XMLHttpRequest');
        ts.forEachChild(node, visit);
      };
      visit(sf);
      assert.deepEqual(problems, []);
    });
  }
});
