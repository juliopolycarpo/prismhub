import type { McpTransportKind, RegisterMcpServerInput } from '@prismhub/contracts';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { registerMcpServer } from '../../lib/app-queries.ts';
import { getErrorMessage } from '../../lib/error.ts';
import { firstFormError } from '../../lib/auth/form-errors.ts';
import { AppModal } from '../../components/app-modal.tsx';
import { Button } from '../../components/ui';
import {
  Field,
  HttpFields,
  type KeyValueRow,
  StdioFields,
  TextInput,
  TransportRadio,
} from './add-mcp-server-fields.tsx';

interface AddMcpServerModalProps {
  readonly onClose: () => void;
  readonly onRegistered: () => Promise<void>;
  readonly onError: (message: string) => void;
}

const TRANSPORTS: ReadonlyArray<{ readonly kind: McpTransportKind; readonly label: string }> = [
  { kind: 'stdio', label: 'STDIO (processo local)' },
  { kind: 'http', label: 'HTTP (URL remota)' },
];

interface AddMcpServerFormValues {
  readonly name: string;
  readonly transport: McpTransportKind;
  readonly command: string;
  readonly stdioArgs: readonly string[];
  readonly url: string;
  readonly headers: readonly KeyValueRow[];
}

const DEFAULT_VALUES: AddMcpServerFormValues = {
  name: '',
  transport: 'stdio',
  command: '',
  stdioArgs: [],
  url: '',
  headers: [{ key: '', value: '' }],
};

function buildPayload(value: AddMcpServerFormValues): RegisterMcpServerInput {
  if (value.transport === 'stdio') {
    return {
      name: value.name,
      transport: 'stdio',
      command: value.command,
      args: value.stdioArgs.filter((arg) => arg.length > 0),
    };
  }
  const headerEntries = value.headers
    .filter((header) => header.key.trim().length > 0)
    .map((header) => [header.key.trim(), header.value] as const);
  return {
    name: value.name,
    transport: 'http',
    url: value.url,
    ...(headerEntries.length > 0 ? { headers: Object.fromEntries(headerEntries) } : {}),
  };
}

export function AddMcpServerModal({ onClose, onRegistered, onError }: AddMcpServerModalProps) {
  const registerServer = useMutation({ mutationFn: registerMcpServer });
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onSubmit: ({ value }) => validateForm(value) },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({});
      try {
        await registerServer.mutateAsync(buildPayload(value));
        await onRegistered();
      } catch (error) {
        const message = getErrorMessage(error, 'Falha ao registrar servidor MCP.');
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
        onError(message);
      }
    },
  });

  function submitForm(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <form onSubmit={submitForm} noValidate>
      <AppModal
        title="Adicionar Servidor MCP"
        description="Conecte um processo local por STDIO ou um endpoint HTTP compatível."
        onClose={onClose}
        footer={
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando…' : 'Registrar'}
                </Button>
              )}
            </form.Subscribe>
          </>
        }
      >
        <div className="space-y-4">
          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <FormBody
                name={values.name}
                onNameChange={(name) => form.setFieldValue('name', name)}
                transport={values.transport}
                onTransportChange={(transport) => form.setFieldValue('transport', transport)}
                command={values.command}
                onCommandChange={(command) => form.setFieldValue('command', command)}
                stdioArgs={values.stdioArgs}
                onStdioArgsChange={(args) => form.setFieldValue('stdioArgs', args)}
                url={values.url}
                onUrlChange={(url) => form.setFieldValue('url', url)}
                headers={values.headers}
                onHeadersChange={(headers) => form.setFieldValue('headers', headers)}
              />
            )}
          </form.Subscribe>
          <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
            {(error) => {
              const message = firstFormError(error);
              return message ? (
                <p role="alert" className="text-xs text-red-400">
                  {message}
                </p>
              ) : null;
            }}
          </form.Subscribe>
        </div>
      </AppModal>
    </form>
  );
}

interface FormBodyProps {
  readonly name: string;
  readonly onNameChange: (v: string) => void;
  readonly transport: McpTransportKind;
  readonly onTransportChange: (v: McpTransportKind) => void;
  readonly command: string;
  readonly onCommandChange: (v: string) => void;
  readonly stdioArgs: readonly string[];
  readonly onStdioArgsChange: (v: readonly string[]) => void;
  readonly url: string;
  readonly onUrlChange: (v: string) => void;
  readonly headers: readonly KeyValueRow[];
  readonly onHeadersChange: (v: readonly KeyValueRow[]) => void;
}

function FormBody(props: FormBodyProps) {
  return (
    <>
      <Field label="Nome">
        <TextInput value={props.name} onChange={props.onNameChange} placeholder="github" required />
      </Field>
      <Field label="Tipo de transporte">
        <div role="radiogroup" aria-label="Tipo de transporte" className="flex gap-2">
          {TRANSPORTS.map((t) => (
            <TransportRadio
              key={t.kind}
              label={t.label}
              selected={props.transport === t.kind}
              onSelect={() => props.onTransportChange(t.kind)}
            />
          ))}
        </div>
      </Field>
      {props.transport === 'stdio' ? (
        <StdioFields
          command={props.command}
          onCommandChange={props.onCommandChange}
          args={props.stdioArgs}
          onArgsChange={props.onStdioArgsChange}
        />
      ) : (
        <HttpFields
          url={props.url}
          onUrlChange={props.onUrlChange}
          headers={props.headers}
          onHeadersChange={props.onHeadersChange}
        />
      )}
    </>
  );
}

function validateForm(value: AddMcpServerFormValues) {
  if (!value.name.trim()) return { form: 'Informe o nome do servidor MCP.', fields: {} };
  if (value.transport === 'stdio' && !value.command.trim())
    return { form: 'Informe o comando STDIO.', fields: {} };
  if (value.transport === 'http' && !value.url.trim())
    return { form: 'Informe a URL HTTP.', fields: {} };
  return undefined;
}
