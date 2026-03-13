export type UnitType = 'Masechtot' | 'Perakim' | 'Blatt';

export interface StudyTrack {
  id: string;
  name: string;
  unitType: UnitType;
  totalUnits: number;
  alreadyLearned: number;
  repetitions: number;
  deadline: Date;
  deadlineName?: string; // e.g. "Shabbat Zachor"
  createdAt: Date;
}

export interface ProgressStats {
  dailyLoad: number;
  currentProgress: number; // percentage
  estimatedFinishDate: Date;
  remainingUnits: number;
  daysRemaining: number;
}
