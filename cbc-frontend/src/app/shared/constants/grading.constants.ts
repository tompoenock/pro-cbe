/**
 * Default grading scales and templates
 * Used across the application to maintain consistency
 */

export const DEFAULT_GRADES = [
  { grade: 'A', minScore: 80, maxScore: 100, remark: 'Excellent', points: 12 },
  { grade: 'A-', minScore: 75, maxScore: 79, remark: 'Very Good', points: 11 },
  { grade: 'B+', minScore: 70, maxScore: 74, remark: 'Good', points: 10 },
  { grade: 'B', minScore: 65, maxScore: 69, remark: 'Good', points: 9 },
  { grade: 'B-', minScore: 60, maxScore: 64, remark: 'Fairly Good', points: 8 },
  { grade: 'C+', minScore: 55, maxScore: 59, remark: 'Average', points: 7 },
  { grade: 'C', minScore: 50, maxScore: 54, remark: 'Average', points: 6 },
  { grade: 'C-', minScore: 45, maxScore: 49, remark: 'Below Average', points: 5 },
  { grade: 'D+', minScore: 40, maxScore: 44, remark: 'Below Average', points: 4 },
  { grade: 'D', minScore: 35, maxScore: 39, remark: 'Poor', points: 3 },
  { grade: 'D-', minScore: 30, maxScore: 34, remark: 'Poor', points: 2 },
  { grade: 'E', minScore: 0, maxScore: 29, remark: 'Very Poor', points: 1 },
];

export const GERMAN_FALLBACK_GRADES = [
  { grade: '1.0', minScore: 95, maxScore: 100, remark: 'Sehr gut', points: 15 },
  { grade: '1.3', minScore: 90, maxScore: 94, remark: 'Sehr gut', points: 14 },
  { grade: '1.7', minScore: 85, maxScore: 89, remark: 'Gut', points: 13 },
  { grade: '2.0', minScore: 80, maxScore: 84, remark: 'Gut', points: 12 },
  { grade: '2.3', minScore: 75, maxScore: 79, remark: 'Gut', points: 11 },
  { grade: '2.7', minScore: 70, maxScore: 74, remark: 'Befriedigend', points: 10 },
  { grade: '3.0', minScore: 65, maxScore: 69, remark: 'Befriedigend', points: 9 },
  { grade: '3.3', minScore: 60, maxScore: 64, remark: 'Befriedigend', points: 8 },
  { grade: '3.7', minScore: 55, maxScore: 59, remark: 'Ausreichend', points: 7 },
  { grade: '4.0', minScore: 50, maxScore: 54, remark: 'Ausreichend', points: 6 },
  { grade: '5.0', minScore: 40, maxScore: 49, remark: 'Mangelhaft', points: 4 },
  { grade: '6.0', minScore: 0, maxScore: 39, remark: 'Ungenügend', points: 1 },
];

export const DEFAULT_GRADING_FORM = {
  name: '',
  isDefault: false,
  grades: DEFAULT_GRADES.map(g => ({ ...g })),
};
