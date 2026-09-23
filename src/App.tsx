import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  Grid3X3,
  Heart,
  Plus,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Star,
  Trash2,
  Type,
} from 'lucide-react';
import { MigrationModal } from './MigrationModal';
import {
  DEFAULT_SETTINGS,
  applyHeadingMigration,
  undoMigration,
} from './migration';
import {
  draftEquals,
  loadMigrations,
  loadPairs,
  saveMigrations,
  savePairs,
} from './storage';
import type { FontMigration, Pair, PairDraft } from './types';

function draftFromPair(pair: Pair): PairDraft {
  return {
    headingFont: pair.headingFont,
    bodyFont: pair.bodyFont,
    size: pair.size,
    weight: pair.weight,
    leading: pair.leading,
    tracking: pair.tracking,
  };
}

export default function App() {
  const [pairs, setPairs] = useState<Pair[]>(loadPairs);
  const [migrationHistory, setMigrationHistory] =
    useState<FontMigration[]>(loadMigrations);
  const [selectedId, setSelectedId] = useState(() => loadPairs()[0]?.id ?? 0);
  const current = pairs.find(pair => pair.id === selectedId) ?? pairs[0];

  const [draft, setDraft] = useState<PairDraft>(() =>
    current ? draftFromPair(current) : { ...DEFAULT_SETTINGS },
  );
  const [showAdd, setShowAdd] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [lastMigration, setLastMigration] = useState<FontMigration | null>(
    () => migrationHistory[0] ?? null,
  );

  useEffect(() => savePairs(pairs), [pairs]);
  useEffect(() => saveMigrations(migrationHistory), [migrationHistory]);

  useEffect(() => {
    if (current) setDraft(draftFromPair(current));
  }, [selectedId]);

  useEffect(() => {
    if (!pairs.some(pair => pair.id === selectedId) && pairs[0]) {
      setSelectedId(pairs[0].id);
    }
  }, [pairs, selectedId]);

  const hasUnsavedChanges = Boolean(current && !draftEquals(current, draft));
  const favoriteCount = useMemo(
    () => pairs.filter(pair => pair.favorite).length,
    [pairs],
  );

  const updateDraft = (patch: Partial<PairDraft>) => {
    setDraft(d => ({ ...d, ...patch }));
  };

  const selectPair = (id: number) => {
    if (
      hasUnsavedChanges &&
      !window.confirm('当前配对有未保存调整，切换后这些调整会丢失。仍要切换吗？')
    ) {
      return;
    }
    setSelectedId(id);
  };

  const persistDraft = () => {
    if (!current) return;
    setPairs(items =>
      items.map(pair => (pair.id === current.id ? { ...pair, ...draft } : pair)),
    );
  };

  const toggleFav = () => {
    if (!current) return;
    setPairs(items =>
      items.map(pair =>
        pair.id === current.id ? { ...pair, favorite: !pair.favorite } : pair,
      ),
    );
  };

  const createPair = () => {
    if (!newTitle.trim()) return;
    const id = Date.now();
    const pair: Pair = {
      id,
      title: newTitle.trim(),
      heading: 'Your new headline',
      body: 'Start with a sentence that lets your type pairing show its character.',
      category: 'Untitled',
      favorite: false,
      ...DEFAULT_SETTINGS,
    };
    setPairs(items => [...items, pair]);
    setSelectedId(id);
    setDraft(draftFromPair(pair));
    setNewTitle('');
    setShowAdd(false);
  };

  const deleteCurrent = () => {
    if (!current) return;
    const next = pairs.filter(pair => pair.id !== current.id);
    setPairs(next);
    const fallback = next[0];
    setSelectedId(fallback?.id ?? 0);
    if (fallback) setDraft(draftFromPair(fallback));
  };

  const requestMigration = (oldFont: string, newFont: string) => {
    if (hasUnsavedChanges) return null;
    const outcome = applyHeadingMigration(pairs, oldFont, newFont);
    if (!outcome) return null;

    setPairs(outcome.pairs);
    setMigrationHistory(history => [outcome.archive, ...history]);
    setLastMigration(outcome.archive);
    const migratedCurrent = outcome.pairs.find(pair => pair.id === current?.id);
    if (migratedCurrent) setDraft(draftFromPair(migratedCurrent));
    return outcome.archive;
  };

  const undoLastMigration = (archive: FontMigration) => {
    if (hasUnsavedChanges) return;
    const restoredPairs = undoMigration(pairs, archive);
    setPairs(restoredPairs);
    setMigrationHistory(history => history.filter(item => item.id !== archive.id));
    setLastMigration(previous => (previous?.id === archive.id ? null : previous));
    const restoredCurrent = restoredPairs.find(pair => pair.id === current?.id);
    if (restoredCurrent) setDraft(draftFromPair(restoredCurrent));
  };

  const exportCss = () => {
    if (!current) return;
    const css = `/* ${current.title} */\n.heading { font-family: '${draft.headingFont}'; font-size: ${draft.size}px; font-weight: ${draft.weight}; }\n.body { font-family: '${draft.bodyFont}'; line-height: ${draft.leading}; letter-spacing: ${draft.tracking}px; }`;
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
    anchor.download = 'type-pair.css';
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <div className="brand-mark">
            <Type size={18} />
          </div>
          <div>
            <b>Type Pairer</b>
            <small>FIND YOUR VOICE</small>
          </div>
        </div>

        <div className="nav-section">
          <span>LIBRARY</span>
          <button className="nav active">
            <Grid3X3 size={16} />
            All pairings <b>{pairs.length}</b>
          </button>
          <button className="nav">
            <Heart size={16} />
            Favorites <b>{favoriteCount}</b>
          </button>
        </div>

        <div className="saved">
          <div className="saved-head">
            <span>COLLECTIONS</span>
            <button onClick={() => setShowAdd(true)}>
              <Plus size={14} />
            </button>
          </div>
          <button className="collection">
            <i style={{ background: '#e8b7a0' }} />
            Editorial <b>4</b>
          </button>
          <button className="collection">
            <i style={{ background: '#9fc9be' }} />
            Portfolio <b>3</b>
          </button>
          <button className="collection">
            <i style={{ background: '#b4add8' }} />
            Brand voice <b>5</b>
          </button>
        </div>

        <div className="aside-foot">
          <button className="nav">
            <Settings2 size={16} />
            Preferences
          </button>
          <div className="profile">
            <div className="avatar">YL</div>
            <div>
              <b>Yuki Lin</b>
              <small>Design workspace</small>
            </div>
            <ChevronDown size={14} />
          </div>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <div className="crumb">
              TYPE LIBRARY / <b>PAIRING STUDIO</b>
            </div>
            <h1>Find the right conversation.</h1>
            <p>Explore combinations, tune the details, and save what feels like you.</p>
          </div>
          <div className="actions">
            <button
              className="outline"
              onClick={() => setShowMigration(true)}
              title="批量迁移标题字体"
            >
              <RotateCcw size={15} />
              迁移字体
            </button>
            <button className="outline" onClick={exportCss}>
              <Download size={15} />
              Copy CSS
            </button>
            <button className="primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} />
              New pairing
            </button>
          </div>
        </header>

        {hasUnsavedChanges && (
          <div className="dirty-banner">
            <AlertTriangle size={15} />
            <span>当前配对有未保存调整；保存前不能开始批量迁移。</span>
            <button onClick={() => current && setDraft(draftFromPair(current))}>
              放弃
            </button>
            <button className="strong" onClick={persistDraft}>
              保存调整
            </button>
          </div>
        )}

        {lastMigration && !hasUnsavedChanges && (
          <div className="migration-banner">
            <Check size={15} />
            <span>
              上一批迁移已完成：{lastMigration.changes.length} 个标题字体由
              {lastMigration.oldFont} 改为 {lastMigration.newFont}。
            </span>
            <button onClick={() => undoLastMigration(lastMigration)}>
              <RotateCcw size={13} />
              仅撤销这批记录
            </button>
          </div>
        )}

        {current ? (
          <div className="layout">
            <section className="gallery">
              <div className="gallery-head">
                <div>
                  <h2>Saved pairings</h2>
                  <span>{pairs.length} compositions</span>
                </div>
                <div className="view-toggle">
                  <button className="on">
                    <Grid3X3 size={14} />
                  </button>
                  <button>
                    <BookOpen size={14} />
                  </button>
                </div>
              </div>

              <div className="pair-list">
                {pairs.map(pair => (
                  <button
                    key={pair.id}
                    className={current.id === pair.id ? 'pair selected' : 'pair'}
                    onClick={() => selectPair(pair.id)}
                  >
                    <div className="pair-top">
                      <span>{pair.category}</span>
                      <Heart
                        size={15}
                        fill={pair.favorite ? '#e88769' : 'none'}
                        color={pair.favorite ? '#e88769' : '#aeb5b7'}
                      />
                    </div>
                    <strong style={{ fontFamily: pair.headingFont }}>
                      {pair.heading}
                    </strong>
                    <p style={{ fontFamily: pair.bodyFont }}>{pair.body}</p>
                    <div className="pair-foot">
                      <span>{pair.title}</span>
                      <small>Open canvas →</small>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="studio">
              <div className="studio-head">
                <div>
                  <span>PAIRING CANVAS</span>
                  <h2>{current.title}</h2>
                </div>
                <button className="favorite" onClick={toggleFav}>
                  <Star
                    size={16}
                    fill={current.favorite ? '#e5a35e' : 'none'}
                    color={current.favorite ? '#e5a35e' : '#98a4a7'}
                  />
                </button>
              </div>

              <div className="canvas">
                <div className="canvas-bar">
                  <span>PREVIEW</span>
                  <div>
                    <button>Desktop</button>
                    <button>Tablet</button>
                    <button>Mobile</button>
                  </div>
                </div>
                <div className="preview">
                  <span className="preview-kicker">A NOTE ON TYPE</span>
                  <h3
                    style={{
                      fontFamily: draft.headingFont,
                      fontSize: `${draft.size}px`,
                      fontWeight: draft.weight,
                      letterSpacing: `${draft.tracking}px`,
                      lineHeight: 1.05,
                    }}
                  >
                    {current.heading}
                  </h3>
                  <p
                    style={{
                      fontFamily: draft.bodyFont,
                      lineHeight: draft.leading,
                      letterSpacing: `${draft.tracking / 2}px`,
                    }}
                  >
                    {current.body}
                  </p>
                  <div className="preview-rule" />
                  <span className="preview-meta">
                    PAIRING {current.id} · {current.category.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="controls">
                <div className="control-head">
                  <div>
                    <span>TYPE CONTROLS</span>
                    <h3>Fine tune your pairing</h3>
                  </div>
                  <SlidersHorizontal size={17} />
                </div>
                <div className="font-row">
                  <label>
                    Heading font
                    <select
                      value={draft.headingFont}
                      onChange={e => updateDraft({ headingFont: e.target.value })}
                    >
                      <option>Fraunces</option>
                      <option>DM Sans</option>
                      <option>Space Grotesk</option>
                      <option>Newsreader</option>
                      <option>IBM Plex Sans</option>
                      <option>Playfair Display</option>
                    </select>
                  </label>
                  <label>
                    Body font
                    <select
                      value={draft.bodyFont}
                      onChange={e => updateDraft({ bodyFont: e.target.value })}
                    >
                      <option>Fraunces</option>
                      <option>DM Sans</option>
                      <option>Space Grotesk</option>
                      <option>Newsreader</option>
                      <option>IBM Plex Sans</option>
                      <option>Playfair Display</option>
                    </select>
                  </label>
                </div>
                <div className="range-row">
                  <label>
                    Size <b>{draft.size}px</b>
                    <input
                      type="range"
                      min="28"
                      max="76"
                      value={draft.size}
                      onChange={e => updateDraft({ size: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Weight <b>{draft.weight}</b>
                    <input
                      type="range"
                      min="300"
                      max="800"
                      step="100"
                      value={draft.weight}
                      onChange={e => updateDraft({ weight: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <div className="range-row">
                  <label>
                    Line height <b>{draft.leading.toFixed(2)}</b>
                    <input
                      type="range"
                      min="1"
                      max="1.8"
                      step=".05"
                      value={draft.leading}
                      onChange={e => updateDraft({ leading: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Letter spacing <b>{draft.tracking}px</b>
                    <input
                      type="range"
                      min="-1"
                      max="3"
                      step=".5"
                      value={draft.tracking}
                      onChange={e => updateDraft({ tracking: Number(e.target.value) })}
                    />
                  </label>
                </div>
              </div>

              <div className="studio-foot">
                <button className="delete" onClick={deleteCurrent}>
                  <Trash2 size={15} />
                  Delete pairing
                </button>
                <button
                  className={hasUnsavedChanges ? 'save pending' : 'save'}
                  onClick={persistDraft}
                >
                  {hasUnsavedChanges ? (
                    <>保存调整</>
                  ) : (
                    <>
                      <Check size={13} />
                      Saved locally
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="empty-state">
            <Type size={30} />
            <h2>还没有字体配对</h2>
            <p>创建一个配对，开始选择标题字体和正文字体。</p>
            <button className="primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} />
              New pairing
            </button>
          </div>
        )}
      </main>

      {showAdd && (
        <div className="backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New pairing</h2>
            <label>
              Pairing name
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createPair()}
                placeholder="e.g. Quiet confidence"
              />
            </label>
            <div className="modal-actions">
              <button className="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="primary" onClick={createPair}>
                Create pairing
              </button>
            </div>
          </div>
        </div>
      )}

      <MigrationModal
        open={showMigration}
        pairs={pairs}
        hasUnsavedChanges={hasUnsavedChanges}
        onClose={() => setShowMigration(false)}
        onMigrate={requestMigration}
        onUndo={undoLastMigration}
      />
    </div>
  );
}
