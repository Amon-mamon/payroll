import { CalendarCheck, Clock, LogIn, Wallet } from "lucide-react";

/** Illustrative mock of the app (pure HTML/CSS, no screenshots). */
export const ProductPreview = () => (
  <div className="preview-frame" aria-hidden="true">
    <div className="preview-bar">
      <span /><span /><span />
    </div>
    <div className="grid gap-3 p-4 sm:grid-cols-[1.2fr_1fr]">
      <div className="preview-card space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> Time clock</span>
          <span className="status-badge rounded-full border px-2 py-0.5" data-status="present">Present</span>
        </div>
        <div className="clock-display text-4xl!">08:02:41</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="clock-stat"><dt>Time in</dt><dd>7:58 AM</dd></div>
          <div className="clock-stat"><dt>Shift</dt><dd>8–5</dd></div>
          <div className="clock-stat"><dt>Grace</dt><dd>15 min</dd></div>
        </div>
        <div className="flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground">
          <LogIn className="size-4" /> Time in
        </div>
      </div>
      <div className="grid gap-3">
        <div className="preview-card">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="size-3.5" /> Net pay · Nov 1–15</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">₱ 18,240.50</div>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Gross</span><span className="tabular-nums">₱ 22,500.00</span></div>
            <div className="flex justify-between"><span>Deductions</span><span className="tabular-nums">− ₱ 4,259.50</span></div>
          </div>
        </div>
        <div className="preview-card">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarCheck className="size-3.5" /> Vacation leave</div>
          <div className="mt-1 text-2xl font-bold">11 <span className="text-sm font-normal text-muted-foreground">/ 15 days left</span></div>
          <div className="balance-bar mt-2"><span style={{ width: "27%" }} /></div>
        </div>
      </div>
    </div>
  </div>
);
