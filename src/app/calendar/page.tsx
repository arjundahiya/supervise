"use client";

import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
} from "lucide-react";

const days = [
  { label: "Mon", date: 29 },
  { label: "Tue", date: 30 },
  { label: "Wed", date: 31 },
  { label: "Thu", date: 1 },
  { label: "Fri", date: 2 },
  { label: "Sat", date: 3 },
  { label: "Sun", date: 4 },
];

const hours = Array.from({ length: 12 }, (_, i) => 8 + i);

const events = [
  {
    title: "Neuro Lab Supervision",
    location: "Cortex 2.14",
    dayIndex: 1,
    start: 9.0,
    end: 10.5,
    tone: "bg-sky-500/10 text-sky-900 border-sky-500/30 dark:text-sky-100",
  },
  {
    title: "Project Check-in",
    location: "Teams",
    dayIndex: 1,
    start: 13.0,
    end: 14.0,
    tone: "bg-emerald-500/10 text-emerald-900 border-emerald-500/30 dark:text-emerald-100",
  },
  {
    title: "Office Hours",
    location: "CRC 4.09",
    dayIndex: 2,
    start: 11.0,
    end: 13.0,
    tone: "bg-violet-500/10 text-violet-900 border-violet-500/30 dark:text-violet-100",
  },
  {
    title: "Supervision: HCI",
    location: "Lecture Hall B",
    dayIndex: 3,
    start: 9.5,
    end: 11.0,
    tone: "bg-amber-500/10 text-amber-900 border-amber-500/30 dark:text-amber-100",
  },
  {
    title: "Mentoring Block",
    location: "Dept Lounge",
    dayIndex: 4,
    start: 15.0,
    end: 17.0,
    tone: "bg-rose-500/10 text-rose-900 border-rose-500/30 dark:text-rose-100",
  },
  {
    title: "Focused Work",
    location: "No meetings",
    dayIndex: 5,
    start: 10.0,
    end: 13.0,
    tone: "bg-slate-500/10 text-slate-900 border-slate-500/30 dark:text-slate-100",
  },
];

const hourHeight = 72;
const startHour = 8;

const toneForCount = (count: number, max: number) => {
  if (count === 0) return "bg-emerald-500";
  if (count === 1) return "bg-orange-500";
  if (count === 2) return "bg-rose-500";

  return "bg-rose-600";
};

const widthForCount = (count: number) => {
  const clamped = Math.min(Math.max(count, 0), 2);
  if (clamped === 0) return "33%";
  if (clamped === 1) return "66%";
  return "100%";
};

export default function CalendarPage() {
  const supervisionCounts = days.map((day, dayIndex) => ({
    label: day.label,
    count: dayIndex % 3, // 0, 1, 2 repeating for visual testing
  }));
  const maxCount = Math.max(1, ...supervisionCounts.map((item) => item.count));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">
                Calendar
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">
              Supervision Calendar
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              View all busy periods and supervisions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add busy period
            </Button>
          </div>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">Jan 29 - Feb 4</span>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Today
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-64 rounded-full border bg-card pl-9 pr-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="Search sessions or people"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Tabs defaultValue="week">
              <TabsList variant="default">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overview</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <Calendar
                  mode="single"
                  selected={new Date()}
                  className="scale-[0.98]"
                />
              </CardContent>
            </Card>

        

            
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Your Calendar 
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Displays lectures, supervisions, and other scheduled events.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-700">
                    Low
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-700">
                    Medium
                  </span>
                  <span className="rounded-full bg-rose-500/20 px-2 py-1 text-rose-700">
                    High
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b bg-muted/40">
                    <div className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                      Time
                    </div>
                    {days.map((day, index) => (
                      <div
                        key={`${day.label}-${index}`}
                        className="px-4 py-3 text-xs font-semibold text-muted-foreground"
                      >
                        <div className="flex items-center justify-between">
                          <span>{day.label}</span>
                          <span className="text-foreground">{day.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative grid grid-cols-[80px_repeat(7,minmax(0,1fr))]">
                    <div className="flex flex-col border-r bg-background">
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="flex h-[72px] items-start justify-center border-b pt-3 text-xs text-muted-foreground"
                        >
                          {hour <= 12 ? `${hour}:00` : `${hour}:00`}
                        </div>
                      ))}
                    </div>

                    {days.map((_, dayIndex) => (
                      <div
                        key={`day-${dayIndex}`}
                        className="relative border-r"
                        style={{ height: hours.length * hourHeight }}
                      >
                        {hours.map((hour) => (
                          <div
                            key={`${dayIndex}-${hour}`}
                            className="h-[72px] border-b"
                          />
                        ))}

                        {events
                          .filter((event) => event.dayIndex === dayIndex)
                          .map((event) => {
                            const top =
                              (event.start - startHour) * hourHeight;
                            const height =
                              (event.end - event.start) * hourHeight;
                            return (
                              <div
                                key={`${event.title}-${event.start}`}
                                className={`absolute left-2 right-2 rounded-xl border p-2 text-xs shadow-sm ${event.tone}`}
                                style={{ top, height }}
                              >
                                <div className="font-semibold">
                                  {event.title}
                                </div>
                                <div className="text-[10px] opacity-70">
                                  {event.location}
                                </div>
                                <div className="mt-1 text-[10px] font-medium opacity-80">
                                  {event.start
                                    .toFixed(2)
                                    .replace(".00", ":00")
                                    .replace(".50", ":30")}{" "}
                                  -{" "}
                                  {event.end
                                    .toFixed(2)
                                    .replace(".00", ":00")
                                    .replace(".50", ":30")}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Supervisons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supervisionCounts.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${toneForCount(item.count, maxCount)}`}
                        style={{ width: widthForCount(item.count) }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

