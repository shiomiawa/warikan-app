/** 入力欄の下に出す注意(通常の値から大きく外れているとき) */
export default function FieldWarning({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="field-warning" role="alert">
      ⚠️ {message}
    </p>
  );
}
