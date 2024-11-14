"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundGradientAnimation = ({
	className,
}: {
	className?: string;
}) => {
	return (
		<div className={cn("relative w-full h-full overflow-hidden", className)}>
			<div className="absolute inset-0 gradient-animation"></div>
		</div>
	);
};
