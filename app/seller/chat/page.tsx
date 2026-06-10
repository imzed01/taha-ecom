"use client";

import ChatSupport from "@/components/ChatSupport";
import DashboardLayout from "@/components/DashboardLayout";

export default function SellerChatPage() {
  const handleMessagesSeen = async () => {
    try {
      // Fetch the updated unseen count from the server
      const response = await fetch("/api/seller/total-unseen-messages");
      if (response.ok) {
        const data = await response.json();
        const updatedCount = data.totalUnseenCount || 0;

        // Dispatch a custom event to update the sidebar badge with the actual count
        const event = new CustomEvent("updateSupportBadge", {
          detail: { count: updatedCount },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Failed to fetch updated unseen count:", error);
      // Fallback: set count to 0 if fetch fails
      const event = new CustomEvent("updateSupportBadge", {
        detail: { count: 0 },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <DashboardLayout requiredRole="seller" title="Support Chat" noPadding>
      <div className="w-full h-full">
        <ChatSupport onMessagesSeen={handleMessagesSeen} />
      </div>
    </DashboardLayout>
  );
}
