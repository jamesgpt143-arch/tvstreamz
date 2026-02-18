import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Copy, RefreshCw, Trash2, Clock, Paperclip, ArrowLeft, Inbox } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'https://api.driftz.net';

interface TempEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  body?: string;
  textBody?: string;
  htmlBody?: string;
  hasAttachments?: boolean;
  attachments?: any[];
}

interface EmailDetail {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  textBody: string;
  htmlBody: string;
  attachments: any[];
}

const TempMail = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [emails, setEmails] = useState<TempEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Generate temp address
  const generateAddress = async () => {
    setLoading(true);
    setSelectedEmail(null);
    setEmails([]);
    try {
      const res = await fetch(`${API_BASE}/temp/generate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAddress(data.result.address);
        // API returns Unix timestamp in seconds, convert to ISO string
        const expiresTimestamp = typeof data.result.expiresAt === 'number' 
          ? new Date(data.result.expiresAt * 1000).toISOString() 
          : data.result.expiresAt;
        setExpiresAt(expiresTimestamp);
        toast.success('Temp email generated!');
      } else {
        toast.error('Failed to generate address');
      }
    } catch {
      toast.error('API error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch inbox
  const fetchInbox = useCallback(async () => {
    if (!address) return;
    setPolling(true);
    try {
      const res = await fetch(`${API_BASE}/temp/${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.success) {
        setEmails(data.result.emails || []);
      }
    } catch {
      // silent
    } finally {
      setPolling(false);
    }
  }, [address]);

  // View single email
  const viewEmail = async (emailId: string) => {
    if (!address) return;
    try {
      const res = await fetch(`${API_BASE}/temp/${encodeURIComponent(address)}/${emailId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedEmail(data.result);
      }
    } catch {
      toast.error('Failed to load email');
    }
  };

  // Auto-poll every 5s
  useEffect(() => {
    if (!address) return;
    fetchInbox();
    const interval = setInterval(fetchInbox, 5000);
    return () => clearInterval(interval);
  }, [address, fetchInbox]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
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
              <div className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Generate a temporary email address to receive emails</p>
                <Button onClick={generateAddress} disabled={loading} size="lg">
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
                  <Button variant="ghost" size="sm" onClick={generateAddress} className="text-xs">
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
                  From: {selectedEmail.from} • {new Date(selectedEmail.date).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEmail.htmlBody ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-lg p-4 overflow-auto max-h-[60vh]"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded-lg p-4 max-h-[60vh] overflow-auto">
                    {selectedEmail.textBody || selectedEmail.body || 'No content'}
                  </pre>
                )}
                {selectedEmail.attachments?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" /> Attachments
                    </p>
                    {selectedEmail.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={`${API_BASE}/attachments/${att.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline"
                      >
                        {att.filename} ({(att.size / 1024).toFixed(1)} KB)
                      </a>
                    ))}
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
                      <button
                        key={email.id}
                        onClick={() => viewEmail(email.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors flex items-start gap-3"
                      >
                        <Mail className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{email.subject || '(No Subject)'}</p>
                          <p className="text-xs text-muted-foreground truncate">{email.from}</p>
                          <p className="text-xs text-muted-foreground">{new Date(email.date).toLocaleString()}</p>
                        </div>
                        {email.hasAttachments && <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      </button>
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
