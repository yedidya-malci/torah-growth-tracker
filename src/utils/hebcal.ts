// @ts-ignore
import { HDate, HebrewCalendar, Event } from 'hebcal';

export const getHebrewDateInfo = (date: Date) => {
  const hdate = new HDate(date);
  
  // Try to find a parasha or a special shabbat
  const allEvents = HebrewCalendar.calendar({
    start: date,
    end: date,
    sedrot: true,
    holidays: true
  });

  const parasha = allEvents.find((e: any) => e.getFlags() & Event.SEDRA_OF_WEEK);
  const holiday = allEvents.find((e: any) => !(e.getFlags() & Event.SEDRA_OF_WEEK));

  return {
    hdate,
    hebrewDateString: hdate.renderGematriya(),
    parasha: parasha ? parasha.render('he') : null,
    holiday: holiday ? holiday.render('he') : null,
    displayName: holiday ? holiday.render('he') : (parasha ? parasha.render('he') : hdate.renderGematriya())
  };
};

/**
 * Attempts to resolve a Hebrew name to a Date.
 */
export const resolveHebrewNameByDate = (input: string): Date | null => {
  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);

  const mapping: Record<string, string> = {
    "פסח": "Pesach",
    "ערב פסח": "Erev Pesach",
    "שבועות": "Shavuot",
    "סוכות": "Sukkot",
    "ראש השנה": "Rosh Hashana",
    "יום כיפור": "Yom Kippur",
    "שבת זכור": "Shabbat Zachor",
    "שבת הגדול": "Shabbat HaGadol",
    "שבת חזון": "Shabbat Chazon",
    "שבת נחמו": "Shabbat Nachamu",
    "פורים": "Purim",
    "חנוכה": "Chanukah"
  };

  const searchName = mapping[input] || input;

  const events = HebrewCalendar.calendar({
    start: now,
    end: nextYear,
    holidays: true,
    sedrot: true
  });

  const found = events.find((e: any) => 
    e.render('en').toLowerCase().includes(searchName.toLowerCase()) || 
    e.render('he').includes(input)
  );

  return found ? found.getDate().greg() : null;
};

export const calculatePace = (
  totalUnits: number, 
  alreadyLearned: number, 
  repetitions: number, 
  deadline: Date
): number => {
  const remainingUnits = (totalUnits - alreadyLearned) * repetitions;
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return remainingUnits > 0 ? remainingUnits : 0;
  return Number((remainingUnits / diffDays).toFixed(2));
};
