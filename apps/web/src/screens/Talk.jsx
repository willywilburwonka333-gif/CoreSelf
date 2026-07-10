import { useEffect, useMemo, useRef, useState } from 'react';
import { load, save } from '../services/localStore';
import { CURRENT_CONVERSATION_KEY, buildMessage, ensureConversation, loadLatestConversationMessages, saveConversationMessage } from '../services/conversationService';
import { routeCoreRequest, seedCoreSelfData } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import { prepareFileAttachments } from '../services/fileIntakeEngine';
import { analyseAttachments, summarizeFileAnalysisResults } from '../services/fileAnalysisClient';
import { buildImagePromptFromCreatorPlan, generateImageFromPrompt } from '../services/imageGenerationClient';
import { classifyCommand, policySummary } from '../services/commandPolicy';
import { addOperatorLog, loadOperatorLog } from '../services/operatorLog';
import { cleanCoreReply } from '../services/responseCleaner';

function statusLabel(meta) {
  if (!meta) return 'Ready';
  if (meta.operatorPolicy?.mode === 'confirm') return 'Approval required';
  if (meta.imageGenerationResult?.ok) return 'Image created';
  if (meta.fileAnalysisSummary) return 'File analysed';
  if (meta.internetUsed) return 'Web scan used';
  if (meta.deepThink) return 'Deep Think used';
  return 'Done';
}

function isDirectImageCommand(input = '') {
  return classifyCommand(input).intent === 'image_generate';
}

function stripPreview(file) {
  if (!file) return file;
  const { previewUrl, routeDataUrl, ...safeFile } = file;
  return safeFile;
}

function stripPreviewOnly(file) {
  if (!file) return file;
  const { previewUrl, ...safeFile } = file;
  return safeFile;
}

