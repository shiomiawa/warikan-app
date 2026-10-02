import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent } from 'react';
import QRCode from 'qrcode';
import { shrinkImage } from '../image';
import { checkPaypayLink } from '../share';

type Props = {
  link: string;
  onChange: (link: string) => void;
  image: string;
  onChangeImage: (image: string) => void;
};

/**
 * 幹事がPayPayアプリで作った受け取り用リンクを貼ると、QRコードにして表示する。
 * リンクの代わりに、受け取りQRコードのスクショを貼ってそのまま表示することもできる。
 * リンクもスクショも設定に保存され、次回からは貼らなくてよい。
 */
export default function PaypayQr({ link, onChange, image, onChangeImage }: Props) {
  const [open, setOpen] = useState(!!link || !!image);
  const [qr, setQr] = useState('');
  const [imageError, setImageError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
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

  const takeImage = async (file: Blob | null | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageError('');
    try {
      onChangeImage(await shrinkImage(file));
    } catch {
      setImageError('画像を読み込めませんでした。別の画像を選んでください。');
    }
  };

  // パソコンでは、コピーしたスクショをこの枠の中で Ctrl+V しても貼れる
  const onPaste = (e: ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items)
      .find((item) => item.type.startsWith('image/'))
      ?.getAsFile();
    if (file) {
      e.preventDefault();
      takeImage(file);
    }
  };

  if (!open) {
    return (
      <button type="button" className="paypay-open" onClick={() => setOpen(true)}>
        📱 PayPayの受け取りQRを表示する
      </button>
    );
  }

  return (
    <div className="paypay" onPaste={onPaste}>
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
      {check === 'empty' && !image && (
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

      <div className="paypay-shot">
        <span className="field-label">または、受け取りQRコードのスクショ</span>
        {image ? (
          <div className="paypay-qr">
            <img src={image} alt="PayPayの受け取りQRコードのスクショ" className="paypay-shot-image" />
            <p className="muted">みんなのスマホのカメラで、画像のQRコードを読み取ってもらってください。</p>
            <button type="button" className="link clear-link" onClick={() => onChangeImage('')}>
              スクショを消す
            </button>
          </div>
        ) : (
          <>
            <button type="button" className="wide" onClick={() => fileInput.current?.click()}>
              🖼️ スクショを選ぶ
            </button>
            <p className="muted">
              PayPayアプリの「受け取る」画面のスクショを選んでください。パソコンでは、コピーした画像をここで貼り付け（Ctrl+V）もできます。
            </p>
          </>
        )}
        {imageError && <p className="route-error">{imageError}</p>}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            takeImage(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
