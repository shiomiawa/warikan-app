import Airplane from './Airplane';
import Cloud from './Cloud';

const CLOUDS = 7;
const AIRPLANES = 3;

/** 背景にまばらに散らす雲と飛行機(カードの後ろに置き、操作の邪魔にしない)。位置は styles.css の番号付きクラスで決める */
export default function BackgroundDecor() {
  return (
    <div className="bg-decor" aria-hidden="true">
      {Array.from({ length: CLOUDS }, (_, i) => (
        <Cloud key={`c${i}`} className={`bg-cloud bg-cloud-${i + 1}`} />
      ))}
      {Array.from({ length: AIRPLANES }, (_, i) => (
        <Airplane key={`a${i}`} className={`bg-airplane bg-airplane-${i + 1}`} />
      ))}
    </div>
  );
}
