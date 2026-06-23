import { describe, it, expect } from "vitest";

// The logic implemented in the API routes
function getReminderTriggers(hoursUntil: number, flags: { reminder_24h_sent: boolean; reminder_4h_sent: boolean; reminder_2h_sent: boolean }) {
  const needs24h = !flags.reminder_24h_sent && hoursUntil >= 20 && hoursUntil <= 26;
  const needs4h  = !flags.reminder_4h_sent  && hoursUntil >= 3.5 && hoursUntil <= 5.5;
  const needs2h  = !flags.reminder_2h_sent  && hoursUntil >= 1.5 && hoursUntil <= 3;

  return { needs24h, needs4h, needs2h };
}

function getCronUpdates(diffHours: number, flags: { reminder_24h_sent: boolean; reminder_4h_sent: boolean; reminder_2h_sent: boolean }) {
  let send24h = false;
  let send4h = false;
  let send2h = false;

  if (diffHours <= 2.5 && !flags.reminder_2h_sent) {
    send2h = true;
  } else if (diffHours > 2.5 && diffHours <= 5 && !flags.reminder_4h_sent) {
    send4h = true;
  } else if (diffHours > 5 && diffHours <= 24 && !flags.reminder_24h_sent) {
    send24h = true;
  }

  const updates: Record<string, boolean> = {};
  if (send2h) {
    updates.reminder_2h_sent = true;
    updates.reminder_4h_sent = true;
    updates.reminder_24h_sent = true;
  } else if (send4h) {
    updates.reminder_4h_sent = true;
    updates.reminder_24h_sent = true;
  } else if (send24h) {
    updates.reminder_24h_sent = true;
  }

  return { send24h, send4h, send2h, updates };
}

describe("Reminder Window and Cascading Logic", () => {
  describe("API Route (reminders/route.ts) logic", () => {
    it("should trigger 24h reminder when in 20-26 hours window and not sent", () => {
      const result = getReminderTriggers(24, {
        reminder_24h_sent: false,
        reminder_4h_sent: false,
        reminder_2h_sent: false,
      });
      expect(result.needs24h).toBe(true);
      expect(result.needs4h).toBe(false);
      expect(result.needs2h).toBe(false);
    });

    it("should trigger 4h reminder when in 3.5-5.5 hours window and not sent", () => {
      const result = getReminderTriggers(4, {
        reminder_24h_sent: true,
        reminder_4h_sent: false,
        reminder_2h_sent: false,
      });
      expect(result.needs24h).toBe(false);
      expect(result.needs4h).toBe(true);
      expect(result.needs2h).toBe(false);
    });

    it("should trigger 2h reminder when in 1.5-3 hours window and not sent", () => {
      const result = getReminderTriggers(2, {
        reminder_24h_sent: true,
        reminder_4h_sent: true,
        reminder_2h_sent: false,
      });
      expect(result.needs24h).toBe(false);
      expect(result.needs4h).toBe(false);
      expect(result.needs2h).toBe(true);
    });

    it("should not trigger any reminder outside windows", () => {
      const result = getReminderTriggers(10, {
        reminder_24h_sent: false,
        reminder_4h_sent: false,
        reminder_2h_sent: false,
      });
      expect(result.needs24h).toBe(false);
      expect(result.needs4h).toBe(false);
      expect(result.needs2h).toBe(false);
    });
  });

  describe("Cron Route (reminders/cron/route.ts) logic", () => {
    it("should trigger 2h reminder and update all flags if diffHours <= 2.5", () => {
      const result = getCronUpdates(2.0, {
        reminder_24h_sent: false,
        reminder_4h_sent: false,
        reminder_2h_sent: false,
      });
      expect(result.send2h).toBe(true);
      expect(result.send4h).toBe(false);
      expect(result.send24h).toBe(false);
      expect(result.updates).toEqual({
        reminder_24h_sent: true,
        reminder_4h_sent: true,
        reminder_2h_sent: true,
      });
    });

    it("should trigger 4h reminder and update 4h & 24h flags if 2.5 < diffHours <= 5", () => {
      const result = getCronUpdates(4.2, {
        reminder_24h_sent: false,
        reminder_4h_sent: false,
        reminder_2h_sent: false,
      });
      expect(result.send2h).toBe(false);
      expect(result.send4h).toBe(true);
      expect(result.send24h).toBe(false);
      expect(result.updates).toEqual({
        reminder_24h_sent: true,
        reminder_4h_sent: true,
      });
    });

    it("should trigger 24h reminder and update 24h flag if 5 < diffHours <= 24", () => {
      const result = getCronUpdates(12.0, {
        reminder_24h_sent: false,
        reminder_4h_sent: false,
        reminder_2h_sent: false,
      });
      expect(result.send2h).toBe(false);
      expect(result.send4h).toBe(false);
      expect(result.send24h).toBe(true);
      expect(result.updates).toEqual({
        reminder_24h_sent: true,
      });
    });

    it("should not trigger any reminders if all already sent", () => {
      const result = getCronUpdates(2.0, {
        reminder_24h_sent: true,
        reminder_4h_sent: true,
        reminder_2h_sent: true,
      });
      expect(result.send2h).toBe(false);
      expect(result.send4h).toBe(false);
      expect(result.send24h).toBe(false);
      expect(result.updates).toEqual({});
    });
  });
});
