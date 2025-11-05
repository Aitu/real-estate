'use client';

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  AlertCircle,
  Bell,
  BellRing,
  PencilLine,
  Plus,
  Smartphone,
  Trash2,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useI18n, useTranslations } from '@/lib/i18n/provider';
import {
  PROPERTY_TYPE_OPTIONS,
  type AlertSummary,
  type PropertyTypeOption,
  type TransactionTypeOption
} from '@/lib/db/alerts';
import {
  createAlert,
  updateAlert,
  deleteAlert,
  type AlertFormState,
  type AlertFormValues
} from './actions';
import type { ActionState } from '@/lib/auth/middleware';

const EMPTY_FORM_VALUES: AlertFormValues = {
  title: '',
  transactionType: 'sale',
  propertyType: '',
  minBudget: '',
  maxBudget: '',
  location: '',
  radiusKm: '',
  notifyEmail: true,
  notifyPush: false
};

type AlertsClientProps = {
  locale: string;
  alerts: AlertSummary[];
};

type FeedbackState = {
  type: 'success' | 'error';
  key: string;
};

export function AlertsClient({ locale, alerts }: AlertsClientProps) {
  const tPage = useTranslations('alertsPage');
  const tList = useTranslations('alertsPage.list');
  const tFilters = useTranslations('alertsPage.filters');
  const tFeedback = useTranslations('alertsPage.feedback');
  const tForm = useTranslations('alertsPage.form');
  const tSearchTypes = useTranslations('search.types');
  const tTransactions = useTranslations('alertsPage.transactions');
  const { locale: activeLocale } = useI18n();

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertSummary | null>(null);

  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    });
  }, [activeLocale]);

  const handleSuccess = (key: string) => {
    setFeedback({ type: 'success', key });
  };

  const handleError = (key: string) => {
    setFeedback({ type: 'error', key });
  };

  const handleDeleteComplete = (state: ActionState) => {
    if (state.success) {
      setFeedback({ type: 'success', key: state.success });
    } else if (state.error) {
      setFeedback({ type: 'error', key: state.error });
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              {tPage('title')}
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              {tPage('subtitle')}
            </p>
          </div>
          <Button
            type="button"
            className="self-start rounded-full px-4"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            <span>{tPage('createButton')}</span>
          </Button>
        </div>
        {feedback && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm',
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            )}
          >
            <AlertCircle className="size-4" />
            <span>{tFeedback(feedback.key)}</span>
          </div>
        )}
      </header>

      <div className="mt-8 flex flex-col gap-6">
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <BellRing className="mx-auto size-10 text-slate-400" />
            <h2 className="mt-4 text-lg font-medium text-slate-900">
              {tPage('empty.title')}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {tPage('empty.description')}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              locale={locale}
              onEdit={() => setEditingAlert(alert)}
              onDeleteComplete={handleDeleteComplete}
              formatBudget={(min, max) =>
                formatBudgetRange(min, max, currencyFormatter, tFilters)
              }
              formatTransaction={(value) => tTransactions(value)}
              formatPropertyType={(value) =>
                value ? tSearchTypes(value) : tFilters('propertyTypeAny')
              }
              formatLocation={(city, radius) =>
                formatLocation(city, radius, tFilters)
              }
              tList={tList}
              tForm={tForm}
            />
          ))
        )}
      </div>

      {isCreateOpen && (
        <Modal title={tForm('createTitle')} onClose={() => setCreateOpen(false)}>
          <AlertForm
            key="create"
            mode="create"
            locale={locale}
            onCancel={() => setCreateOpen(false)}
            onSuccess={(key) => {
              handleSuccess(key);
              setCreateOpen(false);
            }}
            onError={handleError}
            submitLabel={tForm('createAction')}
          />
        </Modal>
      )}

      {editingAlert && (
        <Modal
          title={tForm('editTitle')}
          onClose={() => setEditingAlert(null)}
        >
          <AlertForm
            key={editingAlert.id}
            mode="edit"
            locale={locale}
            alertId={editingAlert.id}
            defaultValues={alertToFormValues(editingAlert)}
            onCancel={() => setEditingAlert(null)}
            onSuccess={(key) => {
              handleSuccess(key);
              setEditingAlert(null);
            }}
            onError={handleError}
            submitLabel={tForm('updateAction')}
          />
        </Modal>
      )}
    </section>
  );
}

