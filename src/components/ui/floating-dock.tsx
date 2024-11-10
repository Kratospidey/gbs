/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/

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
import { ModeToggle } from "@/components/mode-toggle"; // Ensure ModeToggle is imported if needed

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
	title, // Destructure the title prop
}) => {
	const baseClasses =
		"aspect-square rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110";

	if (item.customComponent) {
		return (
			<div
				className={cn(baseClasses, className)}
				style={style}
				title={title} // Apply title for tooltip
			>
				{item.customComponent}
			</div>
		);
	}

	const content = item.icon;

	if (item.href) {
		return (
			<Link href={item.href}>
				<div
					className={cn(baseClasses, className)}
					style={style}
					title={title} // Apply title for tooltip
				>
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
				title={title} // Apply title for tooltip
			>
				{content}
			</button>
		);
	} else {
		return (
			<div
				className={cn(baseClasses, className)}
				style={style}
				title={title} // Apply title for tooltip
			>
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
	itemClassName?: string; // Add this to match usage
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
				"fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 mx-auto hidden md:flex gap-4 items-end rounded-2xl bg-background text-foreground px-4 py-2 shadow-lg",
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

	const handleItemClick = (item: DockItem) => {
		if (item.onClick) {
			item.onClick();
		}
		if (item.href) {
			setOpen(false);
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
						className="absolute bottom-full mb-2 flex flex-col gap-1 bg-background rounded-lg p-2 shadow-lg"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
					>
						{items.map((item) => (
							<DockButton
								key={item.title}
								item={item}
								onClick={() => handleItemClick(item)}
								title={item.title} // Ensure title is passed here
							/>
						))}
					</motion.div>
				)}
			</AnimatePresence>
			<button
				onClick={() => setOpen((prev) => !prev)}
				className="h-10 w-10 rounded-full bg-background text-foreground flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110"
				title="Toggle Navigation"
			>
				<IconLayoutNavbarCollapse className="h-5 w-5" />
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
			return val - rect.left - rect.width / 2;
		}
		return 0;
	});

	const maxDistance = 100;
	const minScale = 1;
	const maxScale = 1.3;

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
			className="relative"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<DockButton item={item} title={item.title} /> {/* Pass title here */}
			{(item.submenu || item.customComponent) && (
				<AnimatePresence>
					{submenuOpen && (
						<motion.div
							className="absolute flex flex-col items-center gap-1 bg-background rounded-lg p-2 shadow-lg scale-90"
							style={{ bottom: "110%", marginBottom: "6px" }}
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
						>
							{item.submenu &&
								item.submenu.map((subItem) => (
									<DockButton
										key={subItem.title}
										item={subItem}
										className="last:mb-0"
										title={subItem.title} // Pass title here
									/>
								))}
							{item.customComponent && <div>{item.customComponent}</div>}
						</motion.div>
					)}
				</AnimatePresence>
			)}
		</motion.div>
	);
}
