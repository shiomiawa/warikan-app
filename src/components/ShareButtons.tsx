import { useState } from 'react';
import { lineShareUrl, smsShareUrl } from '../share';

/** 割り勘結果を LINE・SMS・その他のアプリ・コピーで共有するボタン */
export default function ShareButtons({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('コピーできませんでした。手動でコピーしてください。');
    }
  };

  const shareOther = async () => {
    try {
      await navigator.share({ text });
    } catch {
      // 共有をキャンセルしたときは何もしない
    }
  };

  return (
    <div className="share-buttons">
      <a className="share line" href={lineShareUrl(text)} target="_blank" rel="noreferrer">
        LINEで送る
      </a>
      <a className="share sms" href={smsShareUrl(text)}>
        SMSで送る
      </a>
      {canShare && (
        <button type="button" className="share" onClick={shareOther}>
          ほかのアプリ
        </button>
      )}
      <button type="button" className="share" onClick={copy}>
        {copied ? 'コピーしました' : 'コピー'}
      </button>
    </div>
  );
}
