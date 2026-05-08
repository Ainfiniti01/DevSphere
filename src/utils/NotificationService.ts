"use client";

import messageSound from '../../assets/sounds/universfield-new-notification-051-494246.mp3';
import projectSound from '../../assets/sounds/universfield-new-notification-057-494255.mp3';
import systemSound from '../../assets/sounds/dragon-studio-notification-sound-effect-372475.mp3';

export type NotificationSoundType = 'message' | 'project' | 'system';

class NotificationService {
  private sounds: Record<NotificationSoundType, HTMLAudioElement> | null = null;

  private init() {
    if (this.sounds) return;
    this.sounds = {
      message: new Audio(messageSound),
      project: new Audio(projectSound),
      system: new Audio(systemSound),
    };
    
    // Configure sounds
    Object.values(this.sounds).forEach(audio => {
      audio.preload = 'auto';
      audio.volume = 0.5;
    });
  }

  play(type: NotificationSoundType, enabled: boolean = true) {
    if (!enabled) return;
    this.init();
    
    const audio = this.sounds?.[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => {
        // Browsers often block audio until user interaction
        console.debug("[NotificationService] Audio play deferred:", e.message);
      });
    }
  }
}

export const notificationService = new NotificationService();