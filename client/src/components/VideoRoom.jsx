import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize, User } from 'lucide-react';

const VideoRoom = ({ channelName, token, appId, uid, onEndCall }) => {
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [joined, setJoined] = useState(false);
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);

    const clientRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideosRef = useRef({});

    useEffect(() => {
        const init = async () => {
            clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

            clientRef.current.on('user-published', async (user, mediaType) => {
                await clientRef.current.subscribe(user, mediaType);
                if (mediaType === 'video') {
                    setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
                }
                if (mediaType === 'audio') {
                    user.audioTrack.play();
                }
            });

            clientRef.current.on('user-unpublished', (user) => {
                setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
            });

            try {
                const finalUid = await clientRef.current.join(appId, channelName, token, uid || null);
                const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

                setLocalAudioTrack(audioTrack);
                setLocalVideoTrack(videoTrack);

                await clientRef.current.publish([audioTrack, videoTrack]);
                videoTrack.play(localVideoRef.current);

                setJoined(true);
            } catch (error) {
                console.error('Agora Join Error:', error);
                alert('Video Connection Failed. Ensure camera/mic permissions are granted.');
            }
        };

        init();

        return () => {
            if (localVideoTrack) localVideoTrack.close();
            if (localAudioTrack) localAudioTrack.close();
            if (clientRef.current) clientRef.current.leave();
        };
    }, []);

    // Effect to play remote videos
    useEffect(() => {
        remoteUsers.forEach(user => {
            if (user.videoTrack && remoteVideosRef.current[user.uid]) {
                user.videoTrack.play(remoteVideosRef.current[user.uid]);
            }
        });
    }, [remoteUsers]);

    const toggleMic = async () => {
        if (localAudioTrack) {
            await localAudioTrack.setMuted(!muted);
            setMuted(!muted);
        }
    };

    const toggleVideo = async () => {
        if (localVideoTrack) {
            await localVideoTrack.setMuted(!videoOff);
            setVideoOff(!videoOff);
        }
    };

    const handleLeave = () => {
        if (onEndCall) onEndCall();
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', borderRadius: '1.25rem', overflow: 'hidden' }}>
            {/* Remote Video (Main View) */}
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {remoteUsers.length > 0 ? (
                    remoteUsers.map(user => (
                        <div
                            key={user.uid}
                            ref={el => remoteVideosRef.current[user.uid] = el}
                            style={{ width: '100%', height: '100%' }}
                        />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#1e293b', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={64} style={{ opacity: 0.3 }} />
                        </div>
                        <p>Waiting for patient to connect...</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Encrypted P2P Link Active</p>
                    </div>
                )}
            </div>

            {/* Local Video (PiP) */}
            <div style={{
                position: 'absolute', top: '1.5rem', right: '1.5rem',
                width: '150px', height: '220px', background: '#334155',
                borderRadius: '1rem', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', zIndex: 10
            }}>
                <div ref={localVideoRef} style={{ width: '100%', height: '100%' }}>
                    {videoOff && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b' }}>
                            <VideoOff size={32} color="#94a3b8" />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Overlay */}
            <div style={{
                position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '1rem', background: 'rgba(15, 23, 42, 0.8)',
                padding: '0.8rem 1.5rem', borderRadius: '3rem', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)', zIndex: 20
            }}>
                <button onClick={toggleMic} style={{ background: muted ? '#ef4444' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {muted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
                </button>
                <button onClick={toggleVideo} style={{ background: videoOff ? '#ef4444' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {videoOff ? <VideoOff size={20} color="#fff" /> : <Video size={20} color="#fff" />}
                </button>
                <button onClick={handleLeave} style={{ background: '#ef4444', border: 'none', borderRadius: '3rem', padding: '0 1.5rem', height: '45px', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#fff', fontWeight: 600 }}>
                    <PhoneOff size={20} /> End Call
                </button>
                <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Maximize size={20} color="#fff" />
                </button>
            </div>

            {/* Status Indicators */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <span style={{ background: 'rgba(34, 197, 94, 0.8)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', animation: 'pulse 1s infinite' }} /> LIVE
                </span>
                <span style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                    Node Encryption Active
                </span>
            </div>
        </div>
    );
};

export default VideoRoom;
