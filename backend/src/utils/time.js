import { DateTime, Duration } from 'luxon';

const parseInput = (value, timezone) => {
  if (value === undefined || value === null || value === '') return null;
  if (!Number.isNaN(Number(value))) {
    return DateTime.fromSeconds(Number(value), { zone: 'utc' });
  }
  return DateTime.fromISO(value, { zone: timezone || 'UTC' });
};

export const resolveRange = ({
  period = 'day',
  from,
  to,
  timezone = 'UTC',
}) => {
  if (from && to) {
    const start = parseInput(from, timezone) || DateTime.now().setZone(timezone).minus({ days: 1 });
    const end = parseInput(to, timezone) || DateTime.now().setZone(timezone);
    return {
      from: Math.floor(start.toUTC().toSeconds()),
      to: Math.floor(end.toUTC().toSeconds()),
      durationSeconds: Math.max(end.toSeconds() - start.toSeconds(), 1),
    };
  }

  const now = DateTime.now().setZone(timezone);
  let start;
  switch (period) {
    case 'week':
      start = now.minus({ days: 7 });
      break;
    case 'month':
      start = now.minus({ days: 30 });
      break;
    case 'year':
      start = now.minus({ days: 365 });
      break;
    case 'day':
    default:
      start = now.minus({ days: 1 });
      break;
  }

  return {
    from: Math.floor(start.toUTC().toSeconds()),
    to: Math.floor(now.toUTC().toSeconds()),
    durationSeconds: Math.max(now.toSeconds() - start.toSeconds(), 1),
  };
};

export const granularityForRange = (durationSeconds) => {
  if (durationSeconds <= Duration.fromObject({ hours: 6 }).as('seconds')) return 300; // 5 min
  if (durationSeconds <= Duration.fromObject({ days: 2 }).as('seconds')) return 900; // 15 min
  if (durationSeconds <= Duration.fromObject({ days: 7 }).as('seconds')) return 3600; // 1 hr
  if (durationSeconds <= Duration.fromObject({ days: 31 }).as('seconds')) return 4 * 3600;
  return 24 * 3600;
};

