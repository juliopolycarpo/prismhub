import type { FeedEnvelope, SessionEventPayload } from '@prismhub/contracts';
import { Sparkles, Zap } from 'lucide-react';
import { Card } from '../components/ui';

export function FeedItem({ envelope }: { readonly envelope: FeedEnvelope }) {
  const event = envelope.event;
  if (event.kind === 'session_started') {
    return (
      <LabelRow
        agent={event.session.agent}
        description={`iniciou sessão${event.session.title ? ` — ${event.session.title}` : ''}`}
        timestamp={event.at}
      />
    );
  }
  if (event.kind === 'session_ended') {
    return (
      <LabelRow
        agent="sistema"
        description={`encerrou sessão (${event.summary.reason ?? 'completed'})`}
        timestamp={event.at}
      />
    );
  }
  return <SessionEventRow event={event.event} timestamp={event.at} />;
}

function LabelRow({
  agent,
  description,
  timestamp,
}: {
  readonly agent: string;
  readonly description: string;
  readonly timestamp: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-medium text-sm border-[0.5px] border-orange-500/30 shrink-0">
        {agent[0]?.toUpperCase() ?? 'A'}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-xs text-stone-500 mb-1.5">
          <span className="text-stone-300 font-medium">{agent}</span> · {description}
          <span className="ml-1">{formatTime(timestamp)}</span>
        </p>
      </div>
    </div>
  );
}

function SessionEventRow({
  event,
  timestamp,
}: {
  readonly event: SessionEventPayload;
  readonly timestamp: string;
}) {
  if (event.kind === 'message') {
    return <MessageBubble content={event.content} timestamp={timestamp} />;
  }
  if (event.kind === 'tool_call') {
    return <ToolCallBubble toolName={event.toolName} timestamp={timestamp} />;
  }
  if (event.kind === 'system') {
    return <LabelRow agent="sistema" description={event.message} timestamp={timestamp} />;
  }
  return <ToolResultMarker status={event.status} timestamp={timestamp} />;
}

function MessageBubble({
  content,
  timestamp,
}: {
  readonly content: string;
  readonly timestamp: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-medium text-sm border-[0.5px] border-orange-500/30 shrink-0">
        M
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-xs text-stone-500 mb-1.5">
          <span className="text-stone-300 font-medium">mensagem</span> · {formatTime(timestamp)}
        </p>
        <div className="bg-stone-800/40 border-[0.5px] border-stone-800 inline-block px-4 py-3 rounded-[12px] rounded-bl-[3px] text-stone-200 text-sm leading-relaxed max-w-2xl">
          {content}
        </div>
      </div>
    </div>
  );
}

function ToolCallBubble({
  toolName,
  timestamp,
}: {
  readonly toolName: string;
  readonly timestamp: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-stone-800/50 flex items-center justify-center text-stone-500 font-medium text-sm border-[0.5px] border-stone-800 shrink-0">
        T
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-xs text-stone-500 mb-1.5">
          chamou <span className="text-stone-300 font-medium">{toolName}</span> ·{' '}
          {formatTime(timestamp)}
        </p>
        <Card className="px-4 py-3 max-w-3xl border-l-2 border-l-orange-500">
          <p className="text-orange-400 font-medium flex items-center gap-2">
            <Sparkles size={14} /> {toolName}
          </p>
        </Card>
      </div>
    </div>
  );
}

function ToolResultMarker({
  status,
  timestamp,
}: {
  readonly status: 'ok' | 'error';
  readonly timestamp: string;
}) {
  return (
    <div className="flex gap-4 ml-3 relative">
      <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium text-[10px] shrink-0 z-10 shadow-[0_0_10px_rgba(217,119,70,0.4)]">
        <Zap size={10} fill="currentColor" />
      </div>
      <div className="flex-1 -mt-1">
        <p className="text-[11px] text-stone-500">
          resultado {status} · {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
