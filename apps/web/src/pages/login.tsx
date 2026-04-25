import { useForm } from '@tanstack/react-form';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { AuthAlert, AuthCard, AuthShell, AuthSubmitButton } from '../components/auth-form.tsx';
import { FormField } from '../components/ui.tsx';
import { authClient } from '../lib/auth-client.ts';
import type { AuthenticatedPath } from '../lib/dashboard-paths.ts';
import { firstFormError, requiredText } from '../lib/form-errors.ts';

interface LoginFormValues {
  readonly email: string;
  readonly password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { redirect = '/live' } = useSearch({ from: '/login' });
  const form = useLoginForm(redirect, navigate);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <AuthShell>
      <AuthCard onSubmit={submitForm} title="Prism Hub" subtitle="entre na sua instância">
        <LoginFields form={form} />
        <LoginFormError form={form} />
        <LoginSubmitButton form={form} />
        <p className="text-xs text-stone-500 text-center">
          Sem conta?{' '}
          <Link to="/signup" className="text-orange-400 hover:underline">
            Criar conta
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

function useLoginForm(redirect: AuthenticatedPath, navigate: ReturnType<typeof useNavigate>) {
  return useForm({
    defaultValues: { email: '', password: '' } satisfies LoginFormValues,
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({});
      const result = await authClient.signIn.email(value);
      if (!result.error) return navigate({ to: redirect, replace: true });
      formApi.setErrorMap({
        onSubmit: { form: result.error.message ?? 'Falha ao entrar.', fields: {} },
      });
    },
  });
}

type LoginForm = ReturnType<typeof useLoginForm>;

function LoginFields({ form }: { readonly form: LoginForm }) {
  return (
    <>
      <LoginField form={form} name="email" label="E-mail" type="email" error="Informe o e-mail." />
      <LoginField
        form={form}
        name="password"
        label="Senha"
        type="password"
        error="Informe a senha."
      />
    </>
  );
}

function LoginField({
  form,
  name,
  label,
  type,
  error,
}: {
  readonly form: LoginForm;
  readonly name: keyof LoginFormValues;
  readonly label: string;
  readonly type: string;
  readonly error: string;
}) {
  return (
    <form.Field name={name} validators={{ onSubmit: ({ value }) => requiredText(value, error) }}>
      {(field) => (
        <FormField
          id={name}
          label={label}
          type={type}
          value={field.state.value}
          error={firstFormError(field.state.meta.errors)}
          onChange={field.handleChange}
        />
      )}
    </form.Field>
  );
}

function LoginFormError({ form }: { readonly form: LoginForm }) {
  return (
    <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
      {(error) => <AuthAlert message={firstFormError(error)} />}
    </form.Subscribe>
  );
}

function LoginSubmitButton({ form }: { readonly form: LoginForm }) {
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <AuthSubmitButton isSubmitting={isSubmitting} idleLabel="Entrar" busyLabel="Entrando…" />
      )}
    </form.Subscribe>
  );
}
