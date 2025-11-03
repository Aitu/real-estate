'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
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

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please provide a valid email address')
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const params = useParams();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locale = useMemo(() => (typeof params?.locale === 'string' ? params.locale : 'en'), [params]);

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (values: ForgotValues) => {
    setIsSubmitting(true);
    // Placeholder: wire up to email service or API endpoint.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-50 px-4 py-12">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-2xl font-semibold">Reset your password</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Enter your email address and we will send you a secure link to set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center text-sm text-slate-600">
              <p>
                If an account exists for <span className="font-semibold">{form.getValues('email')}</span>,
                you will receive an email with instructions shortly.
              </p>
              <p>Remember to check your spam folder if the email doesn&apos;t arrive within a few minutes.</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" inputMode="email" autoComplete="email" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending reset link...
                    </span>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="justify-center text-xs text-slate-500">
          Continue exploring listings in <span className="ml-1 font-medium uppercase">{locale}</span> locale.
        </CardFooter>
      </Card>
    </div>
  );
}
