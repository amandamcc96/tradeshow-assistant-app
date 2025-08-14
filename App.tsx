import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar as CalendarIcon,
  Clock,
  Link as LinkIcon,
  Plus,
  Upload,
  User,
  Plane,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Settings,
} from "lucide-react";

/**
 * Tradeshow Meetings Assistant (KB removed)
 * - Meetings w/ attendee headshots, LinkedIn, talking points, prep checklist
 * - Daily Agenda or Hourly grid
 * - Travel (flight/hotel/ground) with confirmations and date/time
 * - Ask our GPT button with persisted URL
 * - Import/Export (meetings, travel, gptUrl); localStorage persistence
 */

/** ------------------------- Types ------------------------- */
export type Attendee = {
  id: string;
  name: string;
  title?: string;
  company?: string;
  linkedin?: string;
  photoUrl?: string;
  notes?: string;
};
export type Meeting = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  booth?: string;
  startISO: string; // e.g., "2025-09-10T10:30:00-04:00"
  endISO: string;
  attendees: Attendee[];
  talkingPoints?: string;
  prepChecklist?: string;
};
export type Travel = {
  id: string;
  type: "flight" | "hotel" | "ground";
  label: string;
  confirmation?: string;
  startISO?: string;
  endISO?: string;
  details?: string;
};

