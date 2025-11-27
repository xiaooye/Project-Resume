"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { BigDataItem } from "@/types";

const TOTAL_ITEMS = 1000000; // 1 million items
const ITEMS_PER_PAGE = 50;
const VIRTUAL_ITEM_HEIGHT = 60;

function generateData(count: number): BigDataItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Data Item ${i + 1}`,
    value: Math.floor(Math.random() * 10000),
    category: `Category ${(i % 10) + 1}`,
    timestamp: Date.now() - Math.random() * 86400000,
  }));
}

export default function BigDataDemo() {
  const [allData, setAllData] = useState<BigDataItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [useVirtualization, setUseVirtualization] = useState(true);
  const [renderMethod, setRenderMethod] = useState<"virtual" | "traditional">("virtual");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Initialize data only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    setAllData(generateData(TOTAL_ITEMS));
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return allData;
    const term = searchTerm.toLowerCase();
    return allData.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.value.toString().includes(term)
    );
  }, [allData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  // Virtual scrolling - simplified to work without inline styles
  const visibleRange = useMemo(() => {
    if (!useVirtualization || !isMounted) return { start: 0, end: paginatedData.length };
    const containerHeight = 600; // Fixed container height
    const start = Math.max(0, Math.floor(scrollTop / VIRTUAL_ITEM_HEIGHT) - 2);
    const visibleCount = Math.ceil(containerHeight / VIRTUAL_ITEM_HEIGHT) + 4;
    const end = Math.min(start + visibleCount, filteredData.length);
    return { start, end };
  }, [scrollTop, filteredData.length, useVirtualization, paginatedData.length, isMounted]);

  const virtualItems = useMemo(() => {
    if (!useVirtualization || !isMounted) return paginatedData;
    return filteredData.slice(visibleRange.start, visibleRange.end);
  }, [filteredData, visibleRange, useVirtualization, paginatedData, isMounted]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const [memoryUsage, setMemoryUsage] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const timer = setTimeout(() => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
      // @ts-ignore - performance.memory is Chrome-specific
      if (performance.memory) {
        // @ts-ignore
        setMemoryUsage(performance.memory.usedJSHeapSize / 1048576); // MB
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [virtualItems.length, renderMethod]);

  return (
    <div className="container">
      <div className="section">
        <h2 className="title is-2 has-text-centered mb-6">
          Big Data Handling Demo
        </h2>

        <div className="box mb-6">
          <div className="level">
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Total Items</p>
                <p className="title">{TOTAL_ITEMS.toLocaleString()}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Filtered Items</p>
                <p className="title">{filteredData.length.toLocaleString()}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Render Time</p>
                <p className="title">{renderTime.toFixed(2)}ms</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Memory Usage</p>
                <p className="title">
                  {memoryUsage > 0 ? `${memoryUsage.toFixed(2)} MB` : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="box mb-6">
          <div className="field is-grouped">
            <div className="control is-expanded">
              <input
                className="input"
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="control">
              <div className="select">
                <select
                  value={renderMethod}
                  onChange={(e) =>
                    setRenderMethod(e.target.value as "virtual" | "traditional")
                  }
                >
                  <option value="virtual">Virtual Scrolling</option>
                  <option value="traditional">Traditional Rendering</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="box">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="has-background-white"
          >
            {!isMounted ? (
              <div className="has-text-centered py-6">
                <p className="subtitle">Loading...</p>
              </div>
            ) : renderMethod === "virtual" ? (
              <div className="is-relative">
                {/* Spacer for items before visible range */}
                {visibleRange.start > 0 && (
                  <div style={{ height: `${visibleRange.start * VIRTUAL_ITEM_HEIGHT}px` }} />
                )}
                <div>
                  {virtualItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="is-flex is-align-items-center is-justify-content-space-between py-3 px-3"
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <br />
                        <small className="has-text-grey">{item.category}</small>
                      </div>
                      <div className="has-text-right">
                        <div className="title is-5">{item.value.toLocaleString()}</div>
                        <small className="has-text-grey">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </small>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Spacer for items after visible range */}
                {visibleRange.end < filteredData.length && (
                  <div style={{ height: `${(filteredData.length - visibleRange.end) * VIRTUAL_ITEM_HEIGHT}px` }} />
                )}
              </div>
            ) : (
              <div>
                {paginatedData.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="is-flex is-align-items-center is-justify-content-space-between py-3 px-3"
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <br />
                      <small className="has-text-grey">{item.category}</small>
                    </div>
                    <div className="has-text-right">
                      <div className="title is-5">{item.value.toLocaleString()}</div>
                      <small className="has-text-grey">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </small>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {renderMethod === "traditional" && (
          <div className="box">
            <nav className="pagination is-centered" role="navigation">
              <button
                className="pagination-previous"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="pagination-next"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
              <ul className="pagination-list">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <li key={pageNum}>
                      <button
                        className={`pagination-link ${
                          currentPage === pageNum ? "is-current" : ""
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <p className="has-text-centered mt-4">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}

        <div className="box mt-6">
          <h3 className="title is-4 mb-4">Performance Comparison</h3>
          <div className="content">
            <p>
              <strong>Virtual Scrolling:</strong> Only renders visible items, dramatically
              reducing DOM nodes and memory usage. Perfect for large datasets.
            </p>
            <p>
              <strong>Traditional Rendering:</strong> Renders all items in the current page,
              simpler but less efficient for very large datasets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

