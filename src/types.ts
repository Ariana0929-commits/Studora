export type ClassItem = { id: string; name: string; color: string; teacher?: string; room?: string };
export type Period = { id: string; day: number; start: string; end: string; kind: "class" | "lunch" | "free"; classId?: string; label?: string; room?: string };
export type Step = { id: string; text: string; done: boolean };
export type Assignment = { id: string; classId?: string; title: string; due: string; priority: "low" | "medium" | "high"; status: "todo" | "doing" | "done"; notes: string; progress: number; steps: Step[] };
export type CalEvent = { id: string; date: string; title: string; kind: "exam" | "event"; classId?: string; time?: string };
export type Note = { id: string; title: string; body: string; classId?: string; topic: string; photos: string[]; updated: number };
export type Goal = { id: string; title: string; kind: "habit" | "goal"; checks: string[]; target: number };
export type Reminder = { id: string; text: string; date: string; time: string; done: boolean };
export type PaletteKey = "bg" | "surface" | "accent" | "button" | "text" | "border";
export type Settings = {
  theme: "sage" | "oatmeal" | "rose" | "lilac" | "butter" | "blue" | "neutral";
  mode: "light" | "dark"; accent: string; font: "dm" | "nunito" | "serif" | "system";
  textSize: "sm" | "md" | "lg"; radius: number; spacing: "compact" | "comfortable" | "spacious";
  background?: string; avatar?: string; name: string; focusMin: number; breakMin: number;
  notif: { lead: number; quietStart: string; quietEnd: string; enabled: boolean };
};
export type State = {
  version: 1; classes: ClassItem[]; periods: Period[]; assignments: Assignment[];
  events: CalEvent[]; notes: Note[]; goals: Goal[]; reminders: Reminder[];
  focusLog: Record<string, number>; settings: Settings;
};