type AlertCardProps = {
  alert: AlertSummary;
  locale: string;
  formatBudget: (min: number | null, max: number | null) => string;
  formatTransaction: (value: TransactionTypeOption) => string;
  formatPropertyType: (value: PropertyTypeOption | null) => string;
  formatLocation: (city: string | null, radius: number | null) => string;
  onEdit: () => void;
  onDeleteComplete: (state: ActionState) => void;
  tList: (key: string, options?: Record<string, unknown>) => string;
  tForm: (key: string, options?: Record<string, unknown>) => string;
};

function AlertCard({
  alert,
  locale,
  formatBudget,
  formatTransaction,
  formatPropertyType,
  formatLocation,
  onEdit,
  onDeleteComplete,
  tList,
  tForm
}: AlertCardProps) {
  const channelBadges = [
    {
      active: alert.notifyEmail,
      label: tForm('email'),
      icon: Bell
    },
    {
      active: alert.notifyPush,
      label: tForm('push'),
      icon: Smartphone
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900 md:text-lg">
          {alert.title}
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          {formatBudget(alert.minBudget, alert.maxBudget)}
        </CardDescription>
        <CardAction className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <PencilLine className="size-4" />
            {tList('edit')}
          </Button>
          <DeleteAlertButton
            alertId={alert.id}
            locale={locale}
            title={alert.title}
            tList={tList}
            onComplete={onDeleteComplete}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div className="space-y-1">
            <dt className="font-medium text-slate-500">
              {tList('filters.transaction')}
            </dt>
            <dd>{formatTransaction(alert.transactionType)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-slate-500">
              {tList('filters.propertyType')}
            </dt>
            <dd>{formatPropertyType(alert.propertyType)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-slate-500">
              {tList('filters.location')}
            </dt>
            <dd>{formatLocation(alert.city, alert.radiusKm)}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-slate-200 pt-4">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {tList('channelsHeading')}
        </span>
        <div className="flex flex-wrap gap-2">
          {channelBadges.map(({ active, label, icon: Icon }, index) => (
            <span
              key={index}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                active
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                  : 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200'
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </span>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

type DeleteAlertButtonProps = {
  alertId: number;
  locale: string;
  title: string;
  onComplete: (state: ActionState) => void;
  tList: (key: string, options?: Record<string, unknown>) => string;
};

function DeleteAlertButton({
  alertId,
  locale,
  title,
  onComplete,
  tList
}: DeleteAlertButtonProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    deleteAlert,
    {} as ActionState
  );

  useEffect(() => {
    if (state.success || state.error) {
      onComplete(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          tList('confirmDelete', { title })
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="alertId" value={String(alertId)} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={pending}
      >
        <Trash2 className="size-4" />
        {pending ? tList('deleting') : tList('delete')}
      </Button>
    </form>
  );
}

type AlertFormProps = {
  mode: 'create' | 'edit';
  locale: string;
  alertId?: number;
  defaultValues?: AlertFormValues;
  submitLabel: string;
  onSuccess: (key: string) => void;
  onError?: (key: string) => void;
  onCancel: () => void;
};

function AlertForm({
  mode,
  locale,
  alertId,
  defaultValues,
  submitLabel,
  onSuccess,
  onError,
  onCancel
}: AlertFormProps) {
  const action = mode === 'create' ? createAlert : updateAlert;
  const [state, formAction, pending] = useActionState<AlertFormState, FormData>(
    action,
    {} as AlertFormState
  );
  const tForm = useTranslations('alertsPage.form');
  const tFeedback = useTranslations('alertsPage.feedback');
  const values = state.values ?? defaultValues ?? EMPTY_FORM_VALUES;
  const formKey = state.values
    ? `${mode}-${JSON.stringify(state.values)}`
    : defaultValues
    ? `${mode}-default-${alertId ?? 'new'}`
    : `${mode}-initial`;

  useEffect(() => {
    if (state.success) {
      onSuccess(state.success);
    }
  }, [state.success, onSuccess]);

  useEffect(() => {
    if (state.error && onError) {
      onError(state.error);
    }
  }, [state.error, onError]);

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      {mode === 'edit' && alertId !== undefined && (
        <input type="hidden" name="alertId" value={String(alertId)} />
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{tForm('nameLabel')}</Label>
        <Input
          id="title"
          name="title"
          placeholder={tForm('namePlaceholder')}
          defaultValue={values.title}
          maxLength={120}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="transactionType">{tForm('transactionLabel')}</Label>
          <select
            id="transactionType"
            name="transactionType"
            defaultValue={values.transactionType}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="sale">{tForm('transactionSale')}</option>
            <option value="rent">{tForm('transactionRent')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="propertyType">{tForm('propertyTypeLabel')}</Label>
          <select
            id="propertyType"
            name="propertyType"
            defaultValue={values.propertyType}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">{tForm('propertyTypeAny')}</option>
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {tForm(`propertyType.${option}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="minBudget">{tForm('minBudgetLabel')}</Label>
          <Input
            id="minBudget"
            name="minBudget"
            type="number"
            min={0}
            step={1000}
            defaultValue={values.minBudget}
            placeholder="150000"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="maxBudget">{tForm('maxBudgetLabel')}</Label>
          <Input
            id="maxBudget"
            name="maxBudget"
            type="number"
            min={0}
            step={1000}
            defaultValue={values.maxBudget}
            placeholder="900000"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="location">{tForm('locationLabel')}</Label>
          <Input
            id="location"
            name="location"
            defaultValue={values.location}
            placeholder={tForm('locationPlaceholder')}
            maxLength={120}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="radiusKm">{tForm('radiusLabel')}</Label>
          <Input
            id="radiusKm"
            name="radiusKm"
            type="number"
            min={0}
            step={1}
            defaultValue={values.radiusKm}
            placeholder="5"
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
        <legend className="px-2 text-sm font-medium text-slate-500">
          {tForm('notificationsLabel')}
        </legend>
        <ChannelToggle
          id="notifyEmail"
          name="notifyEmail"
          defaultChecked={values.notifyEmail}
          label={tForm('email')}
          description={tForm('emailDescription')}
        />
        <ChannelToggle
          id="notifyPush"
          name="notifyPush"
          defaultChecked={values.notifyPush}
          label={tForm('push')}
          description={tForm('pushDescription')}
        />
      </fieldset>

      {state.error && (
        <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="size-4" />
          <span>{tFeedback(state.error)}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
        >
          {tForm('cancel')}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? tForm('saving') : submitLabel}
        </Button>
      </div>
    </form>
  );
}

type ChannelToggleProps = {
  id: string;
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
};

function ChannelToggle({
  id,
  name,
  label,
  description,
  defaultChecked
}: ChannelToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-slate-300"
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
      />
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </label>
  );
}

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function formatBudgetRange(
  min: number | null,
  max: number | null,
  formatter: Intl.NumberFormat,
  tFilters: (key: string, options?: Record<string, unknown>) => string
) {
  if (min !== null && max !== null) {
    return tFilters('budgetRange', {
      min: formatter.format(min),
      max: formatter.format(max)
    });
  }

  if (min !== null) {
    return tFilters('budgetMin', { value: formatter.format(min) });
  }

  if (max !== null) {
    return tFilters('budgetMax', { value: formatter.format(max) });
  }

  return tFilters('budgetAny');
}

function formatLocation(
  city: string | null,
  radius: number | null,
  tFilters: (key: string, options?: Record<string, unknown>) => string
) {
  if (!city && radius === null) {
    return tFilters('locationAny');
  }

  if (city && radius !== null) {
    return tFilters('locationWithRadius', {
      city,
      radius
    });
  }

  if (city) {
    return city;
  }

  return tFilters('radiusOnly', { radius });
}

function alertToFormValues(alert: AlertSummary): AlertFormValues {
  return {
    title: alert.title,
    transactionType: alert.transactionType,
    propertyType: alert.propertyType ?? '',
    minBudget: alert.minBudget !== null ? String(alert.minBudget) : '',
    maxBudget: alert.maxBudget !== null ? String(alert.maxBudget) : '',
    location: alert.city ?? '',
    radiusKm: alert.radiusKm !== null ? String(alert.radiusKm) : '',
    notifyEmail: alert.notifyEmail,
    notifyPush: alert.notifyPush
  };
}
