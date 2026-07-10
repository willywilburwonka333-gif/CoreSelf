import { useEffect, useMemo, useRef, useState } from 'react';
import { load, save } from '../services/localStore';
import { CURRENT_CONVERSATION_KEY, buildMessage, ensureConversation, loadLatestConversationMessages, saveConversationMessage } from '../services/conversationService';
import { routeCoreRequest, seedCoreSelfData } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import { acceptSuggestion, suggestMemoryFromMessage } from '../services/memorySuggestions';
import { prepareFileAttachments } from '../services/fileIntakeEngine';
import { analyseAttachments, summarizeFileAnalysisResults } from '../services/fileAnalysisClient';
import { generateImageFromPrompt } from '../services/imageGenerationClient';
import { isDirectImageCommand, requiresHumanApproval, stripApprovalNoise } from '../services/commandPolicy';

function statusLabel(meta) {
  if (!meta) return 'Dylan Core ready';
  if (meta.source === 'direct-image-command') return 'Image creator executed';
  if (meta.source === 'dylan-core-internet-engine') return meta.deepThink ? 'Deep Internet Scan online' : 'Internet Scan online';
  if (meta.deepThink) return 'Deep Think online';
  if (meta.source === 'dylan-core-engine' || meta.source === 'real-ai-brain') return 'Dylan Core Engine online';
  if (meta.source === 'cloud-memory') return 'Cloud memory active';
  return 'Safe fallback mode';
}

