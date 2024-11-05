// src/types/post.ts
export interface Post {
	_id: string;
	title: string;
	slug: {
		current: string;
	};
	mainImage: {
		asset: {
			_ref?: string;
			url?: string;
		};
	};
	description?: string;
	author: {
		name: string;
		image?: {
			asset: {
				url: string;
			};
		};
	};
	categories: {
		title: string;
		description: string;
	}[];
	publishedAt: string;
}
