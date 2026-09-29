# CLAUDE.md

このファイルは、Claude Code がこのプロジェクトで作業する際のガイドです。

## プロジェクト概要

複数人で簡単に割り勘ができる React アプリです。
飲み会・旅行での立て替えを記録し、最終的に「相殺後」の送金額を表示します。

## 設計書

`docs/warikan_design.md` と `docs/warikan_design_overview.md` に、画面遷移・データ構造・計算フローがあります。実装はこの設計に従ってください。

## 開発コマンド

- インストール: `npm install`
- 開発サーバー: `npm run dev`(http://localhost:5173/warikan-app/)
- テスト: `npm test`(計算ロジックは `src/calc.ts`、テストは `src/calc.test.ts`)
- ビルド: `npm run build`(型チェック込み、出力は `dist/`)

## デプロイ

- 公開先: https://shiomiawa.github.io/warikan-app/
- `main` へのプッシュで GitHub Actions(`.github/workflows/deploy.yml`)がテスト・ビルドし、GitHub Pages に公開する
- `vite.config.ts` の `base` はリポジトリ名(`/warikan-app/`)に合わせている

## ルール

- 金額は整数(円)で扱う
- 画面の文言はすべて日本語
- スマートフォンでも使いやすいレイアウトにする
- 端数処理(1円・10円・100円単位)を明示し、余りは立て替え者に寄せる
- 計算ロジックにはテストを書く
- 既存コードの命名・書式・コメント量に合わせる

## Git運用ルール

- **コードを変更するたびに、GitHubへプッシュする。**
  - 変更 → `git add` → `git commit` → `git push` をひとまとまりの作業として行う
  - 変更を溜め込まず、小さな単位でコミット・プッシュする
- コミットメッセージは、何をなぜ変更したか分かるように簡潔に書く
- `git push --force` は、明示的な指示がない限り使わない
- 秘密情報(APIキー、`.env` など)はコミットしない。必要なら `.gitignore` に追加する
