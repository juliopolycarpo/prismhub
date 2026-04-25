import type { SettingsRecord, ThemeMode, UpdateSettingsInput } from '@prismhub/contracts';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { SettingsRow, SettingsSection } from '../components/settings-panels.tsx';
import { SegmentedControl, Toggle, type SegmentedControlOption } from '../components/ui.tsx';
import { settingsQueryOptions, updateSettings } from '../lib/app-queries.ts';
import { getErrorMessage } from '../lib/error.ts';
import { queryKeys } from '../lib/query-keys.ts';

const THEME_OPTIONS: readonly SegmentedControlOption<ThemeMode>[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
];

type DensityMode = SettingsRecord['density'];

const DENSITY_OPTIONS: readonly SegmentedControlOption<DensityMode>[] = [
  { value: 'comfortable', label: 'Confortável' },
  { value: 'compact', label: 'Compacto' },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery(settingsQueryOptions());
  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onMutate: async (patch) => optimisticSettingsUpdate(queryClient, patch),
    onError: (_error, _patch, previous) => restoreSettings(queryClient, previous),
    onSuccess: (settings) => queryClient.setQueryData(queryKeys.settings(), settings),
  });

  if (settingsQuery.isError)
    return (
      <p className="p-8 text-sm text-red-400">
        {getErrorMessage(settingsQuery.error, 'Falha ao carregar configurações.')}
      </p>
    );
  if (settingsQuery.isLoading || !settingsQuery.data)
    return <p className="p-8 text-sm text-stone-500">Carregando…</p>;

  const save = (patch: UpdateSettingsInput) => saveMutation.mutate(patch);

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-900 overflow-hidden">
      <header className="px-8 py-8 shrink-0">
        <h1 className="text-2xl font-bold text-stone-100">Configurações</h1>
        <p className="text-sm text-stone-400 mt-1">Defaults seguros. Ajuste quando quiser.</p>
      </header>
      <div className="flex-1 overflow-y-auto px-8 pb-12 max-w-4xl space-y-6">
        <AppearanceSection settings={settingsQuery.data} onSave={save} />
        <InterfaceSection settings={settingsQuery.data} onSave={save} />
        {saveMutation.isError && (
          <p role="alert" className="text-sm text-red-400">
            {getErrorMessage(saveMutation.error, 'Falha ao salvar configuração.')}
          </p>
        )}
        <CacheSection />
        <PrivacySection />
        <AdvancedSection />
      </div>
    </div>
  );
}

function AppearanceSection({
  settings,
  onSave,
}: {
  readonly settings: SettingsRecord;
  readonly onSave: (patch: UpdateSettingsInput) => void;
}) {
  return (
    <SettingsSection
      title="Aparência"
      description="Personalize como o Prism Hub se parece. As mudanças são aplicadas imediatamente."
    >
      <SettingsRow title="Tema" description="Claro para o dia, escuro para sessões longas.">
        <SegmentedControl
          ariaLabel="Tema"
          value={settings.themeMode}
          options={THEME_OPTIONS}
          onChange={(themeMode) => onSave({ themeMode })}
        />
      </SettingsRow>
      <SettingsRow
        title="Densidade"
        description="Compacto mostra mais na tela; confortável respira."
      >
        <SegmentedControl
          ariaLabel="Densidade"
          value={settings.density}
          options={DENSITY_OPTIONS}
          onChange={(density) => onSave({ density })}
        />
      </SettingsRow>
      <SettingsRow title="Cor de destaque" description="Atualmente fixa em laranja.">
        <span className="text-sm font-mono text-stone-400">{settings.accentColor}</span>
      </SettingsRow>
    </SettingsSection>
  );
}

function InterfaceSection({
  settings,
  onSave,
}: {
  readonly settings: SettingsRecord;
  readonly onSave: (patch: UpdateSettingsInput) => void;
}) {
  return (
    <SettingsSection
      title="Interface"
      description="Como o feed se apresenta. Sempre pode virar modo técnico com um clique."
    >
      <SettingsRow
        title="Mostrar metadados"
        description="Exibe payload/JSON cru ao lado de cada evento."
      >
        <Toggle
          ariaLabel="Mostrar metadados"
          isActive={settings.showMetadata}
          onChange={() => onSave({ showMetadata: !settings.showMetadata })}
        />
      </SettingsRow>
    </SettingsSection>
  );
}

function CacheSection() {
  return (
    <SettingsSection
      title="Cache"
      description="Prism Hub reutiliza resultados sempre que ainda estão válidos."
    >
      <SettingsRow
        title="TTL padrão"
        description="Sobrescrito por MCP individual."
        rightText="15 min"
      />
      <SettingsRow title="Diretório de cache" description="" rightText="~/.prismhub/cache" />
    </SettingsSection>
  );
}

function PrivacySection() {
  return (
    <SettingsSection
      title="Privacidade"
      description="Prism Hub roda localmente. Nada sai da sua máquina a menos que você escolha."
    >
      <SettingsRow
        title="Enviar telemetria anônima"
        description="Ajuda o time a priorizar bugs. Opt-in."
      >
        <Toggle ariaLabel="Enviar telemetria anônima" isActive={false} />
      </SettingsRow>
    </SettingsSection>
  );
}

function AdvancedSection() {
  return (
    <SettingsSection title="Avançado" description="Se você já sabe o que está fazendo.">
      <SettingsRow title="Binding HTTP" description="" rightText="127.0.0.1:3030" />
      <SettingsRow
        title="Database"
        description=""
        rightText="~/.prismhub/database/database.sqlite"
      />
    </SettingsSection>
  );
}

async function optimisticSettingsUpdate(
  queryClient: QueryClient,
  patch: UpdateSettingsInput,
): Promise<SettingsRecord | undefined> {
  await queryClient.cancelQueries({ queryKey: queryKeys.settings() });
  const previous = queryClient.getQueryData<SettingsRecord>(queryKeys.settings());
  if (previous) queryClient.setQueryData(queryKeys.settings(), { ...previous, ...patch });
  return previous;
}

function restoreSettings(queryClient: QueryClient, previous: SettingsRecord | undefined) {
  if (previous) queryClient.setQueryData(queryKeys.settings(), previous);
}
