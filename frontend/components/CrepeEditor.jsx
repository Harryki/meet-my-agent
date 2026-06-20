import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';

import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

export default function CrepeEditor({ value = '', onChange }) {
  const containerRef = useRef(null);
  const crepeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let crepe;
    let active = true;

    const init = async () => {
      crepe = new Crepe({
        root: containerRef.current,
        defaultValue: value,
      });

      if (onChange) {
        crepe.on((listener) => {
          listener.markdownUpdated((ctx, markdown) => {
            onChange(markdown);
          });
        });
      }

      if (!active) {
        crepe.destroy();
        return;
      }
      await crepe.create();
      if (active) {
        crepeRef.current = crepe;
      } else {
        crepe.destroy();
      }
    };

    init();

    return () => {
      active = false;
      if (crepe) {
        crepe.destroy();
      }
      crepeRef.current = null;
    };
  }, [value, onChange]);

  return <div ref={containerRef} className="crepe w-full" />;
}
