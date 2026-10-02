import Airplane from './Airplane';
import Cloud from './Cloud';

/** 背景に小さく散らす雲と飛行機(カードの後ろに置き、操作の邪魔にしない) */
export default function BackgroundDecor() {
  return (
    <div className="bg-decor" aria-hidden="true">
      <Cloud className="bg-cloud bg-cloud-1" />
      <Cloud className="bg-cloud bg-cloud-2" />
      <Cloud className="bg-cloud bg-cloud-3" />
      <Airplane className="bg-airplane" />
    </div>
  );
}
