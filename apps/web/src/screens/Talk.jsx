import { useEffect, useMemo, useRef, useState } from 'react';
import { load, save } from '../services/localStore';
import { CURRENT_CONVERSATION_KEY, buildMessage, ensureConversation, loadLatestConversationMessages, saveConversationMessage } from '../services/conversationService';
import { routeCoreRequest, seedCoreSelfData } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import { acceptSuggestion, suggestMemoryFromMessage } from '../services/memorySuggestions';
import { prepareFileAttachments } from '../services/fileIntakeEngine';
import { analyseAttachments, summarizeFileAnalysisResults } from '../services/fileAnalysisClient';
import { buildImagePromptFromCreatorPlan, generateImageFromPrompt } from '../services/imageGenerationClient';

function statusLabel(meta) {
  if (!meta) return 'Dylan Core ready';
  if (meta.source === 'dylan-core-internet-engine') return meta.deepThink ? 'Deep Internet Scan online' : 'Internet Scan online';
  if (meta.deepThink) return 'Deep Think online';
  if (meta.source === 'dylan-core-engine') return 'Dylan Core Engine online';
  if (meta.source === 'real-ai-brain') return 'Dylan Core Engine online';
  if (meta.source === 'cloud-memory') return 'Cloud memory active';
  return 'Safe fallback mode';
}


function isDirectImageRequest(input = '') {
  const text = String(input || '').toLowerCase();
  const create = /\b(make|create|generate|draw|design|render|produce|build)\b/.test(text);
  const target = /\b(image|picture|photo|thumbnail|cover|cover art|poster|logo|banner|mockup|visual|artwork|wallpaper|icon|graphic)\b/.test(text);
  const edit = /\b(edit|change|remove|replace|upscale|enhance|fix|clean|restore)\b/.test(text);
  const hasUploadContext = /\b(attached|uploaded|this image|this photo|the image|the photo)\b/.test(text);
  const analysisOnly = /\b(analyse|analyze|inspect|read|identify|what is|what's|describe|explain|look at)\b/.test(text);
  return Boolean(((create && target) || (edit && hasUploadContext)) && !analysisOnly);
}

function stripApprovalNoise(text = '') {
  const source = String(text || '');
  const blocked = [
    /approve/i,
    /approval/i,
    /pending\s+approval/i,
    /ui\s+once\s+it'?s\s+ready/i,
    /please\s+hold\s+on/i,
    /confirm\s+if\s+you'?d\s+like\s+to\s+proceed/i,
    /let\s+me\s+know/i,
    /image\s+generation\s+request/i,
  ];
  const lines = source
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !blocked.some((pattern) => pattern.test(line)));
  return lines.join('\n').trim();
}

function shouldRequireHumanApproval(action = {}) {
  const text = `${action.title || ''} ${action.detail || ''} ${action.nextStep || ''} ${action.type || ''}`.toLowerCase();
  return /\b(send|email|message|sms|call|delete|remove permanently|overwrite|spend|pay|purchase|buy|deploy|push|commit|firebase|production|background|schedule|calendar|book|contact)\b/.test(text);
}

