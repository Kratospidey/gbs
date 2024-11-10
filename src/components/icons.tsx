// src/components/icons.tsx
import { Loader2, Save, Send } from "lucide-react";

export const Icons = {
	spinner: Loader2,
	draft: Save,
	publish: Send,
} as const;

export type IconKeys = keyof typeof Icons;
