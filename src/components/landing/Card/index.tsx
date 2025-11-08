import styles from './style.module.scss';
import { useTransform, motion, MotionValue } from 'framer-motion';
import { useRef } from 'react';

interface CardProps {
  i: number;
  title: string;
  description: string;
  color: string;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}

const Card = ({i, title, description, color, progress, range, targetScale}: CardProps) => {

  const container = useRef(null);
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div ref={container} className={styles.cardContainer}>
      <motion.div
        style={{backgroundColor: color, scale, top:`calc(-5vh + ${i * 25}px)`}}
        className={styles.card}
      >
        <h2 className={title === "Lightning Fast" ? styles.whiteText : ""}>{title}</h2>
        <p className={title === "Lightning Fast" ? styles.whiteText : ""}>{description}</p>
      </motion.div>
    </div>
  )
}

export default Card