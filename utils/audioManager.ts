// utils/audioManager.ts
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

class AudioManager {
    private player: AudioPlayer | null = null;
    private currentUrl: string | null = null;
    private isMuted: boolean = false;

    async initialize() {
        // Configure audio mode for ambient playback
        try {
            await setAudioModeAsync({
                playsInSilentMode: true,
            });
        } catch (error) {
            console.warn('Failed to configure audio mode:', error);
        }
    }

    async playPreview(url: string | undefined) {
        if (!url || this.isMuted) return;

        // Skip if already playing this URL
        if (this.currentUrl === url && this.player) {
            return;
        }

        // Stop previous player
        if (this.player) {
            try {
                this.player.remove();
            } catch (e) {
                // Ignore errors
            }
        }

        try {
            this.player = createAudioPlayer({ uri: url }, { updateInterval: 100 });
            this.player.loop = true;
            this.player.volume = 0.4;
            await this.player.play();
            this.currentUrl = url;
        } catch (error) {
            console.warn('Failed to play audio preview:', error);
            // Silent fail - don't block user experience
        }
    }

    async stop() {
        if (this.player) {
            try {
                this.player.pause();
                this.player.remove();
            } catch (e) {
                // Ignore errors
            }
            this.player = null;
            this.currentUrl = null;
        }
    }

    async setMuted(muted: boolean) {
        this.isMuted = muted;
        if (this.player) {
            try {
                this.player.volume = muted ? 0 : 0.3;
            } catch (e) {
                console.warn('Failed to set volume:', e);
            }
        }
    }

    getMutedState(): boolean {
        return this.isMuted;
    }
}

// Export singleton instance
export const audioManager = new AudioManager();
