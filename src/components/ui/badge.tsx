import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/80",
				secondary:
					"border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/80",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
