"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";

// Types
type TabType = "wallet" | "contract" | "nft";
type Network = {
  name: string;
  chainId: number;
  rpcUrl: string;
};

type NFT = {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
};

export default function Web3Demo() {
  const [activeTab, setActiveTab] = useState<TabType>("wallet");
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Wallet States
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [network, setNetwork] = useState<Network | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Contract States
  const [contractAddress, setContractAddress] = useState("");
  const [contractABI, setContractABI] = useState("");
  const [contractMethods, setContractMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [methodParams, setMethodParams] = useState<string[]>([]);
  const [contractResult, setContractResult] = useState<any>(null);
  const [gasEstimate, setGasEstimate] = useState<string>("0");
  const [transactionHash, setTransactionHash] = useState<string>("");

  // NFT States
  const [nftContractAddress, setNftContractAddress] = useState("");
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);

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

    // Check if MetaMask is installed
    if (typeof window !== "undefined" && (window as any).ethereum) {
      checkConnection();
    }

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      mediaQuery.removeEventListener("change", handleReducedMotion);
    };
  }, []);

  // Check existing connection
  const checkConnection = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  // Wallet Functions
  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("请安装 MetaMask 钱包扩展");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setBalance(ethers.formatEther(balance));
      setNetwork({
        name: network.name,
        chainId: Number(network.chainId),
        rpcUrl: network.name,
      });
      setIsConnected(true);
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      alert(`连接失败: ${error.message || "未知错误"}`);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount("");
    setBalance("0");
    setNetwork(null);
    setIsConnected(false);
  };

  const sendTransaction = async () => {
    if (!signer) {
      alert("请先连接钱包");
      return;
    }

    const to = prompt("请输入接收地址:");
    const amount = prompt("请输入金额 (ETH):");

    if (!to || !amount) return;

    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      setTransactionHash(tx.hash);
      alert(`交易已发送: ${tx.hash}\n等待确认...`);

      await tx.wait();
      alert("交易已确认！");
    } catch (error: any) {
      console.error("Error sending transaction:", error);
      alert(`交易失败: ${error.message || "未知错误"}`);
    }
  };

  // Contract Functions
  const loadContract = async () => {
    if (!contractAddress || !contractABI) {
      alert("请输入合约地址和 ABI");
      return;
    }

    try {
      const abi = JSON.parse(contractABI);
      const contract = new ethers.Contract(contractAddress, abi, signer || provider);
      const fragments = contract.interface.fragments as Record<string, any>;
      const methods = Object.keys(fragments).filter((name) => {
        const fragment = fragments[name];
        return !name.includes("(") && fragment && fragment.type === "function";
      });
      setContractMethods(methods);
      setSelectedMethod(methods[0] || "");
    } catch (error: any) {
      console.error("Error loading contract:", error);
      alert(`加载合约失败: ${error.message || "未知错误"}`);
    }
  };

  const callContractMethod = async () => {
    if (!contractAddress || !contractABI || !selectedMethod || !signer) {
      alert("请先连接钱包并加载合约");
      return;
    }

    try {
      const abi = JSON.parse(contractABI);
      const contract = new ethers.Contract(contractAddress, abi, signer);

      // Estimate gas
      const method = contract[selectedMethod];
      if (!method) {
        alert("方法不存在");
        return;
      }

      const isReadOnly = contract.interface.getFunction(selectedMethod)?.stateMutability === "view";
      let result;

      if (isReadOnly) {
        // Read operation
        const params = methodParams.filter((p) => p.trim() !== "");
        result = await method(...params);
        setContractResult(result.toString());
      } else {
        // Write operation
        const params = methodParams.filter((p) => p.trim() !== "");
        const gasEstimate = await contract[selectedMethod].estimateGas(...params);
        setGasEstimate(gasEstimate.toString());

        const tx = await method(...params);
        setTransactionHash(tx.hash);
        setContractResult(`交易哈希: ${tx.hash}`);

        await tx.wait();
        setContractResult(`交易已确认: ${tx.hash}`);
      }
    } catch (error: any) {
      console.error("Error calling contract method:", error);
      alert(`调用失败: ${error.message || "未知错误"}`);
    }
  };

  // NFT Functions
  const loadNFTs = async () => {
    if (!nftContractAddress) {
      alert("请输入 NFT 合约地址");
      return;
    }

    setLoadingNfts(true);
    try {
      // Simplified NFT loading - in production, use OpenSea API or similar
      const mockNFTs: NFT[] = [
        {
          tokenId: "1",
          name: "Demo NFT #1",
          description: "This is a demo NFT for the portfolio",
          image: "https://via.placeholder.com/400x400?text=NFT+1",
          attributes: [
            { trait_type: "Color", value: "Blue" },
            { trait_type: "Rarity", value: "Common" },
          ],
        },
        {
          tokenId: "2",
          name: "Demo NFT #2",
          description: "Another demo NFT",
          image: "https://via.placeholder.com/400x400?text=NFT+2",
          attributes: [
            { trait_type: "Color", value: "Red" },
            { trait_type: "Rarity", value: "Rare" },
          ],
        },
        {
          tokenId: "3",
          name: "Demo NFT #3",
          description: "Yet another demo NFT",
          image: "https://via.placeholder.com/400x400?text=NFT+3",
          attributes: [
            { trait_type: "Color", value: "Green" },
            { trait_type: "Rarity", value: "Epic" },
          ],
        },
      ];

      // In production, fetch from contract
      if (provider && nftContractAddress) {
        // const contract = new ethers.Contract(nftContractAddress, ERC721_ABI, provider);
        // const totalSupply = await contract.totalSupply();
        // ... fetch NFTs
      }

      setNfts(mockNFTs);
    } catch (error: any) {
      console.error("Error loading NFTs:", error);
      alert(`加载 NFT 失败: ${error.message || "未知错误"}`);
    } finally {
      setLoadingNfts(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container is-fluid mt-6">
      <div className="box liquid-glass-card">
        <h1 className="title is-2 mb-6 liquid-glass-text">Web3 Integration Demo</h1>
        <p className="subtitle is-5 mb-6 liquid-glass-text">
          Ethereum blockchain integration with MetaMask wallet, smart contracts, and NFT support
        </p>

        {/* Tabs */}
        <div className="tabs is-boxed">
          <ul>
            <li className={activeTab === "wallet" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("wallet")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("wallet");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Wallet tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">👛</span>
                </span>
                <span>Wallet</span>
              </a>
            </li>
            <li className={activeTab === "contract" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("contract")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("contract");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Smart contract tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">📜</span>
                </span>
                <span>Smart Contract</span>
              </a>
            </li>
            <li className={activeTab === "nft" ? "is-active" : ""}>
              <a
                onClick={() => setActiveTab("nft")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("nft");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="NFT tab"
              >
                <span className="icon is-small">
                  <span aria-hidden="true">🖼️</span>
                </span>
                <span>NFT</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">MetaMask Wallet</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Connect to MetaMask wallet to interact with the Ethereum blockchain
              </p>

              <div className="box liquid-glass-card mb-4">
                {!isConnected ? (
                  <div>
                    <p className="mb-4 liquid-glass-text">点击下方按钮连接 MetaMask 钱包</p>
                    <button className="button is-primary is-large" onClick={connectWallet} aria-label="Connect MetaMask wallet">
                      连接 MetaMask
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="field is-grouped mb-4">
                      <div className="control">
                        <button className="button is-danger" onClick={disconnectWallet} aria-label="Disconnect wallet">
                          断开连接
                        </button>
                      </div>
                    </div>

                    <div className="box liquid-glass-card">
                      <h3 className="title is-5 mb-3 liquid-glass-text">钱包信息</h3>
                      <div className="content">
                        <p>
                          <strong>地址:</strong> <code>{account}</code>
                        </p>
                        <p>
                          <strong>余额:</strong> {parseFloat(balance).toFixed(4)} ETH
                        </p>
                        {network && (
                          <p>
                            <strong>网络:</strong> {network.name} (Chain ID: {network.chainId})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="box liquid-glass-card mt-4">
                      <h3 className="title is-5 mb-3 liquid-glass-text">发送交易</h3>
                      <button className="button is-primary" onClick={sendTransaction} aria-label="Send transaction">
                        发送交易
                      </button>
                      {transactionHash && (
                        <div className="notification is-info mt-4">
                          <p>
                            <strong>交易哈希:</strong> <code>{transactionHash}</code>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">Web3 钱包功能</h3>
                <div className="content">
                  <ul>
                    <li>🔐 安全连接 - MetaMask 加密钱包集成</li>
                    <li>💰 余额查询 - 实时 ETH 余额显示</li>
                    <li>📤 交易发送 - 安全的交易签名和发送</li>
                    <li>🌐 多网络支持 - 支持主网和测试网</li>
                    <li>🔒 交易确认 - 所有交易需要用户确认</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Smart Contract Tab */}
          {activeTab === "contract" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">Smart Contract Interaction</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Interact with Ethereum smart contracts - read and write operations
              </p>

              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-3 liquid-glass-text">加载合约</h3>
                <div className="field">
                  <label className="label" htmlFor="contract-address">
                    合约地址
                  </label>
                  <div className="control">
                    <input
                      id="contract-address"
                      className="input"
                      type="text"
                      placeholder="0x..."
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      aria-label="Contract address"
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="contract-abi">
                    ABI (JSON)
                  </label>
                  <div className="control">
                    <textarea
                      id="contract-abi"
                      className="textarea"
                      placeholder='[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"type":"function"}]'
                      value={contractABI}
                      onChange={(e) => setContractABI(e.target.value)}
                      rows={6}
                      aria-label="Contract ABI"
                    />
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button className="button is-primary" onClick={loadContract} aria-label="Load contract">
                      加载合约
                    </button>
                  </div>
                </div>
              </div>

              {contractMethods.length > 0 && (
                <div className="box liquid-glass-card mb-4">
                  <h3 className="title is-5 mb-3 liquid-glass-text">调用合约方法</h3>
                  <div className="field">
                    <label className="label" htmlFor="contract-method">
                      选择方法
                    </label>
                    <div className="control">
                      <div className="select is-fullwidth">
                        <select
                          id="contract-method"
                          value={selectedMethod}
                          onChange={(e) => setSelectedMethod(e.target.value)}
                          aria-label="Contract method"
                        >
                          {contractMethods.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">参数 (每行一个)</label>
                    <div className="control">
                      <textarea
                        className="textarea"
                        placeholder="参数1&#10;参数2"
                        value={methodParams.join("\n")}
                        onChange={(e) => setMethodParams(e.target.value.split("\n"))}
                        rows={4}
                        aria-label="Method parameters"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <div className="control">
                      <button className="button is-primary" onClick={callContractMethod} disabled={!isConnected} aria-label="Call contract method">
                        调用方法
                      </button>
                    </div>
                  </div>
                  {gasEstimate !== "0" && (
                    <div className="notification is-info mt-4">
                      <p>
                        <strong>Gas 估算:</strong> {gasEstimate}
                      </p>
                    </div>
                  )}
                  {contractResult && (
                    <div className="notification is-success mt-4">
                      <p>
                        <strong>结果:</strong> {contractResult}
                      </p>
                    </div>
                  )}
                  {transactionHash && (
                    <div className="notification is-info mt-4">
                      <p>
                        <strong>交易哈希:</strong> <code>{transactionHash}</code>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">智能合约功能</h3>
                <div className="content">
                  <ul>
                    <li>📖 读取操作 - 查询合约状态（无需 Gas）</li>
                    <li>✍️ 写入操作 - 修改合约状态（需要 Gas）</li>
                    <li>⛽ Gas 估算 - 自动估算交易费用</li>
                    <li>🔒 交易确认 - 所有写入操作需要用户确认</li>
                    <li>📊 交易追踪 - 实时显示交易状态</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* NFT Tab */}
          {activeTab === "nft" && (
            <div>
              <h2 className="title is-4 mb-4 liquid-glass-text">NFT Gallery</h2>
              <p className="subtitle is-6 mb-4 liquid-glass-text">
                Browse and view NFT collections with metadata and attributes
              </p>

              <div className="box liquid-glass-card mb-4">
                <h3 className="title is-5 mb-3 liquid-glass-text">加载 NFT</h3>
                <div className="field has-addons">
                  <div className="control is-expanded">
                    <input
                      className="input"
                      type="text"
                      placeholder="NFT 合约地址 (0x...)"
                      value={nftContractAddress}
                      onChange={(e) => setNftContractAddress(e.target.value)}
                      aria-label="NFT contract address"
                    />
                  </div>
                  <div className="control">
                    <button className="button is-primary" onClick={loadNFTs} disabled={loadingNfts} aria-label="Load NFTs">
                      {loadingNfts ? "加载中..." : "加载 NFT"}
                    </button>
                  </div>
                </div>
              </div>

              {nfts.length > 0 && (
                <div className="box liquid-glass-card">
                  <h3 className="title is-5 mb-4 liquid-glass-text">NFT 集合 ({nfts.length})</h3>
                  <div className={`columns is-multiline ${isMobile ? "is-mobile" : ""}`}>
                    {nfts.map((nft) => (
                      <div key={nft.tokenId} className={`column ${isMobile ? "is-half" : "is-one-third"}`}>
                        <motion.div
                          className="box liquid-glass-card"
                          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                          onClick={() => setSelectedNft(nft)}
                          style={{ cursor: "pointer" }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedNft(nft);
                            }
                          }}
                          aria-label={`View NFT ${nft.name}`}
                        >
                          <figure className="image is-square mb-3">
                            <img src={nft.image} alt={nft.name} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                          </figure>
                          <h4 className="title is-6 liquid-glass-text">{nft.name}</h4>
                          <p className="liquid-glass-text is-size-7">{nft.description}</p>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNft && (
                <div className="modal is-active">
                  <div className="modal-background" onClick={() => setSelectedNft(null)}></div>
                  <div className="modal-content box liquid-glass-card">
                    <button
                      className="delete is-large"
                      onClick={() => setSelectedNft(null)}
                      aria-label="Close NFT details"
                    ></button>
                    <h3 className="title is-4 liquid-glass-text">{selectedNft.name}</h3>
                    <figure className="image mb-4">
                      <img src={selectedNft.image} alt={selectedNft.name} />
                    </figure>
                    <p className="liquid-glass-text mb-4">{selectedNft.description}</p>
                    {selectedNft.attributes && selectedNft.attributes.length > 0 && (
                      <div>
                        <h4 className="title is-5 liquid-glass-text">属性</h4>
                        <div className="tags">
                          {selectedNft.attributes.map((attr, idx) => (
                            <span key={idx} className="tag is-info">
                              {attr.trait_type}: {attr.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="box liquid-glass-card">
                <h3 className="title is-5 mb-3 liquid-glass-text">NFT 功能</h3>
                <div className="content">
                  <ul>
                    <li>🖼️ NFT 展示 - 支持图片和元数据</li>
                    <li>📋 元数据解析 - 自动解析 NFT 属性</li>
                    <li>🎨 图片优化 - 响应式图片加载</li>
                    <li>🔍 详细信息 - 查看 NFT 完整信息</li>
                    <li>📱 移动端优化 - 适配移动设备</li>
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

