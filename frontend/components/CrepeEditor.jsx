import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';

import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

export default function CrepeEditor({ value = '', onChange }) {
  const containerRef = useRef(null);
  const crepeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let active = true;
    let creating = false;
    let pendingDestroy = false;

    const init = async () => {
      const crepe = new Crepe({
        root: containerRef.current,
        defaultValue: value ?? '',
      });

      crepeRef.current = crepe;

      if (onChange) {
        crepe.on((listener) => {
          listener.markdownUpdated((ctx, markdown) => {
            onChange(markdown);
          });
        });
      }

      creating = true;
      pendingDestroy = false;

      try {
        await crepe.create();
      } catch (err) {
        console.error('Crepe create error:', err);
        throw err;
      } finally {
        creating = false;
      }

      if (!active || pendingDestroy) {
        crepe.destroy();
        if (active) {
          crepeRef.current = null;
        }
        return;
      }

      crepeRef.current = crepe;
    };

    init();

    return () => {
      active = false;
      const crepe = crepeRef.current;
      if (!crepe) return;

      if (creating) {
        pendingDestroy = true;
      } else {
        crepe.destroy();
        crepeRef.current = null;
      }
    };
  }, [value, onChange]);

  return <div ref={containerRef} className="crepe w-full" />;
}
