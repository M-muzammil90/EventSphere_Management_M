import RealtimeChatView from "@/components/chat/RealtimeChatView";

export default function AdminMessages() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
      <header>
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-slate-900">
          Messages &amp; Support Desk
        </h1>
        <p className="mt-1.5 text-[14px] text-slate-500">
          Reply to exhibitors, attendees and support requests. New messages appear instantly.
        </p>
      </header>

      <RealtimeChatView defaultFilter="ALL" />
    </div>
  );
}