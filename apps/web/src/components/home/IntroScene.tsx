'use client';

import { motion } from 'framer-motion';
import { GroundGrid, Skyline, CyberSun } from '.';
import styles from './introScene.module.css';

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function IntroScene() {
  return (
    <motion.main
      className={styles.root}
      initial="initial"
      animate="animate"
      variants={containerVariants}
    >
      <div>
        <Skyline/>
        <GroundGrid />
      </div>
    </motion.main>
  );
}
