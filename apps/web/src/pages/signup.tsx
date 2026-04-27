import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import {
  AuthAlert,
  AuthCard,
  AuthHeader,
  AuthShell,
  AuthSubmitButton,
} from '../components/auth-form.tsx';
import { FormField } from '../components/ui';
import { authClient } from '../lib/auth/auth-client.ts';
import { registrationStatusQueryOptions } from '../lib/app-queries.ts';
import { hasErrorCode } from '../lib/error.ts';
import { firstFormError, requiredText } from '../lib/auth/form-errors.ts';

interface SignupFormValues {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export function SignupPage() {
  const navigate = useNavigate();
  const status = useQuery(registrationStatusQueryOptions());
  const form = useSignupForm(navigate);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  if (status.data && !status.data.registrationOpen) {
    return (
      <AuthShell>
        <RegistrationClosedBanner />
      </AuthShell>
    );
  }

  const subtitle = status.data?.firstUser ? 'o primeiro usuário vira administrador' : null;

  return (
    <AuthShell>
      <AuthCard onSubmit={submitForm} title="Criar conta" subtitle={subtitle}>
        <SignupFields form={form} />
        <SignupFormError form={form} />
        <SignupSubmitButton form={form} />
        <LoginLink />
      </AuthCard>
    </AuthShell>
  );
}

function useSignupForm(navigate: ReturnType<typeof useNavigate>) {
  return useForm({
    defaultValues: { name: '', email: '', password: '' } satisfies SignupFormValues,
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({});
      const result = await authClient.signUp.email(value);
      if (!result.error) return navigate({ to: '/live', replace: true });
      formApi.setErrorMap({ onSubmit: { form: signupErrorMessage(result.error), fields: {} } });
    },
  });
}

type SignupForm = ReturnType<typeof useSignupForm>;

function SignupFields({ form }: { readonly form: SignupForm }) {
  return (
    <>
      <SignupField form={form} name="name" label="Nome" type="text" error="Informe o nome." />
      <SignupField form={form} name="email" label="E-mail" type="email" error="Informe o e-mail." />
      <SignupField
        form={form}
        name="password"
        label="Senha"
        type="password"
        error="Informe a senha."
      />
    </>
  );
}

function SignupField({
  form,
  name,
  label,
  type,
  error,
}: {
  readonly form: SignupForm;
  readonly name: keyof SignupFormValues;
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

function SignupFormError({ form }: { readonly form: SignupForm }) {
  return (
    <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
      {(error) => <AuthAlert message={firstFormError(error)} />}
    </form.Subscribe>
  );
}

function SignupSubmitButton({ form }: { readonly form: SignupForm }) {
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <AuthSubmitButton
          isSubmitting={isSubmitting}
          idleLabel="Criar conta"
          busyLabel="Criando…"
        />
      )}
    </form.Subscribe>
  );
}

function signupErrorMessage(error: {
  readonly message?: string | undefined;
  readonly status?: number;
}) {
  if (hasErrorCode(error, 'REGISTRATION_DISABLED') || error.status === 403) {
    return 'O cadastro público está desativado. Peça para um administrador habilitar em Configurações.';
  }
  return error.message ?? 'Falha ao criar conta.';
}

function LoginLink() {
  return (
    <p className="text-xs text-stone-500 text-center">
      Já tem conta?{' '}
      <Link to="/login" className="text-orange-400 hover:underline">
        Entrar
      </Link>
    </p>
  );
}

function RegistrationClosedBanner() {
  return (
    <div className="w-full max-w-sm rounded-lg border-[0.5px] border-stone-800 bg-stone-950 p-8 space-y-6">
      <AuthHeader title="Criar conta" subtitle={null} />
      <p role="status" className="text-sm text-red-400">
        O cadastro público está desativado. Peça para um administrador habilitar em Configurações.
      </p>
      <LoginLink />
    </div>
  );
}
