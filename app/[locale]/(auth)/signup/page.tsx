'use client';

import Link from 'next/link';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Chrome, Loader2 } from 'lucide-react';

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

const signupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(100, 'Password must be under 100 characters'),
    confirmPassword: z.string().min(8, 'Confirmation password must match the password length'),
    inviteId: z.string().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type SignupValues = z.infer<typeof signupSchema>;

function SignupPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locale = useMemo(() => {
    const paramLocale = typeof params?.locale === 'string' ? params.locale : 'en';
    return paramLocale;
  }, [params]);

  const inviteId = searchParams?.get('inviteId') ?? undefined;

  const callbackUrl = useMemo(() => {
    const next = searchParams?.get('callbackUrl') ?? searchParams?.get('redirectTo');
    return next || `/${locale}/dashboard`;
  }, [locale, searchParams]);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      inviteId
    }
  });

  const onSubmit = useCallback(
    async (values: SignupValues) => {
      setError(null);
      setIsSubmitting(true);

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            inviteId: values.inviteId,
            locale
          })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? 'Unable to create your account. Please try again.');
          return;
        }

        const result = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
          callbackUrl
        });

        if (result?.error) {
          setError(result.error);
          return;
        }

        const destination = result?.url ?? callbackUrl;
        if (destination.startsWith('http')) {
          try {
            const url = new URL(destination);
            router.push(`${url.pathname}${url.search}` || '/');
          } catch (parseError) {
            console.warn('Failed to parse redirect URL', parseError);
            router.push(callbackUrl);
          }
        } else {
          router.push(destination);
        }
        router.refresh();
      } catch (err) {
        console.error('Failed to sign up', err);
        setError('Something went wrong while creating your account. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [callbackUrl, locale, router]
  );

  const handleGoogleSignUp = useCallback(() => {
    setIsSubmitting(true);
    setError(null);
    void signIn('google', {
      callbackUrl
    }).finally(() => setIsSubmitting(false));
  }, [callbackUrl]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-50 px-4 py-12">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-2xl font-semibold">Create your account</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Start tracking your favourite listings and stay updated with the latest market trends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a strong password"
                        disabled={isSubmitting}
                      />
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
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {inviteId && (
                <FormField
                  control={form.control}
                  name="inviteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-500">Invitation code</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-slate-100" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

              <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Sign up'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            onClick={handleGoogleSignUp}
            disabled={isSubmitting}
          >
            <Chrome className="mr-2 h-4 w-4 text-[#4285F4]" /> Sign up with Google
          </Button>
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href={`/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-orange-600 transition hover:text-orange-500"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}