/** ------------------------- Utilities ------------------------- */
const uid = () => Math.random().toString(36).slice(2, 9);
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
function sameDay(aISO: string, bISO: string) {
  const a = new Date(aISO),
    b = new Date(bISO);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function hoursBetween(startISO: string, endISO: string) {
  return (
    (new Date(endISO).getTime() - new Date(startISO).getTime()) /
    (1000 * 60 * 60)
  );
}

/** ------------------------- Sample Seed Data ------------------------- */
const seedDate = (() => {
  // Future show date (mid-September this year, 9 AM local)
  const now = new Date();
  const d = new Date(now.getFullYear(), 8, 16, 9, 0, 0);
  return d;
})();
const SAMPLE_ATTENDEES: Attendee[] = [
  {
    id: uid(),
    name: "Chris Williams",
    title: "VP Partnerships",
    company: "NorthBridge",
    linkedin: "https://www.linkedin.com/in/example-chris",
    photoUrl: "https://i.pravatar.cc/160?img=12",
    notes: "Loves concise dashboards; ask about Zoho practice.",
  },
  {
    id: uid(),
    name: "Amanda Lee",
    title: "Head of Marketing",
    company: "Protocol80",
    linkedin: "https://www.linkedin.com/in/example-amanda",
    photoUrl: "https://i.pravatar.cc/160?img=32",
    notes: "Interested in co-marketing webinars and case studies.",
  },
  {
    id: uid(),
    name: "Hudson Carter",
    title: "Solutions Architect",
    company: "CloudTrailz",
    linkedin: "https://www.linkedin.com/in/example-hudson",
    photoUrl: "https://i.pravatar.cc/160?img=25",
    notes: "Deep NetSuite background; prefers technical prep notes.",
  },
];
const SAMPLE_MEETINGS: Meeting[] = [
  {
    id: uid(),
    title: "NorthBridge + Commercient intro",
    description: "Explore reseller fit; prioritize Zoho + Monday integrations.",
    location: "Hall B – Meeting Room 3",
    booth: "B122",
    startISO: new Date(seedDate.getTime()).toISOString(),
    endISO: new Date(seedDate.getTime() + 60 * 60 * 1000).toISOString(),
    attendees: [SAMPLE_ATTENDEES[0]],
    talkingPoints:
      "15% target share from one ecosystem; co-selling playbook; partner portal access.",
    prepChecklist:
      "Review Zoho marketplace listing; pull 2 case studies; confirm NDA status.",
  },
  {
    id: uid(),
    title: "Protocol80 co-marketing sprint",
    description: "Finalize webinar topics and case study pipeline.",
    location: "Expo Café (near Hall A)",
    booth: "A210",
    startISO: new Date(seedDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    endISO: new Date(seedDate.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    attendees: [SAMPLE_ATTENDEES[1]],
    talkingPoints:
      "Partner Spotlight Webinar; co-branded email templates; design resources.",
    prepChecklist: "Bring sample creative; align on audience; set metrics.",
  },
  {
    id: uid(),
    title: "CloudTrailz technical sync",
    description:
      "Deep-dive NetSuite<->HubSpot patterns; managed custom objects beta lessons.",
    location: "Booth C341",
    booth: "C341",
    startISO: new Date(seedDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    endISO: new Date(seedDate.getTime() + 5 * 60 * 60 * 1000).toISOString(),
    attendees: [SAMPLE_ATTENDEES[2]],
    talkingPoints:
      "QuickBooks Desktop beta then pivot to NetSuite/Intacct; out-of-the-box industry apps.",
    prepChecklist: "Open architecture diagram; confirm data model mapping doc.",
  },
];
const SAMPLE_TRAVEL: Travel[] = [
  {
    id: uid(),
    type: "flight",
    label: "ATL → BOS (AC 1234)",
    confirmation: "Z7X9QW",
    startISO: new Date(seedDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    endISO: new Date(seedDate.getTime() - 22 * 60 * 60 * 1000).toISOString(),
    details: "Seat 14C; carry-on only.",
  },
  {
    id: uid(),
    type: "hotel",
    label: "Westin Seaport, Boston",
    confirmation: "H987654",
    startISO: new Date(seedDate.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    endISO: new Date(seedDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    details: "Reservation under Commercient; breakfast included.",
  },
];

/** ------------------------- Storage ------------------------- */
const STORAGE_KEY = "tradeshow-assistant-v1";
function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

/** ------------------------- Main Component ------------------------- */
export default function TradeshowAssistantApp() {
  const [meetings, setMeetings] = usePersistentState<Meeting[]>(
    `${STORAGE_KEY}:meetings`,
    SAMPLE_MEETINGS,
  );
  const [travel, setTravel] = usePersistentState<Travel[]>(
    `${STORAGE_KEY}:travel`,
    SAMPLE_TRAVEL,
  );
  const [gptUrl, setGptUrl] = usePersistentState<string>(
    `${STORAGE_KEY}:gptUrl`,
    "",
  );
  const [activeDate, setActiveDate] = useState<string>(
    SAMPLE_MEETINGS[0]?.startISO ?? new Date().toISOString(),
  );
  const [view, setView] = useState<"agenda" | "hourly">("agenda");
  const dayMeetings = useMemo(
    () =>
      meetings
        .filter((m) => sameDay(m.startISO, activeDate))
        .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()),
    [meetings, activeDate],
  );
  const days = useMemo(() => {
    const unique = Array.from(new Set(meetings.map((m) => new Date(m.startISO).toDateString())));
    return unique
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [meetings]);
  const shiftDay = (dir: -1 | 1) => {
    const idx = days.findIndex((d) => sameDay(d.toISOString(), activeDate));
    const next = days[idx + dir];
    if (next) setActiveDate(next.toISOString());
  };
  return (
    <div className="min-h-screen w-full bg-neutral-50 p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Tradeshow Meetings Assistant</h1>
        </div>
        <div className="flex items-center gap-2">
          <ImportExport
            meetings={meetings}
            travel={travel}
            gptUrl={gptUrl}
            onImport={(m, t, g) => {
              if (m) setMeetings(m);
              if (t) setTravel(t);
              if (typeof g === "string") setGptUrl(g);
            }}
          />
          <Settings className="h-5 w-5 opacity-60" />
        </div>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Calendar, GPT link, Travel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" /> Schedule
              </CardTitle>
              <CardDescription>
                Switch between an agenda and an hourly grid for any show day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => shiftDay(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">{fmtDate(activeDate)}</span>
                  <Button variant="outline" size="icon" onClick={() => shiftDay(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                  <TabsList>
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                    <TabsTrigger value="hourly">Hourly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {view === "agenda" ? (
                <div className="space-y-3">
                  {dayMeetings.length === 0 && (
                    <div className="text-sm opacity-70">No meetings for this date.</div>
                  )}
                  {dayMeetings.map((m) => (
                    <MeetingListItem
                      key={m.id}
                      meeting={m}
                      onEdit={(updated) =>
                        setMeetings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                      }
                      onDelete={() => setMeetings((prev) => prev.filter((x) => x.id !== m.id))}
                    />
                  ))}
                </div>
              ) : (
                <HourlyGrid meetings={dayMeetings} dayISO={activeDate} />
              )}
              <div className="pt-2">
                <AddMeeting onAdd={(m) => setMeetings((prev) => [...prev, m])} />
              </div>
            </CardContent>
          </Card>
          {/* Ask our GPT */}
          <GptAccess gptUrl={gptUrl} setGptUrl={setGptUrl} />
          {/* Travel */}
          <TravelCard
            travel={travel}
            onAdd={(t) => setTravel((prev) => [...prev, t])}
            onUpdate={(t) => setTravel((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
            onDelete={(id) => setTravel((prev) => prev.filter((x) => x.id !== id))}
          />
        </div>
        {/* Right: Meeting details */}
        <div className="lg:col-span-2 space-y-6">
          {dayMeetings.map((m) => (
            <MeetingDetail
              key={m.id}
              meeting={m}
              onUpdate={(updated) =>
                setMeetings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
              }
            />
          ))}
          {dayMeetings.length === 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>No meetings this day</CardTitle>
                <CardDescription>Add one using the button on the left.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/** ------------------------- Components ------------------------- */
function MeetingListItem({
  meeting,
  onEdit,
  onDelete,
}: {
  meeting: Meeting;
  onEdit: (m: Meeting) => void;
  onDelete: () => void;
}) {
  return (
    <Card className="shadow-none border border-neutral-200">
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">
            {fmtTime(meeting.startISO)}–{fmtTime(meeting.endISO)} • {meeting.title}
          </div>
          <div className="text-xs opacity-70 truncate">
            {meeting.location} {meeting.booth && ` • Booth ${meeting.booth}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditMeeting meeting={meeting} onSave={onEdit} />
          <Button variant="outline" size="icon" onClick={onDelete} title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function MeetingDetail({ meeting, onUpdate }: { meeting: Meeting; onUpdate: (m: Meeting) => void }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{meeting.title}</span>
          <span className="text-base font-normal text-neutral-500">
            {fmtDate(meeting.startISO)} • {fmtTime(meeting.startISO)}–{fmtTime(meeting.endISO)}
          </span>
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-[13px]">
          <Clock className="h-4 w-4" /> {hoursBetween(meeting.startISO, meeting.endISO).toFixed(1)} hrs • {meeting.location}{" "}
          {meeting.booth && ` • Booth ${meeting.booth}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          {meeting.description && <p className="text-sm">{meeting.description}</p>}
          {meeting.talkingPoints && (
            <div>
              <div className="mb-1 text-sm font-semibold">Suggested talking points</div>
              <div className="rounded-lg bg-neutral-50 p-3 text-sm leading-relaxed">
                {meeting.talkingPoints}
              </div>
            </div>
          )}
          {meeting.prepChecklist && (
            <div>
              <div className="mb-1 text-sm font-semibold">Prep checklist</div>
              <div className="rounded-lg bg-neutral-50 p-3 text-sm leading-relaxed">
                {meeting.prepChecklist}
              </div>
            </div>
          )}
          <EditMeeting meeting={meeting} onSave={onUpdate} triggerLabel="Edit details" />
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold">Attendees</div>
          <div className="space-y-3">
            {meeting.attendees.map((a) => (
              <Card key={a.id} className="border border-neutral-200 shadow-none">
                <CardContent className="flex items-center gap-3 p-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={a.photoUrl} alt={a.name} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{a.name}</div>
                    <div className="truncate text-xs opacity-70">
                      {[a.title, a.company].filter(Boolean).join(" • ")}
                    </div>
                    {a.linkedin && (
                      <a
                        className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 underline"
                        href={a.linkedin}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <LinkIcon className="h-3 w-3" /> LinkedIn
                      </a>
                    )}
                    {a.notes && <div className="mt-1 text-xs">{a.notes}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function HourlyGrid({ meetings, dayISO }: { meetings: Meeting[]; dayISO: string }) {
  // Hour grid 7:00–19:00
  const start = new Date(dayISO);
  start.setHours(7, 0, 0, 0);
  const hours = Array.from({ length: 13 }, (_, i) => new Date(start.getTime() + i * 60 * 60 * 1000));
  return (
    <div className="rounded-lg border border-neutral-200">
      {hours.map((h, i) => {
        const slotMeetings = meetings.filter(
          (m) => new Date(m.startISO) <= h && new Date(m.endISO) > h,
        );
        return (
          <div key={i} className="grid grid-cols-12 border-b border-neutral-100 last:border-b-0">
            <div className="col-span-2 p-2 text-right text-xs text-neutral-500">
              {h.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="col-span-10 p-2">
              {slotMeetings.length === 0 ? (
                <div className="h-6 rounded bg-neutral-50" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slotMeetings.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs"
                    >
                      <span className="font-medium">{m.title}</span>
                      <span className="opacity-60">
                        {fmtTime(m.startISO)}–{fmtTime(m.endISO)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function AddMeeting({ onAdd }: { onAdd: (m: Meeting) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [booth, setBooth] = useState("");
  const [startISO, setStartISO] = useState(new Date().toISOString().slice(0, 16));
  const [endISO, setEndISO] = useState(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  const [description, setDescription] = useState("");
  const add = () => {
    const meeting: Meeting = {
      id: uid(),
      title,
      location,
      booth,
      startISO: new Date(startISO).toISOString(),
      endISO: new Date(endISO).toISOString(),
      attendees: [],
      description,
    };
    onAdd(meeting);
    setOpen(false);
    // reset
    setTitle("");
    setLocation("");
    setBooth("");
    setDescription("");
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Add meeting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New meeting</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <Input placeholder="Booth" value={booth} onChange={(e) => setBooth(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="datetime-local" value={startISO} onChange={(e) => setStartISO(e.target.value)} />
            <Input type="datetime-local" value={endISO} onChange={(e) => setEndISO(e.target.value)} />
          </div>
          <Textarea
            placeholder="Description / goals"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={add} disabled={!title}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function EditMeeting({ meeting, onSave, triggerLabel }: { meeting: Meeting; onSave: (m: Meeting) => void; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Meeting>(meeting);
  useEffect(() => setDraft(meeting), [meeting]);
  const updateAttendee = (a: Attendee, idx: number) => {
    setDraft((d) => ({
      ...d,
      attendees: d.attendees.map((x, i) => (i === idx ? a : x)),
    }));
  };
  const addAttendee = () =>
    setDraft((d) => ({
      ...d,
      attendees: [
        ...d.attendees,
        {
          id: uid(),
          name: "",
          title: "",
          company: "",
          linkedin: "",
          photoUrl: "",
          notes: "",
        },
      ],
    }));
  const removeAttendee = (idx: number) =>
    setDraft((d) => ({
      ...d,
      attendees: d.attendees.filter((_, i) => i !== idx),
    }));
  const save = () => {
    onSave(draft);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerLabel ? "outline" : "ghost"} size={triggerLabel ? "default" : "icon"}>
          {triggerLabel ? (
            <span className="inline-flex items-center gap-2">
              <Edit3 className="h-4 w-4" /> {triggerLabel}
            </span>
          ) : (
            <Edit3 className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit meeting</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Input
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Location"
              value={draft.location ?? ""}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
            <Input
              placeholder="Booth"
              value={draft.booth ?? ""}
              onChange={(e) => setDraft({ ...draft, booth: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="datetime-local"
              value={new Date(draft.startISO).toISOString().slice(0, 16)}
              onChange={(e) => setDraft({ ...draft, startISO: new Date(e.target.value).toISOString() })}
            />
            <Input
              type="datetime-local"
              value={new Date(draft.endISO).toISOString().slice(0, 16)}
              onChange={(e) => setDraft({ ...draft, endISO: new Date(e.target.value).toISOString() })}
            />
          </div>
          <Textarea
            placeholder="Description / goals"
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <Textarea
            placeholder="Suggested talking points"
            value={draft.talkingPoints ?? ""}
            onChange={(e) => setDraft({ ...draft, talkingPoints: e.target.value })}
          />
          <Textarea
            placeholder="Prep checklist"
            value={draft.prepChecklist ?? ""}
            onChange={(e) => setDraft({ ...draft, prepChecklist: e.target.value })}
          />
          <div className="mt-2 text-sm font-semibold">Attendees</div>
          <div className="space-y-3">
            {draft.attendees.map((a, i) => (
              <div key={a.id} className="grid gap-2 rounded-lg border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Name"
                    value={a.name}
                    onChange={(e) => updateAttendee({ ...a, name: e.target.value }, i)}
                  />
                  <Input
                    placeholder="Title"
                    value={a.title ?? ""}
                    onChange={(e) => updateAttendee({ ...a, title: e.target.value }, i)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Company"
                    value={a.company ?? ""}
                    onChange={(e) => updateAttendee({ ...a, company: e.target.value }, i)}
                  />
                  <Input
                    placeholder="LinkedIn URL"
                    value={a.linkedin ?? ""}
                    onChange={(e) => updateAttendee({ ...a, linkedin: e.target.value }, i)}
                  />
                </div>
                <Input
                  placeholder="Photo URL (square preferred)"
                  value={a.photoUrl ?? ""}
                  onChange={(e) => updateAttendee({ ...a, photoUrl: e.target.value }, i)}
                />
                <Textarea
                  placeholder="Personal notes (interests, priorities, history)"
                  value={a.notes ?? ""}
                  onChange={(e) => updateAttendee({ ...a, notes: e.target.value }, i)}
                />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeAttendee(i)}
                    title="Remove attendee"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addAttendee}>
              <Plus className="mr-2 h-4 w-4" /> Add attendee
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function TravelCard({
  travel,
  onAdd,
  onUpdate,
  onDelete,
}: {
  travel: Travel[];
  onAdd: (t: Travel) => void;
  onUpdate: (t: Travel) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Travel>({
    id: uid(),
    type: "flight",
    label: "",
    confirmation: "",
    details: "",
  });
  const save = () => {
    onAdd(draft);
    setDraft({ id: uid(), type: "flight", label: "", confirmation: "", details: "" });
    setOpen(false);
  };
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" /> Travel
        </CardTitle>
        <CardDescription>Store flight, hotel, and ground confirmations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {travel.length === 0 && <div className="text-sm opacity-70">No travel saved.</div>}
        {travel.map((t) => (
          <div
            key={t.id}
            className="grid grid-cols-12 items-center gap-2 rounded-lg border p-3 text-sm"
          >
            <div className="col-span-9">
              <div className="font-medium">[{t.type.toUpperCase()}] {t.label}</div>
              <div className="text-xs opacity-70">
                {t.confirmation && (
                  <>
                    Conf#: {t.confirmation} •
                  </>
                )}
                {t.startISO && (
                  <>
                    Start {fmtDate(t.startISO)} {fmtTime(t.startISO)} •{' '}
                  </>
                )}
                {t.endISO && (
                  <>
                    End {fmtDate(t.endISO)} {fmtTime(t.endISO)}
                  </>
                )}
              </div>
              {t.details && <div className="text-xs">{t.details}</div>}
            </div>
            <div className="col-span-3 flex justify-end gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Edit">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit travel</DialogTitle>
                  </DialogHeader>
                  <TravelEditor value={t} onChange={onUpdate} />
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="icon" title="Delete" onClick={() => onDelete(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Add travel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New travel</DialogTitle>
            </DialogHeader>
            <TravelEditor value={draft} onChange={(t) => setDraft(t)} />
            <DialogFooter>
              <Button onClick={save} disabled={!draft.label}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
function TravelEditor({ value, onChange }: { value: Travel; onChange: (t: Travel) => void }) {
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-2">
        <select
          className="rounded-md border p-2"
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value as any })}
        >
          <option value="flight">Flight</option>
          <option value="hotel">Hotel</option>
          <option value="ground">Ground</option>
        </select>
        <Input
          placeholder="Label (e.g., ATL → BOS)"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
        <Input
          placeholder="Confirmation #"
          value={value.confirmation ?? ""}
          onChange={(e) => onChange({ ...value, confirmation: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="datetime-local"
          value={value.startISO ? new Date(value.startISO).toISOString().slice(0, 16) : ""}
          onChange={(e) =>
            onChange({ ...value, startISO: e.target.value ? new Date(e.target.value).toISOString() : undefined })
          }
        />
        <Input
          type="datetime-local"
          value={value.endISO ? new Date(value.endISO).toISOString().slice(0, 16) : ""}
          onChange={(e) =>
            onChange({ ...value, endISO: e.target.value ? new Date(e.target.value).toISOString() : undefined })
          }
        />
      </div>
      <Textarea
        placeholder="Details"
        value={value.details ?? ""}
        onChange={(e) => onChange({ ...value, details: e.target.value })}
      />
    </div>
  );
}
function GptAccess({ gptUrl, setGptUrl }: { gptUrl: string; setGptUrl: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(gptUrl);
  useEffect(() => setDraft(gptUrl), [gptUrl]);
  const save = () => {
    setGptUrl(draft.trim());
    setOpen(false);
  };
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" /> Ask our GPT
        </CardTitle>
        <CardDescription>Opens your team’s GPT for questions during the event.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Button asChild disabled={!gptUrl}>
          <a
            href={gptUrl || "#"}
            target="_blank"
            rel="noreferrer"
            title={gptUrl ? "Open GPT" : "Set link first"}
          >
            Open GPT
          </a>
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" /> Set Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set your GPT link</DialogTitle>
              <DialogDescription>Paste the URL to your custom GPT or knowledge assistant.</DialogDescription>
            </DialogHeader>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://chat.openai.com/g/g-XXXXX-your-gpt"
            />
            <DialogFooter>
              <Button onClick={save} disabled={!draft.trim()}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      {!gptUrl && (
        <div className="px-6 pb-4 text-xs opacity-70">
          No link set yet. Click <em>Set Link</em> to add one.
        </div>
      )}
    </Card>
  );
}
function ImportExport({
  meetings,
  travel,
  gptUrl,
  onImport,
}: {
  meetings: Meeting[];
  travel: Travel[];
  gptUrl: string;
  onImport: (m?: Meeting[], t?: Travel[], gptUrl?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const doExport = () => {
    const blob = new Blob([JSON.stringify({ meetings, travel, gptUrl }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tradeshow-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const onFile = async (file: File) => {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed.meetings) onImport(parsed.meetings as Meeting[], undefined, undefined);
      if (parsed.travel) onImport(undefined, parsed.travel as Travel[], undefined);
      if ("gptUrl" in parsed) onImport(undefined, undefined, parsed.gptUrl || "");
    } catch (e) {
      alert("Invalid JSON file");
    }
  };
  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => e.target.files && onFile(e.target.files[0])}
      />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" /> Import
      </Button>
      <Button variant="outline" size="sm" onClick={doExport}>
        Export
      </Button>
    </div>
  );
}