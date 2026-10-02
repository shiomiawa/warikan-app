import CalculatorWithSuitcase from './illustrations/CalculatorWithSuitcase';

/** 最初に見せる、ひと目でわかる4ステップ(アイコン・見出し・ひとこと) */
const QUICK_STEPS = [
  ['🗓️', '作る', 'イベント名とメンバーを入れる'],
  ['🧾', '入れる', '立て替えるたびに、金額と立て替えた人'],
  ['💸', '精算する', '誰が誰にいくら送るかが出る'],
  ['📨', '送る', 'LINEで送る（PayPayリンク付き）'],
];

/** 使い方のページ(トップの「📖 使い方」から開く)。4ステップを先に見せ、くわしい説明は畳んでおく */
export default function HelpView() {
  return (
    <div className="help">
      <CalculatorWithSuitcase className="empty-illust" />

      <section className="card">
        <h2>4ステップでわかる使い方</h2>
        <ol className="quick-steps">
          {QUICK_STEPS.map(([icon, title, text], i) => (
            <li key={title}>
              <span className="quick-step-no">{i + 1}</span>
              <span className="quick-step-icon" aria-hidden="true">
                {icon}
              </span>
              <span>
                <strong>{title}</strong>
                <span className="quick-step-text">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="muted">入力するのは幹事1人だけ。その場で割るだけなら「⚡ クイック割り勘」がいちばん早いです。</p>
      </section>

      <p className="help-more">くわしい使い方（タップで開く）</p>

      <details className="card detail-fold">
        <summary>
          <h2>⚡ クイック割り勘</h2>
        </summary>
        <ol className="help-steps">
          <li>トップの「⚡ クイック割り勘」を押します。</li>
          <li>人数・合計金額・端数処理を入れると、1人あたりの金額が出ます。端数は幹事が負担します。</li>
          <li>多め・少なめに払う人がいるときは、「負担の割り方」で比率（%）や金額を変えられます。</li>
          <li>「集金チェック」で、受け取った人にチェックを付けていきます。</li>
        </ol>
        <p className="muted">クイック割り勘は保存されません。</p>
      </details>

      <details className="card detail-fold">
        <summary>
          <h2>✈️ イベントで割り勘</h2>
        </summary>
        <ol className="help-steps">
          <li>トップでイベント名・種類・端数処理・メンバー（2〜30人）を決めて「作成する」を押します。</li>
          <li>
            立て替えがあるたびに「＋ 項目を追加」で、日付・種類・立て替えた人・金額を入れます。詳細（店名など）は空でも、種類から名前が付きます。
          </li>
          <li>ガソリン代は、地図で調べた距離や燃費から計算できます。高速代は、手入力か、IC から料金の目安を自動で計算できます。</li>
          <li>一部の人だけで払った項目は、「負担の割り方」で均等割り・比率指定（%）・金額指定を選びます。</li>
          <li>入れ終わったら「精算する」を押すと、精算結果が出ます。送金の回数がいちばん少なくなる組み合わせです。</li>
        </ol>
      </details>

      <details className="card detail-fold">
        <summary>
          <h2>📨 解散後の精算</h2>
        </summary>
        <p>精算結果の「解散後の精算の連絡」から、LINE・SMS で連絡できます。</p>
        <ol className="help-steps">
          <li>「幹事（PayPayのリンクを集める人）」を選びます。</li>
          <li>
            ① の「まとめて頼む」でグループに送ると、お金を受け取る人が PayPay の受け取りリンクを作って、幹事に送ってくれます。交流のない人には「◯さんに頼む」で個別にも送れます。
          </li>
          <li>届いたリンクを、受け取る人ごとの欄に貼ります。名前で覚えるので、次のイベントでも自動で入ります。</li>
          <li>② の「◯さんへ」で、払う人それぞれに相手・金額・受け取る人のリンクを送ります。リンクがまだないときは「送り先がわからない場合は幹事に連絡」と添えます。</li>
          <li>入金を確認したら「精算済にする」を押します。グレーになり、全員済むとお知らせが出ます。</li>
        </ol>
        <p>
          全員にまとめて送るときは、カードの下の「LINEで送る」を使います。「明細と各人の収支も入れて送る」にチェックを入れると、何にいくら使ったかも全員に届きます。長くて途中で切れるときは「コピー」して貼り付けてください。
        </p>
      </details>

      <details className="card detail-fold">
        <summary>
          <h2>⚙️ 設定</h2>
        </summary>
        <ul className="help-steps">
          <li>米ドル・韓国ウォンを使うかどうかと、為替レートを決めます。外貨の項目は、このレートで円にしてから計算します。</li>
          <li>ガソリン代の距離の入れ方（地図のほかに、メーター・距離の直接入力）を選べます。</li>
          <li>イベントの名前やメンバーを変えるときは、イベント画面の「✏️ 編集」から変えます。</li>
        </ul>
      </details>

      <details className="card detail-fold">
        <summary>
          <h2>⚠️ 注意</h2>
        </summary>
        <ul className="help-steps">
          <li>データは、入力したスマホのブラウザの中にだけ保存されます。ほかの人のスマホとは共有されません。</li>
          <li>ブラウザの履歴やデータを消すと、イベントも消えます。</li>
          <li>PayPay の金額入りの請求リンクは、個人では作れません。送る人が PayPay で金額を入れて送金します。</li>
        </ul>
      </details>
    </div>
  );
}
