// src/types/post.ts
export interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  mainImage: {
    asset: {
      _ref: string;
      _type: 'reference';
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
  tags: string[];
  status: string;
}
