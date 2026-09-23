import {useEffect, useMemo, useState} from 'react';
import {BookOpen, ChevronDown, Download, Grid3X3, Heart, Plus, Replace, RotateCcw, Settings2, SlidersHorizontal, Star, Trash2, Type, X} from 'lucide-react';
import {DEFAULT_SETTINGS, FONTS, sameSettings, settingsOf, type Pair, type PairSettings} from './types';
import {applyMigration, planMigration, undoMigration, type MigrationBatch} from './migration';
import {loadPairs, savePairs} from './storage';

export default function App() {
  const [pairs, setPairs] = useState<Pair[]>(loadPairs);
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState<PairSettings>(DEFAULT_SETTINGS);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showMigrate, setShowMigrate] = useState(false);
  const [oldFont, setOldFont] = useState('');
  const [newFont, setNewFont] = useState('');
  const [dirtyBlocked, setDirtyBlocked] = useState(false);
  const [lastBatch, setLastBatch] = useState<MigrationBatch | null>(null);

  const current = pairs.find(p => p.id === selected) ?? pairs[0];
  const dirty = current ? !sameSettings(draft, settingsOf(current)) : false;

  useEffect(() => savePairs(pairs), [pairs]);

  // Reload the canvas controls when the selection or the saved settings change
  // (save / migration / undo). Favorite toggles don't touch settings, so the
  // draft survives them.
  const savedKey = current ? JSON.stringify(settingsOf(current)) : '';
  useEffect(() => {
    if (current) setDraft(settingsOf(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, savedKey]);

  const headingFontsInUse = useMemo(() => [...new Set(pairs.map(p => p.headingFont))], [pairs]);
  const plan = useMemo(() => planMigration(pairs, oldFont, newFont), [pairs, oldFont, newFont]);

  const create = () => {
    if (!newTitle.trim()) return;
    const id = Date.now();
    setPairs(ps => [...ps, {
      id,
      title: newTitle.trim(),
      heading: 'Your new headline',
      body: 'Start with a sentence that lets your type pairing show its character.',
      category: 'Untitled',
      favorite: false,
      ...DEFAULT_SETTINGS,
    }]);
    setSelected(id);
    setNewTitle('');
    setShowAdd(false);
  };

  const toggleFav = () => current && setPairs(ps => ps.map(p => p.id === current.id ? {...p, favorite: !p.favorite} : p));
  const saveDraft = () => current && setPairs(ps => ps.map(p => p.id === current.id ? {...p, ...draft} : p));
  const revertDraft = () => current && setDraft(settingsOf(current));
  const removeCurrent = () => {
    if (!current) return;
    setPairs(ps => ps.filter(p => p.id !== current.id));
    setSelected(pairs.find(p => p.id !== current.id)?.id ?? 0);
  };

  const openMigrate = () => {
    const preferred = current && headingFontsInUse.includes(current.headingFont)
      ? current.headingFont
      : headingFontsInUse[0] ?? FONTS[0];
    setOldFont(preferred);
    setNewFont(FONTS.find(f => f !== preferred) ?? FONTS[0]);
    setDirtyBlocked(false);
    setShowMigrate(true);
  };

  const confirmMigration = () => {
    if (dirty) {
      // Unsaved adjustments on the current pairing — the migration must not start.
      setDirtyBlocked(true);
      return;
    }
    const {pairs: next, batch} = applyMigration(pairs, planMigration(pairs, oldFont, newFont));
    if (!batch) return;
    setPairs(next);
    setLastBatch(batch);
    setShowMigrate(false);
  };

  const undo = () => {
    if (!lastBatch) return;
    setPairs(ps => undoMigration(ps, lastBatch));
    setLastBatch(null);
  };

  const exportCss = () => {
    if (!current) return;
    const css = `/* ${current.title} */\n.heading { font-family: '${draft.headingFont}'; font-size: ${draft.size}px; font-weight: ${draft.weight}; }\n.body { font-family: '${draft.bodyFont}'; line-height: ${draft.leading}; letter-spacing: ${draft.tracking}px; }`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([css], {type: 'text/css'}));
    a.download = 'type-pair.css';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <div className="brand-mark"><Type size={18}/></div>
          <div><b>Type Pairer</b><small>FIND YOUR VOICE</small></div>
        </div>
        <div className="nav-section">
          <span>LIBRARY</span>
          <button className="nav active"><Grid3X3 size={16}/>All pairings <b>{pairs.length}</b></button>
          <button className="nav"><Heart size={16}/>Favorites <b>{pairs.filter(p => p.favorite).length}</b></button>
        </div>
        <div className="saved">
          <div className="saved-head"><span>COLLECTIONS</span><button onClick={() => setShowAdd(true)}><Plus size={14}/></button></div>
          <button className="collection"><i style={{background: '#e8b7a0'}}/>Editorial <b>4</b></button>
          <button className="collection"><i style={{background: '#9fc9be'}}/>Portfolio <b>3</b></button>
          <button className="collection"><i style={{background: '#b4add8'}}/>Brand voice <b>5</b></button>
        </div>
        <div className="aside-foot">
          <button className="nav"><Settings2 size={16}/>Preferences</button>
          <div className="profile">
            <div className="avatar">YL</div>
            <div><b>Yuki Lin</b><small>Design workspace</small></div>
            <ChevronDown size={14}/>
          </div>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <div className="crumb">TYPE LIBRARY / <b>PAIRING STUDIO</b></div>
            <h1>Find the right conversation.</h1>
            <p>Explore combinations, tune the details, and save what feels like you.</p>
          </div>
          <div className="actions">
            <button className="outline" onClick={openMigrate}><Replace size={15}/>Retire a font</button>
            <button className="outline" onClick={exportCss}><Download size={15}/>Copy CSS</button>
            <button className="primary" onClick={() => setShowAdd(true)}><Plus size={16}/>New pairing</button>
          </div>
        </header>

        <div className="layout">
          <section className="gallery">
            <div className="gallery-head">
              <div><h2>Saved pairings</h2><span>{pairs.length} compositions</span></div>
              <div className="view-toggle"><button className="on"><Grid3X3 size={14}/></button><button><BookOpen size={14}/></button></div>
            </div>
            <div className="pair-list">
              {pairs.map(p => (
                <button key={p.id} className={current?.id === p.id ? 'pair selected' : 'pair'} onClick={() => setSelected(p.id)}>
                  <div className="pair-top">
                    <span>{p.category}</span>
                    <Heart size={15} fill={p.favorite ? '#e88769' : 'none'} color={p.favorite ? '#e88769' : '#aeb5b7'}/>
                  </div>
                  <strong style={{fontFamily: p.headingFont}}>{p.heading}</strong>
                  <p style={{fontFamily: p.bodyFont}}>{p.body}</p>
                  <div className="pair-foot"><span>{p.title}</span><small>Open canvas →</small></div>
                </button>
              ))}
            </div>
          </section>

          {current ? (
            <section className="studio">
              <div className="studio-head">
                <div><span>PAIRING CANVAS</span><h2>{current.title}</h2></div>
                <button className="favorite" onClick={toggleFav}><Star size={16} fill={current.favorite ? '#e5a35e' : 'none'} color={current.favorite ? '#e5a35e' : '#98a4a7'}/></button>
              </div>
              <div className="canvas">
                <div className="canvas-bar">
                  <span>PREVIEW</span>
                  <div><button>Desktop</button><button>Tablet</button><button>Mobile</button></div>
                </div>
                <div className="preview">
                  <span className="preview-kicker">A NOTE ON TYPE</span>
                  <h3 style={{fontFamily: draft.headingFont, fontSize: `${draft.size}px`, fontWeight: draft.weight, letterSpacing: `${draft.tracking}px`, lineHeight: 1.05}}>{current.heading}</h3>
                  <p style={{fontFamily: draft.bodyFont, lineHeight: draft.leading, letterSpacing: `${draft.tracking / 2}px`}}>{current.body}</p>
                  <div className="preview-rule"/>
                  <span className="preview-meta">PAIRING 0{current.id} · {current.category.toUpperCase()}</span>
                </div>
              </div>
              <div className="controls">
                <div className="control-head">
                  <div><span>TYPE CONTROLS</span><h3>Fine tune your pairing</h3></div>
                  <SlidersHorizontal size={17}/>
                </div>
                <div className="font-row">
                  <label>Heading font
                    <select value={draft.headingFont} onChange={e => setDraft({...draft, headingFont: e.target.value})}>
                      {FONTS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </label>
                  <label>Body font
                    <select value={draft.bodyFont} onChange={e => setDraft({...draft, bodyFont: e.target.value})}>
                      {FONTS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </label>
                </div>
                <div className="range-row">
                  <label>Size <b>{draft.size}px</b>
                    <input type="range" min="28" max="76" value={draft.size} onChange={e => setDraft({...draft, size: Number(e.target.value)})}/>
                  </label>
                  <label>Weight <b>{draft.weight}</b>
                    <input type="range" min="300" max="800" step="100" value={draft.weight} onChange={e => setDraft({...draft, weight: Number(e.target.value)})}/>
                  </label>
                </div>
                <div className="range-row">
                  <label>Line height <b>{draft.leading.toFixed(2)}</b>
                    <input type="range" min="1" max="1.8" step=".05" value={draft.leading} onChange={e => setDraft({...draft, leading: Number(e.target.value)})}/>
                  </label>
                  <label>Letter spacing <b>{draft.tracking}px</b>
                    <input type="range" min="-1" max="3" step=".5" value={draft.tracking} onChange={e => setDraft({...draft, tracking: Number(e.target.value)})}/>
                  </label>
                </div>
              </div>
              <div className="studio-foot">
                <button className="delete" onClick={removeCurrent}><Trash2 size={15}/>Delete pairing</button>
                <div className="save-group">
                  {dirty && <button className="revert" onClick={revertDraft}>Revert</button>}
                  <button className={dirty ? 'save dirty' : 'save'} onClick={saveDraft} disabled={!dirty}>
                    <CheckIcon/>{dirty ? 'Save changes' : 'Saved'}
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="studio"><p className="mig-empty">No pairings yet — create one to get started.</p></section>
          )}
        </div>
      </main>

      {lastBatch && (
        <div className="undo-banner">
          <span>Migrated {lastBatch.changed.length} {lastBatch.changed.length === 1 ? 'pairing' : 'pairings'}: {lastBatch.oldFont} → {lastBatch.newFont}</span>
          <button className="undo" onClick={undo}><RotateCcw size={13}/>Undo</button>
          <button className="dismiss" onClick={() => setLastBatch(null)}><X size={14}/></button>
        </div>
      )}

      {showMigrate && (
        <div className="backdrop" onClick={() => setShowMigrate(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <h2>Retire a heading font</h2>
            <div className="mig-fonts">
              <label>Retiring font
                <select value={oldFont} onChange={e => {
                  const f = e.target.value;
                  setOldFont(f);
                  setDirtyBlocked(false);
                  if (f === newFont) setNewFont(FONTS.find(x => x !== f) ?? '');
                }}>
                  {headingFontsInUse.map(f => <option key={f}>{f}</option>)}
                </select>
              </label>
              <label>Replacement
                <select value={newFont} onChange={e => {setNewFont(e.target.value); setDirtyBlocked(false);}}>
                  {FONTS.filter(f => f !== oldFont).map(f => <option key={f}>{f}</option>)}
                </select>
              </label>
            </div>

            {plan.items.length > 0 ? (
              <ul className="mig-list">
                {plan.items.map(({pair, conflict}) => (
                  <li key={pair.id} className={conflict ? 'mig-item conflict' : 'mig-item'}>
                    <Heart className="mig-heart" size={14} fill={pair.favorite ? '#e88769' : 'none'} color={pair.favorite ? '#e88769' : '#c4cbca'}/>
                    <div className="mig-item-main">
                      <strong style={{fontFamily: pair.headingFont}}>{pair.heading}</strong>
                      <p style={{fontFamily: pair.bodyFont}}>{pair.body}</p>
                      <small>
                        {pair.title} · {pair.headingFont} → {newFont}
                        {conflict && <em> · body already uses {newFont}</em>}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mig-empty">No pairings use {oldFont} as their heading font.</p>
            )}

            {plan.conflictCount > 0 && (
              <p className="mig-note">
                {plan.conflictCount} {plan.conflictCount === 1 ? 'pairing' : 'pairings'} would end up with identical heading and body fonts — pick a different replacement to continue.
              </p>
            )}
            {dirtyBlocked && (
              <p className="mig-note">The current pairing has unsaved changes. Save or revert them before migrating.</p>
            )}

            <div className="modal-actions">
              <button className="outline" onClick={() => setShowMigrate(false)}>Cancel</button>
              <button className="primary" disabled={!plan.canApply} onClick={confirmMigration}>
                Migrate {plan.items.length} {plan.items.length === 1 ? 'pairing' : 'pairings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New pairing</h2>
            <label>Pairing name<input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Quiet confidence"/></label>
            <div className="modal-actions">
              <button className="outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="primary" onClick={create}>Create pairing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return <span className="check">✓</span>;
}
