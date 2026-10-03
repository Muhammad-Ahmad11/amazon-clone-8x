#!/usr/bin/env node
// Agent capture hook for Claude Code.
// Wired to UserPromptSubmit (records the prompt) and Stop (records the final
// response of the turn). Renders one markdown log per session into .agent-logs/.
// Entries are append-only in a per-session state file; the markdown is
// re-rendered from that state on every event so the frontmatter stays current.

const fs = require('fs');
const path = require('path');

const AUTHOR = process.env.AGENT_LOG_AUTHOR || 'SET-GITHUB-HANDLE';
const PROJECT = process.env.AGENT_LOG_PROJECT || 'amazon-clone';
const TOOL = 'claude-code';

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

function readTranscript(p) {
  if (!p || !fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function isRealUserPrompt(e) {
  if (e.type !== 'user' || e.isMeta || e.isSidechain) return false;
  const c = e.message && e.message.content;
  if (typeof c === 'string') return true;
  if (Array.isArray(c)) return !c.some(b => b.type === 'tool_result') && c.some(b => b.type === 'text');
  return false;
}

function lastModel(entries) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const m = entries[i].type === 'assistant' && entries[i].message && entries[i].message.model;
    if (m && m !== '<synthetic>') return m;
  }
  return null;
}

// Final response = assistant text emitted after the last tool call of the turn.
function finalResponse(entries) {
  let start = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (isRealUserPrompt(entries[i])) { start = i + 1; break; }
  }
  let texts = [];
  let model = null;
  let endsOnTool = false;
  for (const e of entries.slice(start)) {
    if (e.type !== 'assistant' || e.isSidechain) continue;
    const c = (e.message && e.message.content) || [];
    if (e.message.model && e.message.model !== '<synthetic>') model = e.message.model;
    for (const b of c) {
      if (b.type === 'tool_use') { texts = []; endsOnTool = true; }
      else if (b.type === 'text' && b.text) { texts.push(b.text); endsOnTool = false; }
    }
  }
  return { text: texts.join('\n\n').trim(), model, endsOnTool };
}

function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }

function stamp(iso) {
  return iso.replace('T', '_').replace(/:/g, '-').replace(/\..*$/, '');
}

function render(state) {
  const prompts = state.entries.filter(e => e.type === 'PROMPT');
  const short = state.session_id.slice(0, 8);
  const models = [...new Set(state.entries.map(e => e.model).filter(Boolean))];
  let out = '---\n';
  out += `session_id: ${state.session_id}\n`;
  out += `date: ${state.created.slice(0, 10)}\n`;
  out += `author: ${AUTHOR}\n`;
  out += `model: ${models.join(', ') || 'unknown'}\n`;
  out += `tool: ${TOOL}\n`;
  out += `project: ${PROJECT}\n`;
  out += `total_exchanges: ${prompts.length}\n`;
  out += `first_prompt_time: ${prompts.length ? prompts[0].timestamp : ''}\n`;
  out += `last_prompt_time: ${prompts.length ? prompts[prompts.length - 1].timestamp : ''}\n`;
  out += '---\n\n';
  out += `# Session Log - ${state.created.slice(0, 10)}\n\n`;
  out += `Session: \`${short}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\`\n\n---\n\n`;
  for (const e of state.entries) {
    out += `[LOG_ENTRY type=${e.type} num=${e.num} session=${short}]\n`;
    out += `timestamp: ${e.timestamp}\n`;
    out += `model: ${e.model || 'unknown'}\n\n`;
    out += `${e.text}\n\n\n`;
  }
  return out;
}

function main() {
  let input;
  try { input = JSON.parse(readStdin()); } catch { return; }
  const event = input.hook_event_name;
  const sessionId = input.session_id || 'unknown-session';
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const logDir = path.join(root, '.agent-logs');
  const stateDir = path.join(root, '.claude', 'agent-log-state');
  fs.mkdirSync(logDir, { recursive: true });
  fs.mkdirSync(stateDir, { recursive: true });

  const statePath = path.join(stateDir, `${sessionId}.json`);
  const now = new Date().toISOString();
  let state = fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { session_id: sessionId, created: now, file: `${stamp(now)}_${sessionId}.md`, entries: [] };

  const promptCount = state.entries.filter(e => e.type === 'PROMPT').length;

  if (event === 'UserPromptSubmit') {
    const model = lastModel(readTranscript(input.transcript_path)) || process.env.ANTHROPIC_MODEL || null;
    state.entries.push({ type: 'PROMPT', num: promptCount + 1, timestamp: now, model, text: input.prompt || '' });
  } else if (event === 'Stop') {
    if (input.stop_hook_active) return;
    // The transcript may not be fully flushed when Stop fires; retry briefly.
    let r = { text: '', model: null, endsOnTool: true };
    for (let i = 0; i < 10; i++) {
      r = finalResponse(readTranscript(input.transcript_path));
      if (r.text && !r.endsOnTool) break;
      sleep(300);
    }
    const text = input.last_assistant_message || r.text || '(no final text response captured)';
    const num = promptCount || 1;
    const prompt = [...state.entries].reverse().find(e => e.type === 'PROMPT' && e.num === num);
    if (prompt && !prompt.model) prompt.model = r.model;
    state.entries.push({ type: 'RESPONSE', num, timestamp: now, model: r.model, text });
  } else {
    return;
  }

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  fs.writeFileSync(path.join(logDir, state.file), render(state));
}

try { main(); } catch (err) {
  try { fs.appendFileSync(path.join(process.env.CLAUDE_PROJECT_DIR || '.', '.claude', 'agent-log-errors.txt'), `${new Date().toISOString()} ${err.stack}\n`); } catch {}
}
process.exit(0);
