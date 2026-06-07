import { useState } from 'react';
import { X, Download, Share2, Plus } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import './InstallBanner.css';

export function InstallBanner() {
  const { canInstall, isInstalled, isIOS, installApp, showPrompt } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!showPrompt || dismissed || isInstalled) return null;

  if (isIOS) {
    return (
      <div className="install-banner install-banner--ios">
        <div className="install-banner__content">
          <div className="install-banner__icon">
            <Share2 size={20} />
          </div>
          <div className="install-banner__text">
            <div className="install-banner__title">Add to Home Screen</div>
            <div className="install-banner__instruction">
              Tap <Share2 size={14} style={{ display: 'inline' }} /> then "Add to Home Screen"
            </div>
          </div>
          <button
            className="install-banner__close"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss install prompt"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (canInstall) {
    return (
      <div className="install-banner install-banner--android">
        <div className="install-banner__content">
          <div className="install-banner__icon">
            <Download size={20} />
          </div>
          <div className="install-banner__text">
            <div className="install-banner__title">Install GigFinance</div>
            <div className="install-banner__instruction">
              Get instant access from your home screen
            </div>
          </div>
          <button
            className="install-banner__action"
            onClick={installApp}
          >
            <Plus size={18} /> Install
          </button>
          <button
            className="install-banner__close"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss install prompt"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
