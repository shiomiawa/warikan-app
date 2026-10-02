import Airplane from './Airplane';
import Balloon from './Balloon';
import Cloud from './Cloud';

const CLOUDS = 12;
const AIRPLANES = 5;
const BALLOONS = 4;

/** 背景にまばらに散らす雲・飛行機・気球(カードの後ろに置き、操作の邪魔にしない)。位置は styles.css の番号付きクラスで決める */
export default function BackgroundDecor() {
  return (
    <div className="bg-decor" aria-hidden="true">
      {Array.from({ length: CLOUDS }, (_, i) => (
        <Cloud key={`c${i}`} className={`bg-cloud bg-cloud-${i + 1}`} />
      ))}
      {Array.from({ length: AIRPLANES }, (_, i) => (
        <Airplane key={`a${i}`} className={`bg-airplane bg-airplane-${i + 1}`} />
      ))}
      {Array.from({ length: BALLOONS }, (_, i) => (
        <Balloon key={`b${i}`} className={`bg-balloon bg-balloon-${i + 1}`} color={i % 2 === 0 ? 'pink' : 'blue'} />
      ))}
    </div>
  );
}
