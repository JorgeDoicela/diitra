import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioBubblePlayerProps {
    src: string;
}

export const AudioBubblePlayer: React.FC<AudioBubblePlayerProps> = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;

        const onLoadedMetadata = () => setDuration(audio.duration || 0);
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.pause();
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
        };
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(err => console.error("Error playing audio:", err));
            setIsPlaying(true);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="flex items-center gap-3 bg-bg-deep/80 border border-border-thin rounded-xl p-3 w-64 shrink-0 shadow-lg backdrop-blur-sm">
            <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-text-main text-bg-deep flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 focus:outline-none"
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="flex-1 space-y-1">
                {/* Simulated equalizer bars */}
                <div className="flex items-end gap-[3px] h-6 justify-center">
                    {Array.from({ length: 20 }).map((_, i) => {
                        const active = isPlaying && currentTime > 0;
                        const played = (currentTime / (duration || 1)) > (i / 20);
                        const height = Math.sin(i * 0.4) * 6 + 10 + (active ? Math.random() * 8 : 0);
                        return (
                            <span
                                key={i}
                                className={`w-[2px] rounded-full transition-all duration-300 ${
                                    played ? 'bg-text-main' : 'bg-text-dim/30'
                                }`}
                                style={{ height: `${height}px` }}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between text-[8px] font-mono text-text-dim/80 font-bold select-none">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};
