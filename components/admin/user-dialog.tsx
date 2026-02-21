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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { setupFirstAdmin } from '@/lib/actions/admin/setup-actions'
import { authClient } from '@/lib/auth-client'
import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircleIcon, PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

function toMessage(err: unknown, fallback: string): string {
    if (typeof err === 'string') return err
    if (err && typeof err === 'object' && 'message' in err) {
        const { message } = err as { message: unknown }
        if (typeof message === 'string') return message
    }
    return fallback
}

type Mode = 'setup' | 'create'

interface UserDialogProps {
    mode: Mode
}

export function UserDialog({ mode }: UserDialogProps) {
    const isSetup = mode === 'setup'
    const [open, setOpen] = useState(isSetup) // setup opens immediately, create needs trigger
    const router = useRouter()
    const queryClient = useQueryClient()

    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: (isSetup ? 'admin' : 'user') as 'user' | 'admin',
        },
        validators: {
            onSubmit: schema,
            onSubmitAsync: async ({ value }) => {
                if (isSetup) {
                    try {
                        await setupFirstAdmin({
                            name: value.name,
                            email: value.email,
                            password: value.password,
                        })
                    } catch (err) {
                        return {
                            form: toMessage(err, 'Setup failed. Please try again.'),
                            fields: {},
                        }
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
                    return
                }

                // ── Create mode ───────────────────────────────────────────────
                const { error } = await authClient.admin.createUser({
                    name: value.name,
                    email: value.email,
                    password: value.password,
                    role: value.role,
                })

                if (error) {
                    return {
                        form: toMessage(error, 'Failed to create user. Please try again.'),
                        fields: {},
                    }
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
        if (isSetup) return // setup dialog cannot be dismissed
        setOpen(next)
        if (!next) form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {!isSetup && (
                <DialogTrigger asChild>
                    <Button>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create User
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent
                onEscapeKeyDown={(e) => isSetup && e.preventDefault()}
                onPointerDownOutside={(e) => isSetup && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isSetup ? 'Create Admin Account' : 'Create New User'}
                    </DialogTitle>
                    <DialogDescription>
                        {isSetup
                            ? 'No users found. Create the first administrator account to get started.'
                            : 'Add a new user. They can sign in immediately with these credentials.'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="user-dialog-form"
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
                        {/* Name */}
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

                        {/* Email */}
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
                                            placeholder={isSetup ? 'admin@example.com' : 'john@example.com'}
                                            autoComplete="email"
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        </form.Field>

                        {/* Password */}
                        <form.Field name="password">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            {isSetup ? 'Password' : 'Temporary Password'}
                                        </FieldLabel>
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

                        {/* Role — hidden in setup (always admin), visible in create */}
                        {!isSetup && (
                            <form.Field name="role">
                                {(field) => (
                                    <Field>
                                        <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val) =>
                                                field.handleChange(val as 'user' | 'admin')
                                            }
                                        >
                                            <SelectTrigger id={field.name}>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                )}
                            </form.Field>
                        )}
                    </FieldGroup>
                </form>

                <DialogFooter>
                    {!isSetup && (
                        <Button
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                    )}
                    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                type="submit"
                                form="user-dialog-form"
                                disabled={!canSubmit}
                                className={isSetup ? 'w-full' : ''}
                            >
                                {isSubmitting && <Spinner />}
                                {isSetup ? 'Create Admin Account' : 'Create User'}
                            </Button>
                        )}
                    </form.Subscribe>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}