'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Sparkles,
  Database,
  Network,
  Code2,
  Loader2,
  Copy,
  Check,
  History,
  ArrowRight,
  Cpu,
  Zap,
  GitBranch,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const EXAMPLES = [
  'A clone of Airbnb with hosts, listings, bookings, and reviews',
  'A Slack-style team chat with workspaces, channels, threads, and reactions',
  'A SaaS analytics platform with multi-tenant orgs, dashboards, and event tracking',
  'A Notion-like docs app with nested pages, blocks, and real-time collaboration',
];

// Custom React Flow node rendering a database table.
function EntityNode({ data }) {
  return (
    <div className="min-w-[220px] rounded-lg border border-violet-500/40 bg-zinc-900/95 shadow-2xl shadow-violet-500/10 backdrop-blur overflow-hidden">
      <Handle type="target" position={Position.Left} className="!bg-violet-400 !w-2 !h-2" />
      <div className="bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 px-3 py-2 border-b border-violet-500/30 flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-violet-300" />
        <span className="font-semibold text-sm text-violet-100">{data.name}</span>
      </div>
      <div className="p-2 space-y-1">
        {data.fields?.slice(0, 8).map((f, i) => (
          <div key={i} className="flex items-center justify-between text-xs gap-3">
            <span className={`font-mono ${f.isPrimary ? 'text-amber-300' : f.isRelation ? 'text-cyan-300' : 'text-zinc-200'}`}>
              {f.isPrimary && '🔑 '}{f.name}
            </span>
            <span className="font-mono text-zinc-500 text-[10px]">{f.type}</span>
          </div>
        ))}
        {data.fields?.length > 8 && (
          <div className="text-[10px] text-zinc-500 italic pt-1">+ {data.fields.length - 8} more</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-violet-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { entity: EntityNode };

function layoutEntities(entities) {
  // Simple grid layout — 3 columns.
  const cols = 3;
  const colW = 320;
  const rowH = 280;
  return entities.map((e, i) => ({
    id: e.id,
    type: 'entity',
    position: { x: (i % cols) * colW, y: Math.floor(i / cols) * rowH },
    data: e,
  }));
}

function buildEdges(edges) {
  return (edges || []).map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    style: { stroke: '#a78bfa', strokeWidth: 1.5 },
    labelStyle: { fill: '#c4b5fd', fontSize: 11, fontWeight: 500 },
    labelBgStyle: { fill: '#18181b' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
  }));
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('schema');

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch('/api/projects');
      const d = await r.json();
      setHistory(d.projects || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function generate() {
    if (!prompt.trim()) {
      toast.error('Describe what you want to build first.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Generation failed');
      setResult(data.project);
      loadHistory();
      toast.success(`Architecture generated for ${data.project.appName}!`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copySchema() {
    if (!result?.prismaSchema) return;
    navigator.clipboard.writeText(result.prismaSchema);
    setCopied(true);
    toast.success('Prisma schema copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  const nodes = useMemo(() => result ? layoutEntities(result.entities || []) : [], [result]);
  const edges = useMemo(() => result ? buildEdges(result.edges || []) : [], [result]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Ambient gradient backdrop */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-zinc-800/60 backdrop-blur-xl sticky top-0 z-30 bg-zinc-950/70">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/50">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">ArchitectAI</h1>
              <p className="text-[10px] text-zinc-500 -mt-0.5">Powered by Gemini 2.5</p>
            </div>
          </div>
          <Badge variant="outline" className="border-violet-500/40 text-violet-300 bg-violet-500/10">
            <Zap className="w-3 h-3 mr-1" /> Hack Days Ankara 2025
          </Badge>
        </div>
      </header>

      {!result ? (
        /* Landing */
        <main className="max-w-3xl mx-auto px-6 pt-20 pb-24">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-violet-500/10 text-violet-300 border-violet-500/30 hover:bg-violet-500/20">
              <Sparkles className="w-3 h-3 mr-1" /> Powered by Google Gemini
            </Badge>
            <h2 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              What are you building<br/>today?
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Describe your idea. Get a production-ready Prisma schema,
              REST API plan, and visual architecture diagram in seconds.
            </p>
          </div>

          <Card className="bg-zinc-900/70 border-zinc-800 backdrop-blur p-2 shadow-2xl shadow-violet-500/5">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. I want to build a clone of Airbnb with hosts, listings, bookings, payments, and reviews..."
              className="min-h-[140px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-zinc-600"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate();
              }}
            />
            <div className="flex items-center justify-between p-2 pt-0">
              <span className="text-xs text-zinc-500">⌘+Enter to generate</span>
              <Button
                onClick={generate}
                disabled={loading || !prompt.trim()}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-600/30 border-0"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Architecting...</>
                ) : (
                  <>Generate Architecture <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </Card>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/10 text-zinc-300 transition-colors"
                >
                  {ex.length > 60 ? ex.substring(0, 60) + '…' : ex}
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-zinc-500" />
                <p className="text-xs uppercase tracking-wider text-zinc-500">Recent generations</p>
              </div>
              <div className="space-y-2">
                {history.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setResult(p)}
                    className="w-full text-left p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/40 hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-violet-300">{p.appName}</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{p.prompt}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400 shrink-0">
                        {p.entities?.length || 0} models
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      ) : (
        /* Results Dashboard */
        <main className="max-w-[1600px] mx-auto px-4 py-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="min-w-0 flex-1">
              <button
                onClick={() => setResult(null)}
                className="text-xs text-zinc-500 hover:text-violet-300 mb-1"
              >
                ← New generation
              </button>
              <h2 className="text-2xl font-bold truncate">{result.appName}</h2>
              <p className="text-sm text-zinc-400 truncate">{result.summary}</p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/30">
                <Database className="w-3 h-3 mr-1" /> {result.entities?.length || 0} models
              </Badge>
              <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                <GitBranch className="w-3 h-3 mr-1" /> {result.edges?.length || 0} relations
              </Badge>
              <Badge className="bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30">
                <Network className="w-3 h-3 mr-1" /> {result.apiRoutes?.length || 0} routes
              </Badge>
            </div>
          </div>

          {/* Split-screen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-180px)]">
            {/* Left: Code */}
            <Card className="bg-zinc-900/70 border-zinc-800 overflow-hidden flex flex-col">
              <div className="flex border-b border-zinc-800">
                <button
                  onClick={() => setTab('schema')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    tab === 'schema'
                      ? 'border-violet-500 text-violet-300 bg-violet-500/5'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 mr-1.5 inline" /> schema.prisma
                </button>
                <button
                  onClick={() => setTab('routes')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    tab === 'routes'
                      ? 'border-violet-500 text-violet-300 bg-violet-500/5'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 mr-1.5 inline" /> API Routes
                </button>
                <div className="flex-1" />
                {tab === 'schema' && (
                  <button
                    onClick={copySchema}
                    className="px-3 py-2 text-xs text-zinc-400 hover:text-violet-300 flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                {tab === 'schema' ? (
                  <ScrollArea className="h-full">
                    <SyntaxHighlighter
                      language="javascript"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        background: 'transparent',
                        fontSize: '12.5px',
                        padding: '1rem',
                        whiteSpace: 'pre',
                      }}
                      codeTagProps={{ style: { whiteSpace: 'pre', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } }}
                    >
                      {result.prismaSchema || '// no schema generated'}
                    </SyntaxHighlighter>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-2">
                      {result.apiRoutes?.map((r, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800 hover:border-violet-500/40 transition"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={`text-[10px] font-mono border-0 ${
                                r.method === 'GET' ? 'bg-emerald-500/20 text-emerald-300' :
                                r.method === 'POST' ? 'bg-sky-500/20 text-sky-300' :
                                r.method === 'PUT' || r.method === 'PATCH' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {r.method}
                            </Badge>
                            <code className="text-sm text-zinc-200 font-mono">{r.path}</code>
                            {r.auth && <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-300">AUTH</Badge>}
                          </div>
                          <p className="text-xs text-zinc-500 ml-1">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </Card>

            {/* Right: Diagram */}
            <Card className="bg-zinc-900/70 border-zinc-800 overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-sm font-medium">Entity-Relationship Diagram</span>
              </div>
              <div className="flex-1 bg-zinc-950">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  fitView
                  proOptions={{ hideAttribution: true }}
                  className="bg-zinc-950"
                >
                  <Background color="#27272a" gap={20} />
                  <Controls className="!bg-zinc-900 !border-zinc-800 [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-400" />
                </ReactFlow>
              </div>
            </Card>
          </div>
        </main>
      )}
    </div>
  );
}
