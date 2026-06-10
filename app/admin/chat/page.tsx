"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { Search, Plus, X, Users, MessageSquare } from "lucide-react";
import ChatSupport from "@/components/ChatSupport";
import DashboardLayout from "@/components/DashboardLayout";

interface Seller {
  _id: string;
  email: string;
  storeName?: string;
  name?: string;
  verificationStatus?: string;
  createdAt?: string;
}

interface UnseenCount {
  sellerId: string;
  count: number;
}

interface Message {
  senderId: string;
  senderRole: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

export default function AdminChatPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [unseenCounts, setUnseenCounts] = useState<UnseenCount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Seller[]>([]);
  const [showSellerList, setShowSellerList] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminId = (session?.user as any)?.id || "admin";

  // Fetch unseen message counts
  const fetchUnseenCounts = useCallback(async () => {
    if (!adminId) return;

    try {
      const response = await fetch(
        `/api/admin/unseen-messages?adminId=${adminId}`
      );
      if (response.ok) {
        const data = await response.json();
        setUnseenCounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch unseen counts:", error);
    }
  }, [adminId]);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    let s: Socket | null = null;

    const initializeSocket = async () => {
      try {
        await fetch("/api/support-socket");
        s = io({
          path: "/api/support-socket",
          transports: ["websocket", "polling"],
          timeout: 20000,
          forceNew: true,
        });

        s.on("connect", () => {
          console.log("Admin chat connected to socket server");
          s!.emit("join", { userId: adminId, role: "admin" });
        });

        s.on("support-message", (msg: Message) => {
          console.log("Admin chat received message:", msg);

          // If this is a new seller message (not from the currently viewed seller)
          if (
            msg.senderRole === "seller" &&
            msg.senderId !== selectedSeller?._id
          ) {
            console.log(
              "New message from different seller, updating unseen count"
            );

            // Update unseen counts immediately
            setUnseenCounts((prev) => {
              const existingCount = prev.find(
                (count) => count.sellerId === msg.senderId
              );

              if (existingCount) {
                // Increment existing count
                return prev.map((count) =>
                  count.sellerId === msg.senderId
                    ? { ...count, count: count.count + 1 }
                    : count
                );
              } else {
                // Add new count
                return [...prev, { sellerId: msg.senderId, count: 1 }];
              }
            });
          }
        });

        s.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
        });

        s.on("disconnect", () => {
          console.log("Disconnected from socket server");
        });
      } catch (error) {
        console.error("Failed to initialize socket:", error);
      }
    };

    initializeSocket();

    return () => {
      if (s) {
        s.disconnect();
      }
    };
  }, [adminId, selectedSeller?._id]);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/support-messages/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch unseen message counts on mount and periodically
  useEffect(() => {
    fetchUnseenCounts();

    // Poll for unseen counts every 30 seconds
    const interval = setInterval(fetchUnseenCounts, 30000);

    return () => clearInterval(interval);
  }, [fetchUnseenCounts]);

  // Search sellers function
  const searchSellers = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/admin/all-sellers?search=${encodeURIComponent(term)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Failed to search sellers:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchSellers(searchTerm);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchSellers]);

  // Mark messages as seen when selecting a seller
  const handleSellerSelect = async (seller: Seller) => {
    setSelectedSeller(seller);

    // Close seller list on mobile after selection
    setShowSellerList(false);

    // Immediately remove badge from UI
    setUnseenCounts((prev) =>
      prev.filter((count) => count.sellerId !== seller._id)
    );

    // Mark messages as seen for this seller
    try {
      await fetch("/api/admin/unseen-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId: seller._id,
          adminId: adminId,
        }),
      });
      console.log(`Messages marked as seen for seller: ${seller._id}`);

      // Update sidebar badge by fetching total unseen count
      try {
        const response = await fetch(
          `/api/admin/total-unseen-messages?adminId=${adminId}`
        );
        if (response.ok) {
          const data = await response.json();
          const updatedCount = data.totalUnseenCount || 0;

          // Dispatch custom event to update sidebar badge
          const event = new CustomEvent("updateSupportBadge", {
            detail: { count: updatedCount },
          });
          window.dispatchEvent(event);
        }
      } catch (error) {
        console.error("Failed to fetch updated total unseen count:", error);
      }
    } catch (error) {
      console.error("Failed to mark messages as seen:", error);
      // Revert local state if server request failed
      fetchUnseenCounts();
    }
  };

  // Function to handle new seller being messaged
  const handleNewSellerMessage = useCallback(
    async (sellerId: string) => {
      // Check if seller is already in sessions
      const sellerExists = sessions.some((s) => s._id === sellerId);

      if (!sellerExists) {
        // Fetch seller info and add to sessions
        try {
          const response = await fetch(
            `/api/admin/all-sellers?search=${sellerId}&limit=1`
          );
          if (response.ok) {
            const sellers = await response.json();
            if (sellers.length > 0) {
              const newSeller = sellers[0];
              setSessions((prev) => [newSeller, ...prev]);
              console.log(`Added new seller to sessions: ${newSeller.email}`);
            }
          }
        } catch (error) {
          console.error("Failed to fetch new seller info:", error);
        }
      }
    },
    [sessions]
  );

  // Calculate total unseen messages
  const totalUnseenMessages = unseenCounts.reduce(
    (total, count) => total + count.count,
    0
  );

  return (
    <DashboardLayout requiredRole="admin" title="Support Chat" noPadding>
      <div className="flex h-full bg-background rounded-lg shadow-lg overflow-hidden relative">
        {/* Mobile Header for Seller List Toggle */}
        <div className="lg:hidden fixed top-20 left-4 z-50">
          <button
            onClick={() => {
              console.log(
                "Mobile toggle clicked, current state:",
                showSellerList
              );
              setShowSellerList(!showSellerList);
            }}
            className="p-3 bg-primary text-white rounded-lg shadow-lg border border-primary hover:bg-primary/90 transition-colors touch-manipulation"
            aria-label="Toggle seller list"
          >
            <Users className="w-6 h-6" />
            {totalUnseenMessages > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                {totalUnseenMessages > 99 ? "99+" : totalUnseenMessages}
              </span>
            )}
          </button>
        </div>

        {/* Seller List - Mobile Overlay */}
        <div
          className={`lg:hidden fixed inset-0 z-30 ${
            showSellerList ? "block" : "hidden"
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowSellerList(false)}
          />

          {/* Seller List Panel */}
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-sidebar border-r border-border shadow-xl">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Seller Chats
                </h2>
                <button
                  onClick={() => setShowSellerList(false)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Section */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search sellers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pr-8 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {searchLoading && (
                    <div className="absolute right-2 top-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Search Results
                    </h3>
                    {searchResults.map((seller) => {
                      const isInSessions = sessions.some(
                        (s) => s._id === seller._id
                      );
                      return (
                        <div
                          key={seller._id}
                          className={`p-2 rounded-lg cursor-pointer mb-1 transition-colors text-sm ${
                            selectedSeller?._id === seller._id
                              ? "bg-primary text-white"
                              : "hover:bg-accent"
                          }`}
                          onClick={() => handleSellerSelect(seller)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {seller.storeName ||
                                  seller.name ||
                                  seller.email}
                              </div>
                              <div className="text-xs opacity-75 truncate">
                                {seller.email}
                              </div>
                            </div>
                            {!isInSessions && (
                              <Plus className="w-3 h-3 opacity-60" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Seller List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : sessions.length === 0 ? (
                <div className="text-muted-foreground">
                  No seller chats yet.
                </div>
              ) : (
                <ul>
                  {sessions.map((seller) => {
                    const unseenCount = unseenCounts.find(
                      (count) => count.sellerId === seller._id
                    );
                    return (
                      <li
                        key={seller._id}
                        className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors border border-transparent ${
                          selectedSeller?._id === seller._id
                            ? "bg-primary text-white border-primary"
                            : "hover:bg-accent hover:border-accent"
                        }`}
                        onClick={() => handleSellerSelect(seller)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">
                              {seller.storeName || seller.email}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {seller.email}
                            </div>
                          </div>
                          {unseenCount && unseenCount.count > 0 && (
                            <div className="ml-2 flex-shrink-0">
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                {unseenCount.count > 99
                                  ? "99+"
                                  : unseenCount.count}
                              </span>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Seller List - Desktop */}
        <div className="hidden lg:block w-72 border-r bg-sidebar p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Seller Chats
            </h2>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={showSearch ? "Hide search" : "Search sellers"}
            >
              {showSearch ? (
                <X className="w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Search Section */}
          {showSearch && (
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search sellers by name, email, or store..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pr-8 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searchLoading && (
                  <div className="absolute right-2 top-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Search Results
                  </h3>
                  {searchResults.map((seller) => {
                    const isInSessions = sessions.some(
                      (s) => s._id === seller._id
                    );
                    return (
                      <div
                        key={seller._id}
                        className={`p-2 rounded-lg cursor-pointer mb-1 transition-colors text-sm ${
                          selectedSeller?._id === seller._id
                            ? "bg-primary text-white"
                            : "hover:bg-accent"
                        }`}
                        onClick={() => handleSellerSelect(seller)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {seller.storeName || seller.name || seller.email}
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {seller.email}
                            </div>
                          </div>
                          {!isInSessions && (
                            <Plus className="w-3 h-3 opacity-60" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-muted-foreground">No seller chats yet.</div>
          ) : (
            <ul>
              {sessions.map((seller) => {
                const unseenCount = unseenCounts.find(
                  (count) => count.sellerId === seller._id
                );
                return (
                  <li
                    key={seller._id}
                    className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors border border-transparent ${
                      selectedSeller?._id === seller._id
                        ? "bg-primary text-white border-primary"
                        : "hover:bg-accent hover:border-accent"
                    }`}
                    onClick={() => handleSellerSelect(seller)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {seller.storeName || seller.email}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {seller.email}
                        </div>
                      </div>
                      {unseenCount && unseenCount.count > 0 && (
                        <div className="ml-2 flex-shrink-0">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {unseenCount.count > 99 ? "99+" : unseenCount.count}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-background relative">
          {/* Mobile Header for Chat */}
          {selectedSeller && (
            <div className="lg:hidden p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {selectedSeller.storeName || selectedSeller.email}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {selectedSeller.email}
                  </p>
                </div>
                <button
                  onClick={() => setShowSellerList(true)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile Toggle Button - Alternative Position */}
          {!selectedSeller && (
            <div className="lg:hidden absolute top-4 right-4 z-40">
              <button
                onClick={() => {
                  console.log(
                    "Alternative mobile toggle clicked, current state:",
                    showSellerList
                  );
                  setShowSellerList(!showSellerList);
                }}
                className="p-3 bg-primary text-white rounded-lg shadow-lg border border-primary hover:bg-primary/90 transition-colors touch-manipulation"
                aria-label="Toggle seller list"
              >
                <Users className="w-6 h-6" />
                {totalUnseenMessages > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                    {totalUnseenMessages > 99 ? "99+" : totalUnseenMessages}
                  </span>
                )}
              </button>
            </div>
          )}

          {selectedSeller ? (
            <div className="w-full h-full">
              <ChatSupport
                key={`admin-chat-${selectedSeller._id}`} // Force re-mount when seller changes
                receiverId={selectedSeller._id}
                onMessageSent={() => {
                  // When admin sends a message, ensure seller is in sessions
                  handleNewSellerMessage(selectedSeller._id);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-lg text-center p-4">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="mb-2">
                  Select a seller to view and respond to chat.
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Use the menu button to browse available sellers.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
