// src/components/ui/toaster.tsx
"use client";

import { useToast } from "@/components/hooks/use-toast";
import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider swipeDirection="right">
			{toasts.map(({ id, title, description, action, variant, ...props }) => (
				<Toast key={id} variant={variant} {...props}>
					<div className="flex flex-col">
						{title && <ToastTitle>{title}</ToastTitle>}
						{description && <ToastDescription>{description}</ToastDescription>}
					</div>
					{action}
					<ToastClose />
				</Toast>
			))}
			<ToastViewport />
		</ToastProvider>
	);
}
