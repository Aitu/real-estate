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

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locale = useMemo(() => {
    const paramLocale = typeof params?.locale === 'string' ? params.locale : 'en';
    return paramLocale;
  }, [params]);

  const callbackUrl = useMemo(() => {
    const from = searchParams?.get('from');
    const callback = searchParams?.get('callbackUrl') ?? searchParams?.get('redirectTo');
    return callback || from || `/${locale}/`;
  }, [locale, searchParams]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = useCallback(
    async (values: LoginValues) => {
      setError(null);
      setIsSubmitting(true);

      try {
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
        console.error('Failed to sign in', err);
        setError('Something went wrong while trying to sign in. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [callbackUrl, router]
  );

  const handleGoogleSignIn = useCallback(() => {
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
          <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Sign in to access your personalized real estate dashboard.
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
                        autoComplete="current-password"
                        placeholder="••••••••"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between text-xs">
                      <FormMessage />
                      <Link
                        href={`/${locale}/forgot-password`}
                        className="font-medium text-orange-600 transition hover:text-orange-500"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </FormItem>
                )}
              />

              {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

              <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
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
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <Chrome className="mr-2 h-4 w-4 text-[#4285F4]" /> Continue with Google
          </Button>
          <p className="text-sm text-slate-500">
            New to LuxNest?{' '}
            <Link
              href={`/${locale}/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-orange-600 transition hover:text-orange-500"
            >
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
