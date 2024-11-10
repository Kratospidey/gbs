// src/components/ui/DockButton.tsx

import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type DockItem = {
	title: string;
	icon?: React.ReactNode;
	href?: string;
	onClick?: () => void;
	submenu?: DockItem[];
	customComponent?: React.ReactNode;
};

interface DockButtonProps {
	item: DockItem;
	style?: React.CSSProperties;
	className?: string;
	onClick?: () => void;
	title?: string; // Optional title for tooltips
}

export const DockButton: React.FC<DockButtonProps> = ({
	item,
	style,
	className,
	onClick,
	title,
}) => {
	const baseClasses =
		"h-8 w-8 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110";

	if (item.customComponent) {
		return (
			<div className={cn(baseClasses, className)} style={style} title={title}>
				{item.customComponent}
			</div>
		);
	}

	const content = item.icon;

	if (item.href) {
		return (
			<Link href={item.href}>
				<div className={cn(baseClasses, className)} style={style} title={title}>
					{content}
				</div>
			</Link>
		);
	} else if (item.onClick || onClick) {
		return (
			<button
				onClick={onClick || item.onClick}
				className={cn(baseClasses, className)}
				style={style}
				title={title}
			>
				{content}
			</button>
		);
	} else {
		return (
			<div className={cn(baseClasses, className)} style={style} title={title}>
				{content}
			</div>
		);
	}
};