function buildVisibleFileSummary(summary = '') {
  if (!summary) return '';
  const lines = String(summary).split('\n').filter(Boolean).slice(0, 8);
  return lines.length ? `I analysed the attachment.\n\n${lines.join('\n')}` : 'I analysed the attachment.';
}

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(load('messages', [
    { from: 'core', text: 'Dylan Core ready. Tell me what to do.' },
  ]));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [developerMode, setDeveloperMode] = useState(load('developerMode', false));
  const [lastMeta, setLastMeta] = useState(load('lastAiMeta', null));
  const [conversationId, setConversationId] = useState(load(CURRENT_CONVERSATION_KEY, null));
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [operatorStatus, setOperatorStatus] = useState('Ready.');
  const [operatorLog, setOperatorLog] = useState(loadOperatorLog());
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const commandPolicy = useMemo(() => classifyCommand(input, { hasAttachments: attachments.length > 0 }), [input, attachments.length]);
  const policy = useMemo(() => policySummary(), []);

  useEffect(() => {
    const seeded = seedCoreSelfData();
    logActivity({ engine: 'Dylan Core Seed Pack', action: 'Seed context checked', detail: `${seeded.memories} memories, ${seeded.projects} projects, ${seeded.goals} goals, ${seeded.plans} plans available.` });
  }, []);

  useEffect(() => {
    let alive = true;
    async function startConversation() {
      const existing = load(CURRENT_CONVERSATION_KEY, null);
      const result = await ensureConversation(existing, 'Dylan Core Talk');
      if (!alive) return;
      if (result.ok) {
        setConversationId(result.conversationId);
        save(CURRENT_CONVERSATION_KEY, result.conversationId);
        const loaded = await loadLatestConversationMessages(result.conversationId, messages);
        if (alive && loaded.ok && loaded.messages?.length) {
          setMessages(loaded.messages);
          save('messages', loaded.messages);
        }
      }
    }
    startConversation().catch(() => null);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  function pushOperatorLog(entry) {
    const nextLog = addOperatorLog(entry);
    setOperatorLog(nextLog);
  }

  async function handleFilesSelected(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setAttachmentError('');
    const prepared = await prepareFileAttachments(files);
    if (!prepared.ok) {
      setAttachmentError(prepared.reason || 'File intake failed safely.');
      event.target.value = '';
      return;
    }
    setAttachments((current) => [...current, ...prepared.attachments].slice(0, 8));
    setOperatorStatus(`${prepared.attachments.length} attachment(s) ready.`);
    logActivity({ engine: 'File Intake', action: 'Attached files', detail: `${prepared.attachments.length} file(s) staged for Dylan Core.` });
    event.target.value = '';
  }

  function removeAttachment(id) {
    setAttachments((current) => current.filter((file) => file.id !== id));
  }

  async function executeDirectImage({ clean, optimistic, activeAttachments, fileAnalysisResults, fileAnalysisSummary }) {
    setOperatorStatus('Creating image...');
    const routed = await routeCoreRequest({ input: clean, mode, memories: load('memories', []), projects: load('projects', []), goals: load('goals', []), plans: load('plans', []), messages: optimistic, deepThink });
    const imagePrompt = buildImagePromptFromCreatorPlan(routed.creatorPlan, clean);
    const imageGenerationResult = await generateImageFromPrompt({
      prompt: imagePrompt,
      size: routed.creatorPlan?.imageGeneration?.size || '1024x1024',
      quality: routed.creatorPlan?.imageGeneration?.quality || 'auto',
    });
    const meta = {
      ...routed,
      operatorPolicy: classifyCommand(clean, { hasAttachments: activeAttachments.length > 0 }),
      attachments: activeAttachments,
      fileAnalysisResults,
      fileAnalysisSummary,
      imageGenerationResult,
      deepThink,
      at: new Date().toISOString(),
    };
    const text = imageGenerationResult.ok
      ? 'Done. Here’s the image.'
      : `Image generation failed safely. ${imageGenerationResult.error || ''}\n\n${imageGenerationResult.nextAction || 'Check the image provider setup and retry.'}`.trim();
    return { text, meta };
  }

  async function send(overrideInput) {
    const analysisAttachments = attachments.map(stripPreviewOnly);
    const activeAttachments = attachments.map(stripPreview);
    const clean = (overrideInput ?? input).trim() || (activeAttachments.length ? 'Analyse the attached file(s).' : '');
    if ((!clean && !activeAttachments.length) || isSending) return;

    const operatorPolicy = classifyCommand(clean, { hasAttachments: activeAttachments.length > 0 });
    const userMessage = buildMessage({ from: 'dylan', text: clean, attachments: activeAttachments });
    const optimistic = [...messages, userMessage];
    setMessages(optimistic);
    save('messages', optimistic);
    setInput('');
    setAttachments([]);
    setAttachmentError('');
    setIsSending(true);
    setOperatorStatus(operatorPolicy.userVisible);
    if (conversationId) saveConversationMessage(conversationId, userMessage).catch(() => null);

    try {
      if (operatorPolicy.mode === 'confirm') {
        const meta = { operatorPolicy, deepThink, at: new Date().toISOString(), attachments: activeAttachments };
        const next = [...optimistic, buildMessage({ from: 'core', text: `${operatorPolicy.userVisible}\n\nReason: ${operatorPolicy.reason}\n\nReply "approve" with the exact action when you want me to proceed.`, meta })];
        setMessages(next);
        save('messages', next);
        setLastMeta(meta);
        save('lastAiMeta', meta);
        pushOperatorLog({ title: operatorPolicy.label, intent: operatorPolicy.intent, status: 'waiting_for_approval', detail: clean });
        return;
      }

      let fileAnalysisResults = null;
      let fileAnalysisSummary = '';
      if (activeAttachments.length) {
        setOperatorStatus('Analysing attachment...');
        fileAnalysisResults = await analyseAttachments(analysisAttachments, clean);
        fileAnalysisSummary = fileAnalysisResults ? summarizeFileAnalysisResults(fileAnalysisResults) : '';
      }

      let result;
      if (isDirectImageCommand(clean)) {
        result = await executeDirectImage({ clean, optimistic, activeAttachments, fileAnalysisResults, fileAnalysisSummary });
      } else {
        const routed = await routeCoreRequest({
          input: fileAnalysisSummary ? `${clean}\n\nAttached file analysis:\n${fileAnalysisSummary}` : clean,
          mode,
          memories: load('memories', []),
          projects: load('projects', []),
          goals: load('goals', []),
          plans: load('plans', []),
          messages: optimistic,
          deepThink,
        });
        const cleaned = cleanCoreReply(routed.reply);
        const fileText = buildVisibleFileSummary(fileAnalysisSummary);
        const text = [fileText, cleaned || 'Done.'].filter(Boolean).join('\n\n');
        result = {
          text,
          meta: {
            ...routed,
            operatorPolicy,
            attachments: activeAttachments,
            fileAnalysisResults,
            fileAnalysisSummary,
            deepThink,
            at: new Date().toISOString(),
          },
        };
      }

      const next = [...optimistic, buildMessage({ from: 'core', text: result.text, meta: result.meta })];
      setMessages(next);
      save('messages', next);
      setLastMeta(result.meta);
      save('lastAiMeta', result.meta);
      if (conversationId) saveConversationMessage(conversationId, next[next.length - 1]).catch(() => null);
      setOperatorStatus(statusLabel(result.meta));
      pushOperatorLog({ title: result.meta.operatorPolicy?.label || 'Core action', intent: result.meta.operatorPolicy?.intent || 'general', status: result.meta.imageGenerationResult?.ok || result.meta.fileAnalysisSummary || result.text ? 'done' : 'failed', detail: clean });
      logActivity({ engine: 'Operator Mode', action: result.meta.operatorPolicy?.label || 'Executed command', detail: clean });
    } catch (error) {
      const failMeta = { operatorPolicy, error: error.message, at: new Date().toISOString() };
      const failMessage = buildMessage({ from: 'core', text: `Core failed safely. ${error.message || 'Unknown error.'}`, meta: failMeta });
      const next = [...optimistic, failMessage];
      setMessages(next);
      save('messages', next);
      setLastMeta(failMeta);
      setOperatorStatus('Failed safely.');
      pushOperatorLog({ title: operatorPolicy.label, intent: operatorPolicy.intent, status: 'failed', detail: error.message || clean });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="screen talkScreen operatorTalkScreen">
      <div className="operatorShell">
        <header className="operatorHeader">
          <div>
            <p className="eyebrow">DYLAN CORE</p>
            <h2>Operator Mode</h2>
            <small>{operatorStatus}</small>
          </div>
          <div className="talkHeaderActions">
            <button className={`deepToggle ${deepThink ? 'active' : ''}`} type="button" onClick={() => setDeepThink((value) => !value)}>{deepThink ? 'Deep On' : 'Deep'}</button>
            <button className={`devToggle ${developerMode ? 'active' : ''}`} type="button" onClick={() => { const next = !developerMode; setDeveloperMode(next); save('developerMode', next); }}>Dev</button>
          </div>
        </header>

        <div className="operatorCommandBar">
          <span className={`policyPill ${commandPolicy.mode}`}>{commandPolicy.mode === 'confirm' ? 'Needs approval' : commandPolicy.mode === 'execute' ? 'Will act' : 'Will answer'}</span>
          <span>{input.trim() || attachments.length ? commandPolicy.label : 'Tell Dylan Core what to do'}</span>
        </div>

        <div className="chat cleanChat operatorChat">
          {messages.map((m, i) => (
            <div key={i} className={'bubble ' + m.from}>
              <span>{m.text}</span>
              {developerMode && m.meta && (
                <small>
                  {statusLabel(m.meta)} • {m.meta.operatorPolicy?.mode || 'answer'} • {m.meta.operatorPolicy?.intent || 'conversation'}
                  {m.meta.routeProfile ? ` • ${m.meta.routeProfile}` : ''}
                  {m.meta.source ? ` • ${m.meta.source}` : ''}
                </small>
              )}
              {m.meta?.sources?.length > 0 && (
                <div className="sourceCards">
                  {m.meta.sources.slice(0, 4).map((source, sourceIndex) => (
                    <a key={source.url || source.title || sourceIndex} href={source.url} target="_blank" rel="noreferrer" className="sourceCard">
                      <strong>{sourceIndex + 1}. {source.title || 'Source'}</strong>
                      <span>{source.url}</span>
                    </a>
                  ))}
                </div>
              )}
              {m.attachments?.length > 0 && (
                <div className="attachmentCards">
                  {m.attachments.map((file) => (
                    <div className="attachmentCard" key={file.id || file.name}>
                      <strong>{file.name}</strong>
                      <span>{file.kind || 'file'} • {file.sizeLabel || 'attached'}</span>
                    </div>
                  ))}
                </div>
              )}
              {m.meta?.imageGenerationResult?.ok && (
                <div className="generatedImageCard">
                  <img src={m.meta.imageGenerationResult.image} alt="Generated Core Self visual" />
                </div>
              )}
            </div>
          ))}
          {isSending && <div className="bubble core thinking">Working...</div>}
          <div ref={chatEndRef} />
        </div>

        {attachments.length > 0 && (
          <div className="attachmentTray compactAttachmentTray operatorAttachmentTray">
            {attachments.map((file) => (
              <div className="attachmentCard staged" key={file.id}>
                {file.previewUrl && <img src={file.previewUrl} alt={file.name} />}
                <strong>{file.name}</strong>
                <span>{file.kind} • {file.sizeLabel}{file.routeReady === false ? ' • metadata only' : ''}</span>
                <button type="button" onClick={() => removeAttachment(file.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
        {attachmentError && <div className="attachmentError">{attachmentError}</div>}

        <div className="inputRow fileInputRow cleanComposer operatorComposer">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hiddenFileInput"
            accept="image/*,audio/*,video/*,.zip,.rar,.7z,.tar,.gz,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.js,.jsx,.ts,.tsx,.json,.css,.html,.csv,.xml,.yml,.yaml,.log"
            onChange={handleFilesSelected}
          />
          <button type="button" className="attachButton" onClick={() => fileInputRef.current?.click()} disabled={isSending} title="Attach photo, image, PDF, ZIP, document, audio, video or code">📎</button>
          <textarea
            value={input}
            disabled={isSending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Tell Dylan Core what to do..."
            rows={1}
          />
          <button onClick={() => send()} disabled={isSending || (!input.trim() && !attachments.length)}>{isSending ? '...' : 'Send'}</button>
        </div>
      </div>

      {developerMode && (
        <div className="briefing operatorDevPanel">
          <h3>Developer Mode</h3>
          <p><strong>Last:</strong> {lastMeta ? statusLabel(lastMeta) : 'No action yet.'}</p>
          <p><strong>Policy:</strong> act without approval for {policy.executeWithoutApproval.join(', ')}.</p>
          <p><strong>Approval:</strong> {policy.requireApproval.join(', ')}.</p>
          <h4>Work Log</h4>
          {operatorLog.length ? operatorLog.slice(0, 8).map((item) => (
            <div className="miniActionCard" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <small>{item.intent} • {item.status}</small>
            </div>
          )) : <small>No work logged yet.</small>}
        </div>
      )}
    </section>
  );
}
