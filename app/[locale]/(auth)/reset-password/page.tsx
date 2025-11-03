'use client';

import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(8, 'Confirm password must match the password length')
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locale = useMemo(() => (typeof params?.locale === 'string' ? params.locale : 'en'), [params]);
  const token = searchParams?.get('token');

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (values: ResetValues) => {
    setIsSubmitting(true);
    // Placeholder: connect to password reset endpoint once available.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSuccess(true);
    form.reset({ password: '', confirmPassword: '' });
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-50 px-4 py-12">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-2xl font-semibold">Choose a new password</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            {token
              ? 'Enter and confirm your new password to finish resetting your account access.'
              : 'This reset link is missing or has expired. Please request a new one.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center text-sm text-slate-600">
              <p>Your password has been updated successfully.</p>
              <p>You can now return to the sign-in page and log in with your new credentials.</p>
            </div>
          ) : token ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="new-password" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="new-password" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating password...
                    </span>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-4 text-center text-sm text-slate-600">
              <p>The reset link you followed is invalid or has expired.</p>
              <p>Please return to the password recovery page to request a new email.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center text-xs text-slate-500">
          Continue exploring listings in <span className="ml-1 font-medium uppercase">{locale}</span> locale.
        </CardFooter>
      </Card>
    </div>
  );
}
