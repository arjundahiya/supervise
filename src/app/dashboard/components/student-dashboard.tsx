"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, UserCheck, Repeat } from "lucide-react"

export default function StudentDashboard({name}: {name: string}) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Supervisions</h1>
          <p className="text-muted-foreground">
            Manage supervisions, locations, and swaps
          </p>
        </div>
        <Button>Update availability</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Next supervision" value="Tomorrow, 14:00" icon={<Clock />} />
        <SummaryCard title="This term" value="8 sessions" icon={<Calendar />} />
        <SummaryCard title="Supervisors" value="3" icon={<UserCheck />} />
        <SummaryCard title="Swap requests" value="1 open" icon={<Repeat />} />
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="swaps">Swap requests</TabsTrigger>
          <TabsTrigger value="history">Past</TabsTrigger>
        </TabsList>

        {/* Upcoming */}
        <TabsContent value="upcoming" className="space-y-4">
          <SupervisionCard
            date="Tue 6 Feb"
            time="14:00 – 15:00"
            supervisor="Dr Smith"
            location="Room 2.14, Psychology Building"
            topic="Auditory pathways revision"
            status="Confirmed"
          />
          <SupervisionCard
            date="Fri 16 Feb"
            time="10:00 – 11:00"
            supervisor="Prof Khan"
            location="Online (Teams)"
            topic="Mock exam discussion"
            status="Pending"
            allowSwap
          />
        </TabsContent>

        {/* Availability */}
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>My availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Mon: 09:00 – 12:00</p>
              <p>Wed: 13:00 – 17:00</p>
              <p>Fri: 09:00 – 11:00</p>
              <Button size="sm" className="mt-2">Edit availability</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Swaps */}
        <TabsContent value="swaps" className="space-y-4">
          <SwapCard
            date="Fri 16 Feb"
            time="10:00 – 11:00"
            supervisor="Prof Khan"
            location="Online"
            requestedBy="You"
            status="Open"
          />
          <SwapCard
            date="Thu 8 Feb"
            time="09:00 – 10:00"
            supervisor="Dr Smith"
            location="Room 1.03"
            requestedBy="Another student"
            status="Available"
          />
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-4">
          <SupervisionCard
            date="Mon 22 Jan"
            time="15:00 – 16:00"
            supervisor="Dr Patel"
            location="Room 3.01"
            topic="Visual system feedback"
            status="Completed"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryCard({ title, value, icon }: any) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  )
}

function SupervisionCard({ date, time, supervisor, location, topic, status, allowSwap }: any) {
  const variant = status === "Confirmed" ? "default" : status === "Pending" ? "secondary" : "outline"

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-medium">{date}</p>
          <Badge variant={variant}>{status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{time}</p>
        <p className="text-sm">Supervisor: {supervisor}</p>
        <p className="text-sm flex items-center gap-1">
          <MapPin className="h-4 w-4" /> {location}
        </p>
        <p className="text-sm">Topic: {topic}</p>
        {allowSwap && (
          <Button variant="outline" size="sm" className="mt-2">Request swap</Button>
        )}
      </CardContent>
    </Card>
  )
}

function SwapCard({ date, time, supervisor, location, requestedBy, status }: any) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-medium">{date} — {time}</p>
          <Badge variant="outline">{status}</Badge>
        </div>
        <p className="text-sm">Supervisor: {supervisor}</p>
        <p className="text-sm">Location: {location}</p>
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Requested by: {requestedBy}</p>
          {requestedBy !== "You" && (
            <Button size="sm">Accept swap</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
