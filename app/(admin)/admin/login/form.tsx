'use client'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { useForm } from '@tanstack/react-form'
import { AlertCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

const formSchema = z.object({
    email: z.email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters'),
})

export function SignInForm({ className }: React.ComponentProps<'div'>) {
    const router = useRouter()

    const form = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
        validators: {
            onSubmit: formSchema,
            onSubmitAsync: async ({ value }) => {
                const { error } = await authClient.signIn.email({
                    email: value.email,
                    password: value.password,
                })

                if (error) {
                    const message =
                        error.code === 'EMAIL_NOT_VERIFIED'
                            ? 'Please verify your email before signing in.'
                            : (error.message ?? 'An error occurred while signing in. Please try again.')

                    return { form: message, fields: {} }
                }

                form.reset()
                router.push('/headcode')
            },
        },
    })

    return (
        <div className={cn('flex flex-col gap-6', className)}>
            <h2 className="text-center text-3xl font-bold tracking-tight">
                Admin
            </h2>
            <Card>
                <CardHeader>
                    <CardTitle>Sign in</CardTitle>
                    <CardDescription>
                        Sign in to your account to continue. If you don&apos;t have an
                        account, please contact your administrator.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
                        {(submitError) =>
                            submitError ? (
                                <Alert className="mb-4" variant="destructive">
                                    <AlertCircleIcon />
                                    <AlertTitle>{submitError as string}</AlertTitle>
                                </Alert>
                            ) : null
                        }
                    </form.Subscribe>
                    <form
                        id="sign-in-form"
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                    >
                        <FieldGroup>
                            <form.Field name="email">
                                {(field) => {
                                    const isInvalid =
                                        field.state.meta.isTouched && !field.state.meta.isValid
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                placeholder="name@example.com"
                                                // ✅ FIX 6: Use proper autocomplete tokens.
                                                autoComplete="email"
                                            />
                                            {isInvalid && (
                                                <FieldError errors={field.state.meta.errors} />
                                            )}
                                        </Field>
                                    )
                                }}
                            </form.Field>
                            <form.Field name="password">
                                {(field) => {
                                    const isInvalid =
                                        field.state.meta.isTouched && !field.state.meta.isValid
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                type="password"
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                autoComplete="current-password"
                                            />
                                            {isInvalid && (
                                                <FieldError errors={field.state.meta.errors} />
                                            )}
                                        </Field>
                                    )
                                }}
                            </form.Field>
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                            >
                                {([canSubmit, isSubmitting]) => (
                                    <Field>
                                        <Button
                                            type="submit"
                                            disabled={!canSubmit}
                                        >
                                            {isSubmitting && <Spinner />}
                                            Sign in
                                        </Button>
                                    </Field>
                                )}
                            </form.Subscribe>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
