import FlowCanvas from '@/components/canvas/FlowCanvas';
import Sidebar from '@/components/sidebar/Sidebar';
import HistorySidebar from '@/components/sidebar/HistorySidebar';

export default function Home() {
  return (
    <main className="flex h-screen w-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 relative border-x border-[#1d1e26]">
        <FlowCanvas />
      </div>
      <HistorySidebar />
    </main>
  );
}