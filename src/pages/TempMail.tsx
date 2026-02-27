import { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Copy, RefreshCw, Trash2, Clock, Paperclip, ArrowLeft, Inbox } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'https://api.driftz.net';

interface DriftzEmailSummary {
  id: string;
  fromAddress: string;
  toAddress: string;
  subject: string | null;
  receivedAt: number; // Unix timestamp in seconds
  expiresAt: number;
  hasAttachments: boolean | null;
  attachmentCount: number | null;
}

interface DriftzEmailFull extends DriftzEmailSummary {
  htmlContent: string | null;
  textContent: string | null;
}

const generateRandomString = (length: number) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const TempMail = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [emails, setEmails] = useState<DriftzEmailSummary[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<DriftzEmailFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [username, setUsername] = useState('');

  // Fetch available domains on mount
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await fetch(`${API_BASE}/domains`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.result) {
            const allDomains = [
              ...(data.result.temp || []),
              ...(data.result.public || []),
            ];
            setDomains(allDomains);
            if (allDomains.length > 0) {
              setSelectedDomain(allDomains[0]);
            }
          }
        }
      } catch {
        // silent
      }
    };
    fetchDomains();
  }, []);

  // Generate temp address using POST /temp/generate
  const generateAddress = async () => {
    setLoading(true);
    setSelectedEmail(null);
    setEmails([]);
    try {
      const res = await fetch(`${API_BASE}/temp/generate`, { method: 'POST' });
      if (!res.ok) {
        toast.error('Failed to generate temp email');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.result?.address) {
        setAddress(data.result.address);
        setExpiresAt(data.result.expiresAt);
        toast.success('Temp email generated!');
      } else {
        toast.error('Failed to generate temp email');
      }
    } catch (err) {
      console.error('API error:', err);
      toast.error('API error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch inbox using GET /temp/{address}
  const fetchInbox = useCallback(async () => {
    if (!address) return;
    setPolling(true);
    try {
      const res = await fetch(`${API_BASE}/temp/${encodeURIComponent(address)}?limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          setEmails(data.result.items || []);
          if (data.result.expiresAt) {
            setExpiresAt(data.result.expiresAt);
          }
        }
      }
    } catch {
      // silent
    } finally {
      setPolling(false);
    }
  }, [address]);

  // View single email using GET /temp/{address}/{emailId}
  const viewEmail = async (emailId: string) => {
    if (!address) return;
    try {
      const res = await fetch(`${API_BASE}/temp/${encodeURIComponent(address)}/${emailId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          setSelectedEmail(data.result);
        }
      }
    } catch {
      toast.error('Failed to load email');
    }
  };

  // Delete email using DELETE /inbox/{emailId}
  const deleteEmail = async (emailId: string) => {
    try {
      const res = await fetch(`${API_BASE}/inbox/${emailId}`, { method: 'DELETE' });
      if (res.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== emailId));
        if (selectedEmail?.id === emailId) setSelectedEmail(null);
        toast.success('Email deleted');
      } else {
        toast.error('Failed to delete email');
      }
    } catch {
      toast.error('Failed to delete email');
    }
  };

  // Auto-poll every 5s
  useEffect(() => {
    if (!address) return;
    fetchInbox();
    const interval = setInterval(fetchInbox, 5000);
    return () => clearInterval(interval);
  }, [address, fetchInbox]);

  // Countdown timer based on expiresAt (unix seconds)
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = expiresAt * 1000 - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        setAddress(null);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}m ${secs}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success('Copied to clipboard!');
  };

  const formatTimestamp = (unixSeconds: number) => {
    return new Date(unixSeconds * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-24 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Temp Mail</h1>
            <p className="text-sm text-muted-foreground">Disposable email — auto-expires in 1 hour</p>
          </div>
        </div>

        {/* Address Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {!address ? (
              <div className="space-y-4">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-center text-muted-foreground text-sm">Generate a temporary email address to receive emails</p>
                {domains.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      placeholder="(auto-generated)"
                      className="flex-1 min-w-0 bg-muted px-3 py-2 rounded-lg text-sm font-mono border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="text-muted-foreground font-mono text-sm">@</span>
                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                      <SelectTrigger className="w-[180px] bg-card border-border">
                        <SelectValue placeholder="Select domain" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        {domains.map((domain) => (
                          <SelectItem key={domain} value={domain}>
                            {domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={generateAddress} disabled={loading} size="lg" className="w-full">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  Generate Temp Email
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="flex-1 min-w-0 bg-muted px-4 py-2.5 rounded-lg text-sm font-mono truncate">
                    {address}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyAddress} title="Copy">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={fetchInbox} disabled={polling} title="Refresh">
                    <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires in: <span className="font-medium text-foreground">{timeLeft}</span></span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setAddress(null); setExpiresAt(null); setUsername(''); setEmails([]); setSelectedEmail(null); }} className="text-xs">
                    <Trash2 className="w-3 h-3 mr-1" /> New Address
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email View or Inbox */}
        {address && (
          selectedEmail ? (
            <Card>
              <CardHeader className="pb-3">
                <Button variant="ghost" size="sm" className="w-fit mb-2" onClick={() => setSelectedEmail(null)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Inbox
                </Button>
                <CardTitle className="text-lg">{selectedEmail.subject || '(No Subject)'}</CardTitle>
                <CardDescription>
                  From: {selectedEmail.fromAddress} • {formatTimestamp(selectedEmail.receivedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEmail.htmlContent ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-lg p-4 overflow-auto max-h-[60vh]"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.htmlContent, {
                      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'span', 'div', 'img', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'strong', 'em'],
                      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel'],
                      ALLOW_DATA_ATTR: false
                    }) }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded-lg p-4 max-h-[60vh] overflow-auto">
                    {selectedEmail.textContent || 'No content'}
                  </pre>
                )}
                {selectedEmail.hasAttachments && selectedEmail.attachmentCount && selectedEmail.attachmentCount > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" /> {selectedEmail.attachmentCount} Attachment(s)
                    </p>
                    <a
                      href={`${API_BASE}/attachments/email/${selectedEmail.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary hover:underline"
                    >
                      View attachments
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Inbox className="w-5 h-5" /> Inbox
                  </CardTitle>
                  <Badge variant="secondary">{emails.length} {emails.length === 1 ? 'email' : 'emails'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {emails.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <RefreshCw className={`w-8 h-8 mx-auto mb-3 ${polling ? 'animate-spin' : ''}`} />
                    <p className="font-medium">Waiting for emails...</p>
                    <p className="text-xs mt-1">Auto-refreshing every 5 seconds</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <button
                          onClick={() => viewEmail(email.id)}
                          className="flex items-start gap-3 min-w-0 flex-1 text-left"
                        >
                          <Mail className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{email.subject || '(No Subject)'}</p>
                            <p className="text-xs text-muted-foreground truncate">{email.fromAddress}</p>
                            <p className="text-xs text-muted-foreground">{formatTimestamp(email.receivedAt)}</p>
                          </div>
                          {email.hasAttachments && <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteEmail(email.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        )}
      </main>
    </div>
  );
};

export default TempMail;
