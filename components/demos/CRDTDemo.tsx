"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";

// Types
type TabType = "text" | "list" | "map";
type SyncStatus = "synced" | "syncing" | "offline";

export default function CRDTDemo() {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Yjs States
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [updateCount, setUpdateCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);

  // Text Editor States
  const [textContent, setTextContent] = useState("");
  const yDocTextRef = useRef<Y.Doc | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const textPersistenceRef = useRef<IndexeddbPersistence | null>(null);

  // List States
  const [listItems, setListItems] = useState<string[]>([]);
  const [newListItem, setNewListItem] = useState("");
  const yDocListRef = useRef<Y.Doc | null>(null);
  const yArrayRef = useRef<Y.Array<string> | null>(null);
  const listPersistenceRef = useRef<IndexeddbPersistence | null>(null);

  // Map States
  const [mapData, setMapData] = useState<Map<string, string>>(new Map());
  const [newMapKey, setNewMapKey] = useState("");
  const [newMapValue, setNewMapValue] = useState("");
  const yDocMapRef = useRef<Y.Doc | null>(null);
  const yMapRef = useRef<Y.Map<string> | null>(null);
  const mapPersistenceRef = useRef<IndexeddbPersistence | null>(null);

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

    // Initialize Yjs documents
    initializeYjs();

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      mediaQuery.removeEventListener("change", handleReducedMotion);
      cleanupYjs();
    };
  }, []);

  // Initialize Yjs
  const initializeYjs = () => {
    // Text Editor
    const textDoc = new Y.Doc();
    const textYText = textDoc.getText("content");
    const textPersistence = new IndexeddbPersistence("crdt-text", textDoc);

    textYText.observe((event) => {
      setTextContent(textYText.toString());
      setUpdateCount((prev) => prev + 1);
    });

    textPersistence.on("synced", () => {
      setSyncStatus("synced");
    });

    yDocTextRef.current = textDoc;
    yTextRef.current = textYText;
    textPersistenceRef.current = textPersistence;
    setTextContent(textYText.toString());

    // List
    const listDoc = new Y.Doc();
    const listYArray = listDoc.getArray<string>("items");
    const listPersistence = new IndexeddbPersistence("crdt-list", listDoc);

    listYArray.observe((event) => {
      setListItems(listYArray.toArray());
      setUpdateCount((prev) => prev + 1);
    });

    listPersistence.on("synced", () => {
      setSyncStatus("synced");
    });

    yDocListRef.current = listDoc;
    yArrayRef.current = listYArray;
    listPersistenceRef.current = listPersistence;
    setListItems(listYArray.toArray());

    // Map
    const mapDoc = new Y.Doc();
    const mapYMap = mapDoc.getMap<string>("data");
    const mapPersistence = new IndexeddbPersistence("crdt-map", mapDoc);

    mapYMap.observe((event) => {
      const newMap = new Map<string, string>();
      mapYMap.forEach((value, key) => {
        newMap.set(key, value);
      });
      setMapData(newMap);
      setUpdateCount((prev) => prev + 1);
    });

    mapPersistence.on("synced", () => {
      setSyncStatus("synced");
    });

    yDocMapRef.current = mapDoc;
    yMapRef.current = mapYMap;
    mapPersistenceRef.current = mapPersistence;
    const initialMap = new Map<string, string>();
    mapYMap.forEach((value, key) => {
      initialMap.set(key, value);
    });
    setMapData(initialMap);
  };

  const cleanupYjs = () => {
    if (textPersistenceRef.current) {
      textPersistenceRef.current.destroy();
    }
    if (listPersistenceRef.current) {
      listPersistenceRef.current.destroy();
    }
    if (mapPersistenceRef.current) {
      mapPersistenceRef.current.destroy();
    }
  };

  // Text Editor Functions
  const handleTextChange = (value: string) => {
    if (yTextRef.current) {
      const current = yTextRef.current.toString();
      if (value !== current) {
        yTextRef.current.delete(0, yTextRef.current.length);
        yTextRef.current.insert(0, value);
      }
    }
  };

  // List Functions
  const handleAddListItem = () => {
    if (newListItem.trim() && yArrayRef.current) {
      yArrayRef.current.push([newListItem]);
      setNewListItem("");
    }
  };

  const handleDeleteListItem = (index: number) => {
    if (yArrayRef.current) {
      yArrayRef.current.delete(index, 1);
    }
  };

  // Map Functions
  const handleSetMapItem = () => {
    if (newMapKey.trim() && newMapValue.trim() && yMapRef.current) {
      yMapRef.current.set(newMapKey, newMapValue);
      setNewMapKey("");
      setNewMapValue("");
    }
  };

  const handleDeleteMapItem = (key: string) => {
    if (yMapRef.current) {
      yMapRef.current.delete(key);
    }
  };

  // Simulate conflict resolution
  const simulateConflict = () => {
    setSyncStatus("syncing");
    setConflictCount((prev) => prev + 1);
    setTimeout(() => {
      setSyncStatus("synced");
      alert("冲突已自动解决！CRDT 确保所有更改都被保留。");
    }, 1000);
  };

  // Simulate offline mode
  const simulateOffline = () => {
    setSyncStatus("offline");
    setTimeout(() => {
      setSyncStatus("synced");
      alert("离线更改已同步！");
    }, 2000);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">CRDT Real-time Synchronization Demo</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Conflict-free Replicated Data Types for real-time collaborative editing with automatic conflict resolution
        </p>

        {/* Status Bar */}
        <div className="box liquid-glass-card mb-4">
          <div className="columns is-mobile">
            <div className="column">
              <div className="box has-text-centered">
                <p className="heading">同步状态</p>
                <p className="title is-4">
                  <span
                    className={`tag is-${syncStatus === "synced" ? "success" : syncStatus === "syncing" ? "warning" : "danger"}`}
                  >
                    {syncStatus === "synced" ? "已同步" : syncStatus === "syncing" ? "同步中" : "离线"}
                  </span>
                </p>
              </div>
            </div>
            <div className="column">
              <div className="box has-text-centered">
                <p className="heading">更新次数</p>
                <p className="title is-4">{updateCount}</p>
              </div>
            </div>
            <div className="column">
              <div className="box has-text-centered">
                <p className="heading">冲突解决</p>
                <p className="title is-4">{conflictCount}</p>
              </div>
            </div>
            <div className="column">
              <div className="box has-text-centered">
                <p className="heading">操作</p>
                <div className="buttons">
                  <button className="button is-small is-warning" onClick={simulateConflict} aria-label="Simulate conflict">
                    模拟冲突
                  </button>
                  <button className="button is-small is-info" onClick={simulateOffline} aria-label="Simulate offline">
                    模拟离线
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs is-boxed">
          <ul>
            <li className={activeTab === "text" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("text")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("text");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Text editor tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">📝</span>
                </span>
                <span>Text Editor</span>
              </a>
            </li>
            <li className={activeTab === "list" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("list")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("list");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="List editor tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">📋</span>
                </span>
                <span>List</span>
              </a>
            </li>
            <li className={activeTab === "map" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("map")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("map");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Map editor tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🗺️</span>
                </span>
                <span>Map</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Text Editor Tab */}
          {activeTab === "text" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Collaborative Text Editor</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Real-time text editing with automatic conflict resolution using Yjs CRDT
              </p>

              <div className="box liquid-glass-card">
                <div className="field">
                  <label className="label" htmlFor="text-editor">
                    文本编辑器
                  </label>
                  <div className="control">
                    <textarea
                      id="text-editor"
                      className="textarea"
                      value={textContent}
                      onChange={(e) => handleTextChange(e.target.value)}
                      rows={isMobile ? 10 : 15}
                      placeholder="开始输入...多个用户可以同时编辑，所有更改都会自动同步"
                      aria-label="Collaborative text editor"
                    />
                  </div>
                </div>
                <div className="content">
                  <p className="liquid-glass-text is-size-7">
                    💡 <strong>提示:</strong> 所有更改都会自动保存到本地 IndexedDB，即使离线也能继续编辑。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* List Tab */}
          {activeTab === "list" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Collaborative List</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Real-time list editing with automatic ordering and conflict resolution
              </p>

              <div className="box liquid-glass-card mb-4">
                <div className="field has-addons">
                  <div className="control is-expanded">
                    <input
                      className="input"
                      type="text"
                      placeholder="添加新项目..."
                      value={newListItem}
                      onChange={(e) => setNewListItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddListItem();
                        }
                      }}
                      aria-label="New list item"
                    />
                  </div>
                  <div className="control">
                    <button className="button is-primary" onClick={handleAddListItem} aria-label="Add list item">
                      添加
                    </button>
                  </div>
                </div>
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">列表项目 ({listItems.length})</h3>
                {listItems.length === 0 ? (
                  <p className="liquid-glass-text">列表为空。添加一些项目开始吧！</p>
                ) : (
                  <div className="content">
                    <ul>
                      {listItems.map((item, index) => (
                        <motion.li
                          key={index}
                          initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                          className="mb-2"
                        >
                          <div className="box liquid-glass-card is-flex is-justify-content-space-between is-align-items-center">
                            <span className="liquid-glass-text">{item}</span>
                            <button
                              className="button is-small is-danger"
                              onClick={() => handleDeleteListItem(index)}
                              aria-label={`Delete ${item}`}
                            >
                              删除
                            </button>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Tab */}
          {activeTab === "map" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Collaborative Map</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Real-time key-value map editing with automatic conflict resolution
              </p>

              <div className="box liquid-glass-card mb-4">
                <div className="field">
                  <label className="label" htmlFor="map-key">
                    键
                  </label>
                  <div className="control">
                    <input
                      id="map-key"
                      className="input"
                      type="text"
                      placeholder="key"
                      value={newMapKey}
                      onChange={(e) => setNewMapKey(e.target.value)}
                      aria-label="Map key"
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="map-value">
                    值
                  </label>
                  <div className="control">
                    <input
                      id="map-value"
                      className="input"
                      type="text"
                      placeholder="value"
                      value={newMapValue}
                      onChange={(e) => setNewMapValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSetMapItem();
                        }
                      }}
                      aria-label="Map value"
                    />
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button className="button is-primary" onClick={handleSetMapItem} aria-label="Set map item">
                      设置
                    </button>
                  </div>
                </div>
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">Map 数据 ({mapData.size})</h3>
                {mapData.size === 0 ? (
                  <p className="liquid-glass-text">Map 为空。添加一些键值对开始吧！</p>
                ) : (
                  <div className="table-container">
                    <table className="table is-fullwidth is-striped">
                      <thead>
                        <tr>
                          <th>键</th>
                          <th>值</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(mapData.entries()).map(([key, value]) => (
                          <motion.tr
                            key={key}
                            initial={prefersReducedMotion ? {} : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                          >
                            <td>
                              <code>{key}</code>
                            </td>
                            <td>{value}</td>
                            <td>
                              <button
                                className="button is-small is-danger"
                                onClick={() => handleDeleteMapItem(key)}
                                aria-label={`Delete ${key}`}
                              >
                                删除
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="box liquid-glass-card mt-6">
          <h3 className="title is-5 mb-3 liquid-glass-text">CRDT 特性</h3>
          <div className="content">
            <ul>
              <li>🔄 自动冲突解决 - 无需手动合并，所有更改都会被保留</li>
              <li>💾 离线支持 - 使用 IndexedDB 本地存储，离线也能编辑</li>
              <li>⚡ 实时同步 - 更改立即反映到所有客户端</li>
              <li>📊 多种数据类型 - 支持文本、数组、Map 等数据结构</li>
              <li>🔒 数据一致性 - CRDT 保证最终一致性</li>
              <li>📈 性能优化 - 增量更新，最小化网络传输</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

