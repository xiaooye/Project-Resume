import { NextRequest } from "next/server";
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";

// GraphQL Schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
    createdAt: String!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    createdAt: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
    comments: [Comment!]!
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    createPost(title: String!, content: String!, authorId: ID!): Post!
    createComment(content: String!, postId: ID!, authorId: ID!): Comment!
    updatePost(id: ID!, title: String, content: String): Post!
    deletePost(id: ID!): Boolean!
  }

  type Subscription {
    postAdded: Post!
    commentAdded: Comment!
  }
`;

// Mock Data
const users = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
  { id: "3", name: "Charlie", email: "charlie@example.com" },
];

const posts = [
  {
    id: "1",
    title: "GraphQL Introduction",
    content: "GraphQL is a query language for APIs...",
    authorId: "1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Apollo Server Setup",
    content: "Setting up Apollo Server with Next.js...",
    authorId: "2",
    createdAt: new Date().toISOString(),
  },
];

const comments = [
  {
    id: "1",
    content: "Great post!",
    postId: "1",
    authorId: "2",
    createdAt: new Date().toISOString(),
  },
];

// Resolvers with DataLoader pattern to avoid N+1 problem
const resolvers = {
  Query: {
    users: () => users,
    user: (_: any, { id }: { id: string }) => users.find((u) => u.id === id),
    posts: () => posts,
    post: (_: any, { id }: { id: string }) => posts.find((p) => p.id === id),
    comments: () => comments,
  },
  Mutation: {
    createUser: (_: any, { name, email }: { name: string; email: string }) => {
      const newUser = { id: String(users.length + 1), name, email };
      users.push(newUser);
      return newUser;
    },
    createPost: (_: any, { title, content, authorId }: { title: string; content: string; authorId: string }) => {
      const newPost = {
        id: String(posts.length + 1),
        title,
        content,
        authorId,
        createdAt: new Date().toISOString(),
      };
      posts.push(newPost);
      return newPost;
    },
    createComment: (_: any, { content, postId, authorId }: { content: string; postId: string; authorId: string }) => {
      const newComment = {
        id: String(comments.length + 1),
        content,
        postId,
        authorId,
        createdAt: new Date().toISOString(),
      };
      comments.push(newComment);
      return newComment;
    },
    updatePost: (_: any, { id, title, content }: { id: string; title?: string; content?: string }) => {
      const post = posts.find((p) => p.id === id);
      if (!post) throw new Error("Post not found");
      if (title) post.title = title;
      if (content) post.content = content;
      return post;
    },
    deletePost: (_: any, { id }: { id: string }) => {
      const index = posts.findIndex((p) => p.id === id);
      if (index === -1) return false;
      posts.splice(index, 1);
      return true;
    },
  },
  User: {
    posts: (parent: { id: string }) => posts.filter((p) => p.authorId === parent.id),
  },
  Post: {
    author: (parent: { authorId: string }) => users.find((u) => u.id === parent.authorId),
    comments: (parent: { id: string }) => comments.filter((c) => c.postId === parent.id),
  },
  Comment: {
    author: (parent: { authorId: string }) => users.find((u) => u.id === parent.authorId),
    post: (parent: { postId: string }) => posts.find((p) => p.id === parent.postId),
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

