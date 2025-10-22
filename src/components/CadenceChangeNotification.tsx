import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

type CadenceChangeNotificationProps = {
  targetCadence: number;
  tolerance: number;
  show: boolean;
};

export const CadenceChangeNotification = ({
  targetCadence,
  tolerance,
  show,
}: CadenceChangeNotificationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-pulse">
      <div className="bg-green-500 border-4 border-green-300 rounded-lg p-8 shadow-2xl shadow-green-500/80">
        <div className="flex items-center gap-4 mb-4">
          <Activity className="w-16 h-16 text-black animate-bounce" />
          <div>
            <h2 className="text-4xl font-bold text-black font-mono mb-2">
              NOUVELLE CADENCE
            </h2>
            <div className="text-2xl text-black font-mono">
              CIBLE: <span className="font-bold">{targetCadence} SPM</span>
            </div>
            <div className="text-xl text-black font-mono">
              TOLÉRANCE: <span className="font-bold">±{tolerance} SPM</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-black font-mono bg-black/20 rounded px-4 py-2 inline-block">
            {targetCadence - tolerance} - {targetCadence + tolerance} SPM
          </div>
        </div>
      </div>
    </div>
  );
};
