import { CommunityChat } from '@/components/CommunityChat';

export default function GlobalChat() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen w-full bg-background relative pt-16 lg:pt-0">
      <CommunityChat isStandalone={true} />
    </div>
  );
}
