'use client'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'
import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircleIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { userQueryKeys } from './users-table'

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters'),
    role: z.enum(['user', 'admin']),
})

function toMessage(err: unknown): string {
    if (typeof err === 'string') return err
    if (err && typeof err === 'object') {
        if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
            return (err as { message: string }).message
        }
    }
    return 'Failed to create user. Please try again.'
}

export function CreateUserDialog() {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'user' as 'user' | 'admin',
        },
        validators: {
            onSubmit: schema,
            onSubmitAsync: async ({ value }) => {
                const { error } = await authClient.admin.createUser({
                    name: value.name,
                    email: value.email,
                    password: value.password,
                    role: value.role,
                })

                if (error) {
                    return { form: toMessage(error), fields: {} }
                }

                toast.success(`${value.name} created`, {
                    description: `${value.email} can now sign in as ${value.role}.`,
                })

                form.reset()
                setOpen(false)
                await queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
            },
        },
    })

    const handleOpenChange = (next: boolean) => {
        setOpen(next)
        if (!next) form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create User
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Add a new user. They can sign in immediately with these credentials.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="create-user-form"
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
                                            placeholder="john@example.com"
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
                                        <FieldLabel htmlFor={field.name}>Temporary Password</FieldLabel>
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

                        <form.Field name="role">
                            {(field) => (
                                <Field>
                                    <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                                    <select
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value as 'user' | 'admin')
                                        }
                                        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </Field>
                            )}
                        </form.Field>
                    </FieldGroup>
                </form>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                type="submit"
                                form="create-user-form"
                                disabled={!canSubmit}
                            >
                                {isSubmitting && <Spinner />}
                                Create User
                            </Button>
                        )}
                    </form.Subscribe>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}