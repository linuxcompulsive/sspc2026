/* SSPC2026 v1.1 · Tests interactius — HTML, CSS i JavaScript */
(() => {
  'use strict';

  const KEYS = {
    bank: 'sspc2026_bank_v2', history: 'sspc2026_history_v2', missed: 'sspc2026_missed_v2',
    active: 'sspc2026_active_v2', result: 'sspc2026_result_v2',
    custom: 'sspc2026_csv_custom_v3'
  };
  const LETTERS = ['A', 'B', 'C', 'D'];
  const MAX_HISTORY = 100;
  const state = {
    bank: [], history: [], missed: [], active: null, result: null,
    view: 'home', scope: 'all', amount: 10, showAllReview: false, editingId: null, projector: false, projectKey: false,
    defaultBank: [], fileLoaded: false
  };
  const $ = (id) => document.getElementById(id);
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const getJSON = (key, fallback) => { try { const data = localStorage.getItem(key); return data === null ? fallback : JSON.parse(data); } catch { return fallback; } };
  const setJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { showNotice('No s’ha pogut desar al navegador. Exporta el banc CSV per evitar perdre les dades.', 'error'); return false; } };
  const setSession = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* no persistence */ } };
  const readSession = (key) => { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; } };
  const removeSession = (key) => { try { sessionStorage.removeItem(key); } catch { /* noop */ } };
  const unique = (items) => [...new Set(items)];
  const compareTopics = (a, b) => a.localeCompare(b, 'ca', {numeric:true, sensitivity:'base'});
  const shuffle = (input) => { const arr = [...input]; for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const byId = (id) => state.bank.find((q) => q.id === id);
  const questionLabel = (q) => `Lliçó ${q.tema}${q.origen ? ` · ${q.origen}` : ''}`;

  function showNotice(message, kind='success') {
    const notice = $('notice'); notice.textContent = message; notice.dataset.kind = kind; notice.hidden = false;
  }
  function hideNotice() { $('notice').hidden = true; }
  function normalizeQuestion(q, index) {
    if (!q || typeof q !== 'object' || Array.isArray(q)) throw Error(`Pregunta ${index + 1}: el format no és un objecte.`);
    const id = String(q.id ?? '').trim();
    const tema = String(q.tema ?? '').trim();
    const enunciat = String(q.enunciat ?? '').trim();
    const opcions = Array.isArray(q.opcions) ? q.opcions.map((x) => String(x ?? '').trim()) :
      [q.opcio_a, q.opcio_b, q.opcio_c, q.opcio_d].map((x) => String(x ?? '').trim());
    const correcta = String(q.correcta ?? '').trim().toUpperCase();
    const explicacio = String(q.explicacio ?? '').trim();
    if (!id) throw Error(`Pregunta ${index + 1}: falta l'ID.`);
    if (!tema || !enunciat) throw Error(`Pregunta ${id}: falta el tema o l'enunciat.`);
    if (opcions.length !== 4 || opcions.some((x) => !x)) throw Error(`Pregunta ${id}: calen exactament quatre opcions no buides.`);
    if (!LETTERS.includes(correcta)) throw Error(`Pregunta ${id}: la resposta correcta ha de ser A, B, C o D.`);
    return {id, tema, enunciat, opcions, correcta, explicacio, ...(String(q.origen ?? '').trim() ? {origen:String(q.origen).trim()} : {}), ...(q.demo === true ? {demo:true} : {})};
  }
  function validateBank(items) {
    if (!Array.isArray(items)) throw Error('Cal un banc de preguntes vàlid.');
    const questions = items.map(normalizeQuestion);
    const ids = new Set();
    for (const q of questions) { if (ids.has(q.id)) throw Error(`L'identificador "${q.id}" està repetit al fitxer.`); ids.add(q.id); }
    return questions;
  }
  function parseCSV(text) {
    const cleaned = text.replace(/^\uFEFF/, '');
    const first = cleaned.split(/\r?\n/, 1)[0];
    const delimiter = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cell = '', quoted = false;
    for (let i = 0; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (c === '"') { if (quoted && cleaned[i+1] === '"') { cell += '"'; i++; } else { quoted = !quoted; } }
      else if (!quoted && c === delimiter) { row.push(cell); cell = ''; }
      else if (!quoted && (c === '\n' || c === '\r')) {
        if (c === '\r' && cleaned[i+1] === '\n') i++;
        row.push(cell); if (row.some((v) => v.trim())) rows.push(row); row = []; cell = '';
      } else { cell += c; }
    }
    if (quoted) throw Error('El CSV conté cometes sense tancar.');
    row.push(cell); if (row.some((v) => v.trim())) rows.push(row);
    if (!rows.length) throw Error('El fitxer CSV és buit.');
    const headers = rows.shift().map((v) => v.replace(/^\uFEFF/, '').trim().toLowerCase());
    const required = ['id','tema','enunciat','opcio_a','opcio_b','opcio_c','opcio_d','correcta'];
    for (const col of required) if (!headers.includes(col)) throw Error(`Al CSV falta la columna "${col}".`);
    return rows.map((cells, i) => {
      if (cells.length !== headers.length) throw Error(`Fila ${i + 2}: hi ha ${cells.length} columnes, però la capçalera en té ${headers.length}. Comprova les comes i les cometes.`);
      return Object.fromEntries(headers.map((key, index) => [key, cells[index] ?? '']));
    });
  }
  async function readFile(file) {
    const text = await file.text();
    if (/\.csv$/i.test(file.name)) return validateBank(parseCSV(text));
    try { const parsed = JSON.parse(text.replace(/^\uFEFF/, '')); return validateBank(Array.isArray(parsed) ? parsed : parsed.preguntes); }
    catch (error) { if (error instanceof SyntaxError) throw Error('El JSON no és vàlid. Revisa les cometes i les comes.'); throw error; }
  }
  async function fetchDefault() {
    // Font de dades principal: preguntes.csv. No cal cap JSON a GitHub.
    // En local (file://), els navegadors bloquegen fetch() i fem servir
    // una còpia CSV integrada a index.html per a la primera prova.
    if (location.protocol === 'file:') {
      const el = $('embeddedQuestionBank');
      if (!el) throw Error('No hi ha cap banc CSV local. Importa un CSV a Preguntes.');
      return validateBank(parseCSV(el.textContent));
    }
    const response = await fetch(`./preguntes.csv?v=${Date.now()}`, {cache:'no-store'});
    if (!response.ok) throw Error(`Error HTTP ${response.status} en carregar preguntes.csv`);
    return validateBank(parseCSV(await response.text()));
  }

  function persistBank() { return setJSON(KEYS.bank, state.bank); }
  function persistActivity() { setJSON(KEYS.history, state.history); setJSON(KEYS.missed, state.missed); }
  function persistActive() { if (state.active) setSession(KEYS.active, state.active); else removeSession(KEYS.active); }
  function pruneMissed() { const ids = new Set(state.bank.map((q) => q.id)); state.missed = state.missed.filter((id) => ids.has(id)); setJSON(KEYS.missed, state.missed); }
  function commitBank(newBank) { state.bank = newBank; persistBank(); setJSON(KEYS.custom, true); pruneMissed(); renderAll(); }

  function getTopics() { return unique(state.bank.map((q) => q.tema)).sort(compareTopics); }
  function filteredQuestions() {
    if (state.scope === 'all') return state.bank;
    return state.bank.filter((q) => q.tema === $('topicSelect').value);
  }
  function scopeText() {
    return state.scope === 'all' ? 'Tot el temari' : `Lliçó ${$('topicSelect').value}`;
  }
  function renderSelectors() {
    const topics = getTopics();
    const previousTopic = $('topicSelect').value;
    $('topicSelect').innerHTML = topics.map((t) => `<option value="${escapeHTML(t)}">Lliçó ${escapeHTML(t)}</option>`).join('');
    if (topics.includes(previousTopic)) $('topicSelect').value = previousTopic;
    $('filterFields').hidden = state.scope === 'all';
    const available = filteredQuestions().length;
    const chosen = Math.min(state.amount, available);
    const hint = $('availableHint');
    if (!available) { hint.textContent = 'Encara no hi ha preguntes. Importa el CSV des de Preguntes.'; }
    else if (available < state.amount) { hint.textContent = `${available} disponibles. Com que n'has demanat ${state.amount}, el test tindrà ${chosen} preguntes (sense repetir).`; }
    else { hint.textContent = `${available} preguntes disponibles · El test tindrà ${chosen} preguntes aleatòries.`; }
    $('startBtn').disabled = !available;
  }
  function renderHome() {
    $('statQuestions').textContent = state.bank.length.toLocaleString('ca');
    $('statTopics').textContent = unique(state.bank.map((q) => q.tema)).length;
    $('statTests').textContent = state.history.length;
    $('statErrors').textContent = state.missed.length;
    $('pendingCount').textContent = `(${state.missed.length})`;
    $('repeatSavedBtn').disabled = !state.missed.length;
    $('navBankCount').textContent = state.bank.length;
    $('resumeBanner').hidden = !state.active;
    if (state.active) $('resumeDescription').textContent = `${state.active.label} · ${Object.keys(state.active.answers).length} de ${state.active.items.length} preguntes respostes.`;
    $('demoBanner').hidden = !state.bank.some((q) => q.demo);
    $('historyList').innerHTML = state.history.length
      ? state.history.slice(-5).reverse().map((entry) => `<div class="history-row"><div><strong>${escapeHTML(entry.label)}</strong><small>${escapeHTML(formatDate(entry.date))} · ${entry.total} preguntes</small></div><span class="history-grade">${Math.round(entry.correct / entry.total * 100)}%</span></div>`).join('')
      : '<p class="muted">Encara no has finalitzat cap test.</p>';
    renderSelectors();
  }
  function formatDate(iso) { try { return new Intl.DateTimeFormat('ca-ES',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso)); } catch { return iso; } }
  function showView(view, force=false) {
    if (!force && state.active && view !== 'quiz' && !window.confirm('Tens un test començat. Vols sortir-ne? Es conservarà per continuar més endavant.')) return;
    state.view = view;
    document.body.classList.toggle('projection-mode', view === 'quiz' && state.projector);
    if (view !== 'result') { state.projectKey = false; document.body.classList.remove('solution-projection'); }
    for (const element of document.querySelectorAll('.view')) element.hidden = element.id !== `${view}View`;
    for (const element of document.querySelectorAll('.nav-link')) element.classList.toggle('active', element.dataset.nav === view);
    hideNotice();
    if (view === 'home') renderHome();
    if (view === 'bank') renderBank();
    if (view === 'quiz' && state.active) renderQuiz();
    if (view === 'result') renderResults();
    window.scrollTo({top:0, behavior:'instant'});
  }
  function makeQuiz(list, label) {
    const ids = shuffle(unique(list)).filter((id) => Boolean(byId(id)));
    if (!ids.length) { showNotice('No hi ha preguntes disponibles per començar aquest test.', 'error'); return; }
    const items = ids.map((id) => ({id, order:shuffle([0,1,2,3]), question:structuredClone(byId(id))}));
    state.active = {items, answers:{}, current:0, label, start:new Date().toISOString()};
    persistActive(); showView('quiz', true);
  }
  function startSelectedQuiz() {
    const list = filteredQuestions();
    const wanted = state.amount;
    const ids = shuffle(list).slice(0, wanted).map((q) => q.id);
    if (!ids.length) { showNotice('No hi ha preguntes en aquesta categoria.', 'error'); return; }
    if (state.active && !window.confirm('Ja hi ha un test començat. Vols substituir-lo per un de nou?')) return;
    makeQuiz(ids, scopeText());
    if (list.length < wanted) showNotice(`Només hi havia ${list.length} preguntes disponibles. El test s'ha adaptat a aquesta quantitat.`, 'info');
  }
  function timeString(start) {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 1000));
    return `${String(Math.floor(seconds/60)).padStart(2, '0')}:${String(seconds%60).padStart(2, '0')}`;
  }
  function updateTimer() { if (state.view === 'quiz' && state.active) $('testTime').textContent = timeString(state.active.start); }
  function getActiveQuestion(index) { const item = state.active.items[index]; return item.question || byId(item.id); }
  function updateQuizStatus() {
    if (!state.active) return;
    const quiz = state.active;
    const answered = Object.keys(quiz.answers).length;
    $('questionCounter').textContent = `PREGUNTA ${quiz.current+1} DE ${quiz.items.length}`;
    $('answeredCounter').textContent = `${answered} de ${quiz.items.length} respostes`;
    $('progressFill').style.width = `${100 * answered / quiz.items.length}%`;
    $('progressTrack').setAttribute('aria-valuenow', String(Math.round(100 * answered / quiz.items.length)));
    $('questionGrid').innerHTML = quiz.items.map((item, i) => `<button type="button" class="question-tile ${Object.hasOwn(quiz.answers, item.id) ? 'answered' : ''} ${i === quiz.current ? 'current' : ''}" data-index="${i}" aria-label="Pregunta ${i+1}${Object.hasOwn(quiz.answers, item.id) ? ', contestada' : ', pendent'}" ${i === quiz.current ? 'aria-current="step"' : ''}>${i+1}</button>`).join('');
    $('prevBtn').disabled = quiz.current === 0;
    $('nextBtn').hidden = quiz.current === quiz.items.length - 1;
    $('finishBtn').hidden = quiz.current !== quiz.items.length - 1;
    updateTimer();
  }
  function renderQuiz() {
    const quiz = state.active; if (!quiz) return;
    const item = quiz.items[quiz.current], q = getActiveQuestion(quiz.current);
    if (!q) { showNotice('Una de les preguntes del test ja no existeix. Comença un test nou.', 'error'); return; }
    $('quizScope').textContent = quiz.label;
    $('projectionBtn').setAttribute('aria-pressed', String(state.projector));
    $('projectionBtn').textContent = state.projector ? '▣ Sortir del projector' : '▣ Mode projector';
    $('questionMeta').textContent = questionLabel(q);
    $('quizHeading').textContent = q.enunciat;
    const answers = $('answerOptions'); answers.replaceChildren();
    item.order.forEach((originalIndex, displayIndex) => {
      const label = document.createElement('label'); label.className = 'answer-choice';
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'answer'; input.value = String(originalIndex);
      input.checked = quiz.answers[item.id] === originalIndex;
      input.setAttribute('aria-label', `Opció ${LETTERS[displayIndex]}`);
      input.addEventListener('change', () => { quiz.answers[item.id] = originalIndex; persistActive(); updateQuizStatus(); });
      const badge = document.createElement('span'); badge.className = 'option-letter'; badge.textContent = LETTERS[displayIndex];
      const text = document.createElement('span'); text.className = 'option-text'; text.textContent = q.opcions[originalIndex];
      label.append(input, badge, text); answers.append(label);
    });
    updateQuizStatus();
  }
  function goQuestion(index) {
    if (!state.active || index < 0 || index >= state.active.items.length) return;
    state.active.current = index; persistActive(); renderQuiz();
  }
  function finishQuiz() {
    const quiz = state.active; if (!quiz) return;
    const blanks = quiz.items.filter((item) => !Object.hasOwn(quiz.answers, item.id)).length;
    if (blanks && !window.confirm(`Tens ${blanks} pregunta${blanks === 1 ? '' : 'es'} sense respondre. Vols corregir el test igualment?`)) return;
    const entries = quiz.items.map((item) => ({
      id: item.id, order: item.order, chosen: Object.hasOwn(quiz.answers, item.id) ? quiz.answers[item.id] : null,
      question: structuredClone(item.question || byId(item.id))
    }));
    const correct = entries.filter((e) => e.chosen !== null && LETTERS[e.chosen] === e.question.correcta).length;
    const wrong = entries.filter((e) => e.chosen !== null && LETTERS[e.chosen] !== e.question.correcta).length;
    const date = new Date().toISOString();
    state.result = {date, label:quiz.label, entries, correct, wrong, blank:blanks, elapsed:Date.now()-new Date(quiz.start).getTime()};
    const pending = new Set(state.missed);
    for (const entry of entries) {
      if (entry.chosen === null) continue;
      if (LETTERS[entry.chosen] === entry.question.correcta) pending.delete(entry.id);
      else pending.add(entry.id);
    }
    state.missed = [...pending];
    state.history.push({date, label:quiz.label, total:entries.length, correct, wrong, blank:blanks});
    if (state.history.length > MAX_HISTORY) state.history = state.history.slice(-MAX_HISTORY);
    state.active = null; persistActive(); persistActivity(); setJSON(KEYS.result, state.result);
    state.showAllReview = false; showView('result', true);
  }
  // IMPORTANT: les opcions es barregen en cada test. El solucionari mostra
  // la lletra en PANTALLA, no la lletra de la columna correcta del CSV.
  function displayCorrectLetter(entry) {
    const originalIndex = LETTERS.indexOf(entry.question.correcta);
    const shownIndex = entry.order.indexOf(originalIndex);
    return shownIndex >= 0 ? LETTERS[shownIndex] : '?';
  }
  function solutionText(result) {
    return result.entries.map((entry, i) => `${i + 1} → ${displayCorrectLetter(entry)}`).join('\n');
  }
  async function copySolutions() {
    if (!state.result) return;
    const txt = `SSPC2026 — ${state.result.label}\n${solutionText(state.result)}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(txt);
      else {
        const area = document.createElement('textarea'); area.value = txt; document.body.append(area);
        area.select(); if (!document.execCommand('copy')) throw Error('No s’ha pogut copiar.'); area.remove();
      }
      showNotice('Solucionari copiat. Ja el pots enganxar on vulguis.');
    } catch { showNotice('No s’ha pogut copiar. Pots utilitzar el botó Imprimir.', 'error'); }
  }
  function resultStatus(entry) {
    if (entry.chosen === null) return 'blank';
    return LETTERS[entry.chosen] === entry.question.correcta ? 'right' : 'wrong';
  }
  function renderResults() {
    const result = state.result;
    if (!result) { showView('home', true); return; }
    const total = result.entries.length, percent = total ? Math.round(100 * result.correct / total) : 0;
    $('resultPercent').textContent = `${percent}%`;
    $('scoreMessage').textContent = percent === 100 ? 'Excel·lent! Cap error.' : percent >= 75 ? 'Molt bon treball!' : percent >= 50 ? 'Vas pel bon camí.' : 'Una bona ocasió per repassar.';
    $('scoreSentence').textContent = `Has encertat ${result.correct} de ${total} preguntes.`;
    $('scoreRight').textContent = result.correct;
    $('scoreWrong').textContent = result.wrong;
    $('scoreBlank').textContent = result.blank;
    $('resultScope').textContent = `${result.label} · ${total} preguntes · ${formatDate(result.date)} · ${Math.max(1,Math.round(result.elapsed / 60000))} min`;
    $('projectKeyBtn').setAttribute('aria-pressed', String(state.projectKey));
    $('projectKeyBtn').textContent = state.projectKey ? '↙ Vista completa' : '▣ Ampliar solucionari';
    $('answerKeyGrid').innerHTML = result.entries.map((entry, i) => `<div class="answer-key-item"><span>${i+1}</span><span class="key-arrow">→</span><strong>${displayCorrectLetter(entry)}</strong></div>`).join('');
    $('toggleAllBtn').textContent = state.showAllReview ? 'Mostrar només errors' : 'Veure totes';
    $('repeatWrongBtn').disabled = !result.entries.some((e) => resultStatus(e) !== 'right' && Boolean(byId(e.id)));
    const entries = result.entries.map((e, index) => ({...e, number:index+1, status:resultStatus(e)}));
    entries.sort((a,b) => ({wrong:0,blank:1,right:2})[a.status] - ({wrong:0,blank:1,right:2})[b.status] || a.number-b.number);
    const visible = state.showAllReview ? entries : entries.filter((e) => e.status !== 'right');
    $('reviewList').innerHTML = visible.length ? visible.map((entry) => {
      const q = entry.question;
      const correctOriginal = LETTERS.indexOf(q.correcta);
      const correctShown = displayCorrectLetter(entry);
      const chosenShown = entry.chosen === null ? null : LETTERS[entry.order.indexOf(entry.chosen)];
      const statusText = ({right:'ENCERTADA',wrong:'ERRÒNIA',blank:'SENSE RESPONDRE'})[entry.status];
      return `<article class="review-item"><div class="review-top"><span class="review-meta">Pregunta ${entry.number} · Lliçó ${escapeHTML(q.tema)}</span><span class="review-status ${entry.status}">${statusText}</span></div>
        <h3>${escapeHTML(q.enunciat)}</h3>
        ${entry.chosen === null ? '<p class="review-answer bad">No has marcat cap resposta.</p>' : `<p class="review-answer ${entry.status === 'right' ? 'good' : 'bad'}"><strong>La teva resposta:</strong> ${chosenShown} · ${escapeHTML(q.opcions[entry.chosen])}</p>`}
        <p class="review-answer good"><strong>Resposta correcta:</strong> ${correctShown} · ${escapeHTML(q.opcions[correctOriginal])}</p>
        ${q.explicacio ? `<p class="review-explanation"><strong>Explicació:</strong> ${escapeHTML(q.explicacio)}</p>` : ''}</article>`;
    }).join('') : '<p class="empty-message">Has contestat correctament totes les preguntes! Pots fer un altre test o veure totes les respostes.</p>';
  }
  function repeatQuestions(ids, label) {
    if (state.active && !window.confirm('Vols substituir el test que tens començat?')) return;
    const validIds = unique(ids).filter((id) => byId(id));
    makeQuiz(validIds, label);
  }
  function renderBank() {
    const topics = unique(state.bank.map((q) => q.tema)).length;
    $('bankCount').textContent = state.bank.length;
    $('bankTopicCount').textContent = topics;
    $('removeDemoBtn').hidden = !state.bank.some((q) => q.demo);
    const search = $('bankSearch').value.toLocaleLowerCase('ca').trim();
    const matching = state.bank.filter((q) => !search || [q.id, q.tema, q.origen ?? '', q.enunciat, ...q.opcions].join(' ').toLocaleLowerCase('ca').includes(search));
    const sorted = [...matching].sort((a,b) => compareTopics(a.tema,b.tema) || a.id.localeCompare(b.id));
    const visible = sorted.slice(0, 120);
    $('questionList').innerHTML = visible.length ? visible.map((q) => `<article class="bank-question"><div class="bank-question-main"><small>Lliçó ${escapeHTML(q.tema)} · ${escapeHTML(q.id)}</small>${q.origen ? `<small class="origen-tag">${escapeHTML(q.origen)}</small>` : ''}${q.demo ? '<small class="demo-tag">DEMO</small>' : ''}<strong>${escapeHTML(q.enunciat)}</strong></div><div class="bank-question-actions"><button type="button" data-edit-id="${escapeHTML(q.id)}">Editar</button><button type="button" data-delete-id="${escapeHTML(q.id)}">Eliminar</button></div></article>`).join('') : '<p class="empty-message">No hi ha preguntes que coincideixin amb aquesta cerca.</p>';
    $('bankListFoot').textContent = `Mostrant ${visible.length} de ${matching.length} preguntes${matching.length > 120 ? ' (afina la cerca per veure’n més)' : ''}.`;
    $('navBankCount').textContent = state.bank.length;
  }
  function closeEditor() { $('questionForm').hidden = true; state.editingId = null; $('editError').hidden = true; }
  function openEditor(id=null) {
    state.editingId = id;
    $('questionForm').reset(); $('editError').hidden = true;
    if (id) {
      const q = byId(id); if (!q) return;
      $('editorHeading').textContent = 'Editar pregunta';
      $('editId').value = q.id; $('editId').readOnly = true;
      $('editTema').value = q.tema;
      $('editEnunciat').value = q.enunciat; $('editCorrecta').value = q.correcta;
      for (let i=0;i<4;i++) $(`edit${LETTERS[i]}`).value = q.opcions[i];
      $('editExplicacio').value = q.explicacio;
    } else {
      $('editorHeading').textContent = 'Afegir pregunta';
      $('editId').readOnly = false;
      $('editTema').value = getTopics()[0] || '1.1';
    }
    $('questionForm').hidden = false;
    $('questionForm').scrollIntoView({behavior:'smooth',block:'start'});
    $('editId').focus({preventScroll:true});
  }
  function saveEditor(event) {
    event.preventDefault();
    const values = {
      id:$('editId').value, tema:$('editTema').value, enunciat:$('editEnunciat').value,
      opcions:LETTERS.map((letter) => $(`edit${letter}`).value), correcta:$('editCorrecta').value,
      explicacio:$('editExplicacio').value, origen:state.editingId ? (byId(state.editingId)?.origen ?? '') : ''
    };
    try {
      const question = normalizeQuestion(values, 0);
      const collision = state.bank.some((q) => q.id === question.id && q.id !== state.editingId);
      if (collision) throw Error(`Ja hi ha una pregunta amb l'ID ${question.id}.`);
      const current = state.editingId ? byId(state.editingId) : null;
      if (current?.demo) question.demo = true;
      const next = state.editingId ? state.bank.map((q) => q.id === state.editingId ? question : q) : [...state.bank,question];
      commitBank(next); closeEditor(); showNotice("Pregunta desada al navegador. Exporta el CSV i puja'l a GitHub per actualitzar el banc compartit.");
    } catch (error) { $('editError').textContent = error.message; $('editError').hidden = false; }
  }
  function downloadFile(filename, text, mime) {
    const blob = new Blob([text], {type:mime}); const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportBank() {
    // Exportació CSV amb cometes escapades segons RFC 4180 i UTF-8 amb BOM.
    // Compatible amb Excel / LibreOffice, incloses comes i salts de línia.
    const headers = ['id','tema','enunciat','opcio_a','opcio_b','opcio_c','opcio_d','correcta','explicacio'];
    const csvCell = (value) => {
      const text = String(value ?? '');
      return /[",\r\n]/.test(text) || /^\s|\s$/.test(text) ? `"${text.replace(/"/g,'""')}"` : text;
    };
    const records = state.bank.map((q) => [q.id, q.tema, q.enunciat, ...q.opcions, q.correcta, q.explicacio]);
    const content = '\uFEFF' + [headers, ...records].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
    downloadFile('preguntes.csv', content, 'text/csv;charset=utf-8');
  }

  function downloadTemplate() {
    const columns = 'id,tema,enunciat,opcio_a,opcio_b,opcio_c,opcio_d,correcta,explicacio';
    const sample = '1.1-001,1.1,"Pregunta de demostració","Opció A","Opció B","Opció C","Opció D",B,"Explicació opcional"';
    downloadFile('plantilla-preguntes.csv', '\uFEFF' + columns + '\r\n' + sample + '\r\n', 'text/csv;charset=utf-8');
  }
  async function doImport(event) {
    const file = event.target.files?.[0]; if (!file) return;
    event.target.value = '';
    try {
      const parsed = await readFile(file);
      if (!parsed.length) throw Error('El fitxer no conté preguntes.');
      const mode = $('importMode').value;
      let result;
      if (mode === 'replace') result = parsed;
      else {
        const map = new Map(state.bank.map((q) => [q.id,q]));
        for (const q of parsed) map.set(q.id, q);
        result = [...map.values()];
      }
      commitBank(result); $('importOptions').hidden = true;
      showNotice(`${parsed.length} preguntes importades correctament. Banc actual: ${result.length} preguntes. Exporta el CSV per pujar-lo a GitHub.`);
    } catch (error) { showNotice(`No s'ha pogut importar: ${error.message}`, 'error'); }
  }
  async function resetBank() {
    if (!window.confirm('Es perdran les preguntes afegides o modificades només en aquest navegador si no les has exportat. Vols restaurar el fitxer preguntes.csv del repositori?')) return;
    try {
      const fresh = await fetchDefault();
      state.bank = fresh; state.defaultBank = fresh;
      localStorage.removeItem(KEYS.bank);
      localStorage.removeItem(KEYS.custom);
      pruneMissed(); closeEditor(); renderAll(); showNotice(location.protocol === 'file:' ? 'Banc inicial integrat restaurat. Per provar un CSV actualitzat localment, importa’l.' : 'Banc restaurat a partir del fitxer preguntes.csv de GitHub.');
    } catch { showNotice('No s’ha pogut recuperar el banc inicial. Comprova que els fitxers siguin complets.', 'error'); }
  }
  function renderAll() { renderHome(); if (state.view === 'bank') renderBank(); }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const navButton = event.target.closest('[data-nav]');
      if (navButton) showView(navButton.dataset.nav);
      const edit = event.target.closest('[data-edit-id]');
      if (edit) openEditor(edit.dataset.editId);
      const del = event.target.closest('[data-delete-id]');
      if (del) {
        const q = byId(del.dataset.deleteId);
        if (q && window.confirm(`Vols eliminar aquesta pregunta?\n\n${q.enunciat}`)) {
          commitBank(state.bank.filter((item) => item.id !== q.id));
          showNotice('Pregunta eliminada del banc local.');
        }
      }
      const tile = event.target.closest('[data-index]');
      if (tile && state.active) goQuestion(Number(tile.dataset.index));
    });
    document.querySelectorAll('input[name="scope"]').forEach((el) => el.addEventListener('change', () => { state.scope = el.value; renderSelectors(); }));
    document.querySelectorAll('input[name="amount"]').forEach((el) => el.addEventListener('change', () => { state.amount = Number(el.value); renderSelectors(); }));
    $('topicSelect').addEventListener('change', renderSelectors);
    $('startBtn').addEventListener('click', startSelectedQuiz);
    $('projectionBtn').addEventListener('click', () => { state.projector = !state.projector; document.body.classList.toggle('projection-mode', state.projector && state.view === 'quiz'); renderQuiz(); });
    $('projectKeyBtn').addEventListener('click', () => { state.projectKey = !state.projectKey; document.body.classList.toggle('solution-projection', state.projectKey); renderResults(); if (state.projectKey) $('answerKeyPanel').scrollIntoView({block:'start'}); });
    $('copyKeyBtn').addEventListener('click', copySolutions);
    $('printKeyBtn').addEventListener('click', () => window.print());
    $('resumeBtn').addEventListener('click', () => { if (state.active) showView('quiz', true); });
    $('discardBtn').addEventListener('click', () => { if (state.active && window.confirm('Vols descartar el test que tens a mitges?')) { state.active = null; persistActive(); renderHome(); showNotice('Test descartat.'); } });
    $('repeatSavedBtn').addEventListener('click', () => repeatQuestions(state.missed, 'Repàs d’errors pendents'));
    $('quitTestBtn').addEventListener('click', () => showView('home'));
    $('prevBtn').addEventListener('click', () => goQuestion(state.active.current - 1));
    $('nextBtn').addEventListener('click', () => goQuestion(state.active.current + 1));
    $('finishBtn').addEventListener('click', finishQuiz);
    $('finishAsideBtn').addEventListener('click', finishQuiz);
    $('repeatWrongBtn').addEventListener('click', () => { if (state.result) repeatQuestions(state.result.entries.filter((e) => resultStatus(e) !== 'right').map((e) => e.id), 'Repàs del darrer test'); });
    $('toggleAllBtn').addEventListener('click', () => { state.showAllReview = !state.showAllReview; renderResults(); });
    $('addQuestionBtn').addEventListener('click', () => openEditor());
    $('questionForm').addEventListener('submit', saveEditor);
    $('closeEditorBtn').addEventListener('click', closeEditor);
    $('cancelEditBtn').addEventListener('click', closeEditor);
    $('bankSearch').addEventListener('input', renderBank);
    $('importBtn').addEventListener('click', () => { $('importOptions').hidden = !$('importOptions').hidden; });
    $('cancelImportBtn').addEventListener('click', () => { $('importOptions').hidden = true; });
    $('chooseImportBtn').addEventListener('click', () => $('importFile').click());
    $('importFile').addEventListener('change', doImport);
    $('exportBtn').addEventListener('click', exportBank);
    $('downloadTemplateBtn').addEventListener('click', downloadTemplate);
    $('removeDemoBtn').addEventListener('click', () => {
      const count = state.bank.filter((q) => q.demo).length;
      if (window.confirm(`Vols eliminar les ${count} preguntes de demostració del banc local?`)) {
        commitBank(state.bank.filter((q) => !q.demo)); showNotice('Preguntes de demostració eliminades.');
      }
    });
    $('resetBankBtn').addEventListener('click', resetBank);
    document.addEventListener('keydown', (event) => {
      if (state.view !== 'quiz' || !state.active || event.altKey || event.ctrlKey || event.metaKey) return;
      const tag = document.activeElement?.tagName;
      if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
      const n = Number(event.key);
      if (Number.isInteger(n) && n >= 1 && n <= 4 && event.key.length === 1) {
        const item = state.active.items[state.active.current];
        state.active.answers[item.id] = item.order[n-1]; persistActive(); renderQuiz();
      }
      if (event.key === 'ArrowRight') goQuestion(state.active.current + 1);
      if (event.key === 'ArrowLeft') goQuestion(state.active.current - 1);
    });
  }

  async function init() {
    bindEvents();
    if (location.protocol === 'file:') {
      $('resetBankBtn').textContent = 'Restaurar banc inicial';
      $('resetBankBtn').title = 'Recupera la capçalera CSV integrada a index.html';
    }
    state.history = getJSON(KEYS.history, []);
    if (!Array.isArray(state.history)) state.history = [];
    state.missed = getJSON(KEYS.missed, []);
    if (!Array.isArray(state.missed)) state.missed = [];
    state.result = getJSON(KEYS.result, null);
    try {
      state.defaultBank = await fetchDefault(); state.fileLoaded = true;
    } catch (error) {
      showNotice('No s’ha pogut carregar preguntes.csv. Comprova el fitxer a GitHub o importa un CSV.', 'error');
    }
    const localBank = getJSON(KEYS.bank, null);
    let useLocal = getJSON(KEYS.custom, null) === true;
    try { state.bank = useLocal && localBank !== null ? validateBank(localBank) : state.defaultBank; }
    catch { state.bank = state.defaultBank; localStorage.removeItem(KEYS.custom); showNotice('El banc local era invàlid. S’ha recuperat el CSV del repositori.', 'error'); }
    pruneMissed();
    const saved = readSession(KEYS.active);
    if (saved && Array.isArray(saved.items) && saved.items.length && saved.items.every((item) => item.question || byId(item.id)) && saved.answers && typeof saved.current === 'number') {
      state.active = saved;
      renderAll();
      // El test es pot recuperar encara que s'hagi recarregat la pestanya.
      showView('quiz', true);
      showNotice('S’ha recuperat el test que tenies començat.', 'info');
    } else {
      removeSession(KEYS.active);
      renderAll();
    }
    setInterval(updateTimer, 1000);
  }
  init();
})();
