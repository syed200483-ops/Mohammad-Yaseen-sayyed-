let peer = null;
let localStream = null;
let currentRoomId = null;
let remoteStream = null;
let isMicMuted = false;
let isVideoOff = false;

const peerOptions = {
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }
};

// Initialize PeerJS
function initPeer() {
    peer = new Peer(undefined, peerOptions);
    
    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
    });

    peer.on('call', (call) => {
        navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        }).then((stream) => {
            localStream = stream;
            call.answer(stream);
            handleCall(call);
        });
    });
}

// Create Room
function createRoom() {
    const roomId = document.getElementById('roomId').value.trim();
    if (!roomId) {
        alert('Please enter a room name');
        return;
    }
    
    currentRoomId = roomId;
    const roomLink = `${window.location.href}?room=${roomId}`;
    
    document.getElementById('roomLink').textContent = `Share this link: ${roomLink}`;
    document.getElementById('roomLink').classList.remove('hidden');
    document.getElementById('createRoom').classList.add('hidden');
    document.getElementById('callInterface').classList.remove('hidden');
    
    startCall();
}

// Join Room from URL
function joinRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    if (roomId) {
        document.getElementById('roomId').value = roomId;
        createRoom();
    }
}

// Start Call
async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        const localVideo = document.createElement('video');
        localVideo.muted = true;
        localVideo.srcObject = localStream;
        localVideo.play();
        document.getElementById('localVideoContainer').appendChild(localVideo);
        
        // Call other peer
        navigator.mediaDevices.enumerateDevices().then(() => {
            setTimeout(() => {
                const call = peer.call(currentRoomId, localStream);
                handleCall(call);
            }, 1000);
        });
        
    } catch (err) {
        console.error('Error accessing media devices:', err);
        alert('Please allow camera and microphone access');
    }
}

// Handle incoming/outgoing call
function handleCall(call) {
    call.on('stream', (remoteStream) => {
        const remoteVideo = document.createElement('video');
        remoteVideo.srcObject = remoteStream;
        remoteVideo.play();
        document.getElementById('remoteVideoContainer').innerHTML = '';
        document.getElementById('remoteVideoContainer').appendChild(remoteVideo);
        
        document.getElementById('callStatus').textContent = '✅ Connected!';
        document.getElementById('callStatus').classList.remove('status-waiting');
        document.getElementById('callStatus').classList.add('status-connected');
        document.getElementById('callStatus').classList.remove('hidden');
    });
}

// Controls
function toggleMic() {
    isMicMuted = !isMicMuted;
    localStream.getAudioTracks()[0].enabled = !isMicMuted;
}

function toggleVideo() {
    isVideoOff = !isVideoOff;
    localStream.getVideoTracks()[0].enabled = !isVideoOff;
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    location.reload();
}

function copyRoomLink() {
    const roomLink = document.getElementById('roomLink').textContent;
    navigator.clipboard.writeText(roomLink).then(() => {
        const original = document.getElementById('roomLink').textContent;
        document.getElementById('roomLink').textContent = '✅ Link copied!';
        setTimeout(() => {
            document.getElementById('roomLink').textContent = original;
        }, 2000);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initPeer();
    joinRoom(); // Auto-join if room in URL
});