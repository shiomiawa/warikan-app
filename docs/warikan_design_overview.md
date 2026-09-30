# 割り勘アプリ 全体設計図（1枚版）

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'background': '#FFFFFF', 'primaryTextColor': '#222222', 'lineColor': '#555555', 'fontSize': '16px'}}}%%
flowchart TD
    subgraph TOP["① トップページ"]
        T0["トップ"]
        T1["⚙️ 設定<br/>通貨・為替レート<br/>ガソリン代の距離の入れ方"]
        T2["⚡ クイック割り勘<br/>人数・合計金額・端数処理"]
        T3["イベント一覧<br/>新しい順に5件・一番古い日付"]
        T4["イベント作成<br/>名前・種類・端数処理・メンバー"]
        T0 --> T1
        T0 --> T2
        T0 --> T3
        T0 --> T4
    end

    subgraph QUICK["② クイック割り勘（保存しない）"]
        Q1["負担の割り方<br/>均等・比率％・金額指定"]
        Q2["1人あたり／それぞれの負担額<br/>端数は幹事が負担"]
        Q3["集金チェック<br/>済み人数・残り金額"]
        Q1 --> Q2 --> Q3
    end

    subgraph UI["③ イベント画面"]
        E0["✏️ 編集<br/>名前・種類・端数処理<br/>メンバー2〜10人（動物アバター）"]
        E1["支払い項目の入力<br/>日付（カレンダー）・立て替え者<br/>詳細（任意・空なら自動で命名）"]
        C{"種類"}
        F["通常<br/>食事・宿泊・交通など<br/>金額・通貨（円／ドル／ウォン）"]
        G["ガソリン代<br/>地図で距離（標準）・往復<br/>燃費・単価（前回を引き継ぐ）"]
        H["高速代<br/>手入力 または<br/>自動で計算する（IC→IC）"]
        S["負担の割り方（折りたたみ）<br/>均等割り（標準）<br/>比率％（多め・ふつう・少なめ・なし）<br/>金額指定"]
        W["入力チェック<br/>ふつうの範囲外なら<br/>注意＋ぶっぶー音"]
        E1 --> C
        C -->|食事・宿泊など| F
        C -->|ガソリン| G
        C -->|高速| H
        F --> S
        G --> S
        H --> S
        S -->|保存（チャリーン音）| E1
        F -.-> W
        G -.-> W
        H -.-> W
    end

    subgraph DATA["④ 保存するデータ（ブラウザのローカルストレージ）"]
        D1[("イベント<br/>名前・種類・端数処理")]
        D2[("メンバー<br/>ニックネーム・アバター")]
        D3[("支払い項目<br/>日付・種類・金額・通貨")]
        D4[("負担設定<br/>均等・％・金額")]
        D5[("ガソリン詳細<br/>出発地・目的地・距離・燃費・単価")]
        D6[("高速代詳細<br/>IC・距離・車種・割引・金額")]
        D7[("アプリ設定<br/>レート・使う通貨<br/>距離の入れ方・PayPayリンク")]
    end

    subgraph EXT["⑤ 外部サービス"]
        X1["Nominatim ＋ OSRM<br/>地名→車のルート距離"]
        X2["LINE・SMS・共有シート"]
        X3["PayPay受け取りリンク<br/>→ QRコード表示"]
    end

    subgraph CALC["⑥ 精算の計算"]
        K1["項目ごとの金額（円）を確定<br/>外貨＝金額×レート<br/>ガソリン＝距離÷燃費×単価<br/>高速代＝金額欄（自動はNEXCO料金式の目安）"]
        K2["負担額＝金額×本人の％÷100<br/>端数は立て替え者に寄せる"]
        K3["各人の収支＝立て替え合計−負担合計"]
        K4["受け取る人と払う人を組み合わせ<br/>送金回数が最少になるよう相殺"]
        K1 --> K2 --> K3 --> K4
    end

    subgraph OUT["⑦ 精算結果画面"]
        R1["最終的な精算表<br/>誰が誰にいくら払うか"]
        R2["各人の収支・項目ごとの明細<br/>新しい日付順"]
        R3["共有：LINE・SMS・コピー<br/>PayPayのQRコード"]
        R1 --> R2 --> R3
    end

    T2 --> Q1
    T3 --> E1
    T4 --> E1
    E1 -.-> E0

    T1 -.-> D7
    E0 -.-> D1
    E0 -.-> D2
    E1 -.-> D3
    S -.-> D4
    G -.-> D5
    H -.-> D6

    G -.->|距離を調べる| X1
    H -.->|自動で計算する| X1

    E1 ==>|精算する| K1
    D3 -.-> K1
    D4 -.-> K1
    D7 -.-> K1
    K4 ==> R1

    Q3 --> X2
    Q3 --> X3
    R3 --> X2
    R3 --> X3

    %% ノードの色（淡い背景＋濃い文字で読みやすく。赤系は使わない）
    classDef top fill:#E0F2F1,stroke:#00796B,stroke-width:2px,color:#004D40
    classDef quick fill:#FFF3E0,stroke:#D9730D,stroke-width:2px,color:#7A3E00
    classDef ui fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef data fill:#FFF8E1,stroke:#A67C00,stroke-width:2px,color:#4E342E
    classDef ext fill:#EDE7F6,stroke:#6A4C93,stroke-width:2px,color:#311B92
    classDef calc fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef out fill:#ECEFF1,stroke:#546E7A,stroke-width:2px,color:#263238

    class T0,T1,T2,T3,T4 top
    class Q1,Q2,Q3 quick
    class E0,E1,C,F,G,H,S,W ui
    class D1,D2,D3,D4,D5,D6,D7 data
    class X1,X2,X3 ext
    class K1,K2,K3,K4 calc
    class R1,R2,R3 out

    %% 枠（サブグラフ）の色
    style TOP fill:#F4FBFA,stroke:#00796B,stroke-width:2px,color:#004D40
    style QUICK fill:#FFFAF3,stroke:#D9730D,stroke-width:2px,color:#7A3E00
    style UI fill:#F7FBFF,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    style DATA fill:#FFFDF5,stroke:#A67C00,stroke-width:2px,color:#4E342E
    style EXT fill:#F8F5FC,stroke:#6A4C93,stroke-width:2px,color:#311B92
    style CALC fill:#F6FBF6,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    style OUT fill:#F7F9FA,stroke:#546E7A,stroke-width:2px,color:#263238
```

| 色 | 意味 |
|---|---|
| 青緑 | ① トップページ |
| オレンジ | ② クイック割り勘 |
| 青 | ③ イベント画面（入力） |
| 黄 | ④ 保存するデータ |
| 紫 | ⑤ 外部サービス |
| 緑 | ⑥ 精算の計算 |
| 灰 | ⑦ 精算結果画面 |

- 実線の矢印：画面・処理の流れ
- 点線の矢印：データの保存・読み込み、外部サービスの呼び出し
- 太線の矢印：精算の実行と結果表示
