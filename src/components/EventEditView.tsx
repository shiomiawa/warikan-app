import { withMembers } from '../calc';
import type { Rounding, WarikanEvent } from '../types';
import KindField from './KindField';
import MembersEditor from './MembersEditor';

type Props = { event: WarikanEvent; onChange: (e: WarikanEvent) => void };

/** イベントの編集(名前・種類・端数処理・メンバー) */
export default function EventEditView({ event, onChange }: Props) {
  const payers = new Set(event.items.map((i) => i.payerId));

  return (
    <>
      <section className="card">
        <h2>イベント</h2>
        <label>
          イベント名
          <input value={event.name} onChange={(e) => onChange({ ...event, name: e.target.value })} />
        </label>
        <KindField value={event.kind} onChange={(kind) => onChange({ ...event, kind })} />
        <label>
          端数処理
          <select
            value={event.rounding}
            onChange={(e) => onChange({ ...event, rounding: Number(e.target.value) as Rounding })}
          >
            <option value={1}>1円単位</option>
            <option value={10}>10円単位</option>
            <option value={100}>100円単位</option>
          </select>
        </label>
      </section>

      <section className="card">
        <h2>メンバー</h2>
        <MembersEditor
          members={event.members}
          onChange={(members) => onChange(withMembers(event, members))}
          removeBlocker={(id) =>
            payers.has(id)
              ? `${event.members.find((m) => m.id === id)?.nickname}さんは立て替え者になっている項目があるため削除できません。先に項目を変更してください。`
              : null
          }
        />
      </section>
    </>
  );
}
