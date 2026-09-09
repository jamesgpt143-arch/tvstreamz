import { useState, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { MultiViewSlot } from '@/components/MultiViewSlot';
import { type Channel } from '@/lib/channels';
import { useChannels, toAppChannel } from '@/hooks/useChannels';
import { CATEGORIES } from '@/lib/channelCategories';
import { useProxyLogo } from '@/hooks/useProxyLogo';
import { LayoutGrid, Grid2X2, Layers, VolumeX, RefreshCw, Search, Plus, Radio, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type LayoutMode = '2-grid' | '4-grid' | 'focus';

const MultiView = () => {
  const { data: dbChannels, isLoading } = useChannels();
  const { proxyLogo } = useProxyLogo();

  const allChannels: Channel[] = useMemo(() => {
    return (dbChannels || []).map(toAppChannel);
  }, [dbChannels]);

  // Up to 4 slot channels
  const [slots, setSlots] = useState<(Channel | null)[]>([null, null, null, null]);
  const [layout, setLayout] = useState<LayoutMode>('4-grid');
  const [unmutedSlot, setUnmutedSlot] = useState<number>(0);

  // Channel Picker Dialog State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Auto-fill initial channels if slots are completely empty and channels load
  useMemo(() => {
    if (allChannels.length > 0 && slots.every(s => s === null)) {
      setSlots([
        allChannels[0] || null,
        allChannels[1] || null,
        allChannels[2] || null,
        allChannels[3] || null,
      ]);
    }
  }, [allChannels]);

  const handleOpenSelector = (slotIndex: number) => {
    setTargetSlot(slotIndex);
    setIsSelectorOpen(true);
  };

  const handleSelectChannel = (channel: Channel) => {
    if (targetSlot === null) return;
    const newSlots = [...slots];
    newSlots[targetSlot] = channel;
    setSlots(newSlots);
    setIsSelectorOpen(false);
    toast.success(`Set Stream ${targetSlot + 1} to ${channel.name}`);
  };

  const handleToggleMute = (slotIndex: number) => {
    // If clicking already unmuted slot, mute all (-1)
    if (unmutedSlot === slotIndex) {
      setUnmutedSlot(-1);
    } else {
      setUnmutedSlot(slotIndex);
    }
  };

  const handleRemoveChannel = (slotIndex: number) => {
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);
    if (unmutedSlot === slotIndex) {
      setUnmutedSlot(-1);
    }
  };

  const handleResetSlots = () => {
    setSlots([null, null, null, null]);
    setUnmutedSlot(-1);
    toast.info("Multi-View streams reset");
  };

  // Filtered channels for dialog selection
  const filteredChannels = useMemo(() => {
    return allChannels.filter(c => {
      const matchesCategory = selectedCategory === 'All' || (c.category && c.category.toLowerCase() === selectedCategory.toLowerCase());
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allChannels, selectedCategory, searchQuery]);

  const activeSlotCount = layout === '2-grid' ? 2 : 4;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12 px-3 sm:px-6 container mx-auto flex flex-col">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="rounded-xl border border-border">
              <Link to="/live-tv">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-orange-500" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">Multi-View Studio</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Watch multiple Live TV streams simultaneously
              </p>
            </div>
          </div>

          {/* Controls & Layout Switches */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-card border border-border/80 gap-1">
              <Button
                variant={layout === '2-grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLayout('2-grid')}
                className="h-8 text-xs gap-1.5 font-bold rounded-lg"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
                2 Streams
              </Button>
              <Button
                variant={layout === '4-grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLayout('4-grid')}
                className="h-8 text-xs gap-1.5 font-bold rounded-lg"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                4 Streams
              </Button>
              <Button
                variant={layout === 'focus' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLayout('focus')}
                className="h-8 text-xs gap-1.5 font-bold rounded-lg"
              >
                <Layers className="w-3.5 h-3.5" />
                Focus Mode
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnmutedSlot(prev => prev === -1 ? 0 : -1)}
              className="h-9 text-xs gap-1.5 rounded-xl border-border hover:bg-secondary"
            >
              <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
              {unmutedSlot === -1 ? 'Unmute' : 'Mute All'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetSlots}
              className="h-9 text-xs gap-1.5 rounded-xl text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </div>

        {/* Dynamic Multi-View Grid */}
        <div className="flex-1 w-full flex flex-col justify-center min-h-[500px]">
          {layout === '2-grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
              {[0, 1].map((idx) => (
                <div key={idx} className="aspect-video w-full">
                  <MultiViewSlot
                    slotIndex={idx}
                    channel={slots[idx]}
                    isMuted={unmutedSlot !== idx}
                    onOpenSelector={handleOpenSelector}
                    onToggleMute={handleToggleMute}
                    onRemoveChannel={handleRemoveChannel}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === '4-grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="aspect-video w-full">
                  <MultiViewSlot
                    slotIndex={idx}
                    channel={slots[idx]}
                    isMuted={unmutedSlot !== idx}
                    onOpenSelector={handleOpenSelector}
                    onToggleMute={handleToggleMute}
                    onRemoveChannel={handleRemoveChannel}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === 'focus' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full h-full">
              {/* Primary Focus Slot (Main) */}
              <div className="lg:col-span-2 aspect-video w-full">
                <MultiViewSlot
                  slotIndex={0}
                  channel={slots[0]}
                  isMuted={unmutedSlot !== 0}
                  onOpenSelector={handleOpenSelector}
                  onToggleMute={handleToggleMute}
                  onRemoveChannel={handleRemoveChannel}
                />
              </div>

              {/* Secondary Side Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="aspect-video w-full">
                    <MultiViewSlot
                      slotIndex={idx}
                      channel={slots[idx]}
                      isMuted={unmutedSlot !== idx}
                      onOpenSelector={handleOpenSelector}
                      onToggleMute={handleToggleMute}
                      onRemoveChannel={handleRemoveChannel}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Channel Selector Modal */}
      <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
        <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-border rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Select Channel for Stream {targetSlot !== null ? targetSlot + 1 : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-3 my-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 rounded-xl"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background/50 rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[360px] pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleSelectChannel(channel)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-background/60 border border-border/60 hover:border-primary/50 hover:bg-accent/40 transition-all text-left group"
                >
                  <img
                    src={proxyLogo(channel.logo)}
                    alt={channel.name}
                    className="w-8 h-8 object-contain rounded-lg bg-secondary/80 p-1 flex-shrink-0"
                  />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs group-hover:text-primary transition-colors truncate">
                      {channel.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize truncate">
                      {channel.category || 'General'}
                    </p>
                  </div>
                </button>
              ))}

              {filteredChannels.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                  No channels found matching your search.
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiView;
