/// <reference types="vite/client" />

interface ImportMeta {
	glob<T = unknown>(
		pattern: string | readonly string[],
		options: { eager: true; import?: string; query?: string | Record<string, string | number | boolean> }
	): Record<string, T>;
	glob(
		pattern: string | readonly string[],
		options?: { eager?: false; import?: string; query?: string | Record<string, string | number | boolean> }
	): Record<string, () => Promise<unknown>>;
}

