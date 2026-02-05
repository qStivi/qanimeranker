import type {
  RankingListItem,
  RankingItem,
  CalculatedScore,
  ScoreFormat,
  TitleFormat,
} from '../api/types';

interface Segment {
  items: RankingItem[];
  maxScore: number;
  minScore: number;
}

export function getTitle(
  title: { romaji: string; english: string | null; native: string | null },
  format: TitleFormat
): string {
  switch (format) {
    case 'english':
      return title.english || title.romaji;
    case 'native':
      return title.native || title.romaji;
    case 'romaji':
    default:
      return title.romaji;
  }
}

export function calculateScores(
  items: RankingListItem[],
  titleFormat: TitleFormat,
  minScore: number = 10,
  maxScore: number = 100
): CalculatedScore[] {
  if (items.length === 0) return [];

  // Check if there are any markers
  const hasMarkers = items.some(item => item.type === 'marker');

  if (!hasMarkers) {
    // Simple linear distribution
    const animeItems = items.filter((item): item is RankingItem => item.type === 'anime');
    return calculateLinearDistribution(animeItems, minScore, maxScore, titleFormat);
  }

  // Segmented distribution with markers
  return calculateSegmentedDistribution(items, minScore, maxScore, titleFormat);
}

function calculateLinearDistribution(
  animeItems: RankingItem[],
  minScore: number,
  maxScore: number,
  titleFormat: TitleFormat
): CalculatedScore[] {
  const count = animeItems.length;
  if (count === 0) return [];

  if (count === 1) {
    const item = animeItems[0];
    return [
      {
        mediaId: item.mediaId,
        entryId: item.entryId,
        score: maxScore,
        displayScore: String(maxScore),
        title: getTitle(item.anime.title, titleFormat),
      },
    ];
  }

  const step = (maxScore - minScore) / (count - 1);

  return animeItems.map((item, index) => {
    const score = Math.round(maxScore - index * step);
    return {
      mediaId: item.mediaId,
      entryId: item.entryId,
      score,
      displayScore: String(score),
      title: getTitle(item.anime.title, titleFormat),
    };
  });
}

function calculateSegmentedDistribution(
  items: RankingListItem[],
  globalMinScore: number,
  globalMaxScore: number,
  titleFormat: TitleFormat
): CalculatedScore[] {
  // Split into segments at marker boundaries
  const segments: Segment[] = [];
  let currentSegmentItems: RankingItem[] = [];
  let previousMarkerScore = globalMaxScore;

  for (const item of items) {
    if (item.type === 'marker') {
      // Close current segment
      if (currentSegmentItems.length > 0) {
        segments.push({
          items: currentSegmentItems,
          maxScore: previousMarkerScore,
          minScore: item.minRating,
        });
      }
      previousMarkerScore = item.minRating - 1; // Next segment starts just below this marker
      currentSegmentItems = [];
    } else {
      currentSegmentItems.push(item);
    }
  }

  // Handle final segment (below all markers)
  if (currentSegmentItems.length > 0) {
    segments.push({
      items: currentSegmentItems,
      maxScore: previousMarkerScore,
      minScore: globalMinScore,
    });
  }

  // Calculate scores within each segment
  const results: CalculatedScore[] = [];

  for (const segment of segments) {
    const segmentScores = calculateLinearDistribution(
      segment.items,
      segment.minScore,
      segment.maxScore,
      titleFormat
    );
    results.push(...segmentScores);
  }

  return results;
}

export function formatScoreForDisplay(
  score: number,
  format: ScoreFormat
): string {
  switch (format) {
    case 'POINT_100':
      return String(score);
    case 'POINT_10':
      return String(Math.round(score / 10));
    case 'POINT_10_DECIMAL':
      return (score / 10).toFixed(1);
    case 'POINT_5':
      const stars = Math.round(score / 20);
      return '\u2605'.repeat(stars) + '\u2606'.repeat(5 - stars);
    case 'POINT_3':
      if (score <= 33) return '\u{1F641}'; // frowning face
      if (score <= 66) return '\u{1F610}'; // neutral face
      return '\u{1F604}'; // smiling face
    default:
      return String(score);
  }
}

export function getScoreFormatLabel(format: ScoreFormat): string {
  switch (format) {
    case 'POINT_100':
      return '100 Point';
    case 'POINT_10':
      return '10 Point';
    case 'POINT_10_DECIMAL':
      return '10 Point Decimal';
    case 'POINT_5':
      return '5 Star';
    case 'POINT_3':
      return 'Smiley';
    default:
      return format;
  }
}

export const MARKER_PRESETS: Record<ScoreFormat, Array<{ value: number; label: string }>> = {
  POINT_100: [
    { value: 90, label: '90+ (Masterpiece)' },
    { value: 80, label: '80+ (Excellent)' },
    { value: 70, label: '70+ (Good)' },
    { value: 60, label: '60+ (Decent)' },
    { value: 50, label: '50+ (Average)' },
  ],
  POINT_10: [
    { value: 90, label: '9+ (Masterpiece)' },
    { value: 80, label: '8+ (Excellent)' },
    { value: 70, label: '7+ (Good)' },
    { value: 60, label: '6+ (Decent)' },
  ],
  POINT_10_DECIMAL: [
    { value: 90, label: '9.0+ (Masterpiece)' },
    { value: 80, label: '8.0+ (Excellent)' },
    { value: 70, label: '7.0+ (Good)' },
    { value: 60, label: '6.0+ (Decent)' },
  ],
  POINT_5: [
    { value: 90, label: '5 Stars' },
    { value: 70, label: '4 Stars' },
    { value: 50, label: '3 Stars' },
    { value: 30, label: '2 Stars' },
  ],
  POINT_3: [
    { value: 67, label: 'Happy' },
    { value: 34, label: 'Neutral' },
  ],
};
