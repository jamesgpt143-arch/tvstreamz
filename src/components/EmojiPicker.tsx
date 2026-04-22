import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['🎉', '🎊', '🎁', '🎈', '🔥', '⭐', '✨', '💫', '🌟', '💯', '💢', '💥', '💦', '💨', '🎵', '🎶', '🎤', '🎧', '📱', '💻', '⌨️', '🖥️', '📷', '📸'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄', '🐝', '🦋', '🐌', '🐙'],
  'Food': ['🍕', '🍔', '🍟', '🌭', '🍿', '🧀', '🥚', '🍳', '🥓', '🥐', '🍞', '🥖', '🥨', '🥯', '🥞', '🧇', '🍰', '🎂', '🍩', '🍪', '🍫', '🍬', '☕', '🍵'],
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Smileys');

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
          <Smile className="w-5 h-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-2" 
        side="top" 
        align="end"
        sideOffset={8}
      >
        {/* Category Tabs */}
        <div className="flex gap-1 mb-2 overflow-x-auto pb-1 scrollbar-hide">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
          {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="text-xl p-1 hover:bg-muted rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