function shouldAutoGenerateImage(input = '', creatorPlan = {}) {
  const text = String(input || '').toLowerCase();
  const directCreate = /\b(make|create|generate|draw|design|render|produce|build)\b/.test(text);
  const imageTarget = /\b(image|picture|photo|thumbnail|cover|cover art|poster|logo|banner|mockup|visual|artwork|wallpaper|icon|graphic)\b/.test(text);
  const analysisOnly = /\b(analyse|analyze|inspect|read|identify|what is|what's|describe|explain|look at)\b/.test(text);
  return Boolean(directCreate && imageTarget && !analysisOnly && (creatorPlan?.imageGeneration?.ready || imageTarget));
}

function contextLine(meta) {
  const used = meta?.contextUsed;
  if (!used) return 'Seed pack active. Memory, projects, goals and plans load before every reply.';
  return `Context loaded: ${used.relevantMemories || 0} relevant / ${used.memories || 0} total memories • ${used.projects || 0} projects • ${used.goals || 0} goals • ${used.plans || 0} plans.`;
}

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(load('messages', [
    { from: 'core', text: 'Dylan. Core pipeline online. I will use memory, projects, goals, and plans when they are loaded. What are we fixing next?' },
  ]));
  const [suggestions, setSuggestions] = useState(load('memorySuggestions', []));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [lastMeta, setLastMeta] = useState(load('lastAiMeta', null));
  const [actionQueue, setActionQueue] = useState(load('actionQueue', []));
  const [conversationId, setConversationId] = useState(load(CURRENT_CONVERSATION_KEY, null));
  const [cloudState, setCloudState] = useState('Preparing cloud memory...');
  const [seedState, setSeedState] = useState(load('coreSeedState', null));
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [fileAnalysisStatus, setFileAnalysisStatus] = useState('');
  const [developerMode, setDeveloperMode] = useState(load('developerMode', false));
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);


  useEffect(() => {
    const seeded = seedCoreSelfData();
    setSeedState(seeded);
    save('coreSeedState', seeded);
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
        setCloudState('Cloud conversation memory active');
      } else {
        setCloudState(result.reason || 'Cloud conversation memory offline');
      }
    }
    startConversation().catch((error) => setCloudState(error.message || 'Cloud conversation memory failed safely'));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((item) => item.status === 'Pending').length,
    [suggestions]
  );

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
    logActivity({ engine: 'File Intake', action: 'Attached files', detail: `${prepared.attachments.length} file(s) staged for Dylan Core.` });
    event.target.value = '';
  }

  function removeAttachment(id) {
    setAttachments((current) => current.filter((file) => file.id !== id));
  }

  async function send(overrideInput) {
    const analysisAttachments = attachments.map(stripPreviewOnly);
    const activeAttachments = attachments.map(stripPreview);
    const clean = (overrideInput ?? input).trim() || (activeAttachments.length ? 'Analyse the attached file(s).' : '');
    if ((!clean && !activeAttachments.length) || isSending) return;

    setFileAnalysisStatus(activeAttachments.length ? 'Analysing attached file(s) through server routes...' : '');
    const fileAnalysisResults = activeAttachments.length ? await analyseAttachments(analysisAttachments) : null;
    const fileAnalysisSummary = fileAnalysisResults ? summarizeFileAnalysisResults(fileAnalysisResults) : '';
    setFileAnalysisStatus(fileAnalysisSummary ? 'File analyzer routes completed.' : '');

    const userMessage = buildMessage({ from: 'dylan', text: clean, attachments: activeAttachments, fileAnalysisSummary });
    const optimistic = [...messages, userMessage];
    setMessages(optimistic);
    save('messages', optimistic);
    setInput('');
    setAttachments([]);
    setAttachmentError('');
    setIsSending(true);
    if (conversationId) saveConversationMessage(conversationId, userMessage).catch(() => null);

    try {
      const memories = load('memories', []);
      const projects = load('projects', []);
      const goals = load('goals', []);
      const plans = load('plans', []);
      const directImageRequest = isDirectImageRequest(clean);
      let routed = null;
      let imageGenerationResult = null;

      if (directImageRequest) {
        setFileAnalysisStatus('Creating image...');
        const imagePrompt = activeAttachments.length
          ? `${clean}\n\nAttached file context:\n${fileAnalysisSummary || activeAttachments.map((file) => `${file.name} (${file.kind || 'file'})`).join('\n')}`
          : clean;
        imageGenerationResult = await generateImageFromPrompt({
          prompt: imagePrompt,
          size: '1024x1024',
          quality: 'auto',
        });
        setFileAnalysisStatus(imageGenerationResult?.ok ? 'Image created.' : 'Image route failed safely.');
        routed = {
          provider: imageGenerationResult?.provider || 'image-route',
          model: imageGenerationResult?.model || 'gpt-image-1',
          source: 'creator-direct-execution',
          confidence: imageGenerationResult?.ok ? 0.98 : 0.4,
          latencyMs: imageGenerationResult?.latencyMs || 0,
          error: imageGenerationResult?.ok ? '' : imageGenerationResult?.reason,
          contextUsed: { relevantMemories: memories.length, memories: memories.length, projects: projects.length, goals: goals.length, plans: plans.length },
          internetNeeded: false,
          internetUsed: false,
          sources: [],
          preparedActions: [],
          orchestratorPlan: null,
          researchPlan: null,
          developerPlan: null,
          toolReadiness: null,
          fileIntakePlan: activeAttachments.length ? { active: true, summary: 'Attachment context included.' } : null,
          creatorPlan: { primaryLabel: 'Direct image creation', imageGeneration: { ready: true, size: '1024x1024', quality: 'auto' } },
          routeProfile: 'create_asset',
          deepRecommended: false,
          reply: imageGenerationResult?.ok ? 'Done — image created.' : `Image route failed safely. ${imageGenerationResult?.reason || 'Check OPENAI_API_KEY and /api/create-image.'}`,
        };
      } else {
        routed = await routeCoreRequest({ input: clean, mode, memories, projects, goals, plans, messages: optimistic, deepThink, attachments: activeAttachments, fileAnalysisResults, fileAnalysisSummary });
        if (shouldAutoGenerateImage(clean, routed.creatorPlan)) {
          setFileAnalysisStatus('Creating image...');
          const imagePrompt = buildImagePromptFromCreatorPlan(routed.creatorPlan, clean);
          imageGenerationResult = await generateImageFromPrompt({
            prompt: imagePrompt,
            size: routed.creatorPlan?.imageGeneration?.size || '1024x1024',
            quality: routed.creatorPlan?.imageGeneration?.quality || 'auto',
          });
          setFileAnalysisStatus(imageGenerationResult?.ok ? 'Image created.' : 'Image route failed safely.');
        }
      }
      const suggestion = suggestMemoryFromMessage(clean, suggestions);

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
        preparedActions: routed.preparedActions || [],
        orchestratorPlan: routed.orchestratorPlan || null,
        researchPlan: routed.researchPlan || null,
        developerPlan: routed.developerPlan || null,
        toolRuntime: routed.toolReadiness?.runtime || routed.toolRuntime || null,
        fileIntakePlan: routed.fileIntakePlan || null,
        attachments: activeAttachments,
        fileAnalysisResults,
        fileAnalysisSummary,
        imageGenerationResult,
        deepThink,
        routeProfile: routed.routeProfile,
        deepRecommended: routed.deepRecommended,
        at: new Date().toISOString(),
      };

      const cleanReply = imageGenerationResult?.ok
        ? 'Done — image created.'
        : (stripApprovalNoise(routed.reply) || 'Done.');

      const coreText = suggestion
        ? `${cleanReply}\n\nCore Suggestion: this sounds worth saving to Memory.`
        : cleanReply;

      const next = [
        ...optimistic,
        buildMessage({ from: 'core', text: coreText, meta }),
      ];

      setMessages(next);
      save('messages', next);
      setLastMeta(meta);
      if (conversationId) saveConversationMessage(conversationId, next[next.length - 1]).catch(() => null);
      save('lastAiMeta', meta);

      if (suggestion) {
        const nextSuggestions = [suggestion, ...suggestions];
        setSuggestions(nextSuggestions);
        save('memorySuggestions', nextSuggestions);
        logActivity({ engine: 'Memory Suggestions', action: 'Created suggestion', detail: suggestion.title });
      }

      logActivity({
        engine: 'Dylan Core Pipeline',
        action: routed.internetUsed ? 'Used Internet Scan' : (deepThink ? 'Processed with Deep Think' : 'Processed with identity guard'),
        detail: `Mode ${mode}. Context: ${routed.contextUsed.relevantMemories} memories, ${routed.contextUsed.projects} projects, ${routed.contextUsed.goals} goals.`,
      });
    } catch (error) {
      const failMessage = {
        from: 'core',
        text: `Core AI failed safely. ${error.message || 'Unknown error.'}`,
        at: new Date().toISOString(),
      };
      const next = [...optimistic, failMessage];
      setMessages(next);
      save('messages', next);
    } finally {
      setIsSending(false);
    }
  }

  function approveSuggestion(suggestion) {
    const memory = acceptSuggestion(suggestion);
    const currentMemories = load('memories', []);
    save('memories', [memory, ...currentMemories]);
    const nextSuggestions = suggestions.map((item) => item.id === suggestion.id ? { ...item, status: 'Accepted', acceptedAt: new Date().toISOString() } : item);
    setSuggestions(nextSuggestions);
    save('memorySuggestions', nextSuggestions);
    logActivity({ engine: 'Memory Vault', action: 'Accepted memory suggestion', detail: memory.title });
  }

  function rejectSuggestion(suggestion) {
    const nextSuggestions = suggestions.map((item) => item.id === suggestion.id ? { ...item, status: 'Rejected', rejectedAt: new Date().toISOString() } : item);
    setSuggestions(nextSuggestions);
    save('memorySuggestions', nextSuggestions);
    logActivity({ engine: 'Memory Vault', action: 'Rejected memory suggestion', detail: suggestion.title });
  }

  function savePreparedAction(action) {
    const prepared = { ...action, id: action.id || crypto.randomUUID(), savedAt: new Date().toISOString(), status: 'Queued' };
    const nextQueue = [prepared, ...actionQueue].slice(0, 50);
    setActionQueue(nextQueue);
    save('actionQueue', nextQueue);
    logActivity({ engine: 'Action Engine', action: 'Queued prepared action', detail: prepared.title });
  }

  const latestPendingSuggestions = suggestions.filter((item) => item.status === 'Pending').slice(0, 3);
  const latestPreparedActions = (lastMeta?.preparedActions || []).filter(shouldRequireHumanApproval);

  return (
    <section className="screen talkScreen dylanCoreExperience">
      <div className="talkHeader compactTalkHeader">
        <div>
          <p className="eyebrow">DYLAN CORE</p>
          <h2>Talk</h2>
          <small className="readyLine">Memory synced. Ready.</small>
        </div>
        <div className="talkHeaderActions">
          <button
            className={`deepToggle ${deepThink ? 'active' : ''}`}
            type="button"
            onClick={() => setDeepThink((value) => !value)}
          >
            {deepThink ? 'Deep Think On' : 'Deep Think'}
          </button>
          <button
            className={`devToggle ${developerMode ? 'active' : ''}`}
            type="button"
            onClick={() => { const next = !developerMode; setDeveloperMode(next); save('developerMode', next); }}
          >
            Dev
          </button>
        </div>
      </div>

      {developerMode && (
        <div className={`aiStatusPanel ${lastMeta?.source === 'dylan-core-engine' || lastMeta?.source === 'real-ai-brain' ? 'connected' : 'fallback'}`}>
          <span>{statusLabel(lastMeta)}</span>
          <small>{cloudState}</small>
          <small>{contextLine(lastMeta)}</small>
          {seedState && <small>Seed pack: {seedState.memories} memories • {seedState.projects} projects • {seedState.goals} goals • {seedState.plans} plans.</small>}
          {actionQueue.length > 0 && <small>Action Queue: {actionQueue.length} saved item(s).</small>}
          {lastMeta?.internetUsed && <small>Internet Scan used{lastMeta?.sources?.length ? ` • ${lastMeta.sources.length} source(s)` : ''}</small>}
          {lastMeta?.deepRecommended && !lastMeta?.deepThink && <small>Router note: Deep Think may improve this kind of request.</small>}
          {lastMeta?.routeProfile && <small>Route: {lastMeta.routeProfile}</small>}
          {lastMeta?.orchestratorPlan && <small>Orchestrator: {lastMeta.orchestratorPlan.label} • {lastMeta.orchestratorPlan.answerStyle}</small>}
          {lastMeta?.developerPlan?.isDeveloperRequest && <small>Developer: {lastMeta.developerPlan.requestType} • {lastMeta.developerPlan.project}</small>}
          {lastMeta?.toolRuntime && <small>Runtime: {lastMeta.toolRuntime.runnable} runnable • {lastMeta.toolRuntime.blocked} gated</small>}
          {lastMeta?.fileIntakePlan?.active && <small>File Intake: {lastMeta.fileIntakePlan.summary}</small>}
          {lastMeta?.fileAnalysisSummary && <small>Analyzer Routes: {lastMeta.fileAnalysisSummary.split('\n')[0]}</small>}
          {fileAnalysisStatus && <small>{fileAnalysisStatus}</small>}
          {latestPreparedActions.length > 0 && <small>Action Engine prepared {latestPreparedActions.length} action(s).</small>}
        </div>
      )}

      <div className="quickChips cleanChips" aria-label="Quick actions">
        <button type="button" onClick={() => send('What is the next best step for Core Self right now?')}>Next</button>
        <button type="button" onClick={() => send('Create an action plan for the next Core Self build.')}>Plan</button>
        <button type="button" onClick={() => send('Search the internet for the latest useful AI tools for building Core Self cheaply, compare them against our actual stack, tell me what to use now, what to skip, and cite sources.')}>Web</button>
        <button type="button" onClick={() => { const seeded = seedCoreSelfData(); setSeedState(seeded); save('coreSeedState', seeded); }}>Reseed</button>
      </div>

      <div className="chat cleanChat">
        {messages.map((m, i) => (
          <div key={i} className={'bubble ' + m.from}>
            <span>{m.from === 'core' ? stripApprovalNoise(m.text) : m.text}</span>
            {developerMode && m.meta && <small>{statusLabel(m.meta)} • {contextLine(m.meta)}{m.meta.deepThink ? ' • Deep Think' : ''}{m.meta.orchestratorPlan ? ` • ${m.meta.orchestratorPlan.label}` : ''}{m.meta.developerPlan?.isDeveloperRequest ? ` • ${m.meta.developerPlan.requestType}` : ''}</small>}
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
                    {developerMode && <small>{file.intakeNote || 'Attached to this message.'}</small>}
                    {m.fileAnalysisSummary && <small>{m.fileAnalysisSummary.split('\n')[0]}</small>}
                  </div>
                ))}
              </div>
            )}
            {m.meta?.imageGenerationResult?.ok && (
              <div className="generatedImageCard">
                <img src={m.meta.imageGenerationResult.image} alt="Generated Core Self visual" />
                {developerMode && <small>{m.meta.imageGenerationResult.size || '1024x1024'} • {m.meta.imageGenerationResult.quality || 'auto'} quality</small>}
              </div>
            )}
            {developerMode && m.meta?.preparedActions?.length > 0 && (
              <small>Actions prepared: {m.meta.preparedActions.map((action) => action.title).join(' • ')}</small>
            )}
          </div>
        ))}
        {isSending && <div className="bubble core thinking">Working...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="inputRow fileInputRow cleanComposer">
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
          <h3>Prepared Actions</h3>
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
          <h3>Pending Core Suggestions</h3>
          <p>{pendingSuggestions} memory suggestion(s) are waiting in Memory Vault.</p>
          {latestPendingSuggestions.map((suggestion) => (
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