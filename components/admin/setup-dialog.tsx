'use client'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { setupFirstAdmin } from '@/lib/actions/admin/setup-actions'
import { authClient } from '@/lib/auth-client'
import { useForm } from '@tanstack/react-form'
import { AlertCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters'),
})

function toMessage(err: unknown): string {
    if (typeof err === 'string') return err
    if (err && typeof err === 'object') {
        if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
            return (err as { message: string }).message
        }
    }
    return 'Setup failed. Please try again.'
}

export function SetupDialog() {
    const router = useRouter()

    const form = useForm({
        defaultValues: { name: '', email: '', password: '' },
        validators: {
            onSubmit: schema,
            onSubmitAsync: async ({ value }) => {
                try {
                    await setupFirstAdmin(value)
                } catch (err) {
                    return { form: toMessage(err), fields: {} }
                }

                const { error } = await authClient.signIn.email({
                    email: value.email,
                    password: value.password,
                })

                if (error) {
                    toast.error('Account created but sign-in failed.', {
                        description: 'Please sign in manually.',
                    })
                    router.push('/admin/login')
                    return
                }

                toast.success('Admin account created!', {
                    description: 'Welcome. You are now signed in.',
                })
                router.push('/admin')
            },
        },
    })

    return (
        <Dialog open onOpenChange={() => { }}>
            <DialogContent
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Create Admin Account</DialogTitle>
                    <DialogDescription>
                        No users found. Create the first administrator account to get started.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="setup-form"
                    onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        form.handleSubmit()
                    }}
                >
                    <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
                        {(submitError) =>
                            submitError ? (
                                <Alert className="mb-4" variant="destructive">
                                    <AlertCircleIcon />
                                    <AlertTitle>
                                        {typeof submitError === 'string'
                                            ? submitError
                                            : 'An unexpected error occurred.'}
                                    </AlertTitle>
                                </Alert>
                            ) : null
                        }
                    </form.Subscribe>

                    <FieldGroup>
                        <form.Field name="name">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            aria-invalid={isInvalid}
                                            placeholder="John Doe"
                                            autoComplete="name"
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        </form.Field>

                        <form.Field name="email">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
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
                                            placeholder="admin@example.com"
                                            autoComplete="email"
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        </form.Field>

                        <form.Field name="password">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
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
                                            autoComplete="new-password"
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        </form.Field>
                    </FieldGroup>
                </form>

                <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                        <Button
                            type="submit"
                            form="setup-form"
                            disabled={!canSubmit}
                            className="w-full mt-2"
                        >
                            {isSubmitting && <Spinner />}
                            Create Admin Account
                        </Button>
                    )}
                </form.Subscribe>
            </DialogContent>
        </Dialog>
    )
}