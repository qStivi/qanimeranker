import { memo } from 'react';
import type { MissingSequel, TitleFormat } from '../../api/types';
import { getTitle } from '../../utils/ratingCalculator';
import styles from './MissingSequelsModal.module.css';

interface SequelCardProps {
  sequel: MissingSequel;
  titleFormat: TitleFormat;
}

export const SequelCard = memo(function SequelCard({
  sequel,
  titleFormat,
}: SequelCardProps) {
  const title = getTitle(sequel.sequel.title, titleFormat);
  const status = sequel.sequel.status;

  return (
    <a
      href={`https://anilist.co/anime/${sequel.sequel.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
    >
      <img
        src={sequel.sequel.coverImage.large}
        alt={title}
        className={styles.cover}
        loading="lazy"
      />
      <div className={styles.cardInfo}>
        <h3 className={styles.cardTitle} title={title}>
          {title}
        </h3>
        <div className={styles.meta}>
          {sequel.sequel.format && (
            <span className={styles.format}>{sequel.sequel.format}</span>
          )}
          {sequel.sequel.episodes && (
            <span className={styles.episodes}>{sequel.sequel.episodes} eps</span>
          )}
        </div>
        <div className={styles.sequelOf}>
          Sequel of: {sequel.predecessorTitle}
        </div>
        {status === 'RELEASING' && (
          <span className={`${styles.badge} ${styles.badgeReleasing}`}>Releasing</span>
        )}
        {status === 'NOT_YET_RELEASED' && (
          <span className={`${styles.badge} ${styles.badgeUpcoming}`}>Upcoming</span>
        )}
      </div>
    </a>
  );
});