function contextLine(meta) {
  const used = meta?.contextUsed;
  if (!used) return 'Memory, projects, goals and plans load before replies.';
  return `Context: ${used.relevantMemories || 0}/${used.memories || 0} memories • ${used.projects || 0} projects • ${used.goals || 0} goals • ${used.plans || 0} plans.`;
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

function normalizeMessage(message) {
  if (!message?.text) return message;
  return { ...message, text: stripApprovalNoise(message.text) || message.text };
}

function buildImagePrompt(input) {
  const request = String(input || '').trim();
  return `Create a polished production image for Dylan Core / Core Self from this direct user request. Do not add text unless requested. Request: ${request}`;
}

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(() => load('messages', [
    { from: 'core', text: 'Dylan Core ready. Tell me what to do.' },
  ]).map(normalizeMessage));
  const [suggestions, setSuggestions] = useState(load('memorySuggestions', []));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [lastMeta, setLastMeta] = useState(load('lastAiMeta', null));
  const [actionQueue, setActionQueue] = useState(load('actionQueue', []));
  const [conversationId, setConversationId] = useState(load(CURRENT_CONVERSATION_KEY, null));
  const [cloudState, setCloudState] = useState('Preparing memory...');
  const [seedState, setSeedState] = useState(load('coreSeedState', null));
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [workStatus, setWorkStatus] = useState('');
  const [developerMode, setDeveloperMode] = useState(load('developerMode', false));
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const seeded = seedCoreSelfData();
    setSeedState(seeded);
    save('coreSeedState', seeded);
    logActivity({ engine: 'Dylan Core', action: 'Seed context checked', detail: `${seeded.memories} memories, ${seeded.projects} projects, ${seeded.goals} goals, ${seeded.plans} plans available.` });
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
          const cleaned = loaded.messages.map(normalizeMessage);
          setMessages(cleaned);
          save('messages', cleaned);
        }
        setCloudState('Memory synced');
      } else {
        setCloudState(result.reason || 'Memory offline');
      }
    }
    startConversation().catch((error) => setCloudState(error.message || 'Memory failed safely'));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const pendingSuggestions = useMemo(() => suggestions.filter((item) => item.status === 'Pending').length, [suggestions]);
  const latestPreparedActions = developerMode ? (lastMeta?.preparedActions || []) : [];

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
    logActivity({ engine: 'File Intake', action: 'Attached files', detail: `${prepared.attachments.length} file(s) staged.` });
    event.target.value = '';
  }

  function removeAttachment(id) {
    setAttachments((current) => current.filter((file) => file.id !== id));
  }

  function saveMessages(next) {
    const cleaned = next.map(normalizeMessage);
    setMessages(cleaned);
    save('messages', cleaned);
    return cleaned;
  }

  async function runDirectImageCommand({ clean, optimistic, userMessage, activeAttachments, fileAnalysisResults, fileAnalysisSummary }) {
    setWorkStatus('Creating image...');
    const imageGenerationResult = await generateImageFromPrompt({ prompt: buildImagePrompt(clean), size: '1024x1024', quality: 'auto' });
    const meta = {
      source: 'direct-image-command',
      imageGenerationResult,
      attachments: activeAttachments,
      fileAnalysisResults,
      fileAnalysisSummary,
      at: new Date().toISOString(),
    };
    const reply = imageGenerationResult?.ok
      ? 'Done. Here is the image.'
      : `I tried to create the image, but the image route failed: ${imageGenerationResult?.error || 'unknown error'}. ${imageGenerationResult?.nextAction || ''}`.trim();
    const coreMessage = buildMessage({ from: 'core', text: reply, meta });
    const next = saveMessages([...optimistic, coreMessage]);
    setLastMeta(meta);
    save('lastAiMeta', meta);
    if (conversationId) {
      saveConversationMessage(conversationId, userMessage).catch(() => null);
      saveConversationMessage(conversationId, coreMessage).catch(() => null);
    }
    setWorkStatus(imageGenerationResult?.ok ? 'Image created.' : 'Image failed safely.');
    return next;
  }

  async function send(overrideInput) {
    const analysisAttachments = attachments.map(stripPreviewOnly);
    const activeAttachments = attachments.map(stripPreview);
    const clean = (overrideInput ?? input).trim() || (activeAttachments.length ? 'Analyse the attached file(s).' : '');
    if ((!clean && !activeAttachments.length) || isSending) return;

    setIsSending(true);
    setWorkStatus(activeAttachments.length ? 'Reading attachment...' : 'Working...');
    setAttachmentError('');

    try {
      const fileAnalysisResults = activeAttachments.length ? await analyseAttachments(analysisAttachments) : null;
      const fileAnalysisSummary = fileAnalysisResults ? summarizeFileAnalysisResults(fileAnalysisResults) : '';
      const userMessage = buildMessage({ from: 'dylan', text: clean, attachments: activeAttachments, fileAnalysisSummary });
      const optimistic = saveMessages([...messages, userMessage]);
      setInput('');
      setAttachments([]);

      if (isDirectImageCommand(clean)) {
        await runDirectImageCommand({ clean, optimistic, userMessage, activeAttachments, fileAnalysisResults, fileAnalysisSummary });
        return;
      }

      const memories = load('memories', []);
      const projects = load('projects', []);
      const goals = load('goals', []);
      const plans = load('plans', []);
      const routed = await routeCoreRequest({ input: clean, mode, memories, projects, goals, plans, messages: optimistic, deepThink, attachments: activeAttachments, fileAnalysisResults, fileAnalysisSummary });
      const suggestion = suggestMemoryFromMessage(clean, suggestions);
      const preparedActions = requiresHumanApproval(clean) ? (routed.preparedActions || []) : [];

      const meta = {
        provider: routed.provider,
        model: routed.model,
        source: routed.source,
        confidence: routed.confidence,
        latencyMs: routed.latencyMs,
        error: routed.error,
        contextUsed: routed.contextUsed,
        internetNeeded: routed.internetNeeded,
        internetUsed: routed.internetUsed,
        sources: routed.sources || [],
        preparedActions,
        orchestratorPlan: routed.orchestratorPlan || null,
        researchPlan: routed.researchPlan || null,
        developerPlan: routed.developerPlan || null,
        toolRuntime: routed.toolReadiness?.runtime || routed.toolRuntime || null,
        fileIntakePlan: routed.fileIntakePlan || null,
        attachments: activeAttachments,
        fileAnalysisResults,
        fileAnalysisSummary,
        deepThink,
        routeProfile: routed.routeProfile,
        deepRecommended: routed.deepRecommended,
        at: new Date().toISOString(),
      };

      const coreReply = stripApprovalNoise(routed.reply || '') || 'Done.';
      const coreText = developerMode && suggestion ? `${coreReply}\n\nMemory suggestion available in Dev Mode.` : coreReply;
      const coreMessage = buildMessage({ from: 'core', text: coreText, meta });
      saveMessages([...optimistic, coreMessage]);
      setLastMeta(meta);
      save('lastAiMeta', meta);
      if (conversationId) {
        saveConversationMessage(conversationId, userMessage).catch(() => null);
        saveConversationMessage(conversationId, coreMessage).catch(() => null);
      }
      if (suggestion) {
        const nextSuggestions = [suggestion, ...suggestions].slice(0, 50);
        setSuggestions(nextSuggestions);
        save('memorySuggestions', nextSuggestions);
      }
      setWorkStatus('');
    } catch (error) {
      const coreMessage = buildMessage({ from: 'core', text: `Something failed safely: ${error.message || 'Unknown error.'}` });
      saveMessages([...messages, coreMessage]);
      setWorkStatus('Failed safely.');
    } finally {
      setIsSending(false);
    }
  }

  function approveSuggestion(suggestion) {
    const result = acceptSuggestion(suggestion);
    if (!result.ok) return;
    const next = suggestions.map((item) => item.id === suggestion.id ? { ...item, status: 'Accepted' } : item);
    setSuggestions(next);
    save('memorySuggestions', next);
    logActivity({ engine: 'Memory Vault', action: 'Accepted memory suggestion', detail: suggestion.title });
  }

  function rejectSuggestion(suggestion) {
    const next = suggestions.map((item) => item.id === suggestion.id ? { ...item, status: 'Rejected' } : item);
    setSuggestions(next);
    save('memorySuggestions', next);
    logActivity({ engine: 'Memory Vault', action: 'Rejected memory suggestion', detail: suggestion.title });
  }

  function savePreparedAction(action) {
    const prepared = { ...action, id: action.id || crypto.randomUUID(), savedAt: new Date().toISOString(), status: 'Queued' };
    const nextQueue = [prepared, ...actionQueue].slice(0, 50);
    setActionQueue(nextQueue);
    save('actionQueue', nextQueue);
    logActivity({ engine: 'Action Queue', action: 'Queued prepared action', detail: prepared.title });
  }

  return (
    <section className="screen talkScreen dylanCoreExperience commandSystem">
      <div className="talkHeader compactTalkHeader">
        <div>
          <p className="eyebrow">DYLAN CORE</p>
          <h2>Talk</h2>
          <small className="readyLine">{cloudState}. Ready.</small>
        </div>
        <div className="talkHeaderActions">
          <button className={`deepToggle ${deepThink ? 'active' : ''}`} type="button" onClick={() => setDeepThink((value) => !value)}>{deepThink ? 'Deep On' : 'Deep'}</button>
          <button className={`devToggle ${developerMode ? 'active' : ''}`} type="button" onClick={() => { const next = !developerMode; setDeveloperMode(next); save('developerMode', next); }}>Dev</button>
        </div>
      </div>

      {developerMode && (
        <div className={`aiStatusPanel ${lastMeta?.source === 'dylan-core-engine' || lastMeta?.source === 'real-ai-brain' || lastMeta?.source === 'direct-image-command' ? 'connected' : 'fallback'}`}>
          <span>{statusLabel(lastMeta)}</span>
          <small>{contextLine(lastMeta)}</small>
          {seedState && <small>Seed: {seedState.memories} memories • {seedState.projects} projects • {seedState.goals} goals • {seedState.plans} plans.</small>}
          {workStatus && <small>{workStatus}</small>}
          {lastMeta?.internetUsed && <small>Internet Scan used{lastMeta?.sources?.length ? ` • ${lastMeta.sources.length} source(s)` : ''}</small>}
          {lastMeta?.routeProfile && <small>Route: {lastMeta.routeProfile}</small>}
          {lastMeta?.orchestratorPlan && <small>Orchestrator: {lastMeta.orchestratorPlan.label} • {lastMeta.orchestratorPlan.answerStyle}</small>}
          {lastMeta?.toolRuntime && <small>Runtime: {lastMeta.toolRuntime.runnable} runnable • {lastMeta.toolRuntime.blocked} gated</small>}
          {lastMeta?.fileAnalysisSummary && <small>Analyzer: {lastMeta.fileAnalysisSummary.split('\n')[0]}</small>}
          {latestPreparedActions.length > 0 && <small>Approval actions prepared: {latestPreparedActions.length}</small>}
        </div>
      )}

      <div className="quickChips cleanChips" aria-label="Quick actions">
        <button type="button" onClick={() => send('What is the next best step for Core Self right now?')}>Next</button>
        <button type="button" onClick={() => send('Create an action plan for the next Core Self build.')}>Plan</button>
        <button type="button" onClick={() => send('Search the internet for the latest useful AI tools for building Core Self cheaply, compare them against our actual stack, tell me what to use now, what to skip, and cite sources.')}>Web</button>
        <button type="button" onClick={() => { const seeded = seedCoreSelfData(); setSeedState(seeded); save('coreSeedState', seeded); }}>Reseed</button>
      </div>

      <div className="chat cleanChat commandChat">
        {messages.map((m, i) => (
          <div key={i} className={'bubble ' + m.from}>
            <span>{stripApprovalNoise(m.text) || m.text}</span>
            {developerMode && m.meta && <small>{statusLabel(m.meta)} • {contextLine(m.meta)}{m.meta.deepThink ? ' • Deep Think' : ''}</small>}
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
                    {m.fileAnalysisSummary && <small>{m.fileAnalysisSummary.split('\n')[0]}</small>}
                  </div>
                ))}
              </div>
            )}
            {m.meta?.imageGenerationResult?.ok && (
              <div className="generatedImageCard">
                <img src={m.meta.imageGenerationResult.image} alt="Generated Core Self visual" />
                {developerMode && <small>{m.meta.imageGenerationResult.size || '1024x1024'} • {m.meta.imageGenerationResult.quality || 'auto'}</small>}
              </div>
            )}
          </div>
        ))}
        {isSending && <div className="bubble core thinking">{workStatus || 'Working...'}</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="inputRow fileInputRow cleanComposer commandComposer">
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

      {attachmentError && <div className="attachmentError">{attachmentError}</div>}
      {attachments.length > 0 && (
        <div className="attachmentTray compactAttachmentTray">
          {attachments.map((file) => (
            <div className="attachmentCard staged" key={file.id}>
              {file.previewUrl && <img src={file.previewUrl} alt={file.name} />}
              <strong>{file.name}</strong>
              <span>{file.kind} • {file.sizeLabel}</span>
              <button type="button" onClick={() => removeAttachment(file.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {developerMode && actionQueue.length > 0 && (
        <div className="briefing actionNotice">
          <h3>Action Queue</h3>
          {actionQueue.slice(0, 5).map((action) => (
            <div className="miniActionCard" key={action.id}>
              <strong>{action.title}</strong>
              <p>{action.nextStep || action.detail}</p>
              <small>{action.type} • {action.status}</small>
            </div>
          ))}
        </div>
      )}
      {developerMode && latestPreparedActions.length > 0 && (
        <div className="briefing actionNotice">
          <h3>Needs Approval</h3>
          {latestPreparedActions.map((action) => (
            <div className="miniActionCard" key={action.id}>
              <strong>{action.title}</strong>
              <p>{action.nextStep}</p>
              <button type="button" onClick={() => savePreparedAction(action)}>Save to Action Queue</button>
            </div>
          ))}
        </div>
      )}
      {developerMode && !!pendingSuggestions && (
        <div className="briefing suggestionNotice">
          <h3>Memory Suggestions</h3>
          <p>{pendingSuggestions} memory suggestion(s) are waiting.</p>
          {suggestions.filter((item) => item.status === 'Pending').slice(0, 3).map((suggestion) => (
            <div className="miniActionCard" key={suggestion.id}>
              <strong>{suggestion.title}</strong>
              <p>{suggestion.content}</p>
              <div className="miniActionButtons">
                <button type="button" onClick={() => approveSuggestion(suggestion)}>Save Memory</button>
                <button type="button" onClick={() => rejectSuggestion(suggestion)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
