"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import Image from "next/image";
import {
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Send,
  ArrowDown,
} from "lucide-react";
import { validateImageFile } from "@/lib/image-utils";

interface Message {
  _id: string;
  senderId: string;
  senderRole: string;
  receiverId: string;
  message: string;
  image?: string; // Base64 encoded image
  createdAt: string;
}

interface ChatSupportProps {
  receiverId?: string; // For admin to specify which seller to chat with
  onMessageSent?: () => void; // Callback when message is sent (for admin)
  onMessagesSeen?: () => void; // Callback when messages are marked as seen (for seller)
}

interface ExtendedUser {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function ChatSupport({
  receiverId,
  onMessageSent,
  onMessagesSeen,
}: ChatSupportProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
  }>({
    isOpen: false,
    imageUrl: null,
  });
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasMarkedAsSeen = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const shouldAutoScroll = useRef(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTop = useRef(0);
  const isScrollingUp = useRef(false);
  const userScrolledUpRecently = useRef(false);
  const userManuallyScrolled = useRef(false);
  const autoScrollDisabled = useRef(false);
  const hasUserEverScrolledUp = useRef(false);

  const userId = (session?.user as ExtendedUser)?.id;
  const role = (session?.user as ExtendedUser)?.role;

  const fetchMessages = useCallback(async () => {
    if (!userId || !role) return;

    try {
      const sellerId = role === "seller" ? userId : receiverId;
      if (!sellerId) return;

      const response = await fetch(`/api/chat?sellerId=${sellerId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        console.log(`Loaded ${data.length} messages for seller ${sellerId}`);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, role, receiverId]);

  // Mark messages as seen when seller views the chat
  const markMessagesAsSeen = useCallback(async () => {
    if (role !== "seller" || hasMarkedAsSeen.current) return;

    try {
      const response = await fetch("/api/seller/mark-messages-seen", {
        method: "POST",
      });

      if (response.ok) {
        hasMarkedAsSeen.current = true;
        console.log("Messages marked as seen by seller");

        // Call the callback to update badge
        if (onMessagesSeen) {
          onMessagesSeen();
        }
      }
    } catch (error) {
      console.error("Failed to mark messages as seen:", error);
    }
  }, [role, onMessagesSeen]);

  useEffect(() => {
    if (userId && role) {
      fetchMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [userId, role, receiverId, fetchMessages]);

  // Initial scroll to bottom when messages are first loaded - ONLY ON FIRST LOAD
  useEffect(() => {
    if (messages.length > 0 && !isLoading && !hasInitiallyScrolled) {
      console.log("✅ Initial auto-scroll - scrolling to bottom on first load");
      scrollToBottom();
      setHasInitiallyScrolled(true);
    }
  }, [isLoading, messages.length, hasInitiallyScrolled]);

  // COMPLETELY DISABLE AUTO-SCROLL - Only manual scrolling allowed
  useEffect(() => {
    // NO AUTO-SCROLL AT ALL - Let user control scrolling manually
    // This effect runs when new messages arrive, but we don't auto-scroll
    console.log(
      "🚫 New messages arrived - NO AUTO-SCROLL (manual scrolling only)"
    );
  }, [messages]);

  // Mark messages as seen when component mounts (for sellers)
  useEffect(() => {
    if (role === "seller" && userId) {
      markMessagesAsSeen();
    }
  }, [role, userId, markMessagesAsSeen]);

  // Mark messages as seen when new messages arrive (for sellers)
  useEffect(() => {
    if (role === "seller" && messages.length > 0) {
      // Check if there are any admin messages that haven't been seen
      const hasUnseenAdminMessages = messages.some(
        (msg) => msg.senderRole === "admin" && msg.senderId !== userId
      );

      if (hasUnseenAdminMessages) {
        markMessagesAsSeen();
      }
    }
  }, [messages, role, userId, markMessagesAsSeen]);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    if (!userId || !role) return;

    let socket: Socket | null = null;

    const initializeSocket = async () => {
      try {
        // Don't await the fetch - just initialize socket directly
        socket = io({
          path: "/api/support-socket",
          transports: ["websocket", "polling"],
          timeout: 5000,
          forceNew: true,
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 3,
          autoConnect: true,
        });

        socket.on("connect", () => {
          console.log("ChatSupport connected to socket server");
          socket!.emit("join", { userId, role });
        });

        socket.on("support-message", (msg: Message) => {
          console.log("ChatSupport received message:", msg);

          // Update messages list with new message
          setMessages((prev) => {
            // Check if message already exists
            const exists = prev.some((m) => m._id === msg._id);
            if (!exists) {
              return [...prev, msg];
            }
            return prev;
          });

          // Mark messages as seen if seller receives admin message
          if (role === "seller" && msg.senderRole === "admin") {
            markMessagesAsSeen();
          }

          // Dispatch custom event to update sidebar badge
          // For admin: if message is from seller, show badge
          // For seller: if message is from admin, show badge
          if (
            (role === "admin" && msg.senderRole === "seller") ||
            (role === "seller" && msg.senderRole === "admin")
          ) {
            console.log(
              "📢 Dispatching updateSupportBadge event for new message"
            );

            // Fetch the actual unseen count and dispatch it
            const fetchAndDispatchBadgeUpdate = async () => {
              try {
                const endpoint =
                  role === "admin"
                    ? `/api/admin/total-unseen-messages?adminId=${userId}`
                    : "/api/seller/total-unseen-messages";

                const response = await fetch(endpoint);
                if (response.ok) {
                  const data = await response.json();
                  const updatedCount = data.totalUnseenCount || 0;

                  window.dispatchEvent(
                    new CustomEvent("updateSupportBadge", {
                      detail: { count: updatedCount },
                    })
                  );
                }
              } catch (error) {
                console.error("Failed to fetch updated badge count:", error);
                // Fallback: show badge with count 1
                window.dispatchEvent(
                  new CustomEvent("updateSupportBadge", {
                    detail: { count: 1 },
                  })
                );
              }
            };

            fetchAndDispatchBadgeUpdate();
          }
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
        });

        socket.on("disconnect", (reason) => {
          console.log("Disconnected from socket server:", reason);
        });

        socket.on("reconnect", (attemptNumber) => {
          console.log(
            "Reconnected to socket server after",
            attemptNumber,
            "attempts"
          );
        });

        socket.on("reconnect_error", (error) => {
          console.error("Socket reconnection error:", error);
        });

        socketRef.current = socket;
      } catch (error) {
        console.error("Failed to initialize socket:", error);
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [userId, role, markMessagesAsSeen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleManualScrollToBottom = () => {
    console.log("👆 User manually clicked scroll to bottom");
    scrollToBottom();
    setShowScrollButton(false);
  };

  // Check if user is at the bottom of the chat
  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold
    );
  };

  // Handle scroll events to detect user interaction
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const currentScrollTop = container.scrollTop;
    const scrollDifference = currentScrollTop - lastScrollTop.current;

    // Detect scroll direction with a threshold to avoid false positives
    if (scrollDifference < -5) {
      // Reduced threshold for more sensitive detection
      // Scrolling up (negative difference)
      isScrollingUp.current = true;
      isUserScrolling.current = true;
      shouldAutoScroll.current = false;
      userScrolledUpRecently.current = true;
      userManuallyScrolled.current = true;
      autoScrollDisabled.current = true;
      hasUserEverScrolledUp.current = true;
      console.log(
        "🚫 User scrolling up - PERMANENTLY disabling auto-scroll FOREVER"
      );
    } else if (scrollDifference > 10) {
      // Scrolling down (positive difference)
      isScrollingUp.current = false;
    }

    lastScrollTop.current = currentScrollTop;

    const atBottom = isAtBottom();
    setShowScrollButton(!atBottom); // Show scroll button when not at bottom

    if (atBottom) {
      shouldAutoScroll.current = true;
      isScrollingUp.current = false;
      userScrolledUpRecently.current = false;
      // Don't reset userManuallyScrolled here - only reset when user sends message
      console.log("📍 User at bottom - scroll button hidden");
    } else {
      console.log("📍 User not at bottom - scroll button shown");
    }

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set new timeout to reset scrolling state
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
      console.log("Scroll timeout - resetting user scrolling state");
    }, 500);

    // Reset the "recently scrolled up" flag after a longer delay
    setTimeout(() => {
      if (atBottom) {
        userScrolledUpRecently.current = false;
        console.log("Reset recently scrolled up flag");
      }
    }, 2000);
  }, []);

  // Handle manual scroll start
  const handleScrollStart = useCallback(() => {
    isUserScrolling.current = true;
    shouldAutoScroll.current = false;
    userScrolledUpRecently.current = true;
    userManuallyScrolled.current = true;
    autoScrollDisabled.current = true;
    hasUserEverScrolledUp.current = true;
    console.log(
      "🚫 Manual scroll start - PERMANENTLY disabling auto-scroll FOREVER"
    );
  }, []);

  // Debounced scroll handler to prevent rapid state changes
  const debouncedScrollHandler = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const currentScrollTop = container.scrollTop;

    // Only update if scroll position changed significantly
    if (Math.abs(currentScrollTop - lastScrollTop.current) > 5) {
      handleScroll();
    }
  }, [handleScroll]);

  // Add scroll event listeners
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const throttledScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(debouncedScrollHandler, 16); // ~60fps
    };

    container.addEventListener("scroll", throttledScrollHandler);
    container.addEventListener("wheel", handleScrollStart, { passive: true });
    container.addEventListener("touchstart", handleScrollStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleScrollStart, {
      passive: true,
    });

    return () => {
      clearTimeout(scrollTimeout);
      container.removeEventListener("scroll", throttledScrollHandler);
      container.removeEventListener("wheel", handleScrollStart);
      container.removeEventListener("touchstart", handleScrollStart);
      container.removeEventListener("touchmove", handleScrollStart);
    };
  }, [debouncedScrollHandler, handleScrollStart]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const openImageModal = (imageUrl: string) => {
    setImageModal({ isOpen: true, imageUrl });
    setImageZoom(1);
    setImageRotation(0);
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: null });
    setImageZoom(1);
    setImageRotation(0);
  };

  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setImageZoom(1);
    setImageRotation(0);
  };

  const handleRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  // Keyboard shortcuts for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imageModal.isOpen) return;

      switch (e.key) {
        case "Escape":
          closeImageModal();
          break;
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
          e.preventDefault();
          handleZoomOut();
          break;
        case "0":
          e.preventDefault();
          handleResetZoom();
          break;
        case "r":
          e.preventDefault();
          handleRotate();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [imageModal.isOpen]);

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) {
      console.log("No message or image to send");
      return;
    }
    if (!userId || !role) {
      console.error("User not authenticated");
      return;
    }

    console.log("Sending message:", {
      userId,
      role,
      receiverId: role === "seller" ? "admin" : receiverId || "admin",
      hasMessage: !!input.trim(),
      hasImage: !!selectedImage,
    });

    setIsUploading(true);

    try {
      let imageBase64: string | undefined;

      if (selectedImage) {
        // Convert image to base64
        const reader = new FileReader();
        const imagePromise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const base64 = e.target?.result as string;
            resolve(base64);
          };
          reader.onerror = () => reject(new Error("Failed to read image file"));
        });
        reader.readAsDataURL(selectedImage);
        imageBase64 = await imagePromise;
      }

      const sellerId = role === "seller" ? userId : receiverId;
      if (!sellerId) return;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: userId,
          senderRole: role,
          receiverId: role === "seller" ? "admin" : receiverId || "admin",
          message: input.trim(),
          image: imageBase64,
        }),
      });

      if (response.ok) {
        setInput("");
        removeSelectedImage();
        // NO AUTO-SCROLL - Let user manually scroll to see their message
        console.log(
          "🚫 Auto-scroll DISABLED even when sending message - Manual scrolling only"
        );
        fetchMessages();

        // Emit message through socket for real-time updates
        if (socketRef.current) {
          const messageData = {
            senderId: userId,
            senderRole: role,
            receiverId: role === "seller" ? "admin" : receiverId || "admin",
            message: input.trim(),
            image: imageBase64,
            createdAt: new Date().toISOString(),
          };

          socketRef.current.emit("support-message", messageData);
        }

        // Update badge count
        if (onMessageSent) {
          onMessageSent();
        }

        // Dispatch custom event for badge update
        window.dispatchEvent(
          new CustomEvent("updateSupportBadge", {
            detail: { count: 0 },
          })
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to send message:", response.status, errorData);
        alert(`Failed to send message: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-border bg-sidebar flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Support Chat</h2>
        <p className="text-sm text-muted-foreground">
          Get help from our support team
        </p>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 relative"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${
                message.senderId === userId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs sm:max-w-md lg:max-w-lg ${
                  message.senderId === userId
                    ? "bg-primary text-white"
                    : "bg-sidebar-hover text-foreground"
                } rounded-lg p-3`}
              >
                {message.message && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                )}
                {message.image && (
                  <div className="mt-2">
                    <Image
                      src={message.image}
                      alt="Message attachment"
                      width={400}
                      height={300}
                      className="max-w-full h-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openImageModal(message.image!)}
                    />
                  </div>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Manual Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute bottom-20 right-4 z-10">
          <button
            onClick={handleManualScrollToBottom}
            className="bg-primary text-white rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="relative inline-block">
            <Image
              src={imagePreview}
              alt="Preview"
              width={128}
              height={128}
              className="max-w-32 h-auto rounded"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground min-h-[44px] max-h-32"
              rows={1}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-sidebar-hover hover:bg-accent rounded-lg transition-colors"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && !selectedImage) || isUploading}
              className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !input.trim() && !selectedImage
                  ? "Enter a message or select an image"
                  : "Send message"
              }
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageModal.isOpen && imageModal.imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-full max-h-full">
            <Image
              src={imageModal.imageUrl}
              alt="Full size"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                transition: "transform 0.2s ease",
              }}
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={handleZoomIn}
                className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={closeImageModal}
                className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
