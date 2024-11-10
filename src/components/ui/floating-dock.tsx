// src/components/ui/floating-dock.tsx

import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
	AnimatePresence,
	MotionValue,
	motion,
	useMotionValue,
	useSpring,
	useTransform,
} from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";

type DockItem = {
	title: string;
	icon?: React.ReactNode;
	href?: string;
	onClick?: () => void;
	submenu?: DockItem[];
	customComponent?: React.ReactNode;
};

// Define the interface for DockButton props
interface DockButtonProps {
	item: DockItem;
	style?: React.CSSProperties;
	className?: string;
	onClick?: () => void;
	title?: string; // Optional title for tooltips
}

const DockButton: React.FC<DockButtonProps> = ({
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

interface FloatingDockProps {
	items: DockItem[];
	desktopClassName?: string;
	mobileClassName?: string;
	className?: string;
	itemClassName?: string;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
	items,
	desktopClassName,
	mobileClassName,
	className,
	itemClassName,
}) => {
	return (
		<>
			<FloatingDockDesktop items={items} className={desktopClassName} />
			<FloatingDockMobile items={items} className={mobileClassName} />
		</>
	);
};

const FloatingDockDesktop = ({
	items,
	className,
}: {
	items: DockItem[];
	className?: string;
}) => {
	const mouseX = useMotionValue(Infinity);
	return (
		<motion.div
			onMouseMove={(e) => mouseX.set(e.pageX)}
			onMouseLeave={() => mouseX.set(Infinity)}
			className={cn(
				"fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 hidden md:flex gap-4 items-end rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-4 py-2 shadow-lg",
				className
			)}
		>
			{items.map((item) => (
				<IconContainer key={item.title} mouseX={mouseX} item={item} />
			))}
		</motion.div>
	);
};

const FloatingDockMobile = ({
	items,
	className,
}: {
	items: DockItem[];
	className?: string;
}) => {
	const [open, setOpen] = useState(false);
	const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

	const handleItemClick = (item: DockItem) => {
		if (item.submenu) {
			setActiveSubmenu(activeSubmenu === item.title ? null : item.title);
		} else {
			if (item.onClick) item.onClick();
			if (item.href) setOpen(false);
		}
	};

	return (
		<div
			className={cn("fixed bottom-4 right-4 z-50 flex md:hidden", className)}
		>
			<AnimatePresence>
				{open && (
					<motion.div
						key="mobile-nav"
						className="absolute bottom-full mb-2 right-0 flex flex-col gap-0.5 bg-zinc-900/95 rounded-lg p-1 shadow-lg border border-zinc-800/50 backdrop-blur-md"
						initial={{ opacity: 0, y: 10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 10, scale: 0.95 }}
						style={{ transformOrigin: "bottom right" }}
					>
						{items.map((item) => (
							<div key={item.title} className="relative">
								<DockButton
									item={item}
									onClick={() => handleItemClick(item)}
									className="text-zinc-400 hover:text-zinc-100 transition-colors duration-200 px-2 py-1 rounded-md hover:bg-zinc-800/50 text-sm flex items-center gap-2"
									title={item.title}
								/>
								{item.submenu && activeSubmenu === item.title && (
									<motion.div
										initial={{ opacity: 0, x: -5 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -5 }}
										className="absolute right-full top-0 mr-1 flex flex-col gap-0.5 bg-zinc-900/95 rounded-lg p-1 shadow-lg border border-zinc-800/50 backdrop-blur-md"
										style={{ transformOrigin: "right center" }}
									>
										{item.submenu.map((subItem) => (
											<DockButton
												key={subItem.title}
												item={subItem}
												onClick={() => {
													if (subItem.onClick) subItem.onClick();
													setOpen(false);
													setActiveSubmenu(null);
												}}
												className="text-zinc-400 hover:text-zinc-100 transition-colors duration-200 px-1.5 py-1 rounded-md hover:bg-zinc-800/50 text-sm flex items-center gap-1.5 whitespace-nowrap"
												title={subItem.title}
											/>
										))}
									</motion.div>
								)}
							</div>
						))}
					</motion.div>
				)}
			</AnimatePresence>
			<button
				onClick={() => {
					setOpen((prev) => !prev);
					setActiveSubmenu(null);
				}}
				className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 text-zinc-100 flex items-center justify-center shadow-lg border border-zinc-800/50 transition-all duration-200 hover:scale-105 hover:shadow-xl backdrop-blur-md"
				title="Toggle Navigation"
			>
				<IconLayoutNavbarCollapse className="h-4 w-4" />
			</button>
		</div>
	);
};

function IconContainer({
	mouseX,
	item,
}: {
	mouseX: MotionValue<number>;
	item: DockItem;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [submenuOpen, setSubmenuOpen] = useState(false);

	const distance = useTransform(mouseX, (val) => {
		if (ref.current) {
			const rect = ref.current.getBoundingClientRect();
			return val - (rect.left + rect.width / 2);
		}
		return 0;
	});

	const maxDistance = 100;
	const minScale = 1;
	const maxScale = 1.2;

	const scale = useTransform(
		distance,
		[-maxDistance, 0, maxDistance],
		[minScale, maxScale, minScale]
	);

	const springConfig = { stiffness: 500, damping: 30 };
	const animatedScale = useSpring(scale, springConfig);

	const handleMouseEnter = () => {
		if (item.submenu || item.customComponent) {
			setSubmenuOpen(true);
		}
	};

	const handleMouseLeave = () => {
		if (item.submenu || item.customComponent) {
			setSubmenuOpen(false);
		}
	};

	return (
		<motion.div
			ref={ref}
			style={{ scale: animatedScale }}
			className="relative flex items-center justify-center"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<DockButton item={item} title={item.title} />
			{(item.submenu || item.customComponent) && (
				<AnimatePresence>
					{submenuOpen && (
						<motion.div
							className="absolute bottom-full mb-1 flex flex-col items-center bg-zinc-900/95 dark:bg-zinc-950/95 rounded-md p-0.5 shadow-lg border border-zinc-800 backdrop-blur-sm"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
						>
							{item.submenu?.map((subItem) => (
								<DockButton
									key={subItem.title}
									item={subItem}
									className="flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors duration-200 px-2 py-1 rounded hover:bg-zinc-800/50 text-xs whitespace-nowrap"
									title={subItem.title}
								/>
							))}
							{item.customComponent && <div>{item.customComponent}</div>}
							{/* Arrow indicator */}
							<div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-900/95 dark:bg-zinc-950/95 border-t border-l border-zinc-800" />
						</motion.div>
					)}
				</AnimatePresence>
			)}
		</motion.div>
	);
}
