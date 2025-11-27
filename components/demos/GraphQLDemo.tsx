"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

// GraphQL helper function
const graphqlRequest = async (query: string, variables?: any) => {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  return response.json();
};

// GraphQL Queries
const GET_USERS = `
  query GetUsers {
    users {
      id
      name
      email
      posts {
        id
        title
      }
    }
  }
`;

const GET_POSTS = `
  query GetPosts {
    posts {
      id
      title
      content
      author {
        id
        name
        email
      }
      comments {
        id
        content
        author {
          name
        }
      }
      createdAt
    }
  }
`;

const CREATE_POST = `
  mutation CreatePost($title: String!, $content: String!, $authorId: ID!) {
    createPost(title: $title, content: $content, authorId: $authorId) {
      id
      title
      content
      author {
        name
      }
      createdAt
    }
  }
`;

const CREATE_USER = `
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
    }
  }
`;

const UPDATE_POST = `
  mutation UpdatePost($id: ID!, $title: String, $content: String) {
    updatePost(id: $id, title: $title, content: $content) {
      id
      title
      content
    }
  }
`;

const DELETE_POST = `
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

// Types
type TabType = "query" | "mutation" | "subscription" | "cache";

export default function GraphQLDemo() {
  const [activeTab, setActiveTab] = useState<TabType>("query");
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Query States
  const [customQuery, setCustomQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Mutation States
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState("1");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  // Data States
  const [usersData, setUsersData] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [postsData, setPostsData] = useState<any>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [createPostLoading, setCreatePostLoading] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [updatePostLoading, setUpdatePostLoading] = useState(false);
  const [deletePostLoading, setDeletePostLoading] = useState(false);

  // Initialize
  useEffect(() => {
    setIsMounted(true);

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleReducedMotion = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    mediaQuery.addEventListener("change", handleReducedMotion);

    // Load initial data
    if (activeTab === "query") {
      loadUsers();
      loadPosts();
    }

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      mediaQuery.removeEventListener("change", handleReducedMotion);
    };
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "query" && isMounted) {
      loadUsers();
      loadPosts();
    }
  }, [activeTab, isMounted]);

  // Data loading functions
  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const result = await graphqlRequest(GET_USERS);
      if (result.errors) {
        setUsersError(result.errors[0].message);
      } else {
        setUsersData(result.data);
      }
    } catch (error: any) {
      setUsersError(error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadPosts = async () => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const result = await graphqlRequest(GET_POSTS);
      if (result.errors) {
        setPostsError(result.errors[0].message);
      } else {
        setPostsData(result.data);
      }
    } catch (error: any) {
      setPostsError(error.message);
    } finally {
      setPostsLoading(false);
    }
  };

  const refetchUsers = loadUsers;
  const refetchPosts = loadPosts;

  // Custom Query Execution
  const executeCustomQuery = async () => {
    if (!customQuery.trim()) {
      alert("请输入 GraphQL 查询");
      return;
    }

    setQueryLoading(true);
    setQueryError(null);

    try {
      const result = await graphqlRequest(customQuery);
      if (result.errors) {
        setQueryError(result.errors[0].message);
        setQueryResult(null);
      } else {
        setQueryResult(result.data);
      }
    } catch (error: any) {
      setQueryError(error.message);
      setQueryResult(null);
    } finally {
      setQueryLoading(false);
    }
  };

  // Mutation Handlers
  const handleCreatePost = async () => {
    if (!newPostTitle || !newPostContent) {
      alert("请填写所有字段");
      return;
    }

    setCreatePostLoading(true);
    try {
      const result = await graphqlRequest(CREATE_POST, {
        title: newPostTitle,
        content: newPostContent,
        authorId: selectedAuthorId,
      });
      if (result.errors) {
        alert(`创建失败: ${result.errors[0].message}`);
      } else {
        setNewPostTitle("");
        setNewPostContent("");
        alert("帖子创建成功！");
        loadPosts();
        loadUsers();
      }
    } catch (error: any) {
      alert(`创建失败: ${error.message}`);
    } finally {
      setCreatePostLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail) {
      alert("请填写所有字段");
      return;
    }

    setCreateUserLoading(true);
    try {
      const result = await graphqlRequest(CREATE_USER, {
        name: newUserName,
        email: newUserEmail,
      });
      if (result.errors) {
        alert(`创建失败: ${result.errors[0].message}`);
      } else {
        setNewUserName("");
        setNewUserEmail("");
        alert("用户创建成功！");
        loadUsers();
      }
    } catch (error: any) {
      alert(`创建失败: ${error.message}`);
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleUpdatePost = async (postId: string, title: string, content: string) => {
    setUpdatePostLoading(true);
    try {
      const result = await graphqlRequest(UPDATE_POST, {
        id: postId,
        title,
        content,
      });
      if (result.errors) {
        alert(`更新失败: ${result.errors[0].message}`);
      } else {
        alert("帖子更新成功！");
        loadPosts();
      }
    } catch (error: any) {
      alert(`更新失败: ${error.message}`);
    } finally {
      setUpdatePostLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("确定要删除这个帖子吗？")) return;

    setDeletePostLoading(true);
    try {
      const result = await graphqlRequest(DELETE_POST, { id: postId });
      if (result.errors) {
        alert(`删除失败: ${result.errors[0].message}`);
      } else {
        alert("帖子删除成功！");
        loadPosts();
      }
    } catch (error: any) {
      alert(`删除失败: ${error.message}`);
    } finally {
      setDeletePostLoading(false);
    }
  };

  // Cache Operations (simplified - using localStorage as cache)
  const clearCache = () => {
    localStorage.removeItem("graphql_cache");
    alert("缓存已清除");
  };

  const getCacheInfo = () => {
    const cache = localStorage.getItem("graphql_cache");
    if (cache) {
      return {
        size: cache.length,
        keys: Object.keys(JSON.parse(cache)).length,
      };
    }
    return { size: 0, keys: 0 };
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">GraphQL Integration Demo</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Apollo Server and Client demonstration with queries, mutations, subscriptions, and cache management
        </p>

        {/* Tabs */}
        <div className="tabs is-boxed">
          <ul>
            <li className={activeTab === "query" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("query")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("query");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Query tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🔍</span>
                </span>
                <span>Query</span>
              </a>
            </li>
            <li className={activeTab === "mutation" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("mutation")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("mutation");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Mutation tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">✏️</span>
                </span>
                <span>Mutation</span>
              </a>
            </li>
            <li className={activeTab === "subscription" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("subscription")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("subscription");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Subscription tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">📡</span>
                </span>
                <span>Subscription</span>
              </a>
            </li>
            <li className={activeTab === "cache" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("cache")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("cache");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Cache management tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">💾</span>
                </span>
                <span>Cache</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Query Tab */}
          {activeTab === "query" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">GraphQL Queries</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Execute queries to fetch data with automatic caching and optimization
              </p>

              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-3 liquid-glass-text">Custom Query</h3>
                <div className="field">
                  <div className="control">
                    <textarea
                      className="textarea"
                      placeholder="query { users { id name email } }"
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      rows={6}
                      aria-label="GraphQL query"
                    />
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button
                      className="button is-primary"
                      onClick={executeCustomQuery}
                      disabled={queryLoading}
                      aria-label="Execute query"
                    >
                      {queryLoading ? "执行中..." : "执行查询"}
                    </button>
                  </div>
                </div>
                {queryError && (
                  <div className="notification is-danger mt-4">
                    <p>
                      <strong>错误:</strong> {queryError}
                    </p>
                  </div>
                )}
                {queryResult && (
                  <div className="notification is-success mt-4">
                    <pre style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{JSON.stringify(queryResult, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="columns">
                <div className="column">
                  <div className="box liquid-glass-card">
                    <h3 className="title is-5 mb-3 liquid-glass-text">Users</h3>
                    {usersLoading && <p className="liquid-glass-text">加载中...</p>}
                    {usersError && (
                      <div className="notification is-danger">
                        <p>错误: {usersError}</p>
                      </div>
                    )}
                    {usersData && (
                      <div className="table-container">
                        <table className="table is-fullwidth is-striped">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Posts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersData.users.map((user: any) => (
                              <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.posts?.length || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <button className="button is-light mt-3" onClick={() => refetchUsers()} aria-label="Refresh users">
                      刷新
                    </button>
                  </div>
                </div>
                <div className="column">
                  <div className="box liquid-glass-card">
                    <h3 className="title is-5 mb-3 liquid-glass-text">Posts</h3>
                    {postsLoading && <p className="liquid-glass-text">加载中...</p>}
                    {postsError && (
                      <div className="notification is-danger">
                        <p>错误: {postsError}</p>
                      </div>
                    )}
                    {postsData && (
                      <div>
                        {postsData.posts.map((post: any) => (
                          <motion.div
                            key={post.id}
                            className="box liquid-glass-card mb-3"
                            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                          >
                            <h4 className="title is-6 liquid-glass-text">{post.title}</h4>
                            <p className="liquid-glass-text is-size-7">{post.content}</p>
                            <p className="liquid-glass-text is-size-7 mt-2">
                              <strong>作者:</strong> {post.author.name} | <strong>评论:</strong> {post.comments?.length || 0}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    <button className="button is-light mt-3" onClick={() => refetchPosts()} aria-label="Refresh posts">
                      刷新
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mutation Tab */}
          {activeTab === "mutation" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">GraphQL Mutations</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Create, update, and delete data with automatic cache updates
              </p>

              <div className="columns">
                <div className="column">
                  <div className="box liquid-glass-card mb-4">
                    <h3 className="title is-5 mb-3 liquid-glass-text">创建用户</h3>
                    <div className="field">
                      <label className="label" htmlFor="new-user-name">
                        姓名
                      </label>
                      <div className="control">
                        <input
                          id="new-user-name"
                          className="input"
                          type="text"
                          placeholder="用户名"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          aria-label="User name"
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="new-user-email">
                        邮箱
                      </label>
                      <div className="control">
                        <input
                          id="new-user-email"
                          className="input"
                          type="email"
                          placeholder="user@example.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          aria-label="User email"
                        />
                      </div>
                    </div>
                    <div className="field">
                      <div className="control">
                        <button
                          className="button is-primary"
                          onClick={handleCreateUser}
                          disabled={createUserLoading}
                          aria-label="Create user"
                        >
                          {createUserLoading ? "创建中..." : "创建用户"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="column">
                  <div className="box liquid-glass-card mb-4">
                    <h3 className="title is-5 mb-3 liquid-glass-text">创建帖子</h3>
                    <div className="field">
                      <label className="label" htmlFor="new-post-title">
                        标题
                      </label>
                      <div className="control">
                        <input
                          id="new-post-title"
                          className="input"
                          type="text"
                          placeholder="帖子标题"
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          aria-label="Post title"
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="new-post-content">
                        内容
                      </label>
                      <div className="control">
                        <textarea
                          id="new-post-content"
                          className="textarea"
                          placeholder="帖子内容"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          rows={4}
                          aria-label="Post content"
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="post-author">
                        作者
                      </label>
                      <div className="control">
                        <div className="select is-fullwidth">
                          <select
                            id="post-author"
                            value={selectedAuthorId}
                            onChange={(e) => setSelectedAuthorId(e.target.value)}
                            aria-label="Post author"
                          >
                            {usersData?.users.map((user: any) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="field">
                      <div className="control">
                        <button
                          className="button is-primary"
                          onClick={handleCreatePost}
                          disabled={createPostLoading}
                          aria-label="Create post"
                        >
                          {createPostLoading ? "创建中..." : "创建帖子"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {postsData && postsData.posts.length > 0 && (
                <div className="box liquid-glass-card">
                  <h3 className="title is-5 mb-3 liquid-glass-text">管理帖子</h3>
                  {postsData.posts.map((post: any) => (
                    <div key={post.id} className="box liquid-glass-card mb-3">
                      <h4 className="title is-6 liquid-glass-text">{post.title}</h4>
                      <p className="liquid-glass-text is-size-7">{post.content}</p>
                      <div className="buttons mt-3">
                        <button
                          className="button is-small is-warning"
                          onClick={() => {
                            const newTitle = prompt("新标题:", post.title);
                            const newContent = prompt("新内容:", post.content);
                            if (newTitle && newContent) {
                              handleUpdatePost(post.id, newTitle, newContent);
                            }
                          }}
                          disabled={updatePostLoading}
                          aria-label={`Update post ${post.id}`}
                        >
                          更新
                        </button>
                        <button
                          className="button is-small is-danger"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletePostLoading}
                          aria-label={`Delete post ${post.id}`}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === "subscription" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">GraphQL Subscriptions</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Real-time updates using WebSocket subscriptions (Note: Requires WebSocket server setup)
              </p>

              <div className="box liquid-glass-card">
                <div className="notification is-info">
                  <p>
                    <strong>订阅功能说明:</strong>
                  </p>
                  <p>
                    GraphQL 订阅需要 WebSocket 服务器支持。在生产环境中，您需要：
                  </p>
                  <ul>
                    <li>设置 WebSocket 服务器（如使用 graphql-ws）</li>
                    <li>配置 Apollo Server 支持订阅</li>
                    <li>使用 GraphQLWsLink 连接客户端</li>
                  </ul>
                  <p className="mt-3">
                    <strong>当前演示:</strong> 由于 Next.js API 路由的限制，订阅功能需要额外的 WebSocket 服务器。本演示展示了订阅的配置和概念。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cache Tab */}
          {activeTab === "cache" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Cache Management</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Apollo Client cache management and optimization strategies
              </p>

              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-3 liquid-glass-text">缓存信息</h3>
                {(() => {
                  const cacheInfo = getCacheInfo();
                  return (
                    <div className="content">
                      <p>
                        <strong>缓存大小:</strong> {cacheInfo.size} bytes
                      </p>
                      <p>
                        <strong>缓存键数量:</strong> {cacheInfo.keys}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">缓存操作</h3>
                <div className="field">
                  <div className="control">
                    <button className="button is-danger" onClick={clearCache} aria-label="Clear cache">
                      清除缓存
                    </button>
                  </div>
                </div>
                <div className="content mt-4">
                  <p>
                    <strong>缓存策略:</strong>
                  </p>
                  <ul>
                    <li>自动缓存查询结果</li>
                    <li>智能缓存更新 - 变更后自动更新相关查询</li>
                    <li>缓存持久化 - 可配置本地存储</li>
                    <li>缓存优化 - 避免重复查询</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

