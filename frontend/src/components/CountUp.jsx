import React, { useState, useEffect } from 'react';

const CountUp = ({ end, duration = 1000, prefix = "", suffix = "", decimals = 0, className = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const endValue = typeof end === 'number' ? end : parseFloat(String(end).replace(/[^0-9.-]+/g, '')) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // EaseOutQuad formula
      const easeOutProgress = progress * (2 - progress);
      const currentVal = easeOutProgress * endValue;

      setCount(currentVal);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration]);

  const formattedValue = count.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`count-up-val ${className}`}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export default CountUp;
