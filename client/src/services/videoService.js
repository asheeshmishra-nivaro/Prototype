import AgoraRTC from "agora-rtc-sdk-ng";

/**
 * Production Video Service
 * Handles Agora RTC initialization, channel joining, and track management.
 */
class VideoService {
    constructor() {
        this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        this.appId = process.env.VITE_AGORA_APP_ID || "MOCK_APP_ID";
        this.localTracks = {
            videoTrack: null,
            audioTrack: null
        };
    }

    async join(channel, token = null, uid = null) {
        try {
            await this.client.join(this.appId, channel, token, uid);
            this.localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            this.localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();

            await this.client.publish([this.localTracks.audioTrack, this.localTracks.videoTrack]);
            return this.localTracks.videoTrack;
        } catch (error) {
            console.error("Agora Join Failed:", error);
            throw error;
        }
    }

    async leave() {
        this.localTracks.audioTrack?.close();
        this.localTracks.videoTrack?.close();
        await this.client.leave();
    }
}

export default new VideoService();
