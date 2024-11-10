// src/components/types/post.ts

export interface Post {
	_id: string;
	title: string;
	slug: string;
	publishedAt: string;
	mainImageUrl?: string;
	tags: string[];
	authorName: string | null;
	author?: {
		username: string;
		firstName: string;
		lastName: string;
	};
}
