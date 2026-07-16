export type WorkingDay = {
  weekday: number;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  pauseStartsAt: string;
  pauseEndsAt: string;
};

export type ProfessionalSchedule = {
  scheduleStart?: string;
  scheduleEnd?: string;
  pauseStart?: string;
  pauseEnd?: string;
  activeDays?: number[];
};

export type ClockSpan = {
  start: number;
  end: number;
  id?: string | number;
};

export type AvailabilityWindow = {
  isOpen: boolean;
  reason?: string;
  start: number;
  end: number;
  pauses: ClockSpan[];
  label: string;
};

const fallbackWorkingHours: WorkingDay[] = [
  { weekday: 0, isOpen: true, opensAt: "08:00", closesAt: "12:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 1, isOpen: false, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 2, isOpen: true, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 3, isOpen: true, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 4, isOpen: true, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 5, isOpen: true, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 6, isOpen: true, opensAt: "08:00", closesAt: "12:00", pauseStartsAt: "", pauseEndsAt: "" },
];

export function parseDurationMinutes(duration: string | null | undefined) {
  if (!duration) return 60;

  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minuteMatch = duration.match(/(\d+)\s*min/i);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    return Math.max(hours * 60 + minutes, 15);
  }

  const firstNumber = duration.match(/\d+/);
  return firstNumber ? Math.max(Number(firstNumber[0]) || 60, 15) : 60;
}

export function timeToMinutes(value: string | null | undefined) {
  if (!value) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

export function minutesToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function overlaps(spanA: ClockSpan, spanB: ClockSpan) {
  return spanA.start < spanB.end && spanB.start < spanA.end;
}

export function isSpanInsideWindow(spanStart: number, spanEnd: number, windowStart: number, windowEnd: number) {
  return spanStart >= windowStart && spanEnd <= windowEnd;
}

function getWeekday(date: string) {
  return new Date(`${date}T12:00:00`).getDay();
}

function buildPause(start?: string | null, end?: string | null): ClockSpan | null {
  if (!start || !end) return null;
  const pause = { start: timeToMinutes(start), end: timeToMinutes(end) };
  return pause.start < pause.end ? pause : null;
}

export function getAvailabilityWindow(
  date: string,
  workingHours: WorkingDay[] = fallbackWorkingHours,
  professional?: ProfessionalSchedule | null,
): AvailabilityWindow {
  const weekday = getWeekday(date);
  const clinicDay = workingHours.find((day) => day.weekday === weekday) ?? fallbackWorkingHours.find((day) => day.weekday === weekday);

  if (!clinicDay?.isOpen) {
    return {
      isOpen: false,
      reason: "A clínica está fechada nesse dia da semana.",
      start: 0,
      end: 0,
      pauses: [],
      label: "Fechado",
    };
  }

  const professionalDays = professional?.activeDays ?? [];
  if (professionalDays.length > 0 && !professionalDays.includes(weekday)) {
    return {
      isOpen: false,
      reason: "Este profissional não atende nesse dia da semana.",
      start: 0,
      end: 0,
      pauses: [],
      label: "Fechado",
    };
  }

  const clinicStart = timeToMinutes(clinicDay.opensAt);
  const clinicEnd = timeToMinutes(clinicDay.closesAt);
  const professionalStart = professional?.scheduleStart ? timeToMinutes(professional.scheduleStart) : clinicStart;
  const professionalEnd = professional?.scheduleEnd ? timeToMinutes(professional.scheduleEnd) : clinicEnd;
  const start = Math.max(clinicStart, professionalStart);
  const end = Math.min(clinicEnd, professionalEnd);

  if (start >= end) {
    return {
      isOpen: false,
      reason: "Não há interseção entre o horário da clínica e a agenda do profissional.",
      start,
      end,
      pauses: [],
      label: "Fechado",
    };
  }

  const pauses = [
    buildPause(clinicDay.pauseStartsAt, clinicDay.pauseEndsAt),
    buildPause(professional?.pauseStart, professional?.pauseEnd),
  ].filter((pause): pause is ClockSpan => Boolean(pause));

  return {
    isOpen: true,
    start,
    end,
    pauses,
    label: `${minutesToTime(start)} - ${minutesToTime(end)}`,
  };
}

export function getWorkingSlots(startMinute: number, endMinute: number, step = 15) {
  const slots: string[] = [];
  for (let minute = startMinute; minute + step <= endMinute; minute += step) {
    slots.push(minutesToTime(minute));
  }
  return slots;
}

export function buildAvailableSlots({
  window,
  durationMinutes,
  occupied = [],
  step = 15,
}: {
  window: AvailabilityWindow;
  durationMinutes: number;
  occupied?: ClockSpan[];
  step?: number;
}) {
  if (!window.isOpen) return [];

  return getWorkingSlots(window.start, window.end, step).filter((slot) => {
    const span = { start: timeToMinutes(slot), end: timeToMinutes(slot) + durationMinutes };
    const fitsWorkday = isSpanInsideWindow(span.start, span.end, window.start, window.end);
    const overlapsPause = window.pauses.some((pause) => overlaps(span, pause));
    const overlapsOccupied = occupied.some((item) => overlaps(span, item));

    return fitsWorkday && !overlapsPause && !overlapsOccupied;
  });
}
