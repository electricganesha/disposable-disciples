import type { FC, ReactNode, CSSProperties } from "react";
import styles from "./UIComponents.module.css";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const GlassPanel: FC<GlassPanelProps> = ({
  children,
  className = "",
  style,
}) => (
  <div className={`${styles.glassPanel} ${className}`} style={style}>
    {children}
  </div>
);

interface StatDisplayProps {
  label: string;
  value: string | number;
  subValue?: string | number;
  danger?: boolean;
}

export const StatDisplay: FC<StatDisplayProps> = ({
  label,
  value,
  subValue,
  danger,
}) => (
  <div className={`${styles.statItem} ${styles.fadeIn}`}>
    <span className={styles.statLabel}>{label}</span>
    <span className={`${styles.statValue} ${danger ? styles.danger : ""}`}>
      {value}
      {subValue && (
        <span style={{ fontSize: "0.5em", opacity: 0.5, marginLeft: "4px" }}>
          {subValue}
        </span>
      )}
    </span>
  </div>
);

interface RitualistButtonProps {
  job: string;
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}

export const RitualistButton: FC<RitualistButtonProps> = ({
  active,
  label,
  icon,
  onClick,
}) => (
  <button
    className={`${styles.jobBtn} ${active ? styles.active : ""}`}
    onClick={onClick}
  >
    <span
      className={`${styles.statLabel}`}
      style={{ fontSize: "9px", marginBottom: "8px" }}
    >
      {label}
    </span>
    <div className={styles.jobIcon}>
      <img src={icon} alt={label} />
    </div>
  </button>
);
