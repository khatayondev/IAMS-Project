import { useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { toast } from "sonner";

interface LogbookCommentsSectionProps {
  logbookId: string;
  readOnly?: boolean;
  onCommentAdded?: () => void;
}

export function LogbookCommentsSection({
  logbookId,
  readOnly = false,
  onCommentAdded,
}: LogbookCommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.addLogbookComment(logbookId, newComment);
      if (res.success) {
        toast.success("Comment added");
        setNewComment("");
        onCommentAdded?.();
      } else {
        toast.error(res.message ?? "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("An error occurred while adding the comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-sm">Add Comment</h4>
      </div>

      {/* Add Comment Form */}
      {!readOnly && (
        <div className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your feedback or comment..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
            disabled={submitting}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddComment}
              disabled={submitting || !newComment.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-all"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Send className="w-3.5 h-3.5" />
              Post Comment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
