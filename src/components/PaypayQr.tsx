import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { checkPaypayLink } from '../share';

type Props = { link: string; onChange: (link: string) => void };

/**
 * 幹事がPayPayアプリで作った受け取り用リンクを貼ると、QRコードにして表示する。
 * リンクは設定に保存され、次回からは貼らなくてよい。
 */
export default function PaypayQr({ link, onChange }: Props) {
  const [open, setOpen] = useState(!!link);
  const [qr, setQr] = useState('');
  const check = checkPaypayLink(link);
  const usable = check === 'paypay' || check === 'other';

  useEffect(() => {
    if (!usable) {
      setQr('');
      return;
    }
    let alive = true;
    QRCode.toDataURL(link.trim(), { width: 240, margin: 1 })
      .then((url) => alive && setQr(url))
      .catch(() => alive && setQr(''));
    return () => {
      alive = false;
    };
  }, [link, usable]);

  if (!open) {
    return (
      <button type="button" className="paypay-open" onClick={() => setOpen(true)}>
        📱 PayPayの受け取りQRを表示する
      </button>
    );
  }

  return (
    <div className="paypay">
      <label>
        PayPayの受け取りリンク
        <input
          type="url"
          inputMode="url"
          value={link}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://qr.paypay.ne.jp/…"
        />
      </label>
      {check === 'empty' && (
        <p className="muted">
          PayPayアプリの「受け取る」でリンクをコピーして、ここに貼ってください。一度貼ると次回からは自動で入ります。
        </p>
      )}
      {check === 'invalid' && <p className="route-error">https:// で始まるリンクを貼ってください。</p>}
      {check === 'other' && <p className="warn">PayPayのリンクではないようです。貼ったリンクを確認してください。</p>}
      {qr && (
        <div className="paypay-qr">
          <img src={qr} alt="PayPayの受け取りリンクのQRコード" width={200} height={200} />
          <p className="muted">みんなのスマホのカメラで読み取ると、PayPayが開きます。</p>
          <a href={link.trim()} target="_blank" rel="noreferrer">
            リンクを開く
          </a>
          <button type="button" className="link clear-link" onClick={() => onChange('')}>
            リンクを消す
          </button>
        </div>
      )}
    </div>
  );
}
