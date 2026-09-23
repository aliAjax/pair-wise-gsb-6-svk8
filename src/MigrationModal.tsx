import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Heart,
  RotateCcw,
  Type,
  X,
} from 'lucide-react';
import { FONT_CHOICES, buildMigrationPlan } from './migration';
import type { FontMigration, Pair } from './types';

interface MigrationModalProps {
  open: boolean;
  pairs: Pair[];
  hasUnsavedChanges: boolean;
  onClose: () => void;
  onMigrate: (oldFont: string, newFont: string) => FontMigration | null;
  onUndo: (archive: FontMigration) => void;
}

export function MigrationModal({
  open,
  pairs,
  hasUnsavedChanges,
  onClose,
  onMigrate,
  onUndo,
}: MigrationModalProps) {
  const [oldFont, setOldFont] = useState('Fraunces');
  const [newFont, setNewFont] = useState('Newsreader');
  const [result, setResult] = useState<FontMigration | null>(null);

  useEffect(() => {
    if (open) {
      setOldFont('Fraunces');
      setNewFont('Newsreader');
      setResult(null);
    }
  }, [open]);

  const plan = useMemo(
    () => buildMigrationPlan(pairs, oldFont, newFont),
    [pairs, oldFont, newFont],
  );

  if (!open) return null;

  const handleMigrate = () => {
    const archive = onMigrate(oldFont, newFont);
    if (archive) setResult(archive);
  };

  const handleUndo = () => {
    if (!result) return;
    onUndo(result);
    onClose();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal migration-modal" onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          <X size={17} />
        </button>

        {hasUnsavedChanges ? (
          <div className="migration-blocked">
            <AlertTriangle size={27} />
            <h2>迁移尚未开始</h2>
            <p>
              当前配对还有未保存的字体或排版调整。请先保存或放弃这些调整，再开始批量迁移。
            </p>
            <button className="primary" onClick={onClose}>
              返回编辑
            </button>
          </div>
        ) : result ? (
          <div className="migration-success">
            <CheckCircle2 size={31} />
            <h2>迁移完成</h2>
            <p>
              已将 {result.changes.length} 个配对的标题字体从
              <b> {result.oldFont} </b>
              替换为
              <b> {result.newFont}</b>。其他配对未改动。
            </p>
            <div className="modal-actions centered">
              <button className="outline" onClick={onClose}>
                完成
              </button>
              <button className="primary" onClick={handleUndo}>
                <RotateCcw size={14} />
                撤销这次迁移
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="migration-title">
              <span className="migration-icon">
                <Type size={18} />
              </span>
              <div>
                <span>BATCH FONT MIGRATION</span>
                <h2>停用标题字体</h2>
              </div>
            </div>

            <div className="migration-font-grid">
              <label>
                旧标题字体
                <select value={oldFont} onChange={e => setOldFont(e.target.value)}>
                  {FONT_CHOICES.map(font => (
                    <option key={font}>{font}</option>
                  ))}
                </select>
              </label>
              <ArrowRight className="migration-arrow" size={17} />
              <label>
                替代标题字体
                <select value={newFont} onChange={e => setNewFont(e.target.value)}>
                  {FONT_CHOICES.filter(font => font !== oldFont).map(font => (
                    <option key={font}>{font}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="affected-head">
              <div>
                <h3>受影响配对</h3>
                <span>{plan.affected.length} 项将被检查并批量替换</span>
              </div>
              {plan.canApply && <b className="ready">可以迁移</b>}
            </div>

            <div className="affected-list">
              {plan.affected.length === 0 && (
                <div className="migration-empty">没有使用 {oldFont} 的配对。</div>
              )}
              {plan.affected.map(pair => {
                const conflicting = plan.conflicts.some(item => item.id === pair.id);
                return (
                  <article
                    key={pair.id}
                    className={conflicting ? 'affected-item conflict' : 'affected-item'}
                  >
                    <div className="affected-item-head">
                      <span>{pair.title}</span>
                      <Heart
                        size={14}
                        fill={pair.favorite ? '#e88769' : 'none'}
                        color={pair.favorite ? '#e88769' : '#aeb5b7'}
                      />
                    </div>
                    <strong style={{ fontFamily: pair.headingFont }}>
                      {pair.heading}
                    </strong>
                    <p style={{ fontFamily: pair.bodyFont }}>{pair.body}</p>
                    <footer>
                      <span>标题：{pair.headingFont}</span>
                      <span>正文：{pair.bodyFont}</span>
                      {conflicting && (
                        <em>
                          <AlertTriangle size={12} />
                          替换后字体会撞成同一种
                        </em>
                      )}
                    </footer>
                  </article>
                );
              })}
            </div>

            <div className="migration-warnings">
              {plan.reasons.map(reason => (
                <div key={reason} className="warning">
                  <AlertTriangle size={14} />
                  {reason}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="outline" onClick={onClose}>
                取消
              </button>
              <button
                className="primary"
                disabled={!plan.canApply}
                onClick={handleMigrate}
              >
                确认并原子替换（{plan.affected.length} 项）
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
