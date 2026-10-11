"use client";

import React, { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type ReportContentType = 'project' | 'comment' | 'user' | 'message' | 'conversation' | 'group';

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ReportContentType;
  projectId?: string;
  commentId?: string;
  reportedUserId?: string;
  chatId?: string;
  messageId?: string;
  targetLabel: string;
};

const reasons = [
  { value: 'spam', label: 'Spam or misleading content' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'copyright', label: 'Copyright concern' },
  { value: 'privacy', label: 'Privacy or personal information' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'other', label: 'Other policy concern' },
];

const targetNames: Record<ReportContentType, string> = {
  project: 'project',
  comment: 'comment',
  user: 'user',
  message: 'message',
  conversation: 'conversation',
  group: 'group',
};

const ReportDialog = ({ open, onOpenChange, contentType, projectId, commentId, reportedUserId, chatId, messageId, targetLabel }: ReportDialogProps) => {
  const { currentUser } = useApp();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason('');
      setDetails('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      toast.error('Please sign in to report content.');
      return;
    }
    if (!reason) {
      toast.error('Choose a reason for this report.');
      return;
    }
    if (details.trim().length > 2000) {
      toast.error('Details must be 2,000 characters or fewer.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('submit_report', {
        p_content_type: contentType,
        p_project_id: projectId || null,
        p_comment_id: commentId || null,
        p_reported_user_id: reportedUserId || null,
        p_chat_id: chatId || null,
        p_message_id: messageId || null,
        p_reason: reason,
        p_details: details.trim() || null,
      });
      if (error) throw error;
      toast.success('Report submitted for review.');
      handleOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Unable to submit this report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl border-border bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Flag size={19} className="text-destructive" /> Report {targetNames[contentType]}</DialogTitle>
          <DialogDescription>
            Help the DevSphere team review <span className="font-semibold text-foreground">{targetLabel}</span>. Reports are reviewed by authorized moderators and administrators.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason" className="rounded-xl"><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {reasons.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-details">Additional details <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Add context that will help the moderation team review this report."
              className="min-h-28 resize-none rounded-xl"
              maxLength={2000}
            />
            <p className="text-right text-xs text-muted-foreground">{details.length}/2000</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={submitting} className="rounded-xl">
              {submitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Flag size={16} className="mr-2" />}
              Submit report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
