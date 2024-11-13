// utils/github.ts

import fetch from "node-fetch";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;

interface Discussion {
	id: string;
	title: string;
	number: number;
	url: string;
}

interface RepositoryDiscussions {
	nodes: Discussion[];
}

interface GetDiscussionsData {
	repository: {
		discussions: RepositoryDiscussions;
	};
}

interface GitHubError {
	message: string;
}

interface GetDiscussionsResponse {
	data?: GetDiscussionsData;
	errors?: GitHubError[];
}

export async function getDiscussionIdBySlug(
	slug: string
): Promise<string | null> {
	const query = `
        query($owner: String!, $name: String!, $slug: String!) {
          repository(owner: $owner, name: $name) {
            discussions(first: 10, filterBy: {createdBy: "giscus-bot"}, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                id
                title
                number
                url
              }
            }
          }
        }
      `;

	const variables = {
		owner: GITHUB_REPO_OWNER,
		name: GITHUB_REPO_NAME,
		slug,
	};

	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${GITHUB_TOKEN}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});

	const result: GetDiscussionsResponse =
		(await response.json()) as GetDiscussionsResponse;

	if (result.errors) {
		console.error("GitHub API errors:", result.errors);
		return null;
	}

	const discussions = result.data?.repository.discussions.nodes || [];

	// Find the discussion that matches the slug
	const discussion = discussions.find((d) => d.title.includes(slug));

	return discussion ? discussion.id : null;
}

interface DeleteDiscussionData {
	deleteDiscussion: {
		clientMutationId: string | null;
	};
}

interface DeleteDiscussionResponse {
	data?: DeleteDiscussionData;
	errors?: GitHubError[];
}

export async function deleteDiscussion(discussionId: string): Promise<boolean> {
	const mutation = `
          mutation($id: ID!) {
            deleteDiscussion(input: {id: $id}) {
              clientMutationId
            }
          }
        `;

	const variables = {
		id: discussionId,
	};

	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${GITHUB_TOKEN}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query: mutation, variables }),
	});

	const result: DeleteDiscussionResponse =
		(await response.json()) as DeleteDiscussionResponse;

	if (result.errors) {
		console.error("GitHub API errors:", result.errors);
		return false;
	}

	return true;
}
