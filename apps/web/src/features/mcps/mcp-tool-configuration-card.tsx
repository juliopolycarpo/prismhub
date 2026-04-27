import type { McpToolSummary } from '@prismhub/contracts';
import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { Badge, SegmentedControl, type SegmentedControlOption } from '../../components/ui';
import { ParameterControl } from './mcp-tool-parameter-fields.tsx';
import { parseToolParameters, type ParsedParameter } from './tool-parameters.ts';

export type ParameterResolutionMode = 'manual' | 'agent';

const PARAMETER_MODE_OPTIONS: readonly SegmentedControlOption<ParameterResolutionMode>[] = [
  { value: 'manual', label: 'Editar campos' },
  { value: 'agent', label: 'Deixar o Agente decidir' },
];

export function McpToolConfigurationCard({
  tool,
  action,
  className,
}: {
  readonly tool: McpToolSummary;
  readonly action?: ReactNode;
  readonly className?: string;
}) {
  const [mode, setMode] = useState<ParameterResolutionMode>('manual');
  const parameters = parseToolParameters(tool.inputSchema);
  const fieldsDisabled = mode === 'agent';
  return (
    <li className={cn('rounded-lg border-[0.5px] border-stone-800 bg-stone-950/25 p-4', className)}>
      <ToolHeader tool={tool} parameterCount={parameters.length} action={action} />
      <SegmentedControl
        ariaLabel={`Modo de parâmetros de ${tool.name}`}
        value={mode}
        options={PARAMETER_MODE_OPTIONS}
        onChange={setMode}
        className="mb-4 w-full max-w-md"
      />
      <ToolParameters
        parameters={parameters}
        toolName={tool.name}
        fieldsDisabled={fieldsDisabled}
      />
    </li>
  );
}

function ToolHeader({
  tool,
  parameterCount,
  action,
}: {
  readonly tool: McpToolSummary;
  readonly parameterCount: number;
  readonly action: ReactNode | undefined;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-mono text-sm font-medium text-stone-100">{tool.name}</p>
        {tool.description && (
          <p className="mt-1 text-xs leading-5 text-stone-500">{tool.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge>{parameterCount} params</Badge>
        {action}
      </div>
    </div>
  );
}

function ToolParameters({
  parameters,
  toolName,
  fieldsDisabled,
}: {
  readonly parameters: readonly ParsedParameter[];
  readonly toolName: string;
  readonly fieldsDisabled: boolean;
}) {
  if (parameters.length === 0) return <p className="text-xs text-stone-500">Sem parâmetros.</p>;
  return (
    <div className={cn('space-y-3 transition-opacity', fieldsDisabled && 'opacity-45')}>
      {parameters.map((param) => (
        <ParameterRow
          key={param.name}
          param={param}
          toolName={toolName}
          fieldsDisabled={fieldsDisabled}
        />
      ))}
    </div>
  );
}

function ParameterRow({
  param,
  toolName,
  fieldsDisabled,
}: {
  readonly param: ParsedParameter;
  readonly toolName: string;
  readonly fieldsDisabled: boolean;
}) {
  return (
    <div className="grid gap-3 border-t-[0.5px] border-stone-800/70 pt-3 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,1fr)_minmax(14rem,22rem)]">
      <ParameterDescription param={param} />
      <div className="min-w-0">
        <ParameterControl param={param} toolName={toolName} disabled={fieldsDisabled} />
      </div>
    </div>
  );
}

function ParameterDescription({ param }: { readonly param: ParsedParameter }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-stone-200">{param.name}</span>
        <TypeBadge control={param.control} />
        {param.required && <span className="text-[10px] text-orange-400">obrigatório</span>}
      </div>
      {param.description && (
        <p className="mt-1 text-[11px] leading-4 text-stone-500">{param.description}</p>
      )}
    </div>
  );
}

function TypeBadge({ control }: { readonly control: ParsedParameter['control'] }) {
  return <Badge className="rounded px-1.5 py-0 text-[10px] uppercase">{control}</Badge>;
}
